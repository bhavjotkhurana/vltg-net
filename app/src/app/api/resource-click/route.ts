import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Logs an outbound click on a per-gap study resource from the results page.
// Fire-and-forget from the client (sendBeacon/keepalive), so it stays lean and
// never blocks the user's navigation to the resource.
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const skillId = typeof payload.skillId === "string" ? payload.skillId.slice(0, 100) : "";
  const resourceUrl = typeof payload.resourceUrl === "string" ? payload.resourceUrl.slice(0, 500) : "";
  if (!skillId || !resourceUrl) {
    return NextResponse.json({ error: "skillId and resourceUrl required" }, { status: 400 });
  }

  // Attribution is server-derived, never trusted from the client.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // sessionId is validated as a UUID before it reaches Postgres, so a malformed
  // value returns 400 rather than a raw driver error.
  const rawSession = typeof payload.sessionId === "string" ? payload.sessionId : "";
  const sessionId = /^[0-9a-f-]{36}$/i.test(rawSession) ? rawSession : null;

  const service = createServiceSupabaseClient();
  const { error } = await service.from("resource_clicks").insert({
    user_id: user?.id ?? null,
    session_id: sessionId,
    skill_id: skillId,
    resource_url: resourceUrl,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
