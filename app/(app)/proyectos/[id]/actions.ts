"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireEditablePerson,
} from "@/lib/auth/requireActivePerson";
import {
  canManageProjectGaelBudgetAccess,
  canTransferProjectResponsible,
  canImportProjectGaelBudgets,
} from "@/lib/auth/projectGaelAccess";
import { fetchGaelBudget } from "@/lib/integrations/gael/budgets";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, TableUpdate } from "@/types/database";

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

const editableTaskFields = [
  "nombre",
  "responsable_id",
  "estado_id",
  "fecha_comprometida",
  "url",
  "comentario",
] as const;

type EditableProjectField = (typeof allowedFields)[number];
type EditableTaskField = (typeof editableTaskFields)[number];

type CreateProjectTaskInput = {
  plantilla_tarea_id: string | null;
  nombre: string;
  responsable_id: string;
  estado_id: string;
  fecha_comprometida: string | null;
  url: string | null;
  comentario: string | null;
};

type ProjectVenueInput = {
  nombre?: unknown;
  direccion?: unknown;
  comuna?: unknown;
  ciudad?: unknown;
  capacidad?: unknown;
  contacto_nombre?: unknown;
  contacto_correo?: unknown;
  contacto_celular?: unknown;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireString(value: unknown, label: string) {
  if (typeof value !== "string") {
    throw new Error(`${label} no es válido.`);
  }

  return value.trim();
}

function optionalShortText(value: unknown, label: string) {
  const cleanValue = typeof value === "string" ? value.trim() : "";

  if (cleanValue.length > 200) {
    throw new Error(`${label} no puede superar los 200 caracteres.`);
  }

  return cleanValue || null;
}

function normalizeProjectVenueInput(input: unknown): TableUpdate<"venues"> {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos del venue no son válidos.");
  }

  const venue = input as ProjectVenueInput;
  const nombre = requireString(venue.nombre, "El nombre del venue");

  if (!nombre) {
    throw new Error("El nombre del venue es obligatorio.");
  }

  if (nombre.length > 200) {
    throw new Error("El nombre del venue no puede superar los 200 caracteres.");
  }

  const capacidadText =
    typeof venue.capacidad === "string"
      ? venue.capacidad.trim()
      : venue.capacidad;
  const capacidad =
    capacidadText === "" || capacidadText === null || capacidadText === undefined
      ? null
      : Number(capacidadText);

  if (
    capacidad !== null &&
    (!Number.isInteger(capacidad) || capacidad < 0 || capacidad > 10_000_000)
  ) {
    throw new Error(
      "La capacidad debe ser un número entero entre 0 y 10.000.000."
    );
  }

  const contactoCorreo =
    typeof venue.contacto_correo === "string"
      ? venue.contacto_correo.trim().toLowerCase()
      : "";

  if (
    contactoCorreo &&
    (contactoCorreo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactoCorreo))
  ) {
    throw new Error("El correo del contacto no es válido.");
  }

  return {
    nombre,
    direccion: optionalShortText(venue.direccion, "La dirección"),
    comuna: optionalShortText(venue.comuna, "La comuna"),
    ciudad: optionalShortText(venue.ciudad, "La ciudad"),
    capacidad,
    contacto_nombre: optionalShortText(
      venue.contacto_nombre,
      "El nombre del contacto"
    ),
    contacto_correo: contactoCorreo || null,
    contacto_celular: optionalShortText(
      venue.contacto_celular,
      "El celular del contacto"
    ),
  };
}

function requireUuid(value: unknown, label: string) {
  const cleanValue = requireString(value, label);

  if (!uuidPattern.test(cleanValue)) {
    throw new Error(`${label} no es válido.`);
  }

  return cleanValue;
}

function optionalUuid(value: unknown, label: string) {
  const cleanValue = requireString(value, label);

  if (!cleanValue) {
    return null;
  }

  if (!uuidPattern.test(cleanValue)) {
    throw new Error(`${label} no es válido.`);
  }

  return cleanValue;
}

function optionalDate(value: unknown, label: string) {
  const cleanValue = requireString(value, label);

  if (!cleanValue) {
    return null;
  }

  const parsedDate = new Date(`${cleanValue}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(cleanValue) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== cleanValue
  ) {
    throw new Error(`${label} no es válida.`);
  }

  return cleanValue;
}

function optionalHttpUrl(value: unknown) {
  const cleanValue = requireString(value, "El enlace");

  if (!cleanValue) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(cleanValue);
  } catch {
    throw new Error(
      "El enlace debe ser una URL válida, incluyendo https://"
    );
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("El enlace debe comenzar con https:// o http://");
  }

  return cleanValue;
}

function requirePositiveInteger(value: unknown, label: string) {
  const cleanValue = requireString(value, label);
  const parsedValue = Number(cleanValue);

  if (
    !cleanValue ||
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new Error(`${label} debe ser un número válido.`);
  }

  return parsedValue;
}

function gaelStatusHref(projectId: string, status: string) {
  return `/proyectos/${projectId}?gael=${encodeURIComponent(status)}`;
}

function gaelErrorHref(projectId: string, message: string) {
  return `/proyectos/${projectId}?gael=error&gael_error=${encodeURIComponent(
    message
  )}`;
}

async function updateProjectTimestamp(
  supabase: ServerSupabaseClient,
  projectId: string,
  timestamp: string,
  personId?: string
) {
  const updateData: TableUpdate<"proyectos"> = {
    fecha_actualizacion: timestamp,
  };

  if (personId) {
    updateData.actualizado_por_id = personId;
  }

  const { data, error } = await supabase
    .from("proyectos")
    .update(updateData)
    .eq("id", projectId)
    .eq("eliminado", false)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo actualizar la fecha del proyecto: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("No se encontró el proyecto que intentas actualizar.");
  }
}

async function updateProjectFieldOrThrow(
  projectId: string,
  field: EditableProjectField,
  value: string
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");

  if (!allowedFields.includes(field)) {
    throw new Error("El campo que intentas modificar no está permitido.");
  }

  const cleanValue = requireString(value, "El valor");
  let normalizedValue: string | number | null =
    cleanValue === "" ? null : cleanValue;

  if (field === "nombre") {
    if (!cleanValue) {
      throw new Error("El nombre del proyecto es obligatorio.");
    }

    normalizedValue = cleanValue;
  }

  if (field === "estado_id" || field === "responsable_id") {
    normalizedValue = requireUuid(
      cleanValue,
      field === "estado_id" ? "El estado" : "El responsable"
    );
  }

  if (field === "responsable_id") {
    const { data: currentProject, error: projectError } =
      await supabase
        .from("proyectos")
        .select("responsable_id")
        .eq("id", cleanProjectId)
        .single();

    if (projectError) {
      throw new Error(
        `No se pudo verificar el responsable actual: ${projectError.message}`
      );
    }

    if (
      !canTransferProjectResponsible({
        person,
        currentResponsibleId: currentProject.responsable_id,
      })
    ) {
      throw new Error(
        "Solo el responsable actual, Dirección o Admin pueden transferir la responsabilidad del proyecto."
      );
    }
  }

  if (field === "tipo_id" || field === "cliente_id") {
    normalizedValue = optionalUuid(
      cleanValue,
      field === "tipo_id" ? "El tipo" : "El cliente"
    );
  }

  if (
    field === "fecha_propuesta" ||
    field === "fecha_evento_inicio" ||
    field === "fecha_evento_termino"
  ) {
    normalizedValue = optionalDate(
      cleanValue,
      field === "fecha_propuesta"
        ? "La fecha de propuesta"
        : field === "fecha_evento_inicio"
          ? "La fecha de inicio"
          : "La fecha de término"
    );

    if (field === "fecha_propuesta" && normalizedValue === null) {
      throw new Error("La fecha de propuesta es obligatoria.");
    }
  }

  if (field === "prioridad" && normalizedValue !== null) {
    const parsedValue = Number(normalizedValue);

    if (
      !Number.isInteger(parsedValue) ||
      parsedValue < 1 ||
      parsedValue > 9
    ) {
      throw new Error("La prioridad debe ser un entero entre 1 y 9.");
    }

    normalizedValue = parsedValue;
  }

  if (field === "publico_esperado" && normalizedValue !== null) {
    const parsedValue = Number(normalizedValue);

    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      throw new Error("El público esperado debe ser un entero positivo.");
    }

    normalizedValue = parsedValue;
  }

  if (field === "valor_venta" && normalizedValue !== null) {
    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      throw new Error("El valor de venta debe ser un número positivo.");
    }

    normalizedValue = parsedValue;
  }

  if (field === "fecha_evento_inicio") {
    const { data: currentProject, error: projectError } =
      await supabase
        .from("proyectos")
        .select("fecha_evento_inicio, fecha_evento_termino")
        .eq("id", cleanProjectId)
        .single();

    if (projectError) {
      throw new Error(
        `No se pudo obtener el proyecto: ${projectError.message}`
      );
    }

    const eventWasOneDay =
      currentProject.fecha_evento_inicio ===
      currentProject.fecha_evento_termino;

    if (
      normalizedValue !== null &&
      currentProject.fecha_evento_termino &&
      !eventWasOneDay &&
      normalizedValue > currentProject.fecha_evento_termino
    ) {
      throw new Error(
        "La fecha de inicio no puede ser posterior a la fecha de término."
      );
    }

    if (
      normalizedValue !== null &&
      typeof normalizedValue !== "string"
    ) {
      throw new Error("La fecha de inicio no es válida.");
    }

    const updateData: TableUpdate<"proyectos"> = {
      fecha_evento_inicio: normalizedValue,
      fecha_actualizacion: new Date().toISOString(),
      actualizado_por_id: person.id,
    };

    if (eventWasOneDay) {
      updateData.fecha_evento_termino = normalizedValue;
    }

    const { data, error } = await supabase
      .from("proyectos")
      .update(updateData)
      .eq("id", cleanProjectId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        `No se pudo actualizar el proyecto: ${error.message}`
      );
    }

    if (!data) {
      throw new Error("No se encontró el proyecto que intentas actualizar.");
    }
  } else if (field === "fecha_evento_termino") {
    const { data: currentProject, error: projectError } =
      await supabase
        .from("proyectos")
        .select("fecha_evento_inicio")
        .eq("id", cleanProjectId)
        .single();

    if (projectError) {
      throw new Error(
        `No se pudo obtener el proyecto: ${projectError.message}`
      );
    }

    if (
      normalizedValue !== null &&
      currentProject.fecha_evento_inicio &&
      normalizedValue < currentProject.fecha_evento_inicio
    ) {
      throw new Error(
        "La fecha de término no puede ser anterior a la fecha de inicio."
      );
    }

    if (
      normalizedValue !== null &&
      typeof normalizedValue !== "string"
    ) {
      throw new Error("La fecha de término no es válida.");
    }

    const { data, error } = await supabase
      .from("proyectos")
      .update({
        fecha_evento_termino: normalizedValue,
        fecha_actualizacion: new Date().toISOString(),
        actualizado_por_id: person.id,
      })
      .eq("id", cleanProjectId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        `No se pudo actualizar el proyecto: ${error.message}`
      );
    }

    if (!data) {
      throw new Error("No se encontró el proyecto que intentas actualizar.");
    }
  } else {
    const updateData = {
      [field]: normalizedValue,
      fecha_actualizacion: new Date().toISOString(),
      actualizado_por_id: person.id,
    } as TableUpdate<"proyectos">;

    const { data, error } = await supabase
      .from("proyectos")
      .update(updateData)
      .eq("id", cleanProjectId)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        `No se pudo actualizar el proyecto: ${error.message}`
      );
    }

    if (!data) {
      throw new Error("No se encontró el proyecto que intentas actualizar.");
    }
  }

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/resultados");
  revalidatePath("/resultados/detalle");
  revalidatePath("/resultado-financiero");
}

export async function updateProjectField(
  projectId: string,
  field: EditableProjectField,
  value: string
) {
  try {
    await updateProjectFieldOrThrow(projectId, field, value);

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
          : "No se pudo guardar el cambio.",
    };
  }
}

export async function addProjectVenue(
  projectId: string,
  venueId: string
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanVenueId = requireUuid(venueId, "El venue");

  const { data, error } = await supabase
    .from("proyecto_venues")
    .insert({
      proyecto_id: cleanProjectId,
      venue_id: cleanVenueId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Este venue ya está asociado al proyecto."
      );
    }

    throw new Error(
      `No se pudo asociar el venue: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("No se pudo confirmar la asociación del venue.");
  }

  await updateProjectTimestamp(
    supabase,
    cleanProjectId,
    new Date().toISOString(),
    person.id
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function createProjectVenue(
  projectId: string,
  venueName: string
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanName = requireString(venueName, "El nombre del venue");

  if (!cleanName) {
    throw new Error("El nombre del venue es obligatorio.");
  }

  if (cleanName.length > 200) {
    throw new Error("El nombre del venue es demasiado largo.");
  }

  const { data: existingVenue, error: searchError } =
    await supabase
      .from("venues")
      .select("id")
      .ilike("nombre", cleanName)
      .limit(1)
      .maybeSingle();

  if (searchError) {
    throw new Error(
      `No se pudo revisar el catálogo de venues: ${searchError.message}`
    );
  }

  let venueId = existingVenue?.id;

  if (!venueId) {
    const { data: createdVenue, error: createError } =
      await supabase
        .from("venues")
        .insert({
          nombre: cleanName,
        })
        .select("id")
        .single();

    if (createError) {
      throw new Error(
        `No se pudo crear el venue: ${createError.message}`
      );
    }

    venueId = createdVenue.id;
  }

  const { data: relation, error: relationError } = await supabase
    .from("proyecto_venues")
    .insert({
      proyecto_id: cleanProjectId,
      venue_id: venueId,
    })
    .select("id")
    .single();

  if (relationError) {
    if (relationError.code === "23505") {
      throw new Error(
        "Este venue ya está asociado al proyecto."
      );
    }

    throw new Error(
      `No se pudo asociar el venue: ${relationError.message}`
    );
  }

  if (!relation) {
    throw new Error("No se pudo confirmar la asociación del venue.");
  }

  await updateProjectTimestamp(
    supabase,
    cleanProjectId,
    new Date().toISOString(),
    person.id
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function removeProjectVenue(
  projectId: string,
  venueId: string
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanVenueId = requireUuid(venueId, "El venue");

  const { data, error } = await supabase
    .from("proyecto_venues")
    .delete()
    .eq("proyecto_id", cleanProjectId)
    .eq("venue_id", cleanVenueId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo quitar el venue del proyecto: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("El venue ya no está asociado a este proyecto.");
  }

  await updateProjectTimestamp(
    supabase,
    cleanProjectId,
    new Date().toISOString(),
    person.id
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function updateProjectVenue(
  projectId: string,
  venueId: string,
  input: unknown
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanVenueId = requireUuid(venueId, "El venue");
  const venue = normalizeProjectVenueInput(input);

  const { data: relation, error: relationError } = await supabase
    .from("proyecto_venues")
    .select("id")
    .eq("proyecto_id", cleanProjectId)
    .eq("venue_id", cleanVenueId)
    .maybeSingle();

  if (relationError) {
    throw new Error(
      `No se pudo revisar el venue del proyecto: ${relationError.message}`
    );
  }

  if (!relation) {
    throw new Error("El venue no está asociado a este proyecto.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("venues")
    .update({
      ...venue,
      fecha_actualizacion: now,
    })
    .eq("id", cleanVenueId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo actualizar el venue: ${error.message}`);
  }

  if (!data) {
    throw new Error("El venue no existe o no tienes permiso para modificarlo.");
  }

  await updateProjectTimestamp(supabase, cleanProjectId, now, person.id);

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
  revalidatePath("/catalogos");
}

export async function duplicateProject(projectId: string) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");

  const { data: project, error: projectError } = await supabase
    .from("proyectos")
    .select(`
      nombre,
      estado_id,
      tipo_id,
      responsable_id,
      cliente_id,
      prioridad,
      fecha_propuesta,
      fecha_evento_inicio,
      fecha_evento_termino,
      publico_esperado,
      valor_venta,
      notas,
      proyecto_venues (
        venue_id
      )
    `)
    .eq("id", cleanProjectId)
    .eq("eliminado", false)
    .maybeSingle();

  if (projectError) {
    throw new Error(
      `No se pudo obtener el proyecto a duplicar: ${projectError.message}`
    );
  }

  if (!project) {
    throw new Error("No se encontró el proyecto que intentas duplicar.");
  }

  const now = new Date().toISOString();
  const { data: duplicatedProject, error: insertError } = await supabase
    .from("proyectos")
    .insert({
      nombre: `Copia-${project.nombre}`,
      estado_id: project.estado_id,
      tipo_id: project.tipo_id,
      responsable_id: project.responsable_id,
      cliente_id: project.cliente_id,
      prioridad: project.prioridad,
      fecha_propuesta: project.fecha_propuesta,
      fecha_evento_inicio: project.fecha_evento_inicio,
      fecha_evento_termino: project.fecha_evento_termino,
      publico_esperado: project.publico_esperado,
      valor_venta: project.valor_venta,
      notas: project.notas,
      fecha_actualizacion: now,
      creado_por_id: person.id,
      actualizado_por_id: person.id,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(
      `No se pudo duplicar el proyecto: ${insertError.message}`
    );
  }

  const venueRows =
    project.proyecto_venues?.map((venue) => ({
      proyecto_id: duplicatedProject.id,
      venue_id: venue.venue_id,
    })) ?? [];

  if (venueRows.length > 0) {
    const { error: venuesError } = await supabase
      .from("proyecto_venues")
      .insert(venueRows);

    if (venuesError) {
      throw new Error(
        `El proyecto se duplicó, pero no se pudieron copiar los venues: ${venuesError.message}`
      );
    }
  }

  revalidatePath("/proyectos");
  revalidatePath("/calendario");
  revalidatePath("/resultados");
  revalidatePath("/resultado-financiero");

  redirect(`/proyectos/${duplicatedProject.id}`);
}

async function createProjectTaskOrThrow(
  projectId: string,
  input: CreateProjectTaskInput
) {
  const { supabase, person } = await requireEditablePerson();
  const projectIdClean = requireUuid(projectId, "El proyecto");

  if (!input || typeof input !== "object") {
    throw new Error("Los datos de la tarea no son válidos.");
  }

  const taskName = requireString(input.nombre, "El nombre de la tarea");
  const responsibleId = requireUuid(
    input.responsable_id,
    "El responsable"
  );
  const statusId = requireUuid(input.estado_id, "El estado");
  const templateId = optionalUuid(
    input.plantilla_tarea_id ?? "",
    "La plantilla"
  );
  const committedDate = optionalDate(
    input.fecha_comprometida ?? "",
    "La fecha comprometida"
  );
  const url = optionalHttpUrl(input.url ?? "");
  const comment =
    input.comentario == null
      ? null
      : requireString(input.comentario, "El comentario") || null;

  if (!taskName) {
    throw new Error("El nombre de la tarea es obligatorio.");
  }

  if (taskName.length > 500) {
    throw new Error("El nombre de la tarea es demasiado largo.");
  }

  const now = new Date().toISOString();
  const { data: lastTask, error: orderError } = await supabase
    .from("tareas")
    .select("orden")
    .eq("proyecto_id", projectIdClean)
    .eq("eliminada", false)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    throw new Error(
      `No se pudo preparar la nueva tarea: ${orderError.message}`
    );
  }

  const nextOrder = Number(lastTask?.orden ?? 0) + 1;

  const { data, error } = await supabase
    .from("tareas")
    .insert({
      proyecto_id: projectIdClean,
      plantilla_tarea_id: templateId,
      nombre: taskName,
      responsable_id: responsibleId,
      estado_id: statusId,
      fecha_comprometida: committedDate,
      url,
      comentario: comment,
      orden: nextOrder,
      fecha_actualizacion: now,
      creada_por_id: person.id,
      actualizada_por_id: person.id,
      eliminada: false,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505" && templateId) {
      throw new Error(
        "Esta tarea de plantilla ya existe en el proyecto."
      );
    }

    throw new Error(
      `No se pudo crear la tarea: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("No se pudo confirmar la creación de la tarea.");
  }

  try {
    await updateProjectTimestamp(
      supabase,
      projectIdClean,
      now,
      person.id
    );
  } catch (timestampError) {
    console.error(
      "La tarea se creó, pero no se pudo actualizar la fecha del proyecto.",
      {
        projectId: projectIdClean,
        error: timestampError,
      }
    );
  }

  revalidatePath(`/proyectos/${projectIdClean}`);
  revalidatePath("/proyectos");
}

function taskCreationErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo crear la tarea. Revisa los datos e inténtalo nuevamente.";
  }

  if (
    error.message.startsWith("No se pudo crear la tarea:") ||
    error.message.startsWith("No se pudo preparar la nueva tarea:")
  ) {
    return "No se pudo guardar la tarea. Revisa tus permisos e inténtalo nuevamente.";
  }

  return error.message;
}

export async function createProjectTask(
  projectId: string,
  input: CreateProjectTaskInput
) {
  try {
    await createProjectTaskOrThrow(projectId, input);

    return {
      success: true as const,
      error: null,
    };
  } catch (error) {
    console.error("No se pudo crear una tarea.", {
      projectId,
      error,
    });

    return {
      success: false as const,
      error: taskCreationErrorMessage(error),
    };
  }
}

export async function updateTaskField(
  projectId: string,
  taskId: string,
  field: EditableTaskField,
  value: string
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanTaskId = requireUuid(taskId, "La tarea");

  if (!editableTaskFields.includes(field)) {
    throw new Error("El campo que intentas modificar no está permitido.");
  }

  const cleanValue = requireString(value, "El valor");

  if (field === "nombre" && !cleanValue) {
    throw new Error("El nombre de la tarea es obligatorio.");
  }

  if (field === "nombre" && cleanValue.length > 500) {
    throw new Error("El nombre de la tarea es demasiado largo.");
  }

  let normalizedValue: string | null =
    cleanValue === "" ? null : cleanValue;

  if (field === "responsable_id" || field === "estado_id") {
    normalizedValue = requireUuid(
      cleanValue,
      field === "responsable_id" ? "El responsable" : "El estado"
    );
  }

  if (field === "fecha_comprometida") {
    normalizedValue = optionalDate(
      cleanValue,
      "La fecha comprometida"
    );
  }

  if (field === "url") {
    normalizedValue = optionalHttpUrl(cleanValue);
  }

  const now = new Date().toISOString();
  const updateData = {
    [field]: normalizedValue,
    fecha_actualizacion: now,
    actualizada_por_id: person.id,
  } as TableUpdate<"tareas">;

  const { data, error } = await supabase
    .from("tareas")
    .update(updateData)
    .eq("id", cleanTaskId)
    .eq("proyecto_id", cleanProjectId)
    .eq("eliminada", false)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo actualizar la tarea: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("No se encontró la tarea que intentas actualizar.");
  }

  await updateProjectTimestamp(
    supabase,
    cleanProjectId,
    now,
    person.id
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function toggleTaskCompleted(
  projectId: string,
  taskId: string,
  completed: boolean
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanTaskId = requireUuid(taskId, "La tarea");

  if (typeof completed !== "boolean") {
    throw new Error("El estado de la tarea no es válido.");
  }

  const targetStatusName = completed
    ? "Completada"
    : "Pendiente";

  const { data: targetStatus, error: statusError } =
    await supabase
      .from("estados_tarea")
      .select("id")
      .eq("nombre", targetStatusName)
      .single();

  if (statusError || !targetStatus) {
    throw new Error(
      `No se encontró el estado “${targetStatusName}”.`
    );
  }

  const now = new Date().toISOString();
  const completedDate = completed
    ? now.slice(0, 10)
    : null;

  const { data, error } = await supabase
    .from("tareas")
    .update({
      estado_id: targetStatus.id,
      fecha_completada: completedDate,
      fecha_actualizacion: now,
      actualizada_por_id: person.id,
    })
    .eq("id", cleanTaskId)
    .eq("proyecto_id", cleanProjectId)
    .eq("eliminada", false)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo cambiar el estado de la tarea: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("No se encontró la tarea que intentas actualizar.");
  }

  await updateProjectTimestamp(
    supabase,
    cleanProjectId,
    now,
    person.id
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanTaskId = requireUuid(taskId, "La tarea");

  const { data: existingTask, error: lookupError } = await supabase
    .from("tareas")
    .select("id, responsable_id")
    .eq("id", cleanTaskId)
    .eq("proyecto_id", cleanProjectId)
    .eq("eliminada", false)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `No se pudo verificar la tarea: ${lookupError.message}`
    );
  }

  if (!existingTask) {
    throw new Error("La tarea ya no existe o pertenece a otro proyecto.");
  }

  const { data: project, error: projectError } = await supabase
    .from("proyectos")
    .select("responsable_id")
    .eq("id", cleanProjectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(
      `No se pudo verificar el proyecto: ${projectError.message}`
    );
  }

  if (!project) {
    throw new Error("El proyecto ya no existe.");
  }

  const canDelete =
    existingTask.responsable_id === person.id ||
    project.responsable_id === person.id;

  if (!canDelete) {
    throw new Error(
      "Solo la persona asignada a la tarea o el responsable del proyecto pueden eliminarla."
    );
  }

  const now = new Date().toISOString();
  const { data: deletedTask, error } = await supabase
    .from("tareas")
    .update({
      eliminada: true,
      fecha_eliminacion: now,
      eliminada_por_id: person.id,
      actualizada_por_id: person.id,
      fecha_actualizacion: now,
    })
    .eq("id", cleanTaskId)
    .eq("proyecto_id", cleanProjectId)
    .eq("eliminada", false)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo eliminar la tarea: ${error.message}`
    );
  }

  if (!deletedTask) {
    throw new Error(
      "La tarea no se pudo eliminar. Revisa tus permisos e inténtalo nuevamente."
    );
  }

  await updateProjectTimestamp(
    supabase,
    cleanProjectId,
    now,
    person.id
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function importGaelBudget(
  projectId: string,
  formData: FormData
) {
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const budgetNumber = requirePositiveInteger(
    formData.get("gael_presupuesto_id"),
    "El presupuesto Gael"
  );

  try {
    await upsertGaelBudgetForProject(cleanProjectId, budgetNumber);
  } catch (error) {
    redirect(
      gaelErrorHref(
        cleanProjectId,
        error instanceof Error
          ? error.message
          : "No se pudo importar el presupuesto Gael."
      )
    );
  }

  redirect(gaelStatusHref(cleanProjectId, "budget-imported"));
}

export async function refreshGaelBudget(
  projectId: string,
  budgetNumber: number
) {
  const cleanProjectId = requireUuid(projectId, "El proyecto");

  try {
    await upsertGaelBudgetForProject(cleanProjectId, budgetNumber);
  } catch (error) {
    redirect(
      gaelErrorHref(
        cleanProjectId,
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el presupuesto Gael."
      )
    );
  }

  redirect(gaelStatusHref(cleanProjectId, "budget-refreshed"));
}

async function upsertGaelBudgetForProject(
  cleanProjectId: string,
  budgetNumber: number
) {
  const { supabase, person } = await requireEditablePerson();

  const importedBudget = await fetchGaelBudget(budgetNumber);
  const now = new Date().toISOString();

  const { data: project, error: projectError } = await supabase
    .from("proyectos")
    .select(`
      id,
      responsable_id,
      proyecto_presupuesto_gael_accesos (
        persona_id
      )
    `)
    .eq("id", cleanProjectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(
      `No se pudo verificar el proyecto: ${projectError.message}`
    );
  }

  if (!project) {
    throw new Error("No se encontró el proyecto.");
  }

  if (
    !canImportProjectGaelBudgets({
      person,
      projectResponsibleId: project.responsable_id,
      explicitAccessPersonIds:
        project.proyecto_presupuesto_gael_accesos?.map(
          (access) => access.persona_id
        ) ?? [],
    })
  ) {
    throw new Error(
      "No tienes acceso para importar presupuestos Gael en este proyecto."
    );
  }

  const budgetStore = createAdminClient();

  const { data: existingOfficial, error: officialLookupError } = await budgetStore
    .from("proyecto_presupuestos_gael")
    .select(`
      id,
      proyecto_presupuesto_gael_lineas (
        categoria,
        concepto,
        cantidad,
        veces,
        unitario,
        operacion,
        notas,
        orden
      )
    `)
    .eq("proyecto_id", cleanProjectId)
    .eq("gael_presupuesto_id", importedBudget.header.gael_presupuesto_id)
    .maybeSingle();

  if (officialLookupError) {
    throw new Error(
      `No se pudo buscar el presupuesto Gael: ${officialLookupError.message}`
    );
  }

  const { data: draft, error: draftLookupError } = await budgetStore
    .from("proyecto_presupuestos_gael")
    .select(`
      id,
      proyecto_presupuesto_gael_lineas (
        categoria,
        concepto,
        cantidad,
        veces,
        unitario,
        operacion,
        notas,
        orden
      )
    `)
    .eq("proyecto_id", cleanProjectId)
    .eq("origen", "martes")
    .eq("estado_registro", "borrador")
    .maybeSingle();

  if (draftLookupError) {
    throw new Error(
      `No se pudo buscar el borrador de Martes: ${draftLookupError.message}`
    );
  }

  const conceptSourceLines = (
    draft?.proyecto_presupuesto_gael_lineas ??
    existingOfficial?.proyecto_presupuesto_gael_lineas ??
    []
  ).sort((a, b) => a.orden - b.orden);
  const usedSourceLineIndexes = new Set<number>();
  const normalizedText = (value: string | null) =>
    value?.trim().toLocaleLowerCase("es-CL") ?? "";
  const normalizedNumber = (value: number | null) => Number(value ?? 0);

  const officialLines = importedBudget.lines.map((line) => {
    const matchingIndex = conceptSourceLines.findIndex(
      (sourceLine, index) =>
        !usedSourceLineIndexes.has(index) &&
        normalizedText(sourceLine.categoria) ===
          normalizedText(line.categoria) &&
        normalizedNumber(sourceLine.cantidad) ===
          normalizedNumber(line.cantidad) &&
        normalizedNumber(sourceLine.veces) ===
          normalizedNumber(line.veces) &&
        normalizedNumber(sourceLine.unitario) ===
          normalizedNumber(line.unitario) &&
        normalizedText(sourceLine.operacion) ===
          normalizedText(line.operacion)
    );
    const sourceLine =
      matchingIndex >= 0 ? conceptSourceLines[matchingIndex] : null;

    if (matchingIndex >= 0) {
      usedSourceLineIndexes.add(matchingIndex);
    }

    return {
      ...line,
      concepto: line.concepto?.trim() || sourceLine?.concepto?.trim() || null,
      notas: line.notas?.trim() || sourceLine?.notas?.trim() || null,
    };
  });

  const officialValues = {
    gael_presupuesto_id: importedBudget.header.gael_presupuesto_id,
    origen: "gael",
    estado_registro: "oficial",
    nombre: importedBudget.header.nombre,
    estado: importedBudget.header.estado,
    empresa_nombre: importedBudget.header.empresa_nombre,
    ucontrol_nombre: importedBudget.header.ucontrol_nombre,
    valor_proyectado: importedBudget.header.valor_proyectado,
    fecha_creacion_gael: importedBudget.header.fecha_creacion_gael,
    fecha_importacion: now,
    fecha_actualizacion: now,
    actualizado_por_id: person.id,
    raw: importedBudget.header.raw as Json,
  };

  let budgetId: string;

  if (existingOfficial) {
    const { error: updateError } = await budgetStore
      .from("proyecto_presupuestos_gael")
      .update(officialValues)
      .eq("id", existingOfficial.id);

    if (updateError) {
      throw new Error(
        `No se pudo actualizar el presupuesto Gael: ${updateError.message}`
      );
    }

    budgetId = existingOfficial.id;

    if (draft && draft.id !== budgetId) {
      const { error: removeDraftError } = await budgetStore
        .from("proyecto_presupuestos_gael")
        .delete()
        .eq("id", draft.id);

      if (removeDraftError) {
        throw new Error(
          `No se pudo reemplazar el borrador: ${removeDraftError.message}`
        );
      }
    }
  } else if (draft) {
    const { error: convertDraftError } = await budgetStore
      .from("proyecto_presupuestos_gael")
      .update(officialValues)
      .eq("id", draft.id);

    if (convertDraftError) {
      throw new Error(
        `No se pudo convertir el borrador en presupuesto oficial: ${convertDraftError.message}`
      );
    }

    budgetId = draft.id;
  } else {
    const { data: createdBudget, error: insertError } = await budgetStore
      .from("proyecto_presupuestos_gael")
      .insert({
        proyecto_id: cleanProjectId,
        creado_por_id: person.id,
        ...officialValues,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(
        `No se pudo guardar el presupuesto Gael: ${insertError.message}`
      );
    }

    budgetId = createdBudget.id;
  }

  const { error: deleteLinesError } = await budgetStore
    .from("proyecto_presupuesto_gael_lineas")
    .delete()
    .eq("presupuesto_id", budgetId);

  if (deleteLinesError) {
    throw new Error(
      `No se pudieron actualizar las líneas Gael: ${deleteLinesError.message}`
    );
  }

  if (officialLines.length > 0) {
    const { error: insertLinesError } = await budgetStore
      .from("proyecto_presupuesto_gael_lineas")
      .insert(
        officialLines.map((line) => ({
          presupuesto_id: budgetId,
          gael_linea_id: line.gael_linea_id,
          categoria: line.categoria,
          concepto: line.concepto,
          cantidad: line.cantidad,
          veces: line.veces,
          unitario: line.unitario,
          total_proyectado: line.total_proyectado,
          operacion: line.operacion,
          notas: line.notas,
          orden: line.orden,
          raw: line.raw as Json,
        }))
      );

    if (insertLinesError) {
      throw new Error(
        `No se pudieron guardar las líneas Gael: ${insertLinesError.message}`
      );
    }
  }

  await updateProjectTimestamp(
    supabase,
    cleanProjectId,
    now,
    person.id
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
}

export async function removeGaelBudget(
  projectId: string,
  budgetId: string
) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");
  const cleanBudgetId = requireUuid(budgetId, "El presupuesto");

  const { data: project, error: projectError } = await supabase
    .from("proyectos")
    .select(`
      id,
      responsable_id,
      proyecto_presupuesto_gael_accesos (
        persona_id
      )
    `)
    .eq("id", cleanProjectId)
    .maybeSingle();

  if (projectError) {
    throw new Error(
      `No se pudo verificar el proyecto: ${projectError.message}`
    );
  }

  if (
    !project ||
    !canImportProjectGaelBudgets({
      person,
      projectResponsibleId: project.responsable_id,
      explicitAccessPersonIds:
        project.proyecto_presupuesto_gael_accesos?.map(
          (access) => access.persona_id
        ) ?? [],
    })
  ) {
    redirect(
      gaelErrorHref(
        cleanProjectId,
        "No tienes acceso para quitar presupuestos Gael en este proyecto."
      )
    );
  }

  const { error } = await supabase
    .from("proyecto_presupuestos_gael")
    .delete()
    .eq("id", cleanBudgetId)
    .eq("proyecto_id", cleanProjectId);

  if (error) {
    redirect(
      gaelErrorHref(
        cleanProjectId,
        `No se pudo quitar el presupuesto Gael: ${error.message}`
      )
    );
  }

  revalidatePath(`/proyectos/${cleanProjectId}`);
  redirect(gaelStatusHref(cleanProjectId, "budget-removed"));
}

async function assertCanManageGaelBudgetAccess(projectId: string) {
  const { supabase, person } = await requireEditablePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");

  const { data: project, error } = await supabase
    .from("proyectos")
    .select("id, responsable_id")
    .eq("id", cleanProjectId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo verificar el proyecto: ${error.message}`
    );
  }

  if (!project) {
    throw new Error("No se encontró el proyecto.");
  }

  if (
    !canManageProjectGaelBudgetAccess({
      person,
      projectResponsibleId: project.responsable_id,
    })
  ) {
    throw new Error(
      "Solo el responsable del proyecto, Dirección o Admin pueden administrar accesos Gael."
    );
  }

  return {
    supabase,
    person,
    cleanProjectId,
  };
}

export async function addGaelBudgetAccess(
  projectId: string,
  formData: FormData
) {
  const { supabase, person, cleanProjectId } =
    await assertCanManageGaelBudgetAccess(projectId);
  const targetPersonId = requireUuid(
    formData.get("persona_id"),
    "La persona"
  );

  const { data: targetPerson, error: personError } = await supabase
    .from("personas")
    .select("id, activo, rol")
    .eq("id", targetPersonId)
    .maybeSingle();

  if (personError) {
    throw new Error(
      `No se pudo verificar la persona: ${personError.message}`
    );
  }

  if (!targetPerson?.activo || targetPerson.rol === "lector") {
    throw new Error(
      "Solo puedes autorizar personas activas que no sean lectoras."
    );
  }

  const { error } = await supabase
    .from("proyecto_presupuesto_gael_accesos")
    .upsert(
      {
        proyecto_id: cleanProjectId,
        persona_id: targetPersonId,
        creado_por_id: person.id,
      },
      {
        onConflict: "proyecto_id,persona_id",
      }
    );

  if (error) {
    throw new Error(
      `No se pudo autorizar la persona: ${error.message}`
    );
  }

  revalidatePath(`/proyectos/${cleanProjectId}`);
  redirect(`/proyectos/${cleanProjectId}?gael=access-added`);
}

export async function removeGaelBudgetAccess(
  projectId: string,
  accessId: string
) {
  const { supabase, cleanProjectId } =
    await assertCanManageGaelBudgetAccess(projectId);
  const cleanAccessId = requireUuid(accessId, "El acceso");

  const { error } = await supabase
    .from("proyecto_presupuesto_gael_accesos")
    .delete()
    .eq("id", cleanAccessId)
    .eq("proyecto_id", cleanProjectId);

  if (error) {
    throw new Error(
      `No se pudo quitar el acceso: ${error.message}`
    );
  }

  revalidatePath(`/proyectos/${cleanProjectId}`);
  redirect(`/proyectos/${cleanProjectId}?gael=access-removed`);
}

export async function deleteProject(projectId: string) {
  let cleanProjectId: string;

  try {
    const { supabase, user, person } = await requireEditablePerson();
    cleanProjectId = requireUuid(projectId, "El proyecto");

    const { data: project, error: projectError } = await supabase
      .from("proyectos")
      .select(`
        id,
        responsable:personas!proyectos_responsable_id_fkey (
          auth_user_id
        )
      `)
      .eq("id", cleanProjectId)
      .eq("eliminado", false)
      .single();

    if (projectError || !project) {
      throw new Error("No se encontró el proyecto.");
    }

    const responsable = Array.isArray(project.responsable)
      ? project.responsable[0]
      : project.responsable;

    if (responsable?.auth_user_id !== user.id) {
      throw new Error(
        "Solo el responsable del proyecto puede quitarlo. Si necesitas retirarlo, pídele al responsable que lo haga o que te transfiera la responsabilidad."
      );
    }

    const now = new Date().toISOString();
    const { data: deletedProject, error: deleteError } = await supabase
      .from("proyectos")
      .update({
        eliminado: true,
        fecha_eliminacion: now,
        eliminado_por_id: person.id,
        fecha_actualizacion: now,
        actualizado_por_id: person.id,
      })
      .eq("id", cleanProjectId)
      .eq("eliminado", false)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      throw new Error(
        `No se pudo quitar el proyecto: ${deleteError.message}`
      );
    }

    if (!deletedProject) {
      throw new Error("No se encontró el proyecto que intentas quitar.");
    }
  } catch (caughtError) {
    return {
      success: false as const,
      error:
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo quitar el proyecto.",
    };
  }

  revalidatePath("/proyectos");
  redirect("/proyectos");
}
