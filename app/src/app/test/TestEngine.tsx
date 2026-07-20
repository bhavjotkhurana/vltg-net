"use client";

import { createClient } from "@/lib/supabase";
import type { ClientQuestion } from "@/lib/questions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import MathText from "./MathText";
import { Logo } from "@/components/Logo";
import SignOutButton from "@/components/SignOutButton";
import ReportIssue from "@/components/ReportIssue";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "overview" | "math_intro" | "test" | "reading_intro";
type Answer = "A" | "B" | "C" | "D";

interface ExistingResponse {
  question_id: string;
  answer_chosen: string | null;
  flagged_for_review: boolean;
  time_spent_seconds: number;
}

interface Props {
  sessionId: string;
  questions: ClientQuestion[];
  existingResponses: ExistingResponse[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Cap the time credited to any single question. Nobody legitimately spends more
// than a few minutes on one aptitude item, so this bounds "left the tab open for
// hours" idle time and keeps section totals (and the pace benchmark) honest.
const MAX_QUESTION_SECONDS = 600; // 10 min
function cappedElapsed(sinceMs: number) {
  return Math.min((Date.now() - sinceMs) / 1000, MAX_QUESTION_SECONDS);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TestEngine({
  sessionId,
  questions,
  existingResponses,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  // ── State ────────────────────────────────────────────────────────────────

  const [phase, setPhase] = useState<Phase>("overview");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    const map: Record<string, Answer> = {};
    for (const r of existingResponses) {
      if (r.answer_chosen) map[r.question_id] = r.answer_chosen as Answer;
    }
    return map;
  });

  const [flagged, setFlagged] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const r of existingResponses) {
      if (r.flagged_for_review) map[r.question_id] = true;
    }
    return map;
  });

  const [timePerQuestion, setTimePerQuestion] = useState<
    Record<string, number>
  >(() => {
    const map: Record<string, number> = {};
    for (const r of existingResponses) {
      map[r.question_id] = r.time_spent_seconds ?? 0;
    }
    return map;
  });

  const questionStartRef = useRef(Date.now());
  // Seed from time already banked against saved answers, otherwise the session
  // total restarts at 0 on every resume and under-reports how long the test took.
  const [totalSeconds, setTotalSeconds] = useState(() =>
    existingResponses.reduce((sum, r) => sum + (r.time_spent_seconds ?? 0), 0)
  );
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Refs so the keyboard handler always sees the latest state/functions
  // without needing to re-register on every render.
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const navigateToRef = useRef<(i: number) => void>(() => {});
  const handleAnswerRef = useRef<(a: Answer) => void>(() => {});
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Only tick while the tab is visible, and reset the current-question start
    // when the user returns, so idle/background time isn't counted.
    const interval = setInterval(() => {
      if (!document.hidden) setTotalSeconds((s) => s + 1);
    }, 1000);
    function onVisibility() {
      if (!document.hidden) questionStartRef.current = Date.now();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept keys typed into form elements
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Only while a question is on screen. This effect registers once, but the
      // phase screens return early further down, so without this guard pressing
      // "a" on an intro screen answers question 1 before the user has seen it.
      if (phaseRef.current !== "test") return;

      switch (e.key) {
        case "a": case "A": handleAnswerRef.current("A"); break;
        case "b": case "B": handleAnswerRef.current("B"); break;
        case "c": case "C": handleAnswerRef.current("C"); break;
        case "d": case "D": handleAnswerRef.current("D"); break;
        case "ArrowRight":
        case "Enter":
          e.preventDefault();
          navigateToRef.current(currentIndexRef.current + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigateToRef.current(currentIndexRef.current - 1);
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []); // registered once — uses refs to stay current

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentQuestion = questions[currentIndex];
  const isMath = currentQuestion.section === "math";
  const mathTotal = questions.filter((q) => q.section === "math").length;
  const readingTotal = questions.filter((q) => q.section === "reading").length;
  const sectionIndex = isMath ? currentIndex : currentIndex - mathTotal;
  const sectionTotal = isMath ? mathTotal : readingTotal;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  // ── Navigation ────────────────────────────────────────────────────────────

  function recordTime() {
    const elapsed = cappedElapsed(questionStartRef.current);
    setTimePerQuestion((prev) => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] ?? 0) + elapsed,
    }));
    questionStartRef.current = Date.now();
  }

  function navigateTo(index: number) {
    if (index < 0 || index >= questions.length) return;
    // Intercept the math→reading boundary — show reading intro first
    if (
      phase === "test" &&
      questions[currentIndex].section === "math" &&
      questions[index].section === "reading"
    ) {
      recordTime();
      setPhase("reading_intro");
      return;
    }
    recordTime();
    setCurrentIndex(index);
    questionStartRef.current = Date.now();
  }
  navigateToRef.current = navigateTo;

  // ── Answer Selection ──────────────────────────────────────────────────────

  async function handleAnswer(answer: Answer) {
    const q = currentQuestion;
    setAnswers((prev) => ({ ...prev, [q.id]: answer }));

    const elapsed = cappedElapsed(questionStartRef.current);
    const timeSpent = Math.round((timePerQuestion[q.id] ?? 0) + elapsed);

    // Auto-save
    supabase.from("question_responses").upsert(
      {
        session_id: sessionId,
        question_id: q.id,
        section: q.section,
        answer_chosen: answer,
        is_correct: null,
        time_spent_seconds: timeSpent,
        flagged_for_review: flagged[q.id] ?? false,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "session_id,question_id" }
    ).then(({ error }) => {
      if (error) console.error("[auto-save] upsert failed:", error);
    });
  }
  handleAnswerRef.current = handleAnswer;

  // ── Flag Toggle ───────────────────────────────────────────────────────────

  function handleToggleFlag() {
    const q = currentQuestion;
    const nowFlagged = !flagged[q.id];
    setFlagged((prev) => ({ ...prev, [q.id]: nowFlagged }));

    // Persist the flag even with no answer yet. A question you skipped is the
    // most likely one to flag, and gating this on an answer meant exactly those
    // flags were lost on reload. answer_chosen is nullable, so the row is valid.
    const elapsed = cappedElapsed(questionStartRef.current);
    const timeSpent = Math.round((timePerQuestion[q.id] ?? 0) + elapsed);

    supabase.from("question_responses").upsert(
      {
        session_id: sessionId,
        question_id: q.id,
        section: q.section,
        answer_chosen: answers[q.id] ?? null,
        is_correct: null,
        time_spent_seconds: timeSpent,
        flagged_for_review: nowFlagged,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "session_id,question_id" }
    ).then(({ error }) => {
      if (error) console.error("[flag] upsert failed:", error);
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    recordTime();
    setSubmitting(true);

    const res = await fetch("/api/test/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, totalSeconds }),
    });

    if (res.ok) {
      router.push("/results");
    } else {
      setSubmitting(false);
      setShowConfirm(false);
      alert("Submission failed. Please try again.");
    }
  }

  // ── Phase screens ─────────────────────────────────────────────────────────

  if (phase === "overview") {
    return (
      <div className="flex min-h-screen flex-col bg-[#F4F1EC]">
        <header className="border-b-2 border-[#111827] px-6 py-4 sm:px-12">
          <Link href="/"><Logo responsive className="text-[1.4rem]" /></Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-3">You&apos;re all set</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl">
              Here&apos;s what<br />you&apos;re about to take.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              The IBEW aptitude test has two sections, taken in order. Take your time,
              there&apos;s no cutoff here, but I&apos;ll show you how your pace compares to the real clock.
            </p>

            <div className="mt-8 divide-y-2 divide-[#111827] border-2 border-[#111827] bg-white">
              {/* Section 1 */}
              <div className="flex items-start gap-6 p-6">
                <div className="flex-none bg-[#1E3A5F] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
                  Part 1
                </div>
                <div>
                  <p className="text-lg font-bold text-[#111827]">Mathematics</p>
                  <p className="mt-1 text-base text-gray-700">33 questions · Algebra and functions</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Solve equations, work with fractions, interpret graphs, and apply basic algebra.
                    No calculator.
                  </p>
                </div>
              </div>
              {/* Section 2 */}
              <div className="flex items-start gap-6 p-6">
                <div className="flex-none bg-amber-500 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#111827]">
                  Part 2
                </div>
                <div>
                  <p className="text-lg font-bold text-[#111827]">Reading Comprehension</p>
                  <p className="mt-1 text-base text-gray-700">36 questions · Passages and analysis</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    Read short passages and answer questions on the main idea, details, inference,
                    and word meaning. No prior knowledge needed.
                  </p>
                </div>
              </div>
              {/* Total */}
              <div className="grid grid-cols-3 divide-x-2 divide-[#111827]">
                {[
                  { value: "69", label: "Total questions" },
                  { value: "1–9", label: "Stanine scale" },
                  { value: "4+", label: "Score to qualify" },
                ].map(({ value, label }) => (
                  <div key={label} className="px-6 py-5 text-center">
                    <p className="text-3xl font-extrabold text-[#111827]">{value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-5 py-4">
              <p className="text-sm font-bold text-[#111827]">Work by hand, at your own pace.</p>
              <p className="mt-1 text-sm text-gray-700">
                No calculator or notes. Flag anything you want to revisit, and come back to it before you submit.
              </p>
            </div>

            <button
              onClick={() => setPhase("math_intro")}
              className="mt-6 w-full bg-amber-500 py-4 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 active:scale-95"
            >
              I&apos;m ready →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "math_intro") {
    return (
      <div className="flex min-h-screen flex-col bg-[#F4F1EC]">
        <header className="border-b-2 border-[#111827] px-6 py-4 sm:px-12">
          <Link href="/"><Logo responsive className="text-[1.4rem]" /></Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">
            <button
              onClick={() => setPhase("overview")}
              className="mb-6 text-xs font-bold uppercase tracking-[0.14em] text-gray-600 hover:text-[#111827] transition-colors"
            >
              ← Back
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-3">Part 1 of 2</p>
            <h1 className="text-5xl font-extrabold tracking-tight text-[#111827] sm:text-6xl">
              Mathematics
            </h1>
            <p className="mt-4 text-xl text-gray-700">33 questions · 46 min on the real test</p>

            <div className="mt-8 divide-y-2 divide-[#111827] border-2 border-[#111827] bg-white">
              <div className="px-5 py-4">
                <p className="mb-1 text-base font-bold text-[#111827]">Algebra &amp; functions</p>
                <p className="text-sm leading-relaxed text-gray-700">Order of operations, fractions, <span className="font-semibold text-[#111827]">linear equations</span>, inequalities, factoring, and reading linear-function graphs.</p>
              </div>
              <div className="px-5 py-4">
                <p className="mb-1 text-base font-bold text-[#111827]">Single-step to multi-step</p>
                <p className="text-sm leading-relaxed text-gray-700">Difficulty ranges from quick evaluations to <span className="font-semibold text-[#111827]">problems that take several steps</span> in sequence.</p>
              </div>
              <div className="px-5 py-4">
                <p className="mb-1 text-base font-bold text-[#111827]">No calculator, work by hand</p>
                <p className="text-sm leading-relaxed text-gray-700">All arithmetic is done by hand. <span className="font-semibold text-[#111827]">Write things down</span> rather than doing it all in your head.</p>
              </div>
              <div className="px-5 py-4">
                <p className="mb-1 text-base font-bold text-[#111827]">Untimed, but I&apos;ll clock you</p>
                <p className="text-sm leading-relaxed text-gray-700">Take the time you need. Afterward I&apos;ll tell you whether you&apos;d have finished inside the real <span className="font-semibold text-[#111827]">46-minute</span> limit.</p>
              </div>
            </div>

            <button
              onClick={() => { setPhase("test"); questionStartRef.current = Date.now(); }}
              className="mt-6 w-full bg-amber-500 py-4 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 active:scale-95"
            >
              Start mathematics →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "reading_intro") {
    const mathAnswered = questions.filter(q => q.section === "math" && answers[q.id]).length;
    const mathTotal = questions.filter(q => q.section === "math").length;
    return (
      <div className="on-dark flex min-h-screen flex-col bg-[#1E3A5F]">
        <header className="border-b-2 border-white/10 px-6 py-4 sm:px-12">
          <Link href="/"><Logo variant="dark" responsive className="text-[1.4rem]" /></Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-xl">
            <button
              onClick={() => {
                const lastMathIdx = questions.map(q => q.section).lastIndexOf("math");
                setCurrentIndex(lastMathIdx);
                setPhase("test");
                questionStartRef.current = Date.now();
              }}
              className="mb-6 text-xs font-bold uppercase tracking-[0.14em] text-slate-300 hover:text-white transition-colors"
            >
              ← Back to math
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400 mb-3">Part 2 of 2</p>
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
              Reading<br />Comprehension
            </h1>
            <p className="mt-4 text-xl text-slate-300">36 questions · 51 min on the real test</p>

            {mathAnswered < mathTotal && (
              <div className="mt-5 border-2 border-amber-400/60 bg-amber-400/10 px-5 py-4">
                <p className="text-sm font-bold text-amber-300">
                  {mathTotal - mathAnswered} math question{mathTotal - mathAnswered !== 1 ? "s" : ""} still unanswered
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  You can go back and finish them before submitting, but you can&apos;t return to math once you start reading.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <div className="border-2 border-white/15 bg-white/5 px-5 py-4">
                <p className="mb-1 text-base font-bold text-white">Passage first, then the question</p>
                <p className="text-sm leading-relaxed text-slate-200">Read the passage before answering. On a wider screen the passage sits beside the question and <span className="font-semibold text-white">scrolls independently</span>.</p>
              </div>
              <div className="border-2 border-white/15 bg-white/5 px-5 py-4">
                <p className="mb-1 text-base font-bold text-white">Everyday topics, no special knowledge needed</p>
                <p className="text-sm leading-relaxed text-slate-200">Short passages on workplace safety, trades history, science, and civics. You&apos;re tested on the reading, <span className="font-semibold text-white">not on the subject</span>.</p>
              </div>
              <div className="border-2 border-white/15 bg-white/5 px-5 py-4">
                <p className="mb-1 text-base font-bold text-white">Main idea, detail, inference &amp; vocabulary</p>
                <p className="text-sm leading-relaxed text-slate-200">Questions ask for the <span className="font-semibold text-white">main idea</span>, specific <span className="font-semibold text-white">details</span>, logical <span className="font-semibold text-white">inferences</span>, and <span className="font-semibold text-white">word meaning in context</span>.</p>
              </div>
              <div className="border-2 border-white/15 bg-white/5 px-5 py-4">
                <p className="mb-1 text-base font-bold text-white">Untimed, but reading takes longer</p>
                <p className="text-sm leading-relaxed text-slate-200">These take <span className="font-semibold text-white">more time than math</span>. Read carefully. Afterward I&apos;ll show you how your pace compares to the real 51-minute limit.</p>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  // Go back to last math question
                  const lastMathIdx = questions.map(q => q.section).lastIndexOf("math");
                  setCurrentIndex(lastMathIdx);
                  setPhase("test");
                  questionStartRef.current = Date.now();
                }}
                className="border-2 border-white/30 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white/10"
              >
                ← Back to math
              </button>
              <button
                onClick={() => {
                  const firstReadingIdx = questions.findIndex(q => q.section === "reading");
                  setCurrentIndex(firstReadingIdx);
                  setPhase("test");
                  questionStartRef.current = Date.now();
                }}
                className="flex-1 bg-amber-500 py-3.5 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 active:scale-95"
              >
                Start reading →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Windowed question grid — show 7 questions centered on current
  const WINDOW = 5;
  const half = Math.floor(WINDOW / 2);
  const windowStart = Math.max(0, Math.min(currentIndex - half, questions.length - WINDOW));
  const windowEnd = Math.min(questions.length - 1, windowStart + WINDOW - 1);
  const showLeftEllipsis = windowStart > 0;
  const showRightEllipsis = windowEnd < questions.length - 1;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F4F1EC] md:h-screen md:overflow-hidden">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 flex flex-none items-center justify-between border-b-2 border-[#111827] bg-white px-4 py-2 sm:px-8 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide sm:px-3 sm:text-xs ${
            isMath
              ? "bg-[#1E3A5F] text-white"
              : "bg-amber-500 text-[#111827]"
          }`}>
            {isMath ? "Math" : "Reading"}
          </span>
          <span className="text-xs font-bold text-gray-600 sm:text-sm">
            Q<span className="text-[#111827]">{sectionIndex + 1}</span> / {sectionTotal}
          </span>
          <button
            onClick={() => setPhase(isMath ? "math_intro" : "reading_intro")}
            className="hidden text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-[#111827] transition-colors sm:inline"
          >
            Instructions
          </button>
        </div>

        {/* Timer is desktop-only; on mobile it reappears in the grid panel.
            Flag now lives in the footer at every breakpoint, so it isn't in one
            place on desktop and another on mobile. */}
        <span className="hidden text-sm font-bold text-gray-700 sm:block" aria-label="Time elapsed">
          {formatTime(totalSeconds)}
        </span>
      </header>

      {/* ── Question Content ── */}
      <main className="flex-1 md:overflow-hidden">
        {isMath ? (
          <MathQuestionView
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id] ?? null}
            onAnswer={handleAnswer}
          />
        ) : (
          <ReadingQuestionView
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id] ?? null}
            onAnswer={handleAnswer}
          />
        )}
      </main>

      {/* ── Full Question Grid Panel ── */}
      {showGrid && (
        <div className="flex-none border-t-2 border-[#111827] bg-white px-4 py-3 sm:px-8 sm:py-4">
          {/* Mobile carries the elapsed time and answered count that the header drops */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3 sm:hidden">
            <span className="text-xs font-bold text-gray-600">
              Elapsed <span className="text-[#111827]">{formatTime(totalSeconds)}</span>
            </span>
            <span className="text-xs font-bold text-gray-600">
              <span className="text-[#1E3A5F]">{answeredCount}</span> / {questions.length} answered
            </span>
          </div>

          {/* Section headers + grid */}
          {(["math", "reading"] as const).map((section) => {
            const sectionQs = questions
              .map((q, i) => ({ q, i }))
              .filter(({ q }) => q.section === section);
            if (sectionQs.length === 0) return null;
            return (
              <div key={section} className="mb-4 last:mb-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#1E3A5F]">
                  {section === "math" ? "Mathematics" : "Reading Comprehension"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sectionQs.map(({ q, i }) => {
                    const isAnswered = !!answers[q.id];
                    const isFlagged = !!flagged[q.id];
                    const isCurrent = i === currentIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => { navigateTo(i); setShowGrid(false); }}
                        aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ""}${isFlagged ? ", flagged" : ""}`}
                        aria-current={isCurrent ? "true" : undefined}
                        className={`h-10 w-10 text-xs font-bold transition ${
                          isCurrent
                            ? "bg-[#1E3A5F] text-white"
                            : isFlagged
                            ? "border-2 border-amber-500 bg-amber-50 text-amber-800"
                            : isAnswered
                            ? "border-2 border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]"
                            : "border-2 border-slate-300 text-gray-700 hover:border-[#111827]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Legend — desktop only; each grid button's aria-label already carries its state */}
          <div className="mt-3 hidden flex-wrap items-center gap-4 border-t border-slate-200 pt-3 sm:flex">
            {[
              { color: "bg-[#1E3A5F]", label: "Current" },
              { color: "border-2 border-[#1E3A5F] bg-[#1E3A5F]/10", label: "Answered" },
              { color: "border-2 border-amber-500 bg-amber-50", label: "Flagged" },
              { color: "border-2 border-slate-300", label: "Unanswered" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`inline-block h-4 w-4 flex-none ${color}`} />
                <span className="text-xs font-bold text-gray-700">{label}</span>
              </div>
            ))}
          </div>

          {/* Utility row. Both controls live here rather than in the header or
              footer: opt-in, and out of the way of the bars we just shrank. */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <ReportIssue
              getContext={() => ({
                sessionId,
                questionId: currentQuestion.id,
                phase,
                section: currentQuestion.section,
              })}
            />
            <SignOutButton confirmMessage="Your answers are saved. You can sign back in and pick up where you left off." />
          </div>
        </div>
      )}

      {/* ── Footer Navigation ── */}
      {/* `sticky` is itself a positioned value, so the progress hairline below can
          be absolutely positioned against this footer without adding `relative`
          (which would fight `sticky` in the cascade). */}
      <footer className="sticky bottom-0 z-20 flex-none border-t-2 border-[#111827] bg-white px-4 py-2.5 sm:px-8 sm:py-3.5">
        {/* Windowed question grid — hidden on mobile; the grid toggle in the
            controls row below gives full access to all questions in one tap. */}
        <div className="mb-3.5 hidden items-center justify-center gap-1.5 sm:flex">
          {showLeftEllipsis && (
            <span className="px-1 text-xs text-gray-500">…</span>
          )}
          {questions.slice(windowStart, windowEnd + 1).map((q, offset) => {
            const i = windowStart + offset;
            const isAnswered = !!answers[q.id];
            const isFlagged = !!flagged[q.id];
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => navigateTo(i)}
                aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ""}${isFlagged ? ", flagged" : ""}`}
                aria-current={isCurrent ? "true" : undefined}
                className={`h-9 w-9 flex-none text-xs font-bold transition sm:h-10 sm:w-10 ${
                  isCurrent
                    ? "bg-[#1E3A5F] text-white"
                    : isFlagged
                    ? "border-2 border-amber-500 bg-amber-50 text-amber-800"
                    : isAnswered
                    ? "border-2 border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F]"
                    : "border-2 border-slate-300 text-gray-700 hover:border-[#111827]"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
          {showRightEllipsis && (
            <span className="px-1 text-xs text-gray-500">…</span>
          )}
        </div>

        {/* Progress hairline, welded to the top border so it costs no layout height */}
        <div className="absolute inset-x-0 -top-0.5 h-1 bg-slate-200" role="progressbar" aria-label="Answered" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={questions.length}>
          <div
            className="h-full bg-[#1E3A5F] transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>

        {/* Desktop: an equal flex-1 spacer on each side centres the nav group
            under the question strip above, while Submit still sits hard right.
            Mobile: the left spacer is hidden and Submit's ml-auto does the work. */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden flex-1 sm:block" aria-hidden="true" />

          {/* Prev/Next are the controls people reach for constantly, so they get
              a filled tint and a larger glyph. Flag and the grid toggle stay
              outlined and quiet, which makes the hierarchy read at a glance. */}
          <button
            onClick={() => navigateTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            aria-label="Previous question"
            className="h-11 w-11 flex-none border-2 border-[#111827] bg-[#1E3A5F]/[0.08] text-lg font-bold leading-none text-[#111827] transition hover:bg-[#1E3A5F]/[0.16] disabled:opacity-25 sm:h-auto sm:w-auto sm:px-6 sm:py-3 sm:text-xl"
          >
            <span aria-hidden="true">←</span>
          </button>

          {/* Flag and the grid toggle sit between Prev and Next at every
              breakpoint: both act on the current question, so they belong with
              the other per-question controls rather than up in the header. */}
          <button
            onClick={handleToggleFlag}
            aria-pressed={!!flagged[currentQuestion.id]}
            aria-label={flagged[currentQuestion.id] ? "Unflag this question" : "Flag this question for review"}
            className={`h-11 w-11 flex-none border-2 text-sm font-bold transition sm:h-10 sm:w-10 sm:text-xs ${
              flagged[currentQuestion.id]
                ? "border-amber-500 bg-amber-50 text-amber-800"
                : "border-slate-300 bg-white text-gray-700 hover:border-[#111827] hover:text-[#111827]"
            }`}
          >
            <span aria-hidden="true">{flagged[currentQuestion.id] ? "★" : "☆"}</span>
          </button>

          <button
            onClick={() => setShowGrid((v) => !v)}
            aria-label={showGrid ? "Close question grid" : "View all questions"}
            aria-expanded={showGrid}
            className={`h-11 w-11 flex-none border-2 text-sm font-bold transition sm:h-10 sm:w-10 sm:text-xs ${
              showGrid
                ? "border-[#111827] bg-[#111827] text-white"
                : "border-slate-300 text-gray-700 hover:border-[#111827] hover:text-[#111827]"
            }`}
          >
            <span aria-hidden="true">{showGrid ? "↓" : "↑"}</span>
          </button>

          <button
            onClick={() => navigateTo(currentIndex + 1)}
            disabled={currentIndex === questions.length - 1}
            aria-label="Next question"
            className="h-11 w-11 flex-none border-2 border-[#111827] bg-[#1E3A5F]/[0.08] text-lg font-bold leading-none text-[#111827] transition hover:bg-[#1E3A5F]/[0.16] disabled:opacity-25 sm:h-auto sm:w-auto sm:px-6 sm:py-3 sm:text-xl"
          >
            <span aria-hidden="true">→</span>
          </button>

          <div className="ml-auto sm:ml-0 sm:flex sm:flex-1 sm:justify-end">
            <button
              onClick={() => setShowConfirm(true)}
              className="flex-none border-2 border-[#1E3A5F] bg-[#1E3A5F] px-3 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#16304f] sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Submit
            </button>
          </div>
        </div>
      </footer>

      {/* ── Submit Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
          <div className="w-full max-w-sm border-2 border-[#111827] bg-white p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">Confirm</p>
            <h2 id="submit-title" className="text-xl font-bold text-[#111827]">
              Ready to submit?
            </h2>
            {unansweredCount > 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                You have{" "}
                <strong className="text-[#111827]">{unansweredCount}</strong>{" "}
                unanswered question{unansweredCount !== 1 ? "s" : ""}. Skipped
                questions count as incorrect, but you can still go back and answer them.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-700">
                You&apos;ve answered all {questions.length} questions. Nice, you&apos;re ready.
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 border-2 border-[#111827] py-2.5 text-sm font-bold uppercase tracking-wide text-[#111827] hover:bg-slate-50 disabled:opacity-50"
              >
                Keep reviewing
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-amber-500 py-2.5 text-sm font-bold uppercase tracking-wide text-[#111827] hover:bg-amber-400 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Math Question View ───────────────────────────────────────────────────────

function MathQuestionView({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: ClientQuestion;
  selectedAnswer: Answer | null;
  onAnswer: (a: Answer) => void;
}) {
  return (
    <div className="bg-[#F4F1EC] md:h-full md:overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-lg leading-relaxed text-[#111827] font-medium">
          <MathText text={question.question} />
        </p>

        {question.media && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/${question.media.path}`}
            alt={question.media.alt}
            className="mt-5 max-w-full border-2 border-slate-200"
          />
        )}

        <div className="mt-7 space-y-2" role="radiogroup" aria-label="Answer choices">
          {(["A", "B", "C", "D"] as Answer[]).map((letter) => (
            <button
              key={letter}
              role="radio"
              aria-checked={selectedAnswer === letter}
              onClick={() => onAnswer(letter)}
              className={`flex w-full items-start gap-4 border-2 px-5 py-4 text-left transition ${
                selectedAnswer === letter
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-300 bg-white hover:border-[#111827]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center text-xs font-bold ${
                  selectedAnswer === letter
                    ? "bg-amber-500 text-[#111827]"
                    : "bg-slate-100 text-gray-700"
                }`}
                aria-hidden="true"
              >
                {letter}
              </span>
              <span className="text-base leading-relaxed text-[#111827]">
                <MathText text={question.options[letter]} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Reading Question View ────────────────────────────────────────────────────

function ReadingQuestionView({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: ClientQuestion;
  selectedAnswer: Answer | null;
  onAnswer: (a: Answer) => void;
}) {
  const { passage, pairedPassages } = question;

  return (
    <div className="md:grid md:h-full md:grid-cols-2">
      {/* Passage pane */}
      <div className="border-b-2 border-[#111827] bg-white px-6 py-6 text-base leading-loose text-[#111827] md:h-full md:overflow-y-auto md:border-b-0 md:border-r-2">
        {pairedPassages ? (
          <>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#1E3A5F]">
              Passage 1
            </p>
            <PassageText passage={pairedPassages[0]} />
            <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[0.14em] text-[#1E3A5F]">
              Passage 2
            </p>
            <PassageText passage={pairedPassages[1]} />
          </>
        ) : passage ? (
          <PassageText passage={passage} />
        ) : null}
      </div>

      {/* Question pane */}
      <div className="bg-[#F4F1EC] px-6 py-6 md:overflow-y-auto">
        <p className="text-lg font-bold leading-relaxed text-[#111827]">
          {question.question}
        </p>

        <div className="mt-6 space-y-2" role="radiogroup" aria-label="Answer choices">
          {(["A", "B", "C", "D"] as Answer[]).map((letter) => (
            <button
              key={letter}
              role="radio"
              aria-checked={selectedAnswer === letter}
              onClick={() => onAnswer(letter)}
              className={`flex w-full items-start gap-4 border-2 px-5 py-4 text-left transition ${
                selectedAnswer === letter
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-300 bg-white hover:border-[#111827]"
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center text-xs font-bold ${
                  selectedAnswer === letter
                    ? "bg-amber-500 text-[#111827]"
                    : "bg-slate-100 text-gray-700"
                }`}
                aria-hidden="true"
              >
                {letter}
              </span>
              <span className="text-base leading-relaxed text-[#111827]">
                {question.options[letter]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Passage Text ─────────────────────────────────────────────────────────────

function PassageText({
  passage,
}: {
  passage: { title: string; text: string | null; media: string | null };
}) {
  return (
    <>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#1E3A5F]">
        {passage.title}
      </p>
      {passage.media && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/${passage.media}`}
          alt={passage.title}
          className="mb-4 max-w-full rounded"
        />
      )}
      {passage.text &&
        passage.text.split("\n\n").map((para, i) => (
          <p key={i} className="mb-3">
            {para}
          </p>
        ))}
    </>
  );
}
