import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

const MAX_MESSAGE = 2000;
const WINDOW_MS = 5 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/**
 * A salted hash of the caller's IP, never the IP itself. Enough to count
 * repeats from one source; not enough to recover the address if the table
 * leaks. The salt must be secret — IPv4 is small enough to brute force
 * against an unsalted hash in seconds.
 */
function hashIp(request: Request): string | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (!ip) return null;
  const salt = process.env.ISSUE_IP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!salt) return null;
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

// Reports can come from anywhere, including the marketing pages where there is
// no session, so this is deliberately not auth-gated (the waitlist pattern).
// The client never sends user_id — it is derived server-side, so anonymous
// reports work without letting anyone forge attribution.
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const raw = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!raw || raw.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceSupabaseClient();

  const ipHash = hashIp(request);

  // Throttle on whichever identity we have. This endpoint deliberately accepts
  // anonymous reports, so the account check alone left an unauthenticated write
  // path with no ceiling — anyone could fill the table, and it is the same
  // database everything else runs on.
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const identity = user
    ? { column: "user_id", value: user.id }
    : ipHash
      ? { column: "ip_hash", value: ipHash }
      : null;

  if (identity) {
    const { count } = await service
      .from("issue_reports")
      .select("id", { count: "exact", head: true })
      .eq(identity.column, identity.value)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_WINDOW) {
      return NextResponse.json({ error: "Too many reports. Try again shortly." }, { status: 429 });
    }
  }

  const str = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 300) : null);

  const { error } = await service.from("issue_reports").insert({
    message: raw,
    user_id: user?.id ?? null,
    session_id: str(payload.sessionId),
    path: str(payload.path),
    question_id: str(payload.questionId),
    phase: str(payload.phase),
    section: str(payload.section),
    viewport: str(payload.viewport),
    // Server-side: the header is already here and unspoofable, and reading the
    // commit SHA here avoids adding a NEXT_PUBLIC_ build variable.
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    app_version: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    ip_hash: ipHash,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
