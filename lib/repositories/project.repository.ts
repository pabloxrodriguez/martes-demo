import { createClient } from "@/lib/supabase/server";

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
        estado_id
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

  return data ?? [];
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

  return data;
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
      .select("id, nombre, orden")
      .order("orden"),

    supabase
      .from("tipos_proyecto")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("personas")
      .select("id, nombre")
      .order("nombre"),

    supabase
      .from("clientes")
      .select("id, nombre")
      .order("nombre"),

    supabase
      .from("venues")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),

    supabase
      .from("plantillas_tarea")
      .select("id, nombre")
      .order("nombre"),

    supabase
      .from("estados_tarea")
      .select("id, nombre")
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