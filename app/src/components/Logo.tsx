// VLTG wordmark (brand kit v1): amber "V" carries the electricity, "LTG" in ink
// (or cream on dark backgrounds). Work Sans bold, uppercase, 0.06em tracking.

export function Logo({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const ltgColor = variant === "dark" ? "text-[#F4F1EC]" : "text-[#111827]";
  return (
    <span
      className={`inline-block font-sans font-bold uppercase leading-none tracking-[0.06em] select-none ${className}`}
      aria-label="VLTG"
    >
      <span className="text-amber-500" aria-hidden="true">
        V
      </span>
      <span className={ltgColor} aria-hidden="true">
        LTG
      </span>
    </span>
  );
}

// Standalone mark — the amber "V" alone (app icon / compact contexts).
export function VMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block font-sans font-bold uppercase leading-none text-amber-500 select-none ${className}`}
      aria-label="VLTG"
    >
      V
    </span>
  );
}
