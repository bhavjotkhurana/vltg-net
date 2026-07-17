// The VLTG "V-bolt" mark (brand kit v1.1): a navy V whose right stroke is an
// amber lightning bolt, with a darker amber facet for the fold. Single source
// of truth for the paths — the Logo component, favicon, apple icon, and OG
// banner all draw from here so the mark can never drift between surfaces.

export const MARK_COLORS = {
  navy: "#1e3a5f",
  cream: "#F4F1EC",
  bolt: "#fbbf24",
  boltFacet: "#f59e0b",
} as const;

// The three paths live in a 1095×1095 space. The mark itself occupies roughly
// x[247,854] y[248,844], so views crop to that with a little breathing room.
export const MARK_PATHS = {
  v: "M548.39 720.06C548.56 741.07 548.74 762.08 548.92 783.1C545.79 801.98 548.44 823.76 547.8 843.14C517.66 843.26 487.51 843.38 457.36 843.5C387.23 646.17 317.1 448.83 246.97 251.5C300.69 251.5 354.42 251.5 408.14 251.5C414.3 267.54 418.57 284.68 423.45 301.16C434.13 337.24 445.62 373.09 456.45 409.12C476.5 475.78 498.25 541.99 517.56 608.86C528.23 645.81 537.96 683.03 548.39 720.06Z",
  bolt: "M727 248.39C769.21 248.43 811.43 248.46 853.64 248.5C813.31 317.17 772.97 385.83 732.63 454.5C762.35 454.83 792.07 455.17 821.78 455.5C755.36 584.46 688.93 713.43 622.5 842.39C597.6 842.64 572.7 842.89 547.8 843.14C548.44 823.76 545.79 801.98 548.92 783.1C552.78 779.11 556.81 766.44 559.24 760.72C565.19 746.7 571.33 732.76 577.27 718.74C594.39 678.32 612.15 638.18 629.31 597.78C634.28 586.1 639.23 574.42 644.36 562.81C646.97 556.88 651.26 549.88 651.76 543.5C648.7 543.41 646.1 542.82 643.88 545.1C637.75 544.77 631.62 545.51 625.5 545.8C615.17 546.27 604.83 546.66 594.5 547.21C587.75 547.57 579.46 549.4 573.09 547.5C574.35 544.85 575.61 542.2 576.88 539.55C626.92 442.5 676.96 345.44 727 248.39Z",
  facet: "M727 248.39C676.96 345.44 626.92 442.5 576.88 539.55C618.07 442.53 659.27 345.52 700.47 248.5C709.31 248.46 718.16 248.43 727 248.39ZM548.92 783.1C548.74 762.08 548.56 741.07 548.39 720.06C580.22 661.74 612.05 603.42 643.88 545.1C646.1 542.82 648.7 543.41 651.76 543.5C651.26 549.88 646.97 556.88 644.36 562.81C639.23 574.42 634.28 586.1 629.31 597.78C612.15 638.18 594.39 678.32 577.27 718.74C571.33 732.76 565.19 746.7 559.24 760.72C556.81 766.44 552.78 779.11 548.92 783.1Z",
} as const;

// Snug crop for lockups (mark sits beside the wordmark).
export const MARK_VIEWBOX_TIGHT = "240 242 620 610";
// Square crop with ~8% padding, for standalone icons (favicon, app icon).
export const MARK_VIEWBOX_SQUARE = "198 194 704 704";

/** Standalone mark as an SVG string. `dark` flips the navy arm to cream. */
export function markSvgString({
  viewBox = MARK_VIEWBOX_SQUARE,
  dark = false,
}: { viewBox?: string; dark?: boolean } = {}): string {
  const vFill = dark ? MARK_COLORS.cream : MARK_COLORS.navy;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path d="${MARK_PATHS.v}" fill="${vFill}"/><path d="${MARK_PATHS.bolt}" fill="${MARK_COLORS.bolt}"/><path d="${MARK_PATHS.facet}" fill="${MARK_COLORS.boltFacet}"/></svg>`;
}
