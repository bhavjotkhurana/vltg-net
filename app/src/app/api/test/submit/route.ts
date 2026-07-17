import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { loadFullQuestionMeta } from "@/lib/questions";
import { computeDiagnosticReport, studyCadence, MATH_QUESTIONS, READING_QUESTIONS } from "@/lib/scoring";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const { sessionId, totalSeconds } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Verify session ownership ─────────────────────────────────────────────
    const { data: session } = await supabase
      .from("test_sessions")
      .select("id, status, user_id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "completed") {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }

    // ── Load saved responses ──────────────────────────────────────────────────
    const { data: responses } = await supabase
      .from("question_responses")
      .select(
        "question_id, section, answer_chosen, time_spent_seconds, flagged_for_review"
      )
      .eq("session_id", sessionId);

    if (!responses) {
      return NextResponse.json(
        { error: "Failed to load responses" },
        { status: 500 }
      );
    }

    console.log(`[submit] found ${responses.length} saved responses for session ${sessionId}`);

    // ── Grade responses ───────────────────────────────────────────────────────
    const allQuestionMeta = loadFullQuestionMeta();
    const metaById = Object.fromEntries(allQuestionMeta.map((q) => [q.id, q]));

    const gradedResponses = responses.map((r) => {
      const chosen = r.answer_chosen?.trim() ?? null;
      return {
        question_id: r.question_id,
        section: r.section as "math" | "reading",
        is_correct: chosen !== null && metaById[r.question_id]?.correct_answer === chosen,
        time_spent_seconds: r.time_spent_seconds ?? 0,
      };
    });

    // ── Update question_responses with is_correct ─────────────────────────────
    // Batch update — do in parallel
    await Promise.all(
      gradedResponses.map((r) =>
        supabase
          .from("question_responses")
          .update({ is_correct: r.is_correct })
          .eq("session_id", sessionId)
          .eq("question_id", r.question_id)
      )
    );

    // ── Compute diagnostic ────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("desired_score")
      .eq("id", user.id)
      .single();

    const desiredScore = profile?.desired_score ?? 4;

    const diagnostic = computeDiagnosticReport(
      gradedResponses,
      allQuestionMeta,
      desiredScore
    );

    // ── Generate AI summary (fire-and-forget safe — won't block submission) ────
    let aiSummary: string | null = null;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const topWeak = Object.entries(diagnostic.skill_scores as Record<string, { pct: number }>)
          .filter(([, s]) => s.pct < 0.6)
          .sort(([, a], [, b]) => a.pct - b.pct)
          .slice(0, 4)
          .map(([id]) => id.replace(/_/g, " "))
          .join(", ");

        // Frame effort as the same daily cadence the results page shows, not a
        // raw lump-sum hours figure, so the coach note and the page agree.
        const passCadence = studyCadence(diagnostic.hours_to_passing);
        const cadenceText = passCadence
          ? `about ${passCadence.weeks === 1 ? "a week" : `${passCadence.weeks} weeks`} at ~${passCadence.minutesPerDay} minutes a day`
          : "already there";

        const msg = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `You are a warm, encouraging study coach for people preparing for the IBEW electrical apprenticeship aptitude test. Write a 2-3 sentence personalized note to someone who just finished a practice test.

Score: ${diagnostic.composite_score}/9 stanine (math: ${diagnostic.math_raw}/${MATH_QUESTIONS}, reading: ${diagnostic.reading_raw}/${READING_QUESTIONS})
Weakest skills: ${topWeak || "none identified"}
Effort to a qualifying score (4), framed as a daily habit: ${cadenceText}

Tone: supportive and human, like a coach who believes in them — never intimidating or discouraging, but honest and specific. Acknowledge where they are, name the single biggest thing to work on, and point to one concrete next step that feels doable. If you mention how much work is ahead, use the daily-habit framing above (e.g. "about two weeks at 25 minutes a day") rather than a lump sum of hours. Write in plain, everyday language. No bullet points. Don't open with generic filler like "Great job" or "Congratulations."`,
          }],
        });
        aiSummary = (msg.content[0] as { type: string; text: string }).text ?? null;
      } catch (err) {
        console.error("[submit] AI summary failed:", err);
      }
    }

    // ── Write diagnostic report (service role bypasses RLS) ───────────────────
    const service = createServiceSupabaseClient();

    const { error: reportError } = await service
      .from("diagnostic_reports")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        skill_scores: diagnostic.skill_scores,
        study_plan: diagnostic.study_plan,
        score_gap: diagnostic.score_gap,
        hours_to_passing: diagnostic.hours_to_passing,
        hours_to_goal: diagnostic.hours_to_goal,
        prerequisite_gaps: diagnostic.prerequisite_gaps,
        ai_summary: aiSummary,
      });

    if (reportError) {
      console.error("Failed to write diagnostic report:", reportError);
      // Don't fail — still mark session complete
    }

    // ── Update test session ───────────────────────────────────────────────────
    await supabase
      .from("test_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        time_spent_seconds: totalSeconds ?? null,
        math_raw: diagnostic.math_raw,
        reading_raw: diagnostic.reading_raw,
        composite_score: diagnostic.composite_score,
      })
      .eq("id", sessionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
