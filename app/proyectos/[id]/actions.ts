"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const allowedFields = [
  "nombre",
  "prioridad",
  "estado_id",
  "tipo_id",
  "responsable_id",
  "cliente_id",
  "fecha_propuesta",
  "fecha_evento_inicio",
  "fecha_evento_termino",
  "publico_esperado",
  "valor_venta",
  "notas",
] as const;

type EditableProjectField = (typeof allowedFields)[number];

export async function updateProjectField(
  projectId: string,
  field: EditableProjectField,
  value: string
) {
  const supabase = await createClient();

  let normalizedValue: string | number | null = value.trim();

  if (normalizedValue === "") {
    normalizedValue = null;
  }

  if (
    (
      field === "prioridad" ||
      field === "publico_esperado" ||
      field === "valor_venta"
    ) &&
    normalizedValue !== null
  ) {
    const parsedValue = Number(normalizedValue);

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      throw new Error("El valor debe ser un número válido.");
    }

    if (
      field === "prioridad" &&
      (parsedValue < 1 || parsedValue > 9)
    ) {
      throw new Error("La prioridad debe estar entre 1 y 9.");
    }

    normalizedValue = parsedValue;
  }

  if (field === "fecha_evento_inicio") {
    const { data: currentProject, error: projectError } =
      await supabase
        .from("proyectos")
        .select("fecha_evento_inicio, fecha_evento_termino")
        .eq("id", projectId)
        .single();

    if (projectError) {
      throw new Error(
        `No se pudo obtener el proyecto: ${projectError.message}`
      );
    }

    const eventWasOneDay =
      currentProject.fecha_evento_inicio ===
      currentProject.fecha_evento_termino;

    const updateData: Record<string, string | number | null> = {
      fecha_evento_inicio: normalizedValue,
      fecha_actualizacion: new Date().toISOString(),
    };

    if (eventWasOneDay) {
      updateData.fecha_evento_termino = normalizedValue;
    }

    const { error } = await supabase
      .from("proyectos")
      .update(updateData)
      .eq("id", projectId);

    if (error) {
      throw new Error(
        `No se pudo actualizar el proyecto: ${error.message}`
      );
    }
  } else {
    const { error } = await supabase
      .from("proyectos")
      .update({
        [field]: normalizedValue,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      throw new Error(
        `No se pudo actualizar el proyecto: ${error.message}`
      );
    }
  }

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
}