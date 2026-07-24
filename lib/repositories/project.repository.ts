import { createClient } from "@/lib/supabase/server";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proyectos")
    .select(`
      id,
      nombre,
      prioridad,
      fecha_propuesta,
      fecha_evento_inicio,
      estados_proyecto (
        id,
        codigo,
        nombre,
        orden
      ),
      tipos_proyecto (
        nombre
      ),
      clientes (
        nombre
      ),
      responsable:personas!proyectos_responsable_id_fkey (
        nombre
      ),
      tareas (
  estados_tarea (
    nombre
  )
)
    `)
    .order("fecha_evento_inicio", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(
      `No se pudieron obtener los proyectos: ${error.message}`
    );
  }

  return (data ?? []).map((project) => ({
  ...project,
  estados_proyecto: one(project.estados_proyecto),
  tipos_proyecto: one(project.tipos_proyecto),
  clientes: one(project.clientes),
  responsable: one(project.responsable),

  tareas:
    project.tareas?.map((task) => ({
      ...task,
      estados_tarea: one(task.estados_tarea),
    })) ?? [],
}));
}

export async function getProjectById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proyectos")
    .select(`
      id,
      nombre,
      prioridad,
      fecha_actualizacion,
      fecha_propuesta,
      fecha_evento_inicio,
      fecha_evento_termino,
      publico_esperado,
      valor_venta,
      notas,
      estados_proyecto (
        id,
        codigo,
        nombre
      ),
      tipos_proyecto (
        id,
        nombre
      ),
      clientes (
        id,
        nombre
      ),
      responsable:personas!proyectos_responsable_id_fkey (
        id,
        nombre
      ),
      proyecto_venues (
        venue_id,
        venues (
          id,
          nombre,
          comuna,
          ciudad
        )
      ),
      tareas (
        id,
        plantilla_tarea_id,
        nombre,
        fecha_comprometida,
        fecha_completada,
        url,
        comentario,
        orden,
        responsable:personas!tareas_responsable_id_fkey (
          id,
          nombre
        ),
        estados_tarea (
          id,
          nombre
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(
      `No se pudo obtener el proyecto: ${error.message}`
    );
  }

  return {
    ...data!,
    estados_proyecto: one(data!.estados_proyecto),
    tipos_proyecto: one(data!.tipos_proyecto),
    clientes: one(data!.clientes),
    responsable: one(data!.responsable),

    proyecto_venues:
      data!.proyecto_venues?.map((projectVenue) => ({
        ...projectVenue,
        venues: one(projectVenue.venues),
      })) ?? [],

    tareas:
      data!.tareas?.map((task) => ({
        ...task,
        responsable: one(task.responsable),
        estados_tarea: one(task.estados_tarea),
      })) ?? [],
  };
}

export async function getProjectEditOptions() {
  const supabase = await createClient();

  const [
    { data: statuses, error: statusesError },
    { data: types, error: typesError },
    { data: people, error: peopleError },
    { data: clients, error: clientsError },
    { data: venues, error: venuesError },
    { data: taskTemplates, error: taskTemplatesError },
    { data: taskStatuses, error: taskStatusesError },
  ] = await Promise.all([
    supabase
      .from("estados_proyecto")
      .select("id, codigo, nombre, orden")
      .eq("activo", true)
      .order("orden"),

    supabase
      .from("tipos_proyecto")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("personas")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("clientes")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("venues")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("plantillas_tarea")
      .select("id, nombre")
      .eq("activa", true)
      .order("nombre"),

    supabase
      .from("estados_tarea")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),
  ]);

  if (statusesError) {
    throw new Error(
      `No se pudieron obtener los estados de proyecto: ${statusesError.message}`
    );
  }

  if (typesError) {
    throw new Error(
      `No se pudieron obtener los tipos de proyecto: ${typesError.message}`
    );
  }

  if (peopleError) {
    throw new Error(
      `No se pudieron obtener las personas: ${peopleError.message}`
    );
  }

  if (clientsError) {
    throw new Error(
      `No se pudieron obtener los clientes: ${clientsError.message}`
    );
  }

  if (venuesError) {
    throw new Error(
      `No se pudieron obtener los venues: ${venuesError.message}`
    );
  }

  if (taskTemplatesError) {
    throw new Error(
      `No se pudieron obtener las plantillas de tarea: ${taskTemplatesError.message}`
    );
  }

  if (taskStatusesError) {
    throw new Error(
      `No se pudieron obtener los estados de tarea: ${taskStatusesError.message}`
    );
  }

  return {
    statuses: statuses ?? [],
    types: types ?? [],
    people: people ?? [],
    clients: clients ?? [],
    venues: venues ?? [],
    taskTemplates: taskTemplates ?? [],
    taskStatuses: taskStatuses ?? [],
  };
}
