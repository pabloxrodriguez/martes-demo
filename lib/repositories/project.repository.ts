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
      estado_id,
      tipo_id,
      responsable_id,
      fecha_propuesta,
      fecha_evento_inicio,
      fecha_evento_termino,
      valor_venta,
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
        id,
        nombre
      ),
      tareas (
        eliminada,
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
      project.tareas
        ?.filter((task) => !task.eliminada)
        .map((task) => ({
          ...task,
          estados_tarea: one(task.estados_tarea),
        })) ?? [],
  }));
}

export type ProjectListItem = Awaited<
  ReturnType<typeof getProjects>
>[number];

export async function getMyOpenTasks(personId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tareas")
    .select(`
      id,
      proyecto_id,
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
      ),
      proyectos (
        id,
        nombre,
        prioridad,
        fecha_evento_inicio,
        estados_proyecto (
          nombre
        ),
        clientes (
          nombre
        )
      )
    `)
    .eq("responsable_id", personId)
    .is("fecha_completada", null)
    .eq("eliminada", false)
    .order("fecha_comprometida", {
      ascending: true,
      nullsFirst: false,
    })
    .order("orden", { ascending: true });

  if (error) {
    throw new Error(
      `No se pudieron obtener tus tareas: ${error.message}`
    );
  }

  return (data ?? [])
    .map((task) => {
      const status = one(task.estados_tarea);
      const project = one(task.proyectos);

      return {
        ...task,
        responsable: one(task.responsable),
        estados_tarea: status,
        proyectos: project
          ? {
              ...project,
              estados_proyecto: one(
                project.estados_proyecto
              ),
              clientes: one(project.clientes),
            }
          : null,
      };
    })
    .filter((task) => {
      const statusName = task.estados_tarea?.nombre;

      return (
        statusName !== "Completada" &&
        statusName !== "Cancelada"
      );
    });
}

export type MyOpenTaskItem = Awaited<
  ReturnType<typeof getMyOpenTasks>
>[number];

export async function getMyActiveProjects(personId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proyectos")
    .select(`
      id,
      nombre,
      prioridad,
      fecha_propuesta,
      fecha_evento_inicio,
      fecha_actualizacion,
      estados_proyecto (
        codigo,
        nombre
      ),
      clientes (
        nombre
      ),
      tipos_proyecto (
        nombre
      ),
      tareas (
        id,
        fecha_completada,
        eliminada,
        estados_tarea (
          nombre
        )
      )
    `)
    .eq("responsable_id", personId)
    .order("prioridad", { ascending: true, nullsFirst: false })
    .order("fecha_evento_inicio", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(
      `No se pudieron obtener tus proyectos: ${error.message}`
    );
  }

  return (data ?? [])
    .map((project) => ({
      ...project,
      estados_proyecto: one(project.estados_proyecto),
      clientes: one(project.clientes),
      tipos_proyecto: one(project.tipos_proyecto),
      tareas:
        project.tareas?.map((task) => ({
          ...task,
          estados_tarea: one(task.estados_tarea),
        })) ?? [],
    }))
    .filter((project) => {
      const statusCode = Number(project.estados_proyecto?.codigo);

      return [1, 2, 3, 4].includes(statusCode);
    });
}

export type MyActiveProjectItem = Awaited<
  ReturnType<typeof getMyActiveProjects>
>[number];

export async function getRecentTaskActivity(limit = 8) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tareas")
    .select(`
      id,
      nombre,
      fecha_creacion,
      fecha_actualizacion,
      fecha_completada,
      eliminada,
      fecha_eliminacion,
      creador:personas!tareas_creada_por_id_fkey (
        nombre
      ),
      actualizador:personas!tareas_actualizada_por_id_fkey (
        nombre
      ),
      eliminador:personas!tareas_eliminada_por_id_fkey (
        nombre
      ),
      estados_tarea (
        nombre
      ),
      proyectos (
        id,
        nombre
      )
    `)
    .order("fecha_actualizacion", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `No se pudo obtener la actividad reciente: ${error.message}`
    );
  }

  return (data ?? []).map((task) => ({
    ...task,
    creador: one(task.creador),
    actualizador: one(task.actualizador),
    eliminador: one(task.eliminador),
    estados_tarea: one(task.estados_tarea),
    proyectos: one(task.proyectos),
  }));
}

export type RecentTaskActivityItem = Awaited<
  ReturnType<typeof getRecentTaskActivity>
>[number];

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
        eliminada,
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
      data!.tareas
        ?.filter((task) => !task.eliminada)
        .map((task) => ({
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
