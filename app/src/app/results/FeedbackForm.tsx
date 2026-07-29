"use client";

import { useState } from "react";

// Feedback window on the results page (replaces the old waitlist "Coming soon"
// box). Name, email, and subject are optional; the body is the one required
// field. Posts to /api/feedback.
export default function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setState("loading");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        subject,
        body,
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
      }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="mt-4 border-2 border-[#111827] bg-white px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">Thank you</p>
        <p className="mt-1 text-sm font-bold text-[#111827]">Thanks for the feedback.</p>
        <p className="mt-1 text-sm text-gray-700">It&apos;s logged, and I&apos;ll read it.</p>
      </div>
    );
  }

  const inputClass =
    "block w-full border-2 border-slate-300 bg-[#F4F1EC] px-3 py-2 text-sm text-[#111827] placeholder-gray-500 focus:border-[#1E3A5F]";

  return (
    <div className="mt-4 border-2 border-[#111827] bg-white px-6 py-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">Feedback</p>
      <p className="mb-3 text-sm font-bold text-[#111827]">
        Something didn&apos;t work? Something worked well? Let me know.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="fb-name" className="sr-only">Your name</label>
            <input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className={inputClass} />
          </div>
          <div className="flex-1">
            <label htmlFor="fb-email" className="sr-only">Email</label>
            <input id="fb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="fb-subject" className="sr-only">Subject</label>
          <input id="fb-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" className={inputClass} />
        </div>
        <div>
          <label htmlFor="fb-body" className="sr-only">Your feedback</label>
          <textarea
            id="fb-body"
            required
            rows={4}
            maxLength={5000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind?"
            className={`${inputClass} resize-y`}
          />
        </div>
        {state === "error" && (
          <p className="text-xs text-red-600">Something went wrong. Try again.</p>
        )}
        <button
          type="submit"
          disabled={state === "loading" || !body.trim()}
          className="bg-amber-500 px-6 py-2 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 disabled:opacity-50"
        >
          {state === "loading" ? "Sending…" : "Send feedback"}
        </button>
      </form>
    </div>
  );
}
