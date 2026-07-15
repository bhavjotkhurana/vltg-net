import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

// Dev-only: bypass Google OAuth by signing in a fixed confirmed test user
// via email/password. Establishes a real Supabase SSR session (same cookies
// as the OAuth callback), so the whole authenticated flow becomes reachable
// while Google is disabled. Returns 404 in production.

const TEST_EMAIL = "dev+test@vltg.local";
const TEST_PASSWORD = "dev-password-12345";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  // Ensure the test user exists and is email-confirmed (idempotent).
  const service = createServiceSupabaseClient();
  const { error: createError } = await service.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  // "already registered" is expected on repeat runs — ignore it.
  if (createError && !/already|registered|exists/i.test(createError.message)) {
    return new Response("Failed to create test user: " + createError.message, {
      status: 500,
    });
  }

  // Sign in through the SSR client so auth cookies are written on the response.
  const supabase = await createServerSupabaseClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signInError) {
    return new Response("Failed to sign in test user: " + signInError.message, {
      status: 500,
    });
  }

  redirect("/onboarding");
}
