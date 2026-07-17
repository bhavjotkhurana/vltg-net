// The stanine bell curve, drawn from the same z-boundaries the scoring engine
// uses (see lib/scoring.ts) so the picture can never drift from the product.
//
// Inline SVG rather than an image on purpose: the band labels are real text in
// the DOM and the aria-label is a full sentence, so a crawler or an answer
// engine reads this as content instead of skipping an opaque <img>.

const Z_BOUNDS = [-1.75, -1.25, -0.75, -0.25, 0.25, 0.75, 1.25, 1.75];
const PCTS = [4, 7, 12, 17, 20, 17, 12, 7, 4];

type CurveCfg = {
  w: number;
  h: number;
  baseY: number;
  peakH: number;
  x0: number;
  x1: number;
  /** The seven middle bands are only half a z-unit wide. On a phone that is
   *  ~25px, which cannot hold a "12%" label without collisions, so the narrow
   *  variant drops the percentages and lets the curve's shape plus the caption
   *  carry that. One shared viewBox can't serve both widths. */
  showPct: boolean;
  numberSize: number;
  pctSize: number;
  calloutSize: number;
};

const WIDE: CurveCfg = {
  w: 720, h: 302, baseY: 236, peakH: 186, x0: 34, x1: 686,
  showPct: true, numberSize: 21, pctSize: 16, calloutSize: 17,
};

const NARROW: CurveCfg = {
  w: 360, h: 268, baseY: 228, peakH: 178, x0: 8, x1: 352,
  showPct: false, numberSize: 16, pctSize: 0, calloutSize: 13,
};

function geom(c: CurveCfg) {
  const xOf = (z: number) => c.x0 + ((z + 3) / 6) * (c.x1 - c.x0);
  const yOf = (z: number) => c.baseY - Math.exp((-z * z) / 2) * c.peakH;
  /** Filled area under the normal curve between two z values. */
  const bandPath = (zLo: number, zHi: number) => {
    const pts: string[] = [`M ${xOf(zLo).toFixed(2)} ${c.baseY}`];
    for (let z = zLo; z <= zHi + 1e-9; z += 0.02) {
      pts.push(`L ${xOf(z).toFixed(2)} ${yOf(z).toFixed(2)}`);
    }
    pts.push(`L ${xOf(zHi).toFixed(2)} ${c.baseY} Z`);
    return pts.join(" ");
  };
  return { xOf, yOf, bandPath };
}

const BANDS = PCTS.map((pct, i) => {
  const zLo = i === 0 ? -3 : Z_BOUNDS[i - 1];
  const zHi = i === 8 ? 3 : Z_BOUNDS[i];
  const stanine = i + 1;
  // Below the bar = muted. The bar itself (4) = amber. Qualifying (5-9) = navy.
  const fill = stanine < 4 ? "#cbd5e1" : stanine === 4 ? "#F59E0B" : "#1E3A5F";
  return { stanine, pct, zLo, zHi, fill, mid: (zLo + zHi) / 2 };
});

const CURVE_ALT =
  "A bell curve split into nine stanine bands. Bands 1 to 3 are below the qualifying bar, band 4 is the minimum most locals want, and bands 5 to 9 are above it. About 20 percent of test takers land in band 5, which is average, and only about 4 percent land in band 1 or band 9.";

function CurveSvg({ cfg, className }: { cfg: CurveCfg; className: string }) {
  const { xOf, yOf, bandPath } = geom(cfg);
  return (
    <svg
      viewBox={`0 0 ${cfg.w} ${cfg.h}`}
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label={CURVE_ALT}
    >
      {BANDS.map((b) => (
        <path key={b.stanine} d={bandPath(b.zLo, b.zHi)} fill={b.fill} />
      ))}
      {/* band dividers */}
      {Z_BOUNDS.map((z) => (
        <line
          key={z}
          x1={xOf(z)}
          x2={xOf(z)}
          y1={yOf(z)}
          y2={cfg.baseY}
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      ))}
      {/* baseline */}
      <line x1={cfg.x0} x2={cfg.x1} y1={cfg.baseY} y2={cfg.baseY} stroke="#111827" strokeWidth="2" />
      {/* stanine number + share of people who land there */}
      {BANDS.map((b) => (
        <g key={`l-${b.stanine}`}>
          <text
            x={xOf(b.mid)}
            y={cfg.baseY + cfg.numberSize + 8}
            textAnchor="middle"
            fontSize={cfg.numberSize}
            fontWeight="700"
            fill="#111827"
          >
            {b.stanine}
          </text>
          {cfg.showPct && (
            <text
              x={xOf(b.mid)}
              y={cfg.baseY + cfg.numberSize + cfg.pctSize + 14}
              textAnchor="middle"
              fontSize={cfg.pctSize}
              fill="#4b5563"
            >
              {b.pct}%
            </text>
          )}
        </g>
      ))}
      {/* single callout on the peak — the colour legend carries the rest */}
      <text
        x={xOf(0)}
        y={yOf(0) - 14}
        textAnchor="middle"
        fontSize={cfg.calloutSize}
        fontWeight="700"
        fill="#1E3A5F"
      >
        5 is average
      </text>
      <line
        x1={xOf(0)}
        x2={xOf(0)}
        y1={yOf(0) - 9}
        y2={yOf(0) - 3}
        stroke="#1E3A5F"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const LEGEND = [
  { color: "#cbd5e1", label: "1 to 3, below the bar", strong: false },
  { color: "#F59E0B", label: "4, the minimum most locals want", strong: true },
  { color: "#1E3A5F", label: "5 and up, above the bar", strong: false },
];

export function StanineCurve() {
  return (
    <figure className="border-2 border-[#111827] bg-white">
      <div className="px-3 pt-3 sm:px-0 sm:pt-0">
        <CurveSvg cfg={NARROW} className="sm:hidden" />
        <CurveSvg cfg={WIDE} className="hidden sm:block" />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t-2 border-[#111827] px-5 py-3 text-sm">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 flex-none border border-[#111827]"
              style={{ backgroundColor: l.color }}
            />
            <span className={l.strong ? "font-bold text-[#111827]" : "text-gray-700"}>
              {l.label}
            </span>
          </span>
        ))}
      </div>
      <figcaption className="border-t-2 border-[#111827] bg-[#F4F1EC] px-5 py-3 text-sm leading-relaxed text-gray-700">
        Each band is a stanine. Most people land in the middle: about 20% score a 5,
        and only about 4% land at either end. Scoring is about{" "}
        <strong className="text-[#111827]">where you sit relative to everyone else</strong>,
        not the percentage you got right.
      </figcaption>
    </figure>
  );
}
