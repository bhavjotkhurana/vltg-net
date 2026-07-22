"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import ReportIssue from "@/components/ReportIssue";
import { readAttribution } from "@/lib/attribution";

const SCORE_OPTIONS = [
  { score: 4, description: "Minimum to qualify for an interview" },
  { score: 5, description: "Competitive applicant" },
  { score: 6, description: "Strong applicant" },
  { score: 7, description: "Very strong applicant" },
  { score: 8, description: "Top-tier applicant" },
  { score: 9, description: "Perfect score" },
];

type Step = "goal" | "instructions";

export default function OnboardingForm({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("goal");
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [localUnion, setLocalUnion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Rendered below the card on both steps. Showing the email is functional,
  // not decoration: signing in with the wrong Google account is the most common
  // way people get stuck, and this is where they'd notice.
  const accountLine = (
    <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-gray-500">
      <span>Signed in as {userEmail}.</span>
      <SignOutButton />
      <span aria-hidden="true">·</span>
      <ReportIssue />
    </p>
  );

  async function handleStartTest() {
    if (!selectedScore) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    // Attach first-touch attribution captured at landing. This is the one row
    // created early enough to carry it, so it's where the channel that produced
    // this user gets recorded for the whole funnel.
    const attribution = readAttribution();
    const { error } = await supabase.from("user_profiles").insert({
      id: userId,
      desired_score: selectedScore,
      local_union: localUnion.trim() || null,
      ...attribution,
    });

    setLoading(false);
    if (error) setError(error.message);
    else router.push("/test");
  }

  if (step === "instructions") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F1EC] px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-2">Before you begin</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">
              A quick look at what&apos;s ahead.
            </h1>
          </div>

          <div className="divide-y-2 divide-[#111827] border-2 border-[#111827] bg-white">
            {/* Test structure */}
            <div className="p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-4">Test structure</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Math", value: "33 questions", note: "Algebra & functions" },
                  { label: "Reading", value: "36 questions", note: "Comprehension passages" },
                  { label: "Your goal", value: `Score ${selectedScore}`, note: "You can reset this later" },
                  { label: "Passing score", value: "Score 4+", note: "Qualifies for interview" },
                ].map(({ label, value, note }) => (
                  <div key={label} className="border border-slate-300 bg-[#F4F1EC] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-600">{label}</p>
                    <p className="mt-1 text-xl font-bold text-[#111827]">{value}</p>
                    <p className="text-xs text-gray-600">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
            <div className="p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-4">Good to know</p>
              <ul className="space-y-2.5">
                {[
                  "No calculator, work the math by hand",
                  "No outside references or notes",
                  "One answer per question (A, B, C, or D)",
                  "Unanswered questions count as incorrect",
                  "Flag anything you want to revisit before submitting",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-3 text-base text-gray-700">
                    <span className="mt-0.5 flex-none font-bold text-amber-500" aria-hidden="true">·</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keyboard shortcuts */}
            <div className="p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-4">Keyboard shortcuts</p>
              <div className="space-y-2">
                {[
                  ["A / B / C / D", "Select answer"],
                  ["→  or  Enter", "Next question"],
                  ["←", "Previous question"],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center gap-4">
                    <kbd className="border-2 border-[#111827] bg-[#F4F1EC] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#111827]">{key}</kbd>
                    <span className="text-sm text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-3 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setStep("goal")}
              className="border-2 border-[#111827] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-slate-100"
            >
              Back
            </button>
            <button
              onClick={handleStartTest}
              disabled={loading}
              className="flex-1 bg-amber-500 py-3 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Starting…" : "Start the test"}
            </button>
          </div>
          {accountLine}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F1EC] px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-2">Step 1 of 2</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">
            Set your target score.
          </h1>
          <p className="mt-2 text-base leading-relaxed text-gray-700">
            A score of 4 qualifies you for an interview, and higher scores move you up the list. Pick what you&apos;re aiming for and I&apos;ll build your study plan around it.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SCORE_OPTIONS.map(({ score, description }) => (
            <button
              key={score}
              type="button"
              aria-pressed={selectedScore === score}
              onClick={() => setSelectedScore(score)}
              className={`border-2 p-5 text-left transition ${
                selectedScore === score
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-300 bg-white hover:border-[#111827]"
              }`}
            >
              <div className="text-4xl font-extrabold text-[#111827]">{score}</div>
              <div className="mt-2 text-xs font-semibold leading-snug text-gray-700">{description}</div>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <label htmlFor="local_union" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-[#111827]">
            Local union <span className="font-normal normal-case tracking-normal text-gray-600">(optional)</span>
          </label>
          <input
            id="local_union"
            type="text"
            value={localUnion}
            onChange={(e) => setLocalUnion(e.target.value)}
            className="block w-full border-2 border-slate-300 bg-white px-4 py-3 text-base text-[#111827] placeholder-gray-500 focus:border-[#1E3A5F]"
            placeholder="e.g. Local 3 – New York, NY"
          />
        </div>

        <button
          onClick={() => { if (selectedScore) setStep("instructions"); }}
          disabled={!selectedScore}
          className="mt-5 w-full bg-amber-500 py-3.5 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue
        </button>
        {accountLine}
      </div>
    </div>
  );
}
