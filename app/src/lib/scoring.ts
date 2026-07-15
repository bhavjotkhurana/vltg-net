/**
 * IBEW Aptitude Test Prep — Scoring & Diagnostic Logic
 * Adapted for use inside the Next.js app (app/src/lib/scoring.ts)
 * Source of truth: schema/scoring.ts — keep in sync if changes are made there.
 */

import skillsData from "@/data/skills.json";

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
  pct: number;
}

export type StudyCategory =
  | "quick_win"
  | "foundation"
  | "prerequisite_chain"
  | "stretch";

export interface StudyPlanItem {
  skill: string;
  category: StudyCategory;
  hours_estimate: number;
  reason: string;
  chain?: string[];
}

export interface DiagnosticResult {
  composite_score: number;
  math_raw: number;
  reading_raw: number;
  skill_scores: Record<string, SkillScore>;
  study_plan: StudyPlanItem[];
  score_gap: number;
  hours_to_passing: number;
  hours_to_goal: number;
  prerequisite_gaps: { skill: string; weak_prereqs: string[] }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const BASE_HOURS: Record<string, number> = {
  easy: 2,
  medium: 4,
  hard: 8,
};

const SKILL_DIFFICULTY: Record<string, "easy" | "medium" | "hard"> = {
  arithmetic_basic: "easy",
  fractions: "easy",
  order_of_operations: "easy",
  number_sequences: "easy",
  algebraic_substitution: "medium",
  linear_equations: "medium",
  graph_interpretation: "medium",
  inequalities: "medium",
  polynomials: "hard",
  factoring: "hard",
  quadratics: "hard",
  systems_of_equations: "hard",
  vocabulary_in_context: "easy",
  detail_retrieval: "easy",
  sentence_purpose: "medium",
  main_idea: "medium",
  paragraph_function: "medium",
  inference: "medium",
  evidence_support: "medium",
  data_table_reading: "medium",
  rhetorical_techniques: "hard",
  author_perspective: "hard",
  dual_passage: "hard",
  experiment_interpretation: "hard",
};

// ─── Score Mapping: STANINE model ─────────────────────────────────────────────
//
// The real IBEW/NJATC test reports a STANINE (1-9): a normalized, norm-referenced
// score based on your percentile rank against the test-taker population, NOT on
// raw percent correct. Stanines follow a bell curve with fixed proportions
// (~4/7/12/17/20/17/12/7/4%). A 5 is average; a 4 qualifies.
//
// We cannot obtain the official norm tables (proprietary/AIR), so this is a v1
// ESTIMATE: we assume an applicant's proportion-correct is ~Normal(mean, sd) and
// score it with the textbook stanine z-bands. Both constants below are the only
// assumptions; re-norm them from real VLTG score data once enough tests exist.
//
//   TUNE HERE ↓  (or replace with an empirically-derived table later)
export const MATH_QUESTIONS = 33;
export const READING_QUESTIONS = 36;
export const TOTAL_QUESTIONS = MATH_QUESTIONS + READING_QUESTIONS; // 69

// Real per-section time limits on the actual IBEW/NJATC test. The practice test
// is untimed, but we measure the user's pace against these to give a benchmark.
export const MATH_TIME_LIMIT_SECONDS = 46 * 60; // 2760
export const READING_TIME_LIMIT_SECONDS = 51 * 60; // 3060
const NORM_MEAN = 0.6; // assumed mean proportion-correct = stanine 5 center
const NORM_SD = 0.18; // assumed spread of proportion-correct across applicants

// Textbook stanine boundaries in z-score units (bands 0.5 wide, centered on 0).
// z below BOUND[0] → stanine 1; between BOUND[i-1] and BOUND[i] → stanine i+1;
// at or above BOUND[7] → stanine 9.
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

/** Raw correct count → stanine (1-9) under the v1 norm model. */
export function rawToStanine(rawCorrect: number, total = TOTAL_QUESTIONS): number {
  const pct = total > 0 ? rawCorrect / total : 0;
  const z = (pct - NORM_MEAN) / NORM_SD;
  for (let i = 0; i < STANINE_Z_BOUNDS.length; i++) {
    if (z < STANINE_Z_BOUNDS[i]) return i + 1;
  }
  return 9;
}

/** Raw correct count → estimated percentile (0-100) under the v1 norm model. */
export function rawToPercentile(
  rawCorrect: number,
  total = TOTAL_QUESTIONS
): number {
  const pct = total > 0 ? rawCorrect / total : 0;
  const z = (pct - NORM_MEAN) / NORM_SD;
  return Math.round(normalCdf(z) * 100);
}

/** Minimum proportion-correct needed to reach a given stanine (its lower bound). */
export function stanineToMinPct(stanine: number): number {
  if (stanine <= 1) return 0;
  if (stanine >= 9) return NORM_MEAN + STANINE_Z_BOUNDS[7] * NORM_SD;
  const zLow = STANINE_Z_BOUNDS[stanine - 2];
  return Math.max(0, NORM_MEAN + zLow * NORM_SD);
}

export function computeCompositeScore(
  mathRaw: number,
  readingRaw: number
): number {
  return rawToStanine(mathRaw + readingRaw);
}

// ─── Skill Score Breakdown ────────────────────────────────────────────────────

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

// ─── Study Time Estimate ──────────────────────────────────────────────────────

export function estimateHours(skill: string, score: SkillScore): number {
  const difficulty = SKILL_DIFFICULTY[skill] ?? "medium";
  const base = BASE_HOURS[difficulty];
  const missedRatio = 1 - score.pct;
  const hours =
    (base * Math.log2(1 + missedRatio * 10)) / Math.log2(11);
  return Math.round(hours * 10) / 10;
}

// ─── Study Plan Generation ────────────────────────────────────────────────────

const skills = skillsData.skills as Record<
  string,
  { label: string; prerequisites: string[] }
>;

function labelFor(id: string): string {
  return skills[id]?.label ?? id.replace(/_/g, " ");
}

export function generateStudyPlan(
  skillScores: Record<string, SkillScore>
): StudyPlanItem[] {
  const weakSkills = Object.entries(skillScores).filter(([, s]) => s.pct < 0.8);

  const isWeak = (skill: string) =>
    skillScores[skill] !== undefined && skillScores[skill].pct < 0.8;

  const items: StudyPlanItem[] = [];

  for (const [skill, score] of weakSkills) {
    const hours = estimateHours(skill, score);
    const prereqs = skills[skill]?.prerequisites ?? [];
    const weakPrereqs = prereqs.filter(isWeak);
    const isAdvanced = ADVANCED_SKILLS.has(skill);

    // Categorize by what will actually help most, checked in priority order:
    //  1. Genuinely close (>=65%) → a real quick win.
    //  2. Not close, but a skill underneath is weak → fix the root first.
    //  3. Not close, advanced, foundations intact → stretch goal for later.
    //  4. Otherwise a basic skill to build up from scratch → foundation.
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

    const chain =
      category === "prerequisite_chain"
        ? buildPrereqChain(skill, skillScores)
        : undefined;

    const reason = buildReason(skill, score, category, weakPrereqs);
    items.push({ skill, category, hours_estimate: hours, reason, chain });
  }

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

function buildPrereqChain(
  skill: string,
  skillScores: Record<string, SkillScore>,
  visited = new Set<string>()
): string[] {
  if (visited.has(skill)) return [];
  visited.add(skill);

  const prereqs = skills[skill]?.prerequisites ?? [];
  const weakPrereqs = prereqs.filter(
    (p) => skillScores[p] !== undefined && skillScores[p].pct < 0.8
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
  const prereqLabels = weakPrereqs.map(labelFor).join(" and ");
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

// ─── Full Diagnostic Report ───────────────────────────────────────────────────

export function computeDiagnosticReport(
  responses: QuestionResponse[],
  questions: QuestionMeta[],
  desiredScore: number
): DiagnosticResult {
  const mathRaw = responses.filter(
    (r) => r.section === "math" && r.is_correct
  ).length;
  const readingRaw = responses.filter(
    (r) => r.section === "reading" && r.is_correct
  ).length;
  const compositeScore = computeCompositeScore(mathRaw, readingRaw);

  const skillScores = computeSkillScores(responses, questions);
  const studyPlan = generateStudyPlan(skillScores);

  const isWeak = (skill: string) =>
    skillScores[skill] !== undefined && skillScores[skill].pct < 0.8;

  const prerequisiteGaps = Object.keys(skillScores)
    .filter((skill) => isWeak(skill))
    .map((skill) => ({
      skill,
      weak_prereqs: (skills[skill]?.prerequisites ?? []).filter(isWeak),
    }))
    .filter((g) => g.weak_prereqs.length > 0);

  const passingThresholdPct = stanineToMinPct(4); // stanine 4 = qualifying
  const goalPct = stanineToMinPct(desiredScore);
  const currentPct = (mathRaw + readingRaw) / TOTAL_QUESTIONS;

  const hoursToPass = estimateTotalHoursToTarget(
    currentPct,
    passingThresholdPct,
    studyPlan
  );
  const hoursToGoal = estimateTotalHoursToTarget(
    currentPct,
    goalPct,
    studyPlan
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

function estimateTotalHoursToTarget(
  currentPct: number,
  targetPct: number,
  studyPlan: StudyPlanItem[]
): number {
  if (currentPct >= targetPct) return 0;
  const relevantItems = studyPlan.filter(
    (item) =>
      item.category === "quick_win" || item.category === "foundation"
  );
  const total = relevantItems.reduce(
    (sum, item) => sum + item.hours_estimate,
    0
  );
  const gap = targetPct - currentPct;
  const maxGap = 1 - currentPct;
  return Math.round((total * (gap / Math.max(maxGap, 0.01))) * 10) / 10;
}
