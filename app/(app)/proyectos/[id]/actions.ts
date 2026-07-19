"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

async function updateProjectTimestamp(
  projectId: string,
  timestamp: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("proyectos")
    .update({
      fecha_actualizacion: timestamp,
    })
    .eq("id", projectId);

  if (error) {
    throw new Error(
      `No se pudo actualizar la fecha del proyecto: ${error.message}`
    );
  }
}

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

export async function addProjectVenue(
  projectId: string,
  venueId: string
) {
  const supabase = await createClient();

  const cleanVenueId = venueId.trim();

  if (!cleanVenueId) {
    throw new Error("Debes seleccionar un venue.");
  }

  const { error } = await supabase
    .from("proyecto_venues")
    .insert({
      proyecto_id: projectId,
      venue_id: cleanVenueId,
    });

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

  await updateProjectTimestamp(
    projectId,
    new Date().toISOString()
  );

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
}

export async function createProjectVenue(
  projectId: string,
  venueName: string
) {
  const supabase = await createClient();

  const cleanName = venueName.trim();

  if (!cleanName) {
    throw new Error("El nombre del venue es obligatorio.");
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

  const { error: relationError } = await supabase
    .from("proyecto_venues")
    .insert({
      proyecto_id: projectId,
      venue_id: venueId,
    });

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

  await updateProjectTimestamp(
    projectId,
    new Date().toISOString()
  );

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
}

export async function removeProjectVenue(
  projectId: string,
  venueId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("proyecto_venues")
    .delete()
    .eq("proyecto_id", projectId)
    .eq("venue_id", venueId);

  if (error) {
    throw new Error(
      `No se pudo quitar el venue del proyecto: ${error.message}`
    );
  }

  await updateProjectTimestamp(
    projectId,
    new Date().toISOString()
  );

  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/proyectos");
}

export async function createProjectTask(
  projectId: string,
  input: CreateProjectTaskInput
) {
  const supabase = await createClient();

  const projectIdClean = projectId.trim();
  const taskName = input.nombre.trim();
  const responsibleId = input.responsable_id.trim();
  const statusId = input.estado_id.trim();

  const templateId =
    input.plantilla_tarea_id?.trim() || null;

  const committedDate =
    input.fecha_comprometida?.trim() || null;

  const url = input.url?.trim() || null;
  const comment = input.comentario?.trim() || null;

  if (!projectIdClean) {
    throw new Error("El proyecto es obligatorio.");
  }

  if (!taskName) {
    throw new Error("El nombre de la tarea es obligatorio.");
  }

  if (!responsibleId) {
    throw new Error("El responsable es obligatorio.");
  }

  if (!statusId) {
    throw new Error("El estado es obligatorio.");
  }

  if (url) {
    try {
      new URL(url);
    } catch {
      throw new Error(
        "El enlace debe ser una URL válida, incluyendo https://"
      );
    }
  }

  const now = new Date().toISOString();

  const { error } = await supabase
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
      fecha_actualizacion: now,
    });

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

  await updateProjectTimestamp(projectIdClean, now);

  revalidatePath(`/proyectos/${projectIdClean}`);
  revalidatePath("/proyectos");
}

export async function updateTaskField(
  projectId: string,
  taskId: string,
  field: EditableTaskField,
  value: string
) {
  const supabase = await createClient();

  const cleanProjectId = projectId.trim();
  const cleanTaskId = taskId.trim();
  const cleanValue = value.trim();

  if (!cleanProjectId || !cleanTaskId) {
    throw new Error("La tarea y el proyecto son obligatorios.");
  }

  if (field === "nombre" && !cleanValue) {
    throw new Error("El nombre de la tarea es obligatorio.");
  }

  if (field === "responsable_id" && !cleanValue) {
    throw new Error("El responsable es obligatorio.");
  }

  if (field === "estado_id" && !cleanValue) {
    throw new Error("El estado es obligatorio.");
  }

  if (field === "url" && cleanValue) {
    try {
      new URL(cleanValue);
    } catch {
      throw new Error(
        "El enlace debe ser una URL válida, incluyendo https://"
      );
    }
  }

  const normalizedValue =
    cleanValue === "" ? null : cleanValue;

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tareas")
    .update({
      [field]: normalizedValue,
      fecha_actualizacion: now,
    })
    .eq("id", cleanTaskId)
    .eq("proyecto_id", cleanProjectId);

  if (error) {
    throw new Error(
      `No se pudo actualizar la tarea: ${error.message}`
    );
  }

  await updateProjectTimestamp(cleanProjectId, now);

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function toggleTaskCompleted(
  projectId: string,
  taskId: string,
  completed: boolean
) {
  const supabase = await createClient();

  const cleanProjectId = projectId.trim();
  const cleanTaskId = taskId.trim();

  if (!cleanProjectId || !cleanTaskId) {
    throw new Error("La tarea y el proyecto son obligatorios.");
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

  const { error } = await supabase
    .from("tareas")
    .update({
      estado_id: targetStatus.id,
      fecha_completada: completedDate,
      fecha_actualizacion: now,
    })
    .eq("id", cleanTaskId)
    .eq("proyecto_id", cleanProjectId);

  if (error) {
    throw new Error(
      `No se pudo cambiar el estado de la tarea: ${error.message}`
    );
  }

  await updateProjectTimestamp(cleanProjectId, now);

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string
) {
  const supabase = await createClient();

  const cleanProjectId = projectId.trim();
  const cleanTaskId = taskId.trim();

  if (!cleanProjectId || !cleanTaskId) {
    throw new Error("La tarea y el proyecto son obligatorios.");
  }

  const { error } = await supabase
    .from("tareas")
    .delete()
    .eq("id", cleanTaskId)
    .eq("proyecto_id", cleanProjectId);

  if (error) {
    throw new Error(
      `No se pudo eliminar la tarea: ${error.message}`
    );
  }

  await updateProjectTimestamp(
    cleanProjectId,
    new Date().toISOString()
  );

  revalidatePath(`/proyectos/${cleanProjectId}`);
  revalidatePath("/proyectos");
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const cleanProjectId = projectId.trim();

  if (!cleanProjectId) {
    throw new Error("El proyecto es obligatorio.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Debes iniciar sesión para borrar un proyecto.");
  }

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

  const { error: deleteError } = await supabase
    .from("proyectos")
    .delete()
    .eq("id", cleanProjectId);

  if (deleteError) {
    throw new Error(
      `No se pudo borrar el proyecto: ${deleteError.message}`
    );
  }

  revalidatePath("/proyectos");
  redirect("/proyectos");
}