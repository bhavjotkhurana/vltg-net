"use client";

import { useState } from "react";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="mt-4 border-2 border-[#111827] bg-white px-6 py-5">
        <p className="text-sm font-bold text-[#111827]">You&apos;re on the list.</p>
        <p className="mt-1 text-sm text-gray-700">I&apos;ll let you know when the full study materials are ready.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-2 border-[#111827] bg-white px-6 py-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">Coming soon</p>
      <p className="mb-3 text-sm font-bold text-[#111827]">
        Full study guides and practice sets are on the way. Want a heads-up when they land?
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="waitlist-email" className="sr-only">Email address</label>
        <input
          id="waitlist-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 border-2 border-slate-300 bg-[#F4F1EC] px-3 py-2 text-sm text-[#111827] placeholder-gray-500 focus:border-[#1E3A5F]"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="bg-amber-500 px-5 py-2 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 disabled:opacity-50"
        >
          {state === "loading" ? "…" : "Notify me"}
        </button>
      </form>
      {state === "error" && (
        <p className="mt-2 text-xs text-red-600">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
