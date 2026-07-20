"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Sign out, then send the user home.
 *
 * `router.refresh()` after the push is not optional: without it the Router
 * Cache keeps serving the authenticated RSC payload and the user still looks
 * signed in until a hard reload.
 */
export default function SignOutButton({
  confirmMessage,
  className = "",
}: {
  /** If set, ask before signing out (used mid-test). */
  confirmMessage?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setLoading(true);
    const res = await fetch("/api/auth/signout", { method: "POST" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      alert("Couldn't sign you out. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`text-xs font-bold uppercase tracking-[0.15em] text-gray-600 transition-colors hover:text-[#111827] disabled:opacity-50 ${className}`}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
