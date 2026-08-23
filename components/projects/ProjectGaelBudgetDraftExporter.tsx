"use client";

import { Download, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  GAEL_BUDGET_CATEGORIES,
  GAEL_BUDGET_OPERATIONS,
  type GaelBudgetDraftLine,
} from "@/lib/integrations/gael/import-template-config";

type DraftLine = GaelBudgetDraftLine & { id: string };

const INITIAL_LINE: DraftLine = {
  id: "line-1",
  categoria: "Catering",
  concepto: "",
  cantidad: 1,
  veces: 1,
  unitario: 0,
  operacion: "Compra Afecta",
  notas: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function numberFromInput(value: string) {
  const normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEditableNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits,
  }).format(value);
}

export function ProjectGaelBudgetDraftExporter({
  project,
  initialDraft = null,
}: {
  project: { id: string; nombre: string };
  initialDraft?: {
    id: string;
    lines: Array<GaelBudgetDraftLine & { id: string }>;
  } | null;
}) {
  const initialLines = initialDraft?.lines.length
    ? initialDraft.lines.map((line) => ({ ...line }))
    : [INITIAL_LINE];
  const nextLineId = useRef(initialLines.length + 1);
  const [lines, setLines] = useState<DraftLine[]>(initialLines);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => lines.reduce(
      (sum, line) => sum + line.cantidad * line.veces * line.unitario,
      0
    ),
    [lines]
  );

  function updateLine<K extends keyof GaelBudgetDraftLine>(
    id: string,
    field: K,
    value: GaelBudgetDraftLine[K]
  ) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
    setMessage(null);
    setError(null);
  }

  function addLine() {
    const id = `line-${nextLineId.current}`;
    nextLineId.current += 1;
    setLines((current) => [...current, { ...INITIAL_LINE, id }]);
    setMessage(null);
    setError(null);
  }

  function removeLine(id: string) {
    if (lines.length === 1) {
      setError("El presupuesto debe conservar al menos una línea.");
      return;
    }

    setLines((current) => current.filter((line) => line.id !== id));
    setMessage(null);
    setError(null);
  }

  function budgetPayload() {
    return {
      projectId: project.id,
      projectName: project.nombre,
      lines: lines.map((line) => ({
        categoria: line.categoria,
        concepto: line.concepto,
        cantidad: line.cantidad,
        veces: line.veces,
        unitario: line.unitario,
        operacion: line.operacion,
        notas: line.notas,
      })),
    };
  }

  async function persistDraft(showConfirmation = true) {
    const response = await fetch(
      `/api/proyectos/${project.id}/presupuestos-gael/borrador`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgetPayload()),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(payload?.error ?? "No se pudo guardar el borrador.");
    }

    if (showConfirmation) {
      setMessage("Borrador guardado en Martes.");
    }
  }

  async function saveDraft() {
    setMessage(null);
    setError(null);
    setIsSaving(true);

    try {
      await persistDraft();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo guardar el borrador."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function exportBudget() {
    setMessage(null);
    setError(null);

    setIsExporting(true);

    try {
      await persistDraft(false);
      const response = await fetch(
        `/api/proyectos/${project.id}/presupuestos-gael/exportar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(budgetPayload()),
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "No se pudo generar el archivo.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const fileName =
        disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
        "presupuesto-gael.xlsx";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(
        "Excel generado. Impórtalo en Gael y luego ingresa arriba el número asignado para reemplazar este borrador."
      );
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "No se pudo generar el archivo."
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/40 p-5">
      <div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-950">
              Borrador de presupuesto
            </h3>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              Borrador Martes
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-zinc-500">
            Arma y guarda un borrador permanente en Martes. Descarga el Excel
            compatible con Gael y, cuando el presupuesto oficial exista, ingresa
            su número arriba para reemplazar este borrador.
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-700">
            Proyecto: {project.nombre}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200">
        <div className="min-w-[1260px]">
          <div className="grid grid-cols-[190px_260px_100px_90px_140px_260px_180px_52px] border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {[
              "Categoría", "Concepto", "Cantidad", "Veces", "Unitario",
              "Operación", "Notas", "",
            ].map((label, index) => (
              <div key={`${label}-${index}`} className="px-3 py-3">{label}</div>
            ))}
          </div>

          <div className="divide-y divide-zinc-100">
            {lines.map((line) => (
              <div
                key={line.id}
                className="grid grid-cols-[190px_260px_100px_90px_140px_260px_180px_52px] items-center"
              >
                <div className="p-2">
                  <select
                    aria-label="Categoría"
                    value={line.categoria}
                    onChange={(event) => updateLine(line.id, "categoria", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm"
                  >
                    {GAEL_BUDGET_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="p-2">
                  <input
                    aria-label="Concepto"
                    value={line.concepto}
                    onChange={(event) => updateLine(line.id, "concepto", event.target.value)}
                    placeholder="Descripción del gasto"
                    className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm"
                  />
                </div>
                <div className="p-2">
                  <input
                    aria-label="Cantidad"
                    type="text"
                    inputMode="decimal"
                    value={formatEditableNumber(line.cantidad)}
                    onChange={(event) => updateLine(line.id, "cantidad", numberFromInput(event.target.value))}
                    className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-right text-sm tabular-nums"
                  />
                </div>
                <div className="p-2">
                  <input
                    aria-label="Veces"
                    type="text"
                    inputMode="decimal"
                    value={formatEditableNumber(line.veces)}
                    onChange={(event) => updateLine(line.id, "veces", numberFromInput(event.target.value))}
                    className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-right text-sm tabular-nums"
                  />
                </div>
                <div className="p-2">
                  <input
                    aria-label="Unitario"
                    type="text"
                    inputMode="numeric"
                    value={formatEditableNumber(line.unitario, 0)}
                    onChange={(event) => updateLine(line.id, "unitario", numberFromInput(event.target.value))}
                    className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-right text-sm tabular-nums"
                  />
                </div>
                <div className="p-2">
                  <select
                    aria-label="Operación"
                    value={line.operacion}
                    onChange={(event) => updateLine(line.id, "operacion", event.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm"
                  >
                    {GAEL_BUDGET_OPERATIONS.map((operation) => (
                      <option key={operation} value={operation}>{operation}</option>
                    ))}
                  </select>
                </div>
                <div className="p-2">
                  <input
                    aria-label="Notas"
                    value={line.notas}
                    onChange={(event) => updateLine(line.id, "notas", event.target.value)}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm"
                  />
                </div>
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Eliminar línea"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Plus size={16} /> Agregar línea
        </button>

        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total borrador</p>
            <p className="text-lg font-semibold text-zinc-950">{formatCurrency(total)}</p>
          </div>
          <button
            type="button"
            onClick={saveDraft}
            disabled={isSaving || isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 ring-1 ring-zinc-300 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {isSaving ? "Guardando…" : "Guardar borrador"}
          </button>
          <button
            type="button"
            onClick={exportBudget}
            disabled={isExporting || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} />
            {isExporting ? "Generando…" : "Exportar para Gael"}
          </button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
