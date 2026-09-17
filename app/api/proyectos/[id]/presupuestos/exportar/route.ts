import { NextResponse } from "next/server";

import { canEditProjectBudget } from "@/lib/auth/projectBudgetAccess";
import { requireEditablePerson } from "@/lib/auth/requireActivePerson";
import {
  buildBudgetFileName,
  createBudgetWorkbook,
} from "@/lib/budgets/export";
import type { BudgetPayload } from "@/lib/budgets/config";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, person } = await requireEditablePerson();
    const { id: projectId } = await params;

    const payload = (await request.json()) as BudgetPayload;

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
        proyecto_presupuesto_accesos (
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

    if (!canEditProjectBudget(person)) {
      return NextResponse.json(
        { error: "No tienes acceso para exportar este presupuesto." },
        { status: 403 }
      );
    }

    const workbook = await createBudgetWorkbook(payload.lines);
    const fileName = buildBudgetFileName(project.nombre);

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
        : "No se pudo generar el archivo de presupuesto.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
