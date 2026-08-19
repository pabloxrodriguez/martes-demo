"use server";

import { revalidatePath } from "next/cache";

import { requireActivePerson } from "@/lib/auth/requireActivePerson";

export async function updateCommercialTarget(year: number, value: string) {
  try {
    const { supabase, person } = await requireActivePerson();

    if (person.rol !== "admin" && person.rol !== "direccion") {
      throw new Error("No tienes permiso para modificar la meta comercial.");
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new Error("El año de la meta no es válido.");
    }

    const cleanValue = value.replace(/[^\d]/g, "");
    const parsedValue = Number(cleanValue);

    if (!cleanValue || !Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new Error("La meta comercial debe ser un monto válido.");
    }

    const { error } = await supabase.from("metas_comerciales").upsert(
      {
        anio: year,
        meta: parsedValue,
        actualizado_por_id: person.id,
        fecha_actualizacion: new Date().toISOString(),
      },
      {
        onConflict: "anio",
      }
    );

    if (error) {
      throw new Error(`No se pudo guardar la meta: ${error.message}`);
    }

    revalidatePath("/resultado-financiero");

    return {
      success: true as const,
      error: null,
    };
  } catch (caughtError) {
    return {
      success: false as const,
      error:
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar la meta comercial.",
    };
  }
}
