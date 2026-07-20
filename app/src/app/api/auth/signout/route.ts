import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// POST, not GET, so a prefetcher, link scanner, or email client can't sign
// someone out just by fetching a URL.
//
// Cookie clearing works here because the cookies() adapter in
// createServerSupabaseClient() serialises Set-Cookie onto this route's
// response — the same mechanism auth/callback uses to *set* the session.
// This must not be attempted from a Server Component, where cookie writes
// are silently dropped.
export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signing out when already signed out is a success, not an error.
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
