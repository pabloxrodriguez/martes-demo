"use server";

import { revalidatePath } from "next/cache";

import { requireEditablePerson } from "@/lib/auth/requireActivePerson";

type CreateProjectInput = {
  nombre: string;
  responsable_id: string;
  estado_id: string;
  fecha_propuesta: string;
  fecha_evento_inicio: string;
  fecha_evento_termino: string;
};

export async function createProject(
  input: CreateProjectInput
) {
  const { supabase, person } = await requireEditablePerson();

  if (!input || typeof input !== "object") {
    throw new Error("Los datos del proyecto no son válidos.");
  }

  const nombre =
    typeof input.nombre === "string" ? input.nombre.trim() : "";
  const responsableId =
    typeof input.responsable_id === "string"
      ? input.responsable_id.trim()
      : "";
  const estadoId =
    typeof input.estado_id === "string"
      ? input.estado_id.trim()
      : "";
  const fechaPropuesta =
    typeof input.fecha_propuesta === "string"
      ? input.fecha_propuesta.trim()
      : "";
  const fechaEventoInicio =
    typeof input.fecha_evento_inicio === "string"
      ? input.fecha_evento_inicio.trim()
      : "";
  const fechaEventoTermino =
    typeof input.fecha_evento_termino === "string"
      ? input.fecha_evento_termino.trim()
      : "";

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

  if (!fechaEventoInicio) {
    throw new Error("La fecha de inicio del evento es obligatoria.");
  }

  if (!fechaEventoTermino) {
    throw new Error("La fecha de término del evento es obligatoria.");
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(responsableId)) {
    throw new Error("El responsable seleccionado no es válido.");
  }

  if (!uuidPattern.test(estadoId)) {
    throw new Error("El estado seleccionado no es válido.");
  }

  const parsedProposalDate = new Date(
    `${fechaPropuesta}T00:00:00Z`
  );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaPropuesta) ||
    Number.isNaN(parsedProposalDate.getTime()) ||
    parsedProposalDate.toISOString().slice(0, 10) !== fechaPropuesta
  ) {
    throw new Error("La fecha de propuesta no es válida.");
  }

  const parsedEventStart = new Date(
    `${fechaEventoInicio}T00:00:00Z`
  );
  const parsedEventEnd = new Date(
    `${fechaEventoTermino}T00:00:00Z`
  );

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaEventoInicio) ||
    Number.isNaN(parsedEventStart.getTime()) ||
    parsedEventStart.toISOString().slice(0, 10) !== fechaEventoInicio
  ) {
    throw new Error("La fecha de inicio del evento no es válida.");
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaEventoTermino) ||
    Number.isNaN(parsedEventEnd.getTime()) ||
    parsedEventEnd.toISOString().slice(0, 10) !== fechaEventoTermino
  ) {
    throw new Error("La fecha de término del evento no es válida.");
  }

  if (fechaEventoTermino < fechaEventoInicio) {
    throw new Error(
      "La fecha de término del evento no puede ser anterior a la fecha de inicio."
    );
  }

  const { data, error } = await supabase
    .from("proyectos")
    .insert({
      nombre,
      responsable_id: responsableId,
      estado_id: estadoId,
      fecha_propuesta: fechaPropuesta,
      fecha_evento_inicio: fechaEventoInicio,
      fecha_evento_termino: fechaEventoTermino,
      prioridad: 5,
      creado_por_id: person.id,
      actualizado_por_id: person.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `No se pudo crear el proyecto: ${error.message}`
    );
  }

  revalidatePath("/proyectos");
  revalidatePath("/calendario");
  revalidatePath("/resultados");
  revalidatePath("/resultado-financiero");

  return {
    id: data.id,
  };
}
