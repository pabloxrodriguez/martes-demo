import { createClient } from "@/lib/supabase/server";
import type { ProjectType } from "@/types/project-type";

export async function getProjectTypes(): Promise<ProjectType[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tipos_proyecto")
    .select("id, nombre")
    .order("nombre");

  if (error) {
    throw new Error(
      `No se pudieron obtener los tipos de proyecto: ${error.message}`
    );
  }

  return data ?? [];
}