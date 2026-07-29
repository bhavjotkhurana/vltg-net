// A stylized, static recreation of the test-taking screen, paired with
// ResultsPreview on the landing to show the journey. Not a captured image.
export default function TestPreview() {
  const options = [
    { letter: "A", value: "3" },
    { letter: "B", value: "5", selected: true },
    { letter: "C", value: "9" },
    { letter: "D", value: "15" },
  ];
  return (
    <div className="mx-auto max-w-2xl border-2 border-[#111827] bg-white shadow-[7px_7px_0_0_#111827]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b-2 border-[#111827] bg-[#F4F1EC] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
        <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
          Taking the test
        </span>
      </div>

      {/* Test chrome: section, progress, timer */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-[#111827] px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-[#1E3A5F] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            Math
          </span>
          <span className="text-xs font-bold text-gray-600">Question 12 of 69</span>
        </div>
        <span className="text-sm font-bold tabular-nums text-[#111827]">18:42</span>
      </div>

      {/* Question */}
      <div className="px-6 pt-6">
        <p className="text-lg font-bold leading-relaxed text-[#111827]">
          Solve for <span className="italic">x</span>: &nbsp;5<span className="italic">x</span> &minus; 3 = 2<span className="italic">x</span> + 12
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5 px-6 py-5">
        {options.map((o) => (
          <div
            key={o.letter}
            className={`flex items-center gap-3 border-2 px-4 py-2.5 ${
              o.selected
                ? "border-amber-500 bg-amber-50"
                : "border-slate-300 bg-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center text-sm font-bold ${
                o.selected ? "bg-amber-500 text-[#111827]" : "bg-slate-100 text-gray-600"
              }`}
            >
              {o.letter}
            </span>
            <span className="text-base font-medium text-[#111827]">{o.value}</span>
          </div>
        ))}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t-2 border-[#111827] px-6 py-3 text-xs font-bold uppercase tracking-[0.12em]">
        <span className="text-gray-500">&larr; Back</span>
        <span className="text-[#1E3A5F]">Next &rarr;</span>
      </div>
    </div>
  );
}
