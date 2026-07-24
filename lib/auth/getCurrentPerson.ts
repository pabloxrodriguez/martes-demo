import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentPerson() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?reason=session_expired");
  }

  const { data: person, error } = await supabase
    .from("personas")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return person;
}
