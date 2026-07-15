import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { loadFullQuestionMeta } from "@/lib/questions";
import { computeDiagnosticReport } from "@/lib/scoring";
import { redirect } from "next/navigation";

// Dev-only: simulate a completed test with varied per-skill correctness rates
// so the results page shows interesting, realistic-looking diagnostic data.

// Correctness rate per skill (0–1). Varied intentionally so the results page
// isn't flat — some skills strong, some weak, to stress-test the breakdown.
const SKILL_CORRECT_RATE: Record<string, number> = {
  // Math
  arithmetic_basic: 0.95,
  fractions: 0.70,
  order_of_operations: 0.85,
  algebraic_substitution: 0.75,
  linear_equations: 0.60,
  inequalities: 0.50,
  systems_of_equations: 0.40,
  polynomials: 0.35,
  factoring: 0.45,
  quadratics: 0.30,
  graph_interpretation: 0.80,
  number_sequences: 0.65,
  // Reading
  vocabulary_in_context: 0.85,
  detail_retrieval: 0.90,
  sentence_purpose: 0.75,
  main_idea: 0.80,
  paragraph_function: 0.65,
  inference: 0.70,
  evidence_support: 0.60,
  rhetorical_techniques: 0.50,
  author_perspective: 0.55,
  dual_passage: 0.45,
  data_table_reading: 0.70,
  experiment_interpretation: 0.60,
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const service = createServiceSupabaseClient();

  // Delete any existing sessions for this user
  await service.from("test_sessions").delete().eq("user_id", user.id);

  // Create a new in-progress session
  const { data: session, error: sessionError } = await service
    .from("test_sessions")
    .insert({ user_id: user.id, status: "in_progress" })
    .select("id")
    .single();

  if (sessionError || !session) {
    return new Response("Failed to create session: " + sessionError?.message, { status: 500 });
  }

  const sessionId = session.id;
  const allMeta = loadFullQuestionMeta();

  // Pre-group by skill so we know the total count per skill before deciding
  // which questions to answer correctly. This ensures rates apply accurately
  // even for skills with only 2–3 questions.
  const questionsBySkill: Record<string, typeof allMeta> = {};
  for (const q of allMeta) {
    if (!questionsBySkill[q.primary_skill]) questionsBySkill[q.primary_skill] = [];
    questionsBySkill[q.primary_skill].push(q);
  }

  const correctIds = new Set<string>();
  for (const [skill, qs] of Object.entries(questionsBySkill)) {
    const rate = SKILL_CORRECT_RATE[skill] ?? 0.75;
    const correctCount = Math.round(qs.length * rate);
    qs.slice(0, correctCount).forEach((q) => correctIds.add(q.id));
  }

  const responses = allMeta.map((q) => {
    const isCorrect = correctIds.has(q.id);
    const answer = isCorrect
      ? q.correct_answer
      : (["A", "B", "C", "D"] as const).find((a) => a !== q.correct_answer) ?? "A";

    return {
      session_id: sessionId,
      question_id: q.id,
      section: q.section,
      answer_chosen: answer,
      is_correct: isCorrect,
      time_spent_seconds: Math.floor(Math.random() * 90) + 30,
      flagged_for_review: false,
      answered_at: new Date().toISOString(),
    };
  });

  const { error: respError } = await service.from("question_responses").insert(responses);
  if (respError) {
    return new Response("Failed to insert responses: " + respError.message, { status: 500 });
  }

  // Score and generate diagnostic
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("desired_score")
    .eq("id", user.id)
    .single();

  const gradedResponses = responses.map((r) => ({
    question_id: r.question_id,
    section: r.section as "math" | "reading",
    is_correct: r.is_correct,
    time_spent_seconds: r.time_spent_seconds,
  }));

  const diagnostic = computeDiagnosticReport(
    gradedResponses,
    allMeta,
    profile?.desired_score ?? 4
  );

  const topWeak = Object.entries(diagnostic.skill_scores as Record<string, { pct: number }>)
    .filter(([, s]) => s.pct < 0.6)
    .sort(([, a], [, b]) => a.pct - b.pct)
    .slice(0, 3)
    .map(([id]) => id.replace(/_/g, " "))
    .join(", ");

  const devSummary = `You scored a ${diagnostic.composite_score}/9 — you're in qualifying range, but ${Math.abs(diagnostic.score_gap)} point${Math.abs(diagnostic.score_gap) !== 1 ? "s" : ""} short of your goal. Your biggest gaps are in ${topWeak || "a few key areas"}. Start with those before moving to harder material.`;

  await service.from("diagnostic_reports").insert({
    session_id: sessionId,
    user_id: user.id,
    skill_scores: diagnostic.skill_scores,
    study_plan: diagnostic.study_plan,
    score_gap: diagnostic.score_gap,
    hours_to_passing: diagnostic.hours_to_passing,
    hours_to_goal: diagnostic.hours_to_goal,
    prerequisite_gaps: diagnostic.prerequisite_gaps,
    ai_summary: devSummary,
  });

  await service.from("test_sessions").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    time_spent_seconds: 4800,
    math_raw: diagnostic.math_raw,
    reading_raw: diagnostic.reading_raw,
    composite_score: diagnostic.composite_score,
  }).eq("id", sessionId);

  redirect("/results");
}
