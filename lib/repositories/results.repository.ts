import { createClient } from "@/lib/supabase/server";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function getResultsProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proyectos")
    .select(`
      id,
      nombre,
      estado_id,
      tipo_id,
      responsable_id,
      cliente_id,
      fecha_propuesta,
      fecha_evento_inicio,
      fecha_evento_termino,
      valor_venta,
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
      ),
      responsable:personas!proyectos_responsable_id_fkey (
        nombre
      )
    `)
    .eq("eliminado", false)
    .order("fecha_evento_inicio", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(
      `No se pudieron obtener los resultados: ${error.message}`
    );
  }

  return (data ?? []).map((project) => ({
    ...project,
    estados_proyecto: one(project.estados_proyecto),
    tipos_proyecto: one(project.tipos_proyecto),
    clientes: one(project.clientes),
    responsable: one(project.responsable),
  }));
}

export async function getResultsClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(
      `No se pudieron obtener los clientes: ${error.message}`
    );
  }

  return data ?? [];
}

export async function getCommercialTarget(year: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metas_comerciales")
    .select("meta")
    .eq("anio", year)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo obtener la meta comercial: ${error.message}`
    );
  }

  return Number(data?.meta ?? 0);
}

export type ResultsProject = Awaited<
  ReturnType<typeof getResultsProjects>
>[number];
