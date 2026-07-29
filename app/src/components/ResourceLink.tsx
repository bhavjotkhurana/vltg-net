"use client";

/**
 * A per-gap study-resource link on the results page. Opens in a new tab so the
 * person keeps their own results open (the results page is the retention
 * primitive, so we never navigate them away from it), and logs the click by
 * skill so we learn which gaps actually drive study behavior.
 *
 * The log is fire-and-forget: sendBeacon when available, a keepalive fetch
 * otherwise. Either way it never blocks the click.
 */
export default function ResourceLink({
  sessionId,
  skillId,
  url,
  title,
  source,
}: {
  sessionId: string;
  skillId: string;
  url: string;
  title: string;
  source: string;
}) {
  function logClick() {
    const body = JSON.stringify({ sessionId, skillId, resourceUrl: url });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/resource-click", new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // fall through to fetch
    }
    fetch("/api/resource-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={logClick}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A5F] underline decoration-amber-500 underline-offset-2 transition-colors hover:text-amber-600"
    >
      Study this: {title} ({source})
    </a>
  );
}
