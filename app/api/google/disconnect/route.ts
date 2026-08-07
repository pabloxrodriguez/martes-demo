import { NextResponse } from "next/server";

import { requireActivePerson } from "@/lib/auth/requireActivePerson";

export async function POST(request: Request) {
  const { supabase, person } = await requireActivePerson();
  const origin = new URL(request.url).origin;

  const { error } = await supabase
    .from("google_connections")
    .delete()
    .eq("persona_id", person.id);

  if (error) {
    console.error("No se pudo desconectar Google.", error);

    return NextResponse.redirect(
      new URL("/mi-martes?google=disconnect-error", origin)
    );
  }

  return NextResponse.redirect(
    new URL("/mi-martes?google=disconnected", origin)
  );
}
