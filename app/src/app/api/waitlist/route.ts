import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const service = createServiceSupabaseClient();
  const { error } = await service
    .from("waitlist")
    .insert({ email: email.trim().toLowerCase() });

  // Ignore duplicate — already signed up is fine
  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
