"use client";

import Link from "next/link";
import { useState } from "react";

import { updateProjectField } from "@/app/(app)/proyectos/[id]/actions";
import type { ResultsDetailProject } from "@/lib/services/results.service";

type Option = {
  value: string;
  label: string;
};

type SaveResult = {
  success: boolean;
  error: string | null;
};

type ProjectDraft = {
  estado_id: string;
  fecha_propuesta: string;
  fecha_evento_inicio: string;
  fecha_evento_termino: string;
  valor_venta: string;
};

type EditableField = keyof ProjectDraft;

type ResultsEditableProjectsTableProps = {
  projects: ResultsDetailProject[];
  statusOptions: Option[];
};

function formatMoney(value: number | null) {
  if (value === null) {
    return "";
  }

  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(value);
}

function cleanMoney(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildDraft(project: ResultsDetailProject): ProjectDraft {
  return {
    estado_id: project.estado_id,
    fecha_propuesta: project.fecha_propuesta ?? "",
    fecha_evento_inicio: project.fecha_evento_inicio ?? "",
    fecha_evento_termino: project.fecha_evento_termino ?? "",
    valor_venta: formatMoney(project.valor_venta),
  };
}

function getChangedFields(
  original: ProjectDraft,
  draft: ProjectDraft
): EditableField[] {
  return (Object.keys(draft) as EditableField[]).filter(
    (field) => {
      if (field === "valor_venta") {
        return cleanMoney(draft[field]) !== cleanMoney(original[field]);
      }

      return draft[field].trim() !== original[field].trim();
    }
  );
}

export function ResultsEditableProjectsTable({
  projects,
  statusOptions,
}: ResultsEditableProjectsTableProps) {
  const [drafts, setDrafts] = useState<Record<string, ProjectDraft>>(
    () =>
      Object.fromEntries(
        projects.map((project) => [project.id, buildDraft(project)])
      )
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Record<string, { tone: "ok" | "error"; text: string }>
  >({});

  function updateDraft(
    projectId: string,
    field: EditableField,
    value: string
  ) {
    setDrafts((current) => ({
      ...current,
      [projectId]: {
        ...current[projectId],
        [field]: value,
      },
    }));
  }

  async function saveProject(project: ResultsDetailProject) {
    const original = buildDraft(project);
    const draft = drafts[project.id];
    const changedFields = getChangedFields(original, draft);

    if (changedFields.length === 0) {
      setMessages((current) => ({
        ...current,
        [project.id]: {
          tone: "ok",
          text: "Sin cambios.",
        },
      }));
      return;
    }

    setSavingId(project.id);
    setMessages((current) => ({
      ...current,
      [project.id]: {
        tone: "ok",
        text: "Guardando...",
      },
    }));

    for (const field of changedFields) {
      const result = (await updateProjectField(
        project.id,
        field,
        field === "valor_venta" ? cleanMoney(draft[field]) : draft[field]
      )) as SaveResult;

      if (!result.success) {
        setMessages((current) => ({
          ...current,
          [project.id]: {
            tone: "error",
            text: result.error ?? "No se pudo guardar el cambio.",
          },
        }));
        setSavingId(null);
        return;
      }
    }

    setMessages((current) => ({
      ...current,
      [project.id]: {
        tone: "ok",
        text: "Guardado. Actualiza el reporte para recalcular.",
      },
    }));
    setSavingId(null);
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-14 text-center text-zinc-500">
        No hay proyectos para este criterio.
      </div>
    );
  }

  return (
    <div className="max-h-[72vh] overflow-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 shadow-sm">
          <tr>
            <th className="border-b border-zinc-200 px-4 py-3">Proyecto</th>
            <th className="border-b border-zinc-200 px-4 py-3">Cliente</th>
            <th className="border-b border-zinc-200 px-4 py-3">Responsable</th>
            <th className="border-b border-zinc-200 px-4 py-3">Estado</th>
            <th className="border-b border-zinc-200 px-4 py-3">Propuesta</th>
            <th className="border-b border-zinc-200 px-4 py-3">Inicio</th>
            <th className="border-b border-zinc-200 px-4 py-3">Término</th>
            <th className="border-b border-zinc-200 px-4 py-3">Valor</th>
            <th className="border-b border-zinc-200 px-4 py-3">Acción</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-zinc-100">
          {projects.map((project) => {
            const draft = drafts[project.id] ?? buildDraft(project);
            const message = messages[project.id];
            const isSaving = savingId === project.id;

            return (
              <tr key={project.id} className="align-top">
                <td className="px-4 py-3">
                  <Link
                    href={`/proyectos/${project.id}`}
                    className="font-semibold text-zinc-950 hover:underline"
                  >
                    {project.nombre}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-400">
                    Fecha reporte: {project.metricDate ?? "—"}
                  </div>
                </td>

                <td className="px-4 py-3 text-zinc-700">
                  {project.clientes?.nombre ?? "Sin cliente"}
                </td>

                <td className="px-4 py-3 text-zinc-700">
                  {project.responsable?.nombre ?? "Sin responsable"}
                </td>

                <td className="px-4 py-3">
                  <select
                    value={draft.estado_id}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "estado_id",
                        event.target.value
                      )
                    }
                    className="w-44 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={draft.fecha_propuesta}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "fecha_propuesta",
                        event.target.value
                      )
                    }
                    className="w-36 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={draft.fecha_evento_inicio}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "fecha_evento_inicio",
                        event.target.value
                      )
                    }
                    className="w-36 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={draft.fecha_evento_termino}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "fecha_evento_termino",
                        event.target.value
                      )
                    }
                    className="w-36 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.valor_venta}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "valor_venta",
                        cleanMoney(event.target.value)
                          ? formatMoney(
                              Number(cleanMoney(event.target.value))
                            )
                          : ""
                      )
                    }
                    className="w-36 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-right text-zinc-950 outline-none focus:border-zinc-500"
                  />
                </td>

                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void saveProject(project)}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isSaving ? "Guardando..." : "Guardar"}
                  </button>

                  {message && (
                    <p
                      className={`mt-2 max-w-44 text-xs ${
                        message.tone === "error"
                          ? "text-red-600"
                          : "text-green-700"
                      }`}
                    >
                      {message.text}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
