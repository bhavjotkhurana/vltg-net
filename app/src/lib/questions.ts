/**
 * Server-only: loads question + passage data from src/data/ and returns
 * a client-safe ordered list (correct_answer and distractors stripped out).
 */
import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientPassage {
  id: string;
  title: string;
  text: string | null;
  media: string | null;
}

export interface ClientQuestion {
  id: string;
  section: "math" | "reading";
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  /** Image/diagram attached to the question itself (rare) */
  media: { type: string; path: string; alt: string } | null;
  /** Single passage (most reading questions) */
  passage?: ClientPassage;
  /** Two passages side-by-side (dual-passage comparison questions) */
  pairedPassages?: [ClientPassage, ClientPassage];
}

// ─── Raw JSON shapes (just what we need) ─────────────────────────────────────

interface RawMathQuestion {
  id: string;
  section: "math";
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  media: { type: string; path: string; alt: string } | null;
}

interface RawReadingQuestion {
  id: string;
  section: "reading";
  passage_id: string;
  question_number: number;
  question: string;
  options: Record<"A" | "B" | "C" | "D", string>;
}

interface RawPassage {
  id: string;
  title: string;
  text: string | null;
  media: string | null;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function readData<T>(filename: string): T {
  const p = path.join(process.cwd(), "src", "data", filename);
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

export function loadTestQuestions(): ClientQuestion[] {
  const mathData = readData<{ questions: RawMathQuestion[] }>("math.json");
  const readingData = readData<{ questions: RawReadingQuestion[] }>(
    "reading.json"
  );
  const passagesData = readData<{ passages: RawPassage[] }>("passages.json");

  const passageById = Object.fromEntries(
    passagesData.passages.map((p) => [p.id, p])
  );

  // Math: sorted by ID (m001 → m035)
  const mathQuestions: ClientQuestion[] = mathData.questions
    .filter((q) => !("_instructions" in q))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((q) => ({
      id: q.id,
      section: "math" as const,
      question: q.question,
      options: q.options,
      media: q.media ?? null,
    }));

  // Reading: sorted by question_number (1 → 36)
  const readingQuestions: ClientQuestion[] = readingData.questions
    .filter((q) => !("_instructions" in q))
    .sort((a, b) => a.question_number - b.question_number)
    .map((q): ClientQuestion => {
      const passage = passageById[q.passage_id];
      return {
        id: q.id,
        section: "reading",
        question: q.question,
        options: q.options,
        media: null,
        passage: passage
          ? {
              id: passage.id,
              title: passage.title,
              text: passage.text,
              media: passage.media,
            }
          : undefined,
      };
    });

  return [...mathQuestions, ...readingQuestions];
}

// ─── Full question metadata for scoring (server-side only) ────────────────────

export interface FullQuestionMeta {
  id: string;
  section: "math" | "reading";
  primary_skill: string;
  skill_tags: string[];
  difficulty: "easy" | "medium" | "hard";
  correct_answer: "A" | "B" | "C" | "D";
}

export function loadFullQuestionMeta(): FullQuestionMeta[] {
  const mathData = readData<{
    questions: (FullQuestionMeta & { _instructions?: unknown })[];
  }>("math.json");
  const readingData = readData<{
    questions: (FullQuestionMeta & { _instructions?: unknown })[];
  }>("reading.json");

  const mathMeta = mathData.questions.filter((q) => !("_instructions" in q));
  const readingMeta = readingData.questions.filter(
    (q) => !("_instructions" in q)
  );

  return [...mathMeta, ...readingMeta];
}
