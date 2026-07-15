import { createServerSupabaseClient } from "@/lib/supabase-server";
import { loadTestQuestions } from "@/lib/questions";
import { redirect } from "next/navigation";
import TestEngine from "./TestEngine";

export default async function TestPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check for existing session (UNIQUE on user_id → at most one row)
  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (session?.status === "completed") redirect("/results");

  let sessionId = session?.id as string | undefined;

  if (!sessionId) {
    const { data: newSession, error } = await supabase
      .from("test_sessions")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (error || !newSession) {
      throw new Error("Failed to create test session");
    }
    sessionId = newSession.id as string;
  }

  // Load existing responses so the user can resume where they left off
  const { data: existingResponses } = await supabase
    .from("question_responses")
    .select("question_id, answer_chosen, flagged_for_review, time_spent_seconds")
    .eq("session_id", sessionId);

  const questions = loadTestQuestions();

  return (
    <TestEngine
      sessionId={sessionId}
      questions={questions}
      existingResponses={existingResponses ?? []}
    />
  );
}
