"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RetakeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRetake() {
    if (!confirm("This will clear your current results and restart the test. Are you sure?")) return;
    setLoading(true);
    const res = await fetch("/api/test/retake", { method: "POST" });
    if (res.ok) {
      router.push("/test");
    } else {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRetake}
      disabled={loading}
      className="border-2 border-white/30 bg-amber-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#111827] transition hover:bg-amber-400 disabled:opacity-50"
    >
      {loading ? "Resetting…" : "Retake test"}
    </button>
  );
}
