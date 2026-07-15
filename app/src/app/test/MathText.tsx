"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Renders text that may contain inline LaTeX delimited by $...$
 * e.g. "Solve $x^2 + 3x - 4 = 0$" renders the LaTeX portion with KaTeX.
 * Escaped dollar signs (\$) are treated as literal $ characters.
 */
export default function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  // Replace escaped \$ with a private-use placeholder so the LaTeX splitter
  // doesn't treat currency dollar signs as math delimiters.
  const PLACEHOLDER = "\uE000";
  const processed = text.replace(/\\\$/g, PLACEHOLDER);

  // Split on $...$ (non-greedy, single-line)
  const parts = processed.split(/(\$[^$\n]+\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const latex = part.slice(1, -1).replace(new RegExp(PLACEHOLDER, "g"), "\\$");
          try {
            const html = katex.renderToString(latex, {
              throwOnError: false,
              output: "html",
            });
            return (
              <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
            );
          } catch {
            return <span key={i}>{part.replace(new RegExp(PLACEHOLDER, "g"), "$")}</span>;
          }
        }
        return <span key={i}>{part.replace(new RegExp(PLACEHOLDER, "g"), "$")}</span>;
      })}
    </span>
  );
}
