import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  MATH_QUESTIONS,
  READING_QUESTIONS,
  MATH_TIME_LIMIT_SECONDS,
  READING_TIME_LIMIT_SECONDS,
  rawToPercentile,
  studyCadence,
} from "@/lib/scoring";
import skillsData from "@/data/skills.json";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { StanineCurve } from "@/components/StanineCurve";
import RetakeButton from "./RetakeButton";
import EmailCapture from "./EmailCapture";
import SignOutButton from "@/components/SignOutButton";
import ReportIssue from "@/components/ReportIssue";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillScore { correct: number; total: number; pct: number; }
type StudyCategory = "quick_win" | "foundation" | "prerequisite_chain" | "stretch";
interface StudyPlanItem {
  skill: string;
  category: StudyCategory;
  hours_estimate: number;
  reason: string;
  chain?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKILL_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(skillsData.skills).map(([id, data]) => [id, (data as { label: string }).label])
);
function skillLabel(id: string) { return SKILL_LABELS[id] ?? id.replace(/_/g, " "); }

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function formatDuration(s: number | null) {
  if (!s) return "—";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Compact "M:SS" for comparing against the real section time limits.
function formatMMSS(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function scoreHeadline(score: number, passing: boolean, atGoal: boolean) {
  if (atGoal && passing) return "You hit your goal. Nice work.";
  if (passing) return "You're in qualifying range.";
  if (score >= 3) return "You're close. A focused push gets you there.";
  return "Here's your path to a qualifying score.";
}

// Study-plan category presentation, in the order we want the learner to work.
const CATEGORY_META: Record<StudyCategory, { label: string; blurb: string; order: number }> = {
  quick_win: { label: "Quick wins", blurb: "You're already close here. A short review pushes these over the line.", order: 0 },
  foundation: { label: "Foundations", blurb: "Core skills worth building up from the ground.", order: 1 },
  prerequisite_chain: { label: "Fix the root first", blurb: "A skill underneath is holding these back. Start below and work up.", order: 2 },
  stretch: { label: "Stretch goals", blurb: "More advanced topics. Save these for after the rest.", order: 3 },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResultsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, math_raw, reading_raw, composite_score, time_spent_seconds, completed_at")
    .eq("user_id", user.id).eq("status", "completed").maybeSingle();
  if (!session) redirect("/test");

  const [{ data: report }, { data: profile }, { data: responses }] = await Promise.all([
    supabase.from("diagnostic_reports").select("*").eq("session_id", session.id).single(),
    supabase.from("user_profiles").select("desired_score").eq("id", user.id).single(),
    supabase.from("question_responses").select("section, time_spent_seconds, is_correct").eq("session_id", session.id),
  ]);

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F1EC]">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-600">Processing results…</p>
      </div>
    );
  }

  const composite = session.composite_score as number;
  const mathRaw = session.math_raw as number;
  const readingRaw = session.reading_raw as number;
  const desiredScore = profile?.desired_score ?? 4;
  const scoreGap = report.score_gap as number;
  const hoursToPass = report.hours_to_passing as number;
  const hoursToGoal = report.hours_to_goal as number;
  const skillScores = report.skill_scores as Record<string, SkillScore>;
  const studyPlan = (report.study_plan ?? []) as StudyPlanItem[];
  const aiSummary = report.ai_summary as string | null;

  const alreadyPassing = composite >= 4;
  const alreadyAtGoal = scoreGap <= 0;
  const percentile = rawToPercentile(mathRaw + readingRaw);

  // One honest "how much work" figure, recast as a daily rhythm rather than a
  // lump sum: the hours to the target that actually matters right now (a
  // qualifying 4 if you're below it, otherwise your own goal).
  const targetStanine = alreadyPassing ? desiredScore : 4;
  const hoursToTarget = alreadyPassing ? hoursToGoal : hoursToPass;
  const cadence = studyCadence(hoursToTarget);

  // Lead with what they got right. Strongest tested skills first.
  const strongSkills = Object.entries(skillScores)
    .filter(([, s]) => s.total > 0 && s.pct >= 0.8)
    .sort(([, a], [, b]) => b.pct - a.pct)
    .map(([id]) => skillLabel(id));

  // Group the study plan by category, in the intended working order.
  const groupedPlan = (Object.keys(CATEGORY_META) as StudyCategory[])
    .sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order)
    .map((cat) => ({ cat, items: studyPlan.filter((i) => i.category === cat) }))
    .filter((g) => g.items.length > 0);

  const allSkillDefs = skillsData.skills as Record<string, { label: string; section: string }>;
  const mathSkills: [string, SkillScore][] = Object.entries(allSkillDefs)
    .filter(([, s]) => s.section === "math")
    .map(([id]) => [id, skillScores[id] ?? { correct: 0, total: 0, pct: 0 }]);
  const readingSkills: [string, SkillScore][] = Object.entries(allSkillDefs)
    .filter(([, s]) => s.section === "reading")
    .map(([id]) => [id, skillScores[id] ?? { correct: 0, total: 0, pct: 0 }]);

  const mathResponses = (responses ?? []).filter((r) => r.section === "math");
  const readingResponses = (responses ?? []).filter((r) => r.section === "reading");
  const mathTotalSec = mathResponses.reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0);
  const readingTotalSec = readingResponses.reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0);
  const totalTimeSec = mathTotalSec + readingTotalSec;
  const mathAvgSec = mathResponses.length > 0 ? mathTotalSec / mathResponses.length : 0;
  const readingAvgSec = readingResponses.length > 0 ? readingTotalSec / readingResponses.length : 0;
  const mathPct = totalTimeSec > 0 ? Math.round((mathTotalSec / totalTimeSec) * 100) : 50;
  const readingPct = 100 - mathPct;

  const avg = (arr: typeof mathResponses, correct: boolean) => {
    const filtered = arr.filter((r) => r.is_correct === correct);
    if (filtered.length === 0) return null;
    return Math.round(filtered.reduce((s, r) => s + (r.time_spent_seconds ?? 0), 0) / filtered.length);
  };
  const mathCorrectAvg = avg(mathResponses, true);
  const mathWrongAvg = avg(mathResponses, false);
  const readingCorrectAvg = avg(readingResponses, true);
  const readingWrongAvg = avg(readingResponses, false);

  const allCorrectAvg = avg([...mathResponses, ...readingResponses], true) ?? 0;
  const allWrongAvg = avg([...mathResponses, ...readingResponses], false) ?? 0;
  const pacingInsight = (() => {
    if (allWrongAvg > allCorrectAvg * 1.4) return "You spent noticeably longer on the questions you missed. That hesitation is worth practicing away, since the real sections are timed.";
    if (allWrongAvg < allCorrectAvg * 0.8) return "You moved faster through the ones you missed than the ones you got right. It can pay to slow down on the questions you're unsure of.";
    if (readingAvgSec > mathAvgSec * 1.5) return "Reading took you longer per question than math. On the real test that's the section to build speed in.";
    if (mathAvgSec > readingAvgSec * 1.5) return "You moved through reading quickly relative to math. Make sure you're reading each passage fully before answering.";
    return "Your pacing was well balanced across both sections.";
  })();

  const completedDate = new Date(session.completed_at as string).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#F4F1EC]">

      {/* ── Nav ── */}
      <header className="border-b-2 border-[#111827] bg-white px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="focus-visible:outline-offset-4"><Logo responsive className="text-[1.4rem]" /></Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs font-bold uppercase tracking-[0.12em] text-gray-600 sm:inline">Completed {completedDate}</span>
            <ReportIssue context={{ sessionId: session.id }} />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-10">

        {/* ══ Score hero ══ */}
        <div className="grid grid-cols-1 gap-0 border-2 border-[#111827] sm:grid-cols-[auto_1fr]">

          {/* Score block */}
          <div className="on-dark flex flex-col items-center justify-center border-b-2 border-[#111827] bg-[#1E3A5F] px-12 py-10 sm:border-b-0 sm:border-r-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300 mb-2">Your score</p>
            <p className="text-9xl font-extrabold leading-none text-amber-400">{composite}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.1em] text-slate-300">out of 9 · stanine</p>
            <p className="mt-1 text-sm text-slate-300">≈ {ordinal(percentile)} percentile · estimated</p>
            <p className="mt-4 text-center text-xl font-bold text-white">
              {scoreHeadline(composite, alreadyPassing, alreadyAtGoal)}
            </p>
            {!alreadyAtGoal && (
              <p className="mt-1 text-center text-base text-slate-300">
                Goal: {desiredScore} · {Math.abs(scoreGap)} point{Math.abs(scoreGap) !== 1 ? "s" : ""} to go
              </p>
            )}
          </div>

          {/* Right: where you landed on the curve + section stats */}
          <div className="flex flex-col bg-white">
            <div className="border-b-2 border-[#111827] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-3">Where you landed</p>
              <StanineCurve
                marker={composite}
                goal={desiredScore}
                caption={
                  <>
                    The dark dot is you, at a{" "}
                    <strong className="text-[#111827]">{composite}</strong>. The amber
                    ring is your goal of {desiredScore}. A stanine is your standing
                    against everyone else, not your percent correct.
                  </>
                }
              />
            </div>

            <div className="grid flex-1 grid-cols-1 divide-y-2 divide-[#111827] sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
              {[
                { label: "Math", value: `${mathRaw}/${MATH_QUESTIONS}`, sub: `${Math.round((mathRaw/MATH_QUESTIONS)*100)}%` },
                { label: "Reading", value: `${readingRaw}/${READING_QUESTIONS}`, sub: `${Math.round((readingRaw/READING_QUESTIONS)*100)}%` },
                { label: "Time taken", value: formatDuration(session.time_spent_seconds), sub: "total" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="flex flex-col justify-center px-5 py-5">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-600">{label}</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#111827] xl:text-4xl">{value}</p>
                  <p className="text-sm text-gray-600">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ Strengths first — start from what's already working ══ */}
        {strongSkills.length > 0 && (
          <div className="mt-4 border-2 border-[#111827] bg-white px-6 py-5">
            <div className="flex items-baseline gap-3">
              <span aria-hidden="true" className="h-3 w-3 flex-none translate-y-0.5 bg-emerald-500" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Already solid
                </p>
                <p className="mt-1 text-lg leading-relaxed text-gray-800">
                  You&apos;re already strong on{" "}
                  <strong className="text-[#111827]">{strongSkills.slice(0, 5).join(", ")}</strong>
                  {strongSkills.length > 5 ? `, and ${strongSkills.length - 5} more.` : "."}{" "}
                  That&apos;s the part you don&apos;t have to spend time on.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ Coach note ══ */}
        {aiSummary && (
          <div className="mt-4 border-2 border-[#111827] bg-white px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-2">Coach note</p>
            <p className="text-lg leading-relaxed text-gray-800">{aiSummary}</p>
          </div>
        )}

        {/* ══ STUDY PLAN — the centerpiece ══ */}
        <section className="mt-4 border-2 border-[#111827] bg-white">
          <div className="flex flex-col gap-1 border-b-2 border-[#111827] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F]">Your study plan</p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#111827]">What to work on, in order.</h2>
              <p className="mt-1 text-base text-gray-700">Built from your answers. The skills at the top move your score the most.</p>
            </div>
            {cadence && (
              <div className="flex-none border-l-4 border-amber-500 bg-amber-50 py-2 pl-4 pr-4 sm:min-w-[13rem]">
                <p className="text-xl font-extrabold text-[#111827]">
                  {cadence.weeks === 1 ? "About a week" : `About ${cadence.weeks} weeks`}
                </p>
                <p className="text-sm text-gray-700">
                  at ~{cadence.minutesPerDay} min a day to reach a {targetStanine}
                </p>
              </div>
            )}
          </div>

          {groupedPlan.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-lg font-bold text-[#111827]">You&apos;re strong across every skill I tested.</p>
              <p className="mt-1 text-base text-gray-700">No priority gaps to fix. Keep your edge with a full retake before test day.</p>
            </div>
          ) : (
            <ol className="divide-y-2 divide-[#111827]">
              {groupedPlan.map(({ cat, items }, gi) => (
                <li key={cat}>
                  <div className="flex items-baseline gap-3 bg-[#F4F1EC] px-6 py-3">
                    <span className="text-sm font-bold uppercase tracking-[0.1em] text-[#1E3A5F]">
                      {String(gi + 1).padStart(2, "0")} · {CATEGORY_META[cat].label}
                    </span>
                    <span className="text-sm text-gray-700">{CATEGORY_META[cat].blurb}</span>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {items.map((item) => (
                      <div key={item.skill} className="px-6 py-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-lg font-bold text-[#111827]">{skillLabel(item.skill)}</p>
                          <span className="flex-none text-sm font-bold text-[#1E3A5F]">~{item.hours_estimate}h</span>
                        </div>
                        <p className="mt-1 text-base leading-relaxed text-gray-700">{item.reason}</p>
                        {item.chain && item.chain.length > 0 && (
                          <p className="mt-2 text-xs uppercase tracking-[0.06em] text-gray-600">
                            Build up: {item.chain.map(skillLabel).join(" → ")} → {skillLabel(item.skill)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ══ Supporting detail (demoted) ══ */}
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-gray-600">The detail behind your score</p>

        {/* Full skill breakdown */}
        <div className="mt-3 border-2 border-[#111827] bg-white">
          <div className="border-b-2 border-[#111827] px-6 py-4">
            <p className="text-lg font-bold text-[#111827]">Every skill tested</p>
            <p className="mt-0.5 text-base text-gray-700">Sorted weakest to strongest, so you can see the full picture.</p>
          </div>
          <div className="grid divide-y-2 divide-[#111827] sm:grid-cols-2 sm:divide-y-0">
            <div className="min-w-0 sm:border-r-2 sm:border-[#111827]">
              <div className="border-b border-slate-300 bg-[#F4F1EC] px-6 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-700">Mathematics</p>
              </div>
              <SkillList skills={mathSkills} />
            </div>
            <div className="min-w-0">
              <div className="border-b border-slate-300 bg-[#F4F1EC] px-6 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-700">Reading</p>
              </div>
              <SkillList skills={readingSkills} />
            </div>
          </div>
        </div>

        {/* Time & pacing — vs the real section clocks */}
        <div className="mt-4 flex flex-col border-2 border-[#111827] bg-white">
          <div className="border-b-2 border-[#111827] px-6 py-4">
            <p className="text-lg font-bold text-[#111827]">Beating the clock</p>
            <p className="mt-0.5 text-base text-gray-700">The real test is timed. You took it at your own pace. Here&apos;s how that pace stacks up.</p>
          </div>
          <div className="flex h-2">
            <div className="bg-[#1E3A5F]" style={{ width: `${mathPct}%` }} />
            <div className="flex-1 bg-amber-400" />
          </div>
          <div className="flex flex-1 flex-col divide-y-2 divide-[#111827] sm:flex-row sm:divide-x-2 sm:divide-y-0">
            {[
              { label: `Math · ${mathPct}%`, total: mathTotalSec, limit: MATH_TIME_LIMIT_SECONDS, avgSec: mathAvgSec, right: mathCorrectAvg, wrong: mathWrongAvg },
              { label: `Reading · ${readingPct}%`, total: readingTotalSec, limit: READING_TIME_LIMIT_SECONDS, avgSec: readingAvgSec, right: readingCorrectAvg, wrong: readingWrongAvg },
            ].map((col) => {
              const beat = col.total <= col.limit;
              const delta = Math.abs(col.total - col.limit);
              return (
                <div key={col.label} className="flex flex-1 flex-col px-6 py-6">
                  <p className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-[#1E3A5F]">{col.label}</p>
                  <p className="text-5xl font-extrabold text-[#111827]">{formatDuration(col.total)}</p>
                  <p className="mt-1.5 text-base text-gray-600">~{Math.round(col.avgSec)}s / question</p>

                  <div className={`mt-4 border-l-4 py-2 pl-3 ${beat ? "border-emerald-600 bg-emerald-50" : "border-amber-500 bg-amber-50"}`}>
                    <p className={`text-sm font-bold ${beat ? "text-emerald-800" : "text-amber-900"}`}>
                      {beat
                        ? `Inside the ${formatMMSS(col.limit)} limit`
                        : `${formatMMSS(delta)} over the ${formatMMSS(col.limit)} limit`}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      {beat
                        ? `You'd have finished with ${formatMMSS(delta)} to spare.`
                        : "On test day you'd want to pick up the pace here."}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-700">Correct avg</span>
                      <span className="text-base font-bold text-emerald-700">{col.right !== null ? `${col.right}s` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-700">Missed avg</span>
                      <span className="text-base font-bold text-red-600">{col.wrong !== null ? `${col.wrong}s` : "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t-2 border-[#111827] bg-[#F4F1EC] px-6 py-3">
            <p className="text-sm leading-relaxed text-gray-700"><span className="font-bold text-[#111827]">Pacing: </span>{pacingInsight}</p>
          </div>
        </div>

        {/* ══ Email capture ══ */}
        <EmailCapture />

        {/* ══ What's next ══ */}
        <div className="on-dark mt-4 border-2 border-[#111827] bg-[#1E3A5F]">
          <div className="px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400 mb-1">What&apos;s next</p>
              <p className="text-xl font-bold text-white">
                {alreadyAtGoal
                  ? "You hit your goal. Apply to your local with confidence."
                  : alreadyPassing
                  ? `You already qualify, and your goal is ${desiredScore}. Work the plan to close the gap.`
                  : "Start at the top of your plan and work down. Those skills move your score the most."}
              </p>
              <p className="mt-1 text-base text-slate-300">
                {alreadyPassing
                  ? "You can apply now. More prep just means a higher rank on the list."
                  : `${Math.abs(scoreGap)} more point${Math.abs(scoreGap) !== 1 ? "s" : ""} gets you to a qualifying 4. Start with the quick wins.`}
              </p>
            </div>
            <div className="mt-4 flex flex-none gap-3 sm:mt-0">
              <RetakeButton />
              <Link
                href="/"
                className="inline-block border-2 border-white/30 px-6 py-3 text-base font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                Home
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-2 pb-8">
          <Logo className="text-base" />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-600">Wired for the test</span>
        </div>

      </main>
    </div>
  );
}

// ─── Skill list ───────────────────────────────────────────────────────────────

function SkillList({ skills }: { skills: [string, SkillScore][] }) {
  const sorted = [...skills].sort(([, a], [, b]) => {
    if (a.total === 0 && b.total > 0) return 1;
    if (b.total === 0 && a.total > 0) return -1;
    return a.pct - b.pct;
  });
  return (
    <div className="divide-y divide-slate-200">
      {sorted.map(([id, score]) => {
        const noData = score.total === 0;
        const pct = Math.round(score.pct * 100);
        const barColor = score.pct >= 0.8 ? "bg-emerald-500" : score.pct >= 0.5 ? "bg-amber-500" : "bg-red-500";
        const label = noData ? "No data" : score.pct >= 0.8 ? "Strong" : score.pct >= 0.5 ? "Needs work" : "Weak";
        const labelColor = noData ? "text-gray-500" : score.pct >= 0.8 ? "text-emerald-700" : score.pct >= 0.5 ? "text-amber-800" : "text-red-600";
        return (
          <div key={id} className={`flex items-center gap-4 px-6 py-3 ${noData ? "opacity-50" : ""}`}>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="truncate text-base font-bold text-[#111827]">{skillLabel(id)}</p>
                <span className={`flex-none text-xs font-bold uppercase tracking-wide ${labelColor}`}>{label}</span>
              </div>
              <div className="h-2 w-full border border-slate-300 bg-slate-100">
                {!noData && <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />}
              </div>
            </div>
            <div className="w-14 flex-none text-right">
              {noData ? (
                <p className="text-base text-gray-500">—</p>
              ) : (
                <>
                  <p className="text-base font-bold text-[#111827]">{score.correct}/{score.total}</p>
                  <p className="text-xs text-gray-600">{pct}%</p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
