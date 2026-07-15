// ── Database row types (mirrors schema.sql) ───────────────────────────────────

export interface UserProfile {
  id: string;
  desired_score: number | null;
  local_union: string | null;
  created_at: string;
  updated_at: string;
}

export type SessionStatus = "in_progress" | "completed" | "abandoned";

export interface TestSession {
  id: string;
  user_id: string;
  test_id: string;
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  time_spent_seconds: number | null;
  math_raw: number | null;
  reading_raw: number | null;
  composite_score: number | null;
}

export interface QuestionResponse {
  id: string;
  session_id: string;
  question_id: string;
  section: "math" | "reading";
  answer_chosen: "A" | "B" | "C" | "D" | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  flagged_for_review: boolean;
  answered_at: string;
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

export interface DiagnosticReport {
  id: string;
  session_id: string;
  user_id: string;
  generated_at: string;
  skill_scores: Record<string, SkillScore>;
  study_plan: StudyPlanItem[];
  score_gap: number;
  hours_to_passing: number;
  hours_to_goal: number;
  prerequisite_gaps: { skill: string; weak_prereqs: string[] }[];
}

// ── Question bank types (mirrors math.json / reading.json structure) ──────────

export type Difficulty = "easy" | "medium" | "hard";

export interface MathQuestion {
  id: string;
  section: "math";
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  expected_time_seconds: number;
  primary_skill: string;
  skill_tags: string[];
  question: string;
  media: { type: string; path: string; alt: string } | null;
  options: Record<"A" | "B" | "C" | "D", string>;
  correct_answer: "A" | "B" | "C" | "D";
  distractors: Partial<Record<"A" | "B" | "C" | "D", string>>;
  explanation: string;
  source: string;
}

export interface ReadingQuestion {
  id: string;
  section: "reading";
  passage_id: string;
  question_number: number;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  expected_time_seconds: number;
  primary_skill: string;
  skill_tags: string[];
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correct_answer: "A" | "B" | "C" | "D";
  distractors: Partial<Record<"A" | "B" | "C" | "D", string>>;
  explanation: string;
  source: string;
}

export interface Passage {
  id: string;
  title: string;
  type: "literary" | "historical" | "scientific" | "technical" | "argumentative";
  word_count: number;
  text: string | null;
  media: string | null;
  source: string;
  paired_with: string | null;
}

// ── App state types ───────────────────────────────────────────────────────────

// Stored in memory during an active test session (not persisted until submit)
export interface ActiveTestState {
  session_id: string;
  current_index: number;
  answers: Record<string, "A" | "B" | "C" | "D" | null>;
  flagged: Record<string, boolean>;
  time_per_question: Record<string, number>;
  section_start_time: number;
}
