// VLTG logo. The "V-bolt" mark (see lib/logoMark) sits beside the Work Sans
// wordmark. The wordmark is plain ink so it doesn't fight the amber V in the
// mark; on dark backgrounds both the V arm and the wordmark flip to cream.
// Sized off font-size (the `className` sets it), so every existing call site
// that passed `text-[1.4rem]` etc. keeps working.

import { MARK_COLORS, MARK_PATHS, MARK_VIEWBOX_TIGHT } from "@/lib/logoMark";

export function VMark({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const vFill = variant === "dark" ? MARK_COLORS.cream : MARK_COLORS.navy;
  return (
    <svg
      viewBox={MARK_VIEWBOX_TIGHT}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={MARK_PATHS.v} fill={vFill} />
      <path d={MARK_PATHS.bolt} fill={MARK_COLORS.bolt} />
      <path d={MARK_PATHS.facet} fill={MARK_COLORS.boltFacet} />
    </svg>
  );
}

export function Logo({
  variant = "light",
  responsive = false,
  className = "",
}: {
  variant?: "light" | "dark";
  /** Hide the wordmark below the `sm` breakpoint (mark only), for tight headers. */
  responsive?: boolean;
  className?: string;
}) {
  const textColor = variant === "dark" ? "text-[#F4F1EC]" : "text-[#111827]";
  return (
    <span
      className={`inline-flex items-center gap-[0.4em] leading-none ${className}`}
      role="img"
      aria-label="VLTG"
    >
      <VMark variant={variant} className="h-[1.25em] w-auto shrink-0" />
      <span
        className={`font-sans font-bold uppercase tracking-[0.06em] ${textColor} ${
          responsive ? "hidden sm:inline-block" : ""
        }`}
        aria-hidden="true"
      >
        VLTG
      </span>
    </span>
  );
}
