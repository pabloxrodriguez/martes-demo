import { createClient } from "@/lib/supabase/server";

export async function getProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proyectos")
    .select(`
      id,
      nombre,
      prioridad,
      estados_proyecto (
        nombre
      ),
      tipos_proyecto (
        nombre
      )
    `)
    .order("fecha_evento_inicio", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}