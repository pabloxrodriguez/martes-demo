"use server";

import { revalidatePath } from "next/cache";

import { requireAdminPerson } from "@/lib/auth/requireAdminPerson";
import type { TableInsert, TableUpdate } from "@/types/database";

const ROLES = ["admin", "direccion", "equipo", "lector"] as const;
type PersonRole = (typeof ROLES)[number];

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return normalizeText(value).toLowerCase();
}

function requireRole(value: FormDataEntryValue | null): PersonRole {
  const role = normalizeText(value);

  if (!ROLES.includes(role as PersonRole)) {
    throw new Error("El rol seleccionado no es válido.");
  }

  return role as PersonRole;
}

async function getActiveAdminCount(
  supabase: Awaited<ReturnType<typeof requireAdminPerson>>["supabase"]
) {
  const { count, error } = await supabase
    .from("personas")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("activo", true)
    .eq("rol", "admin");

  if (error) {
    throw new Error(
      `No se pudo verificar cuántos admin activos existen: ${error.message}`
    );
  }

  return count ?? 0;
}

async function assertCanChangeAdminStatus(targetPersonId: string) {
  const { supabase, person } = await requireAdminPerson();
  const { data: target, error } = await supabase
    .from("personas")
    .select("id, rol, activo")
    .eq("id", targetPersonId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo verificar la persona: ${error.message}`);
  }

  if (!target) {
    throw new Error("La persona no existe.");
  }

  const activeAdminCount = await getActiveAdminCount(supabase);

  return {
    supabase,
    currentPerson: person,
    target,
    activeAdminCount,
  };
}

export async function createPerson(formData: FormData) {
  const { supabase } = await requireAdminPerson();
  const nombre = normalizeText(formData.get("nombre"));
  const email = normalizeEmail(formData.get("email"));
  const rol = requireRole(formData.get("rol"));
  const activo = formData.get("activo") === "on";

  if (!nombre) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("El correo no tiene un formato válido.");
  }

  const insertData: TableInsert<"personas"> = {
    nombre,
    email,
    rol,
    activo,
    administrador: rol === "admin",
  };
  const { error } = await supabase.from("personas").insert(insertData);

  if (error) {
    throw new Error(`No se pudo crear la persona: ${error.message}`);
  }

  revalidatePath("/administracion");
}

export async function updatePerson(formData: FormData) {
  const personId = normalizeText(formData.get("id"));
  const nombre = normalizeText(formData.get("nombre"));
  const email = normalizeEmail(formData.get("email"));
  const rol = requireRole(formData.get("rol"));
  const activo = formData.get("activo") === "on";

  if (!personId) {
    throw new Error("Falta la persona a actualizar.");
  }

  if (!nombre) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("El correo no tiene un formato válido.");
  }

  const { supabase, currentPerson, target, activeAdminCount } =
    await assertCanChangeAdminStatus(personId);
  const wouldRemoveLastActiveAdmin =
    target.rol === "admin" &&
    target.activo &&
    (rol !== "admin" || !activo) &&
    activeAdminCount <= 1;

  if (wouldRemoveLastActiveAdmin) {
    throw new Error("No puedes dejar el sistema sin un admin activo.");
  }

  if (currentPerson.id === personId && !activo) {
    throw new Error("No puedes desactivarte a ti mismo.");
  }

  const updateData: TableUpdate<"personas"> = {
    nombre,
    email,
    rol,
    activo,
    administrador: rol === "admin",
    fecha_actualizacion: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("personas")
    .update(updateData)
    .eq("id", personId);

  if (error) {
    throw new Error(`No se pudo actualizar la persona: ${error.message}`);
  }

  revalidatePath("/administracion");
}
