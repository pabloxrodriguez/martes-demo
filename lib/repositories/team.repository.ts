import { createClient } from "@/lib/supabase/server";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getTeamPeople() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre, email, rol, activo")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    throw new Error(
      `No se pudieron obtener las personas del equipo: ${error.message}`
    );
  }

  return data ?? [];
}

export async function getTeamOpenTasks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tareas")
    .select(`
      id,
      nombre,
      responsable_id,
      fecha_comprometida,
      fecha_completada,
      eliminada,
      estados_tarea (
        nombre
      ),
      proyectos (
        id,
        nombre,
        eliminado,
        prioridad,
        fecha_evento_inicio,
        estados_proyecto (
          codigo,
          nombre,
          orden
        ),
        tipos_proyecto (
          nombre
        ),
        clientes (
          nombre
        )
      )
    `)
    .eq("eliminada", false)
    .is("fecha_completada", null)
    .not("responsable_id", "is", null)
    .order("fecha_comprometida", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(
      `No se pudieron obtener las tareas del equipo: ${error.message}`
    );
  }

  return (data ?? [])
    .map((task) => {
      const project = one(task.proyectos);

      return {
        ...task,
        estados_tarea: one(task.estados_tarea),
        proyectos: project
          ? {
              ...project,
              estados_proyecto: one(project.estados_proyecto),
              tipos_proyecto: one(project.tipos_proyecto),
              clientes: one(project.clientes),
            }
          : null,
      };
    })
    .filter((task) => task.proyectos?.eliminado === false);
}

export type TeamPerson = Awaited<ReturnType<typeof getTeamPeople>>[number];
export type TeamOpenTask = Awaited<
  ReturnType<typeof getTeamOpenTasks>
>[number];
