import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function requireActivePerson() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para realizar esta acción.");
  }

  const { data: person, error: personError } = await supabase
    .from("personas")
    .select("id, activo, administrador")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (personError) {
    throw new Error(
      `No se pudo verificar tu acceso: ${personError.message}`
    );
  }

  if (!person?.activo) {
    throw new Error("Tu usuario no está autorizado para realizar esta acción.");
  }

  return {
    supabase,
    user,
    person,
  };
}
