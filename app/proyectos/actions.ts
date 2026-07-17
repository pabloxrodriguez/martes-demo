"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type CreateProjectInput = {
  nombre: string;
  responsable_id: string;
  estado_id: string;
  fecha_propuesta: string;
};

export async function createProject(
  input: CreateProjectInput
) {
  const supabase = await createClient();

  const nombre = input.nombre.trim();
  const responsableId = input.responsable_id.trim();
  const estadoId = input.estado_id.trim();
  const fechaPropuesta = input.fecha_propuesta.trim();

  if (!nombre) {
    throw new Error("El nombre del proyecto es obligatorio.");
  }

  if (!responsableId) {
    throw new Error("El responsable es obligatorio.");
  }

  if (!estadoId) {
    throw new Error("El estado es obligatorio.");
  }

  if (!fechaPropuesta) {
    throw new Error("La fecha de propuesta es obligatoria.");
  }

  const { data, error } = await supabase
    .from("proyectos")
    .insert({
      nombre,
      responsable_id: responsableId,
      estado_id: estadoId,
      fecha_propuesta: fechaPropuesta,
      prioridad: 5,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `No se pudo crear el proyecto: ${error.message}`
    );
  }

  revalidatePath("/proyectos");

  return {
    id: data.id,
  };
}