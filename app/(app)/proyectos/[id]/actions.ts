"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActivePerson } from "@/lib/auth/requireActivePerson";
import { createClient } from "@/lib/supabase/server";
import type { TableUpdate } from "@/types/database";

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

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireString(value: unknown, label: string) {
  if (typeof value !== "string") {
    throw new Error(`${label} no es válido.`);
  }

  return value.trim();
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
  const { supabase, person } = await requireActivePerson();
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
  const { supabase, person } = await requireActivePerson();
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
  const { supabase, person } = await requireActivePerson();
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
  const { supabase, person } = await requireActivePerson();
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

async function createProjectTaskOrThrow(
  projectId: string,
  input: CreateProjectTaskInput
) {
  const { supabase, person } = await requireActivePerson();
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
  const { supabase, person } = await requireActivePerson();
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
  const { supabase, person } = await requireActivePerson();
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
  const { supabase, person } = await requireActivePerson();
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

export async function deleteProject(projectId: string) {
  const { supabase, user } = await requireActivePerson();
  const cleanProjectId = requireUuid(projectId, "El proyecto");

  const { data: project, error: projectError } = await supabase
    .from("proyectos")
    .select(`
      id,
      responsable:personas!proyectos_responsable_id_fkey (
        auth_user_id
      )
    `)
    .eq("id", cleanProjectId)
    .single();

  if (projectError || !project) {
    throw new Error("No se encontró el proyecto.");
  }

  const responsable = Array.isArray(project.responsable)
    ? project.responsable[0]
    : project.responsable;

  if (responsable?.auth_user_id !== user.id) {
    throw new Error("Solo el responsable puede borrar este proyecto.");
  }

  const { data: deletedProject, error: deleteError } = await supabase
    .from("proyectos")
    .delete()
    .eq("id", cleanProjectId)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    throw new Error(
      `No se pudo borrar el proyecto: ${deleteError.message}`
    );
  }

  if (!deletedProject) {
    throw new Error("No se encontró el proyecto que intentas borrar.");
  }

  revalidatePath("/proyectos");
  redirect("/proyectos");
}
