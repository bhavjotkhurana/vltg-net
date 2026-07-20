"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_MESSAGE = 2000;

/**
 * "Report an issue" — a muted trigger plus a modal. The user types free text;
 * the page context is attached silently.
 *
 * `getContext` is a FUNCTION, not an object, so callers can hand over a closure
 * that reads live state at submit time. Passing an object would freeze the
 * context at render time and attach a stale question id if the user navigated
 * while the modal was open.
 */
export default function ReportIssue({
  getContext,
  className = "",
  label = "Report an issue",
}: {
  getContext?: () => Record<string, unknown>;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setState("idle");
    setMessage("");
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const ctx = getContext?.() ?? {};
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        viewport:
          typeof window !== "undefined"
            ? `${window.innerWidth}x${window.innerHeight}`
            : undefined,
        ...ctx,
      }),
    });
    setState(res.ok ? "done" : "error");
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className={`text-xs font-bold uppercase tracking-[0.15em] text-gray-600 transition-colors hover:text-[#111827] ${className}`}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
        >
          <div className="w-full max-w-sm border-2 border-[#111827] bg-white p-6">
            {state === "done" ? (
              <>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">Received</p>
                <h2 id="report-title" className="text-xl font-bold text-[#111827]">
                  Thanks for the report.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  It&apos;s been logged and I&apos;ll look into it as soon as I can.
                </p>
                <button
                  onClick={close}
                  className="mt-5 w-full border-2 border-[#1E3A5F] bg-[#1E3A5F] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#16304f]"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">Report an issue</p>
                <h2 id="report-title" className="text-xl font-bold text-[#111827]">
                  What went wrong?
                </h2>

                <label htmlFor="report-message" className="sr-only">
                  Describe the issue
                </label>
                <textarea
                  id="report-message"
                  ref={textareaRef}
                  required
                  rows={4}
                  maxLength={MAX_MESSAGE}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="The answer choices overlap on my phone…"
                  className="mt-3 block w-full resize-y border-2 border-slate-300 bg-[#F4F1EC] px-3 py-2 text-sm text-[#111827] placeholder-gray-500 focus:border-[#1E3A5F]"
                />

                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Please describe what you were doing when it happened. Technical
                  details are attached automatically.
                </p>

                {state === "error" && (
                  <p className="mt-2 text-xs text-red-600">Something went wrong. Try again.</p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 border-2 border-[#111827] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={state === "loading" || !message.trim()}
                    className="flex-1 bg-amber-500 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    {state === "loading" ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
