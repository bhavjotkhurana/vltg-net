import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const MAX_BODY = 5000;

// Feedback from the results-page window. Body is required; name, email, subject
// are optional. Written with the service role (the feedback table is RLS-locked
// with no policies). user_id is derived server-side, never trusted from the
// client, and user_agent / app_version are attached for context.
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body || body.length > MAX_BODY) {
    return NextResponse.json({ error: "Feedback message required" }, { status: 400 });
  }
  const str = (v: unknown, n = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceSupabaseClient();

  // Cheap guard against accidental double-submits and spam.
  if (user) {
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await service
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many submissions. Try again shortly." }, { status: 429 });
    }
  }

  const { error } = await service.from("feedback").insert({
    name: str(payload.name, 200),
    email: str(payload.email, 320),
    subject: str(payload.subject, 300),
    body,
    user_id: user?.id ?? null,
    path: str(payload.path),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    app_version: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
