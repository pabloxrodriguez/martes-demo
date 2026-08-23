import { NextResponse } from "next/server";

import { canImportProjectGaelBudgets } from "@/lib/auth/projectGaelAccess";
import { requireEditablePerson } from "@/lib/auth/requireActivePerson";
import {
  buildGaelBudgetFileName,
  createGaelBudgetWorkbook,
} from "@/lib/integrations/gael/export-budget";
import type { GaelBudgetExportPayload } from "@/lib/integrations/gael/import-template-config";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, person } = await requireEditablePerson();
    const { id: projectId } = await params;

    const payload = (await request.json()) as GaelBudgetExportPayload;

    if (
      !payload.projectId ||
      payload.projectId !== projectId ||
      !payload.projectName
    ) {
      return NextResponse.json(
        { error: "Selecciona un proyecto antes de exportar." },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("proyectos")
      .select(`
        id,
        nombre,
        responsable_id,
        proyecto_presupuesto_gael_accesos (
          persona_id
        )
      `)
      .eq("id", projectId)
      .eq("eliminado", false)
      .maybeSingle();

    if (projectError) {
      throw new Error(`No se pudo verificar el proyecto: ${projectError.message}`);
    }

    if (!project || project.nombre !== payload.projectName) {
      return NextResponse.json(
        { error: "El proyecto seleccionado no existe o ya no está disponible." },
        { status: 404 }
      );
    }

    if (
      !canImportProjectGaelBudgets({
        person,
        projectResponsibleId: project.responsable_id,
        explicitAccessPersonIds:
          project.proyecto_presupuesto_gael_accesos?.map(
            (access) => access.persona_id
          ) ?? [],
      })
    ) {
      return NextResponse.json(
        { error: "No tienes acceso para exportar este presupuesto." },
        { status: 403 }
      );
    }

    const workbook = await createGaelBudgetWorkbook(payload.lines);
    const fileName = buildGaelBudgetFileName(project.nombre);

    return new Response(new Uint8Array(workbook), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo generar el archivo para Gael.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
