import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { canImportProjectGaelBudgets } from "@/lib/auth/projectGaelAccess";
import { requireEditablePerson } from "@/lib/auth/requireActivePerson";
import { validateGaelBudgetLines } from "@/lib/integrations/gael/export-budget";
import type { GaelBudgetExportPayload } from "@/lib/integrations/gael/import-template-config";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, person } = await requireEditablePerson();
    const { id: projectId } = await params;

    const payload = (await request.json()) as GaelBudgetExportPayload;

    if (!payload.projectId || payload.projectId !== projectId) {
      return NextResponse.json(
        { error: "El proyecto del borrador no es válido." },
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

    if (!project) {
      return NextResponse.json(
        { error: "El proyecto no existe o ya no está disponible." },
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
        { error: "No tienes acceso para guardar este presupuesto." },
        { status: 403 }
      );
    }

    const lines = validateGaelBudgetLines(payload.lines);
    const now = new Date().toISOString();
    const total = lines.reduce(
      (sum, line) => sum + line.cantidad * line.veces * line.unitario,
      0
    );

    const { data: existingDraft, error: draftLookupError } = await supabase
      .from("proyecto_presupuestos_gael")
      .select("id")
      .eq("proyecto_id", projectId)
      .eq("origen", "martes")
      .eq("estado_registro", "borrador")
      .maybeSingle();

    if (draftLookupError) {
      throw new Error(
        `No se pudo buscar el borrador: ${draftLookupError.message}`
      );
    }

    let draftId = existingDraft?.id ?? null;

    if (draftId) {
      const { error: updateError } = await supabase
        .from("proyecto_presupuestos_gael")
        .update({
          nombre: project.nombre,
          estado: "Borrador Martes",
          valor_proyectado: total,
          fecha_actualizacion: now,
          actualizado_por_id: person.id,
        })
        .eq("id", draftId);

      if (updateError) {
        throw new Error(`No se pudo actualizar el borrador: ${updateError.message}`);
      }
    } else {
      const { data: createdDraft, error: insertError } = await supabase
        .from("proyecto_presupuestos_gael")
        .insert({
          proyecto_id: projectId,
          gael_presupuesto_id: null,
          origen: "martes",
          estado_registro: "borrador",
          nombre: project.nombre,
          estado: "Borrador Martes",
          valor_proyectado: total,
          fecha_actualizacion: now,
          creado_por_id: person.id,
          actualizado_por_id: person.id,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`No se pudo crear el borrador: ${insertError.message}`);
      }

      draftId = createdDraft.id;
    }

    if (!draftId) {
      throw new Error("No se pudo identificar el borrador guardado.");
    }

    const { error: deleteLinesError } = await supabase
      .from("proyecto_presupuesto_gael_lineas")
      .delete()
      .eq("presupuesto_id", draftId);

    if (deleteLinesError) {
      throw new Error(
        `No se pudieron reemplazar las líneas del borrador: ${deleteLinesError.message}`
      );
    }

    const { error: insertLinesError } = await supabase
      .from("proyecto_presupuesto_gael_lineas")
      .insert(
        lines.map((line, index) => ({
          presupuesto_id: draftId,
          gael_linea_id: null,
          categoria: line.categoria,
          concepto: line.concepto,
          cantidad: line.cantidad,
          veces: line.veces,
          unitario: line.unitario,
          total_proyectado: line.cantidad * line.veces * line.unitario,
          operacion: line.operacion,
          notas: line.notas,
          orden: index,
        }))
      );

    if (insertLinesError) {
      throw new Error(
        `No se pudieron guardar las líneas del borrador: ${insertLinesError.message}`
      );
    }

    revalidatePath(`/proyectos/${projectId}`);

    return NextResponse.json({ id: draftId });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el borrador.",
      },
      { status: 400 }
    );
  }
}
