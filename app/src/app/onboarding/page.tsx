import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // If profile already exists with a desired_score, skip to test
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("desired_score")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.desired_score != null) {
    redirect("/test");
  }

  return <OnboardingForm userId={user.id} userEmail={user.email ?? ""} />;
}
