// A stylized, static recreation of the real results page, for the landing so a
// cold visitor sees the payoff before signing in. Not a captured image: it's
// on-brand markup, so it stays sharp, responsive, and in sync with the product.
// Sample numbers only.
export default function ResultsPreview() {
  return (
    <div className="mx-auto max-w-2xl border-2 border-[#111827] bg-white shadow-[7px_7px_0_0_#111827]">
      {/* Window chrome, so it reads as a screenshot */}
      <div className="flex items-center gap-2 border-b-2 border-[#111827] bg-[#F4F1EC] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
        <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
          Your results
        </span>
      </div>

      {/* Score hero */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr]">
        <div className="bg-[#1E3A5F] px-10 py-8 text-center">
          <p className="text-7xl font-extrabold leading-none text-amber-400">6</p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-300">
            out of 9 · stanine
          </p>
          <p className="mt-4 text-base font-bold text-white">You&apos;re in qualifying range.</p>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-300">
            Goal: 7 · 1 point to go
          </p>
        </div>
        {/* Side-by-side on mobile (fits fine there); stacked on desktop so the
            two cells split the navy panel's height instead of floating in it. */}
        <div className="flex divide-x-2 divide-[#111827] border-t-2 border-[#111827] sm:flex-col sm:divide-x-0 sm:divide-y-2 sm:border-l-2 sm:border-t-0">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-600">Math</p>
            <p className="mt-1 text-2xl font-extrabold text-[#111827]">21/33</p>
            <p className="text-sm text-gray-600">64%</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-600">Reading</p>
            <p className="mt-1 text-2xl font-extrabold text-[#111827]">28/36</p>
            <p className="text-sm text-gray-600">78%</p>
          </div>
        </div>
      </div>

      {/* Strengths first */}
      <div className="border-t-2 border-[#111827] px-6 py-4">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-3 w-3 bg-emerald-500" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Already solid
          </span>
        </div>
        <p className="text-sm leading-relaxed text-gray-700">
          You&apos;re already strong on{" "}
          <strong className="text-[#111827]">Basic Arithmetic, Order of Operations, Detail Retrieval</strong>.
          No need to spend time there.
        </p>
      </div>

      {/* Coach note */}
      <div className="border-t-2 border-[#111827] px-6 py-4">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">
          Coach note
        </p>
        <p className="text-sm leading-relaxed text-gray-700">
          You scored a 6, which clears the qualifying bar. Your goal is a 7, so you&apos;re
          one point short. Your biggest gaps are in linear equations and polynomials, so
          start there to close it.
        </p>
      </div>

      {/* Study-plan snippet, colour-coded like the real thing */}
      <div className="border-t-2 border-[#111827]">
        <div className="border-l-4 border-emerald-500 bg-[#F4F1EC] px-6 py-2.5">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">
            01 · Quick wins
          </span>
        </div>
        <div className="px-6 py-4">
          <p className="text-base font-bold text-[#111827]">Fractions &amp; Rational Numbers</p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
            Already at 67%. A little targeted practice tips this over.
          </p>
          <span className="mt-2.5 inline-block text-sm font-bold text-[#1E3A5F] underline decoration-amber-500 underline-offset-2">
            Study this: Fractions (Math Is Fun)
          </span>
        </div>
        <div className="border-l-4 border-red-500 border-t-2 border-t-[#111827] bg-[#F4F1EC] px-6 py-2.5">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-red-700">
            02 · Fix the root first
          </span>
        </div>
        <div className="px-6 py-4">
          <p className="text-base font-bold text-[#111827]">Linear Equations</p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-700">
            At 60%. Gaps in the basics underneath are holding this back, so start there.
          </p>
          <span className="mt-2.5 inline-block text-sm font-bold text-[#1E3A5F] underline decoration-amber-500 underline-offset-2">
            Study this: Solving equations &amp; inequalities (Khan Academy)
          </span>
        </div>
      </div>
    </div>
  );
}
