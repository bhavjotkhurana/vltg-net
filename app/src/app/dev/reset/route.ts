import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

// Dev-only route to wipe your test session and start fresh.
// Only works in development — returns 404 in production.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Deleting the session cascades to question_responses and diagnostic_reports
  await supabase.from("test_sessions").delete().eq("user_id", user.id);

  redirect("/test");
}
