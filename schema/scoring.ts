/**
 * IBEW Aptitude Test Prep — Scoring & Diagnostic Logic
 *
 * This module is the single source of truth for:
 *   1. Mapping raw scores to the 1–9 IBEW scale
 *   2. Computing per-skill breakdowns from question responses
 *   3. Generating the ordered study plan stored in diagnostic_reports
 *
 * Run server-side only (Next.js API route / Server Action).
 */

import skillsData from "../questions/skills.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Section = "math" | "reading";

export interface QuestionResponse {
  question_id: string;
  section: Section;
  is_correct: boolean;
  time_spent_seconds: number;
}

export interface QuestionMeta {
  id: string;
  primary_skill: string;
  skill_tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface SkillScore {
  correct: number;
  total: number;
  pct: number; // 0–1
}

export type StudyCategory =
  | "quick_win"         // 50–79% correct — almost there, small review needed
  | "foundation"        // <50% correct, no weak prerequisites
  | "prerequisite_chain"// <50% correct AND at least one prerequisite is also weak
  | "stretch";          // <50% correct, advanced skill (quadratics, systems, dual_passage)

export interface StudyPlanItem {
  skill: string;
  category: StudyCategory;
  hours_estimate: number;
  reason: string;
  chain?: string[]; // prerequisite skills to study first, in order
}

export interface DiagnosticResult {
  composite_score: number;           // 1.0–9.0
  math_raw: number;
  reading_raw: number;
  skill_scores: Record<string, SkillScore>;
  study_plan: StudyPlanItem[];
  score_gap: number;                 // desired_score - composite_score
  hours_to_passing: number;
  hours_to_goal: number;
  prerequisite_gaps: { skill: string; weak_prereqs: string[] }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Skills considered "advanced" — shown last in the study plan
const ADVANCED_SKILLS = new Set([
  "quadratics",
  "systems_of_equations",
  "polynomials",
  "factoring",
  "dual_passage",
  "rhetorical_techniques",
  "author_perspective",
  "experiment_interpretation",
]);

// Base study hours per skill difficulty level (if you scored 0%)
const BASE_HOURS: Record<string, number> = {
  easy:   2,
  medium: 4,
  hard:   8,
};

// Skill difficulty — defaults to "medium" if not listed
const SKILL_DIFFICULTY: Record<string, "easy" | "medium" | "hard"> = {
  arithmetic_basic:          "easy",
  fractions:                 "easy",
  order_of_operations:       "easy",
  number_sequences:          "easy",
  algebraic_substitution:    "medium",
  linear_equations:          "medium",
  graph_interpretation:      "medium",
  inequalities:              "medium",
  polynomials:               "hard",
  factoring:                 "hard",
  quadratics:                "hard",
  systems_of_equations:      "hard",
  vocabulary_in_context:     "easy",
  detail_retrieval:          "easy",
  sentence_purpose:          "medium",
  main_idea:                 "medium",
  paragraph_function:        "medium",
  inference:                 "medium",
  evidence_support:          "medium",
  data_table_reading:        "medium",
  rhetorical_techniques:     "hard",
  author_perspective:        "hard",
  dual_passage:              "hard",
  experiment_interpretation: "hard",
};

// ─── 1. Raw → 1–9 Score Mapping ──────────────────────────────────────────────

/**
 * STANINE model. The real IBEW/NJATC test reports a norm-referenced stanine (1-9)
 * based on percentile rank against the applicant population (bell curve, fixed
 * proportions ~4/7/12/17/20/17/12/7/4%), NOT raw percent correct. A 5 is average;
 * a 4 qualifies. Official norm tables are proprietary, so this is a v1 ESTIMATE:
 * assume proportion-correct ~ Normal(mean, sd) and score with textbook stanine
 * z-bands. Re-norm from real score data later. Keep in sync with
 * app/src/lib/scoring.ts (the copy the app actually runs).
 */
export const MATH_QUESTIONS = 33;
export const READING_QUESTIONS = 36;
export const TOTAL_QUESTIONS = MATH_QUESTIONS + READING_QUESTIONS; // 69
const NORM_MEAN = 0.6; // assumed mean proportion-correct = stanine 5 center
const NORM_SD = 0.18; // assumed spread of proportion-correct across applicants
const STANINE_Z_BOUNDS = [-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75];

/** Standard normal CDF (Zelen & Severo approximation, ~1e-7 accuracy). */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function rawToStanine(rawCorrect: number, total = TOTAL_QUESTIONS): number {
  const pct = total > 0 ? rawCorrect / total : 0;
  const z = (pct - NORM_MEAN) / NORM_SD;
  for (let i = 0; i < STANINE_Z_BOUNDS.length; i++) {
    if (z < STANINE_Z_BOUNDS[i]) return i + 1;
  }
  return 9;
}

export function rawToPercentile(
  rawCorrect: number,
  total = TOTAL_QUESTIONS
): number {
  const pct = total > 0 ? rawCorrect / total : 0;
  return Math.round(normalCdf((pct - NORM_MEAN) / NORM_SD) * 100);
}

export function stanineToMinPct(stanine: number): number {
  if (stanine <= 1) return 0;
  if (stanine >= 9) return NORM_MEAN + STANINE_Z_BOUNDS[7] * NORM_SD;
  return Math.max(0, NORM_MEAN + STANINE_Z_BOUNDS[stanine - 2] * NORM_SD);
}

export function computeCompositeScore(mathRaw: number, readingRaw: number): number {
  return rawToStanine(mathRaw + readingRaw);
}

// ─── 2. Skill Score Breakdown ─────────────────────────────────────────────────

/**
 * Builds a per-skill breakdown from the raw question responses.
 * Requires the question metadata to look up primary_skill per question.
 */
export function computeSkillScores(
  responses: QuestionResponse[],
  questions: QuestionMeta[]
): Record<string, SkillScore> {
  const metaById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const tally: Record<string, { correct: number; total: number }> = {};

  for (const r of responses) {
    const meta = metaById[r.question_id];
    if (!meta) continue;
    const skill = meta.primary_skill;
    if (!tally[skill]) tally[skill] = { correct: 0, total: 0 };
    tally[skill].total += 1;
    if (r.is_correct) tally[skill].correct += 1;
  }

  return Object.fromEntries(
    Object.entries(tally).map(([skill, { correct, total }]) => [
      skill,
      { correct, total, pct: total > 0 ? correct / total : 0 },
    ])
  );
}

// ─── 3. Study Time Estimate (log scale) ──────────────────────────────────────

/**
 * Estimates study hours for a skill given how many questions were missed.
 *
 * Uses a logarithmic curve so that:
 *   - Missing 1/5 questions → small adjustment (~20% of base hours)
 *   - Missing 3/5 questions → ~70% of base hours
 *   - Missing 5/5 questions → full base hours
 *
 * Formula: hours = base × log2(1 + (missed/total) × 10) / log2(11)
 */
export function estimateHours(skill: string, score: SkillScore): number {
  const difficulty = SKILL_DIFFICULTY[skill] ?? "medium";
  const base = BASE_HOURS[difficulty];
  const missedRatio = 1 - score.pct;
  const hours = base * Math.log2(1 + missedRatio * 10) / Math.log2(11);
  return Math.round(hours * 10) / 10; // round to 1 decimal
}

// ─── 4. Study Plan Generation ─────────────────────────────────────────────────

const skills = skillsData.skills as Record<string, { prerequisites: string[] }>;

/**
 * Generates the ordered study plan shown on the dashboard.
 *
 * Ordering philosophy (encouraging, not overwhelming):
 *   1. Quick wins  — 50–79% correct. Small effort, immediate confidence boost.
 *   2. Foundation  — <50% correct, no weak prerequisites. Standalone fixable gaps.
 *   3. Prerequisite chains — <50% correct AND at least one weak prerequisite.
 *      Shown as a mini-sequence: "study Y first (Xhr) → then X (Xhr)".
 *   4. Stretch     — Advanced skills that depend on mastering the above.
 *
 * Within each category, skills are sorted by hours_estimate ascending
 * so the easiest wins come first.
 */
export function generateStudyPlan(
  skillScores: Record<string, SkillScore>
): StudyPlanItem[] {
  const weakSkills = Object.entries(skillScores).filter(
    ([, s]) => s.pct < 0.80 // anything below 80% gets a study recommendation
  );

  const isWeak = (skill: string) =>
    skillScores[skill] !== undefined && skillScores[skill].pct < 0.80;

  const items: StudyPlanItem[] = [];

  for (const [skill, score] of weakSkills) {
    const hours = estimateHours(skill, score);
    const prereqs = skills[skill]?.prerequisites ?? [];
    const weakPrereqs = prereqs.filter(isWeak);
    const isAdvanced = ADVANCED_SKILLS.has(skill);

    // Priority order: genuinely close → fix the root → stretch → foundation.
    let category: StudyCategory;
    if (score.pct >= 0.65) {
      category = "quick_win";
    } else if (weakPrereqs.length > 0) {
      category = "prerequisite_chain";
    } else if (isAdvanced) {
      category = "stretch";
    } else {
      category = "foundation";
    }

    // Build topological chain for prerequisite_chain items
    const chain =
      category === "prerequisite_chain"
        ? buildPrereqChain(skill, skillScores)
        : undefined;

    const reason = buildReason(skill, score, category, weakPrereqs);

    items.push({ skill, category, hours_estimate: hours, reason, chain });
  }

  // Sort: quick_win → foundation → prerequisite_chain → stretch
  // Within each category: ascending hours (easiest first)
  const categoryOrder: Record<StudyCategory, number> = {
    quick_win: 0,
    foundation: 1,
    prerequisite_chain: 2,
    stretch: 3,
  };

  return items.sort((a, b) => {
    const catDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (catDiff !== 0) return catDiff;
    return a.hours_estimate - b.hours_estimate;
  });
}

/** Recursively builds an ordered list of weak prerequisite skills to study first. */
function buildPrereqChain(
  skill: string,
  skillScores: Record<string, SkillScore>,
  visited = new Set<string>()
): string[] {
  if (visited.has(skill)) return [];
  visited.add(skill);

  const prereqs = skills[skill]?.prerequisites ?? [];
  const weakPrereqs = prereqs.filter(
    (p) => skillScores[p] !== undefined && skillScores[p].pct < 0.80
  );

  const chain: string[] = [];
  for (const prereq of weakPrereqs) {
    chain.push(...buildPrereqChain(prereq, skillScores, visited));
    chain.push(prereq);
  }
  return chain;
}

function buildReason(
  skill: string,
  score: SkillScore,
  category: StudyCategory,
  weakPrereqs: string[]
): string {
  const pct = Math.round(score.pct * 100);
  const prereqLabels = weakPrereqs
    .map((id) => (skills as Record<string, { label?: string }>)[id]?.label ?? id.replace(/_/g, " "))
    .join(" and ");
  switch (category) {
    case "quick_win":
      return `You're at ${pct}% — nearly there. A focused review session should lock this in.`;
    case "foundation":
      return `You're at ${pct}%. Nothing underneath it is holding you back, so it's a clean place to build from the fundamentals.`;
    case "prerequisite_chain":
      return `You're at ${pct}%. Gaps in ${prereqLabels} are likely what's holding this back — shore those up first and this tends to follow.`;
    case "stretch":
      return `You're at ${pct}%. This is one of the tougher topics — tackle it once the skills above are solid.`;
  }
}

// ─── 5. Full Diagnostic Report ────────────────────────────────────────────────

/**
 * Main entry point. Call this server-side when a session is submitted.
 * Returns the full DiagnosticResult to store in diagnostic_reports.
 */
export function computeDiagnosticReport(
  responses: QuestionResponse[],
  questions: QuestionMeta[],
  desiredScore: number
): DiagnosticResult {
  const mathResponses    = responses.filter((r) => r.section === "math");
  const readingResponses = responses.filter((r) => r.section === "reading");
  const mathRaw    = mathResponses.filter((r) => r.is_correct).length;
  const readingRaw = readingResponses.filter((r) => r.is_correct).length;
  const compositeScore = computeCompositeScore(mathRaw, readingRaw);

  const skillScores = computeSkillScores(responses, questions);
  const studyPlan   = generateStudyPlan(skillScores);

  // Prerequisite gaps: skills where a prerequisite is also weak
  const isWeak = (skill: string) =>
    skillScores[skill] !== undefined && skillScores[skill].pct < 0.80;

  const prerequisiteGaps = Object.keys(skillScores)
    .filter((skill) => isWeak(skill))
    .map((skill) => ({
      skill,
      weak_prereqs: (skills[skill]?.prerequisites ?? []).filter(isWeak),
    }))
    .filter((g) => g.weak_prereqs.length > 0);

  // Estimate total hours to reach passing (stanine 4) vs. desired stanine
  const passingThresholdPct = stanineToMinPct(4);
  const goalPct = stanineToMinPct(desiredScore);

  const currentPct = (mathRaw + readingRaw) / TOTAL_QUESTIONS;
  const hoursToPass = estimateTotalHoursToTarget(
    currentPct, passingThresholdPct, studyPlan
  );
  const hoursToGoal = estimateTotalHoursToTarget(
    currentPct, goalPct, studyPlan
  );

  return {
    composite_score: compositeScore,
    math_raw: mathRaw,
    reading_raw: readingRaw,
    skill_scores: skillScores,
    study_plan: studyPlan,
    score_gap: desiredScore - compositeScore,
    hours_to_passing: hoursToPass,
    hours_to_goal: hoursToGoal,
    prerequisite_gaps: prerequisiteGaps,
  };
}

/** Returns the minimum % correct to achieve a given 1–9 score. */
/**
 * Rough estimate of how many study hours are needed to move from
 * currentPct to targetPct, based on the generated study plan.
 * Uses the plan's items sorted by impact (quick wins first).
 */
function estimateTotalHoursToTarget(
  currentPct: number,
  targetPct: number,
  studyPlan: StudyPlanItem[]
): number {
  if (currentPct >= targetPct) return 0;
  // Sum hours from quick_win and foundation items up to the gap needed
  const relevantItems = studyPlan.filter(
    (item) => item.category === "quick_win" || item.category === "foundation"
  );
  const total = relevantItems.reduce((sum, item) => sum + item.hours_estimate, 0);
  // Scale by how far they need to go relative to total possible improvement
  const gap = targetPct - currentPct;
  const maxGap = 1 - currentPct;
  return Math.round((total * (gap / Math.max(maxGap, 0.01))) * 10) / 10;
}
