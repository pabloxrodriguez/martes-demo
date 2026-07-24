import { CatalogsManager } from "@/components/catalogs/CatalogsManager";
import { createClient } from "@/lib/supabase/server";

export default async function CatalogsPage() {
  const supabase = await createClient();
  const [
    { data: clients, error: clientsError },
    { data: projectTypes, error: projectTypesError },
    { data: venues, error: venuesError },
    { data: taskTemplates, error: taskTemplatesError },
  ] = await Promise.all([
    supabase
      .from("clientes")
      .select(
        "id, nombre, contacto_nombre, contacto_correo, contacto_celular, activo"
      )
      .order("activo", { ascending: false })
      .order("nombre"),
    supabase
      .from("tipos_proyecto")
      .select("id, nombre, activo")
      .order("activo", { ascending: false })
      .order("nombre"),
    supabase
      .from("venues")
      .select(
        "id, nombre, direccion, comuna, ciudad, capacidad, activo"
      )
      .order("activo", { ascending: false })
      .order("nombre"),
    supabase
      .from("plantillas_tarea")
      .select("id, nombre, orden, activa")
      .order("activa", { ascending: false })
      .order("orden")
      .order("nombre"),
  ]);

  const loadError =
    clientsError ??
    projectTypesError ??
    venuesError ??
    taskTemplatesError;

  if (loadError) {
    throw new Error(
      `No se pudieron obtener los catálogos: ${loadError.message}`
    );
  }

  return (
    <CatalogsManager
      clients={clients ?? []}
      projectTypes={projectTypes ?? []}
      venues={venues ?? []}
      taskTemplates={(taskTemplates ?? []).map((template) => ({
        id: template.id,
        nombre: template.nombre,
        activo: template.activa,
      }))}
    />
  );
}
