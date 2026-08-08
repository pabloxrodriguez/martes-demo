import { createClient } from "@/lib/supabase/server";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getCalendarProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proyectos")
    .select(`
      id,
      nombre,
      fecha_propuesta,
      fecha_evento_inicio,
      fecha_evento_termino,
      estados_proyecto (
        codigo,
        nombre,
        orden
      ),
      tipos_proyecto (
        nombre
      )
    `)
    .eq("eliminado", false)
    .order("fecha_propuesta", {
      ascending: true,
      nullsFirst: false,
    })
    .order("fecha_evento_inicio", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(
      `No se pudieron obtener los hitos del calendario: ${error.message}`
    );
  }

  return (data ?? []).map((project) => ({
    ...project,
    estados_proyecto: one(project.estados_proyecto),
    tipos_proyecto: one(project.tipos_proyecto),
  }));
}

export type CalendarProject = Awaited<
  ReturnType<typeof getCalendarProjects>
>[number];
