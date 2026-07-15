import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types/project-status";

export async function getProjectStatuses(): Promise<ProjectStatus[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("estados_proyecto")
    .select("id, nombre")
    .order("nombre");

  if (error) {
    throw new Error(
      `No se pudieron obtener los estados de proyecto: ${error.message}`
    );
  }

  return data ?? [];
}