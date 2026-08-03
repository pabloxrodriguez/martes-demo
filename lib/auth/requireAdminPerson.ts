import "server-only";

import { redirect } from "next/navigation";

import { requireActivePerson } from "@/lib/auth/requireActivePerson";

export async function requireAdminPerson() {
  const context = await requireActivePerson();

  if (context.person.rol !== "admin") {
    redirect("/acceso-denegado");
  }

  return context;
}
