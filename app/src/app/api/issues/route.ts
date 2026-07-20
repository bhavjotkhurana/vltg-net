import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MAX_MESSAGE = 2000;

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

  // Cheap guard against accidental double-submits and authenticated spam.
  // Anonymous flooding isn't covered; revisit if the table shows abuse.
  if (user) {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await service
      .from("issue_reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
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
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
