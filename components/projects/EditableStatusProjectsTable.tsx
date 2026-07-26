"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { updateProjectField } from "@/app/(app)/proyectos/[id]/actions";
import type { ProjectListItem } from "@/lib/repositories/project.repository";

type Option = {
  value: string;
  label: string;
};

type SaveResult = {
  success: boolean;
  error: string | null;
};

type ProjectDraft = {
  prioridad: string;
  estado_id: string;
  tipo_id: string;
  responsable_id: string;
  fecha_propuesta: string;
  valor_venta: string;
};

type EditableField = keyof ProjectDraft;

type EditableStatusProjectsTableProps = {
  projects: ProjectListItem[];
  statusOptions: Option[];
  peopleOptions: Option[];
  typeOptions: Option[];
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

function buildDraft(project: ProjectListItem): ProjectDraft {
  return {
    prioridad: project.prioridad ? String(project.prioridad) : "",
    estado_id: project.estado_id,
    tipo_id: project.tipo_id ?? "",
    responsable_id: project.responsable_id ?? "",
    fecha_propuesta: project.fecha_propuesta ?? "",
    valor_venta: formatMoney(project.valor_venta),
  };
}

function getChangedFields(
  original: ProjectDraft,
  draft: ProjectDraft
): EditableField[] {
  return (Object.keys(draft) as EditableField[]).filter((field) => {
    if (field === "valor_venta") {
      return cleanMoney(draft[field]) !== cleanMoney(original[field]);
    }

    return draft[field].trim() !== original[field].trim();
  });
}

export function EditableStatusProjectsTable({
  projects,
  statusOptions,
  peopleOptions,
  typeOptions,
}: EditableStatusProjectsTableProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, ProjectDraft>>(
    () =>
      Object.fromEntries(
        projects.map((project) => [project.id, buildDraft(project)])
      )
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [messages, setMessages] = useState<
    Record<string, { tone: "ok" | "error"; text: string }>
  >({});
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const changedProjectIds = projects
    .filter((project) => {
      const original = buildDraft(project);
      const draft = drafts[project.id] ?? original;

      return getChangedFields(original, draft).length > 0;
    })
    .map((project) => project.id);

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

  async function saveProjectFields(project: ProjectListItem) {
    const original = buildDraft(project);
    const draft = drafts[project.id] ?? original;
    const changedFields = getChangedFields(original, draft);

    if (changedFields.length === 0) {
      setMessages((current) => ({
        ...current,
        [project.id]: {
          tone: "ok",
          text: "Sin cambios.",
        },
      }));
      return true;
    }

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
        return false;
      }
    }

    setMessages((current) => ({
      ...current,
      [project.id]: {
        tone: "ok",
        text: "Guardado. Cambios aplicados.",
      },
    }));
    return true;
  }

  async function saveProject(project: ProjectListItem) {
    setSavingId(project.id);

    const wasSaved = await saveProjectFields(project);

    setSavingId(null);

    if (wasSaved) {
      router.refresh();
    }
  }

  async function saveAllProjects() {
    const changedProjects = projects.filter((project) =>
      changedProjectIds.includes(project.id)
    );

    if (changedProjects.length === 0) {
      return;
    }

    setIsSavingAll(true);

    for (const project of changedProjects) {
      setSavingId(project.id);
      await saveProjectFields(project);
    }

    setSavingId(null);
    setIsSavingAll(false);
    router.refresh();
  }

  function discardChanges() {
    setDrafts(
      Object.fromEntries(
        projects.map((project) => [project.id, buildDraft(project)])
      )
    );
    setMessages({});
  }

  function syncScroll(source: "top" | "table") {
    const top = topScrollRef.current;
    const table = tableScrollRef.current;

    if (!top || !table) {
      return;
    }

    if (source === "top") {
      table.scrollLeft = top.scrollLeft;
    } else {
      top.scrollLeft = table.scrollLeft;
    }
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-14 text-center text-zinc-500">
        No hay proyectos en este estado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
        <p className="text-sm font-medium text-zinc-600">
          {changedProjectIds.length === 0
            ? "Sin cambios pendientes."
            : `${changedProjectIds.length} proyecto(s) con cambios pendientes.`}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={changedProjectIds.length === 0 || isSavingAll}
            onClick={discardChanges}
            className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            Descartar cambios
          </button>

          <button
            type="button"
            disabled={changedProjectIds.length === 0 || isSavingAll}
            onClick={() => void saveAllProjects()}
            className="rounded-xl bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {isSavingAll ? "Guardando..." : "Guardar todos"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div
          ref={topScrollRef}
          onScroll={() => syncScroll("top")}
          className="overflow-x-auto border-b border-zinc-100"
          aria-label="Desplazamiento horizontal de la tabla"
        >
          <div className="h-4 min-w-[1220px]" />
        </div>
        <div
          ref={tableScrollRef}
          onScroll={() => syncScroll("table")}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[1220px] border-separate border-spacing-0 text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 shadow-sm">
              <tr>
                <th className="sticky left-0 z-20 w-72 min-w-72 border-b border-r border-zinc-200 bg-zinc-50 px-4 py-3">
                  Proyecto
                </th>
                <th className="w-40 border-b border-zinc-200 px-4 py-3">
                  Cliente
                </th>
                <th className="border-b border-zinc-200 px-4 py-3">
                  Prioridad
                </th>
                <th className="border-b border-zinc-200 px-4 py-3">Estado</th>
                <th className="border-b border-zinc-200 px-4 py-3">
                  Tipo de proyecto
                </th>
                <th className="border-b border-zinc-200 px-4 py-3">
                  Responsable
                </th>
                <th className="border-b border-zinc-200 px-4 py-3">
                  Propuesta
                </th>
                <th className="border-b border-zinc-200 px-4 py-3">Valor</th>
                <th className="border-b border-zinc-200 px-4 py-3">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {projects.map((project) => {
                const draft = drafts[project.id] ?? buildDraft(project);
                const message = messages[project.id];
                const isSaving = savingId === project.id;
                const hasChanges = changedProjectIds.includes(project.id);

                return (
                  <tr
                    key={project.id}
                    className={`align-top ${
                      hasChanges ? "bg-amber-50/60" : "bg-white"
                    }`}
                  >
                    <td
                      className={`sticky left-0 z-10 w-72 min-w-72 border-r border-zinc-200 px-4 py-3 shadow-[8px_0_12px_-12px_rgba(0,0,0,0.35)] ${
                        hasChanges ? "bg-amber-50" : "bg-white"
                      }`}
                    >
                  <Link
                    href={`/proyectos/${project.id}`}
                    className="font-semibold text-zinc-950 hover:underline"
                  >
                    {project.nombre}
                  </Link>
                  <div className="mt-1 text-xs text-zinc-400">
                    Solo lectura en esta tabla
                  </div>
                  {hasChanges && (
                    <div className="mt-1 text-xs font-medium text-amber-700">
                      Cambios sin guardar
                    </div>
                  )}
                    </td>

                    <td className="max-w-40 truncate px-4 py-3 text-zinc-700">
                      {project.clientes?.nombre ?? "Sin cliente"}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={draft.prioridad}
                        disabled={isSaving || isSavingAll}
                        onChange={(event) =>
                          updateDraft(
                            project.id,
                            "prioridad",
                            event.target.value
                          )
                        }
                        className="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                      >
                    <option value="">—</option>
                        {Array.from(
                          { length: 9 },
                          (_, index) => String(index + 1)
                        ).map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                  </select>
                </td>

                <td className="px-4 py-3">
                  <select
                    value={draft.estado_id}
                    disabled={isSaving || isSavingAll}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "estado_id",
                        event.target.value
                      )
                    }
                    className="w-48 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3">
                  <select
                    value={draft.tipo_id}
                    disabled={isSaving || isSavingAll}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "tipo_id",
                        event.target.value
                      )
                    }
                    className="w-48 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                  >
                    <option value="">Sin tipo</option>
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-3">
                  <select
                    value={draft.responsable_id}
                    disabled={isSaving || isSavingAll}
                    onChange={(event) =>
                      updateDraft(
                        project.id,
                        "responsable_id",
                        event.target.value
                      )
                    }
                    className="w-48 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                  >
                    {peopleOptions.map((option) => (
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
                    disabled={isSaving || isSavingAll}
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
                    type="text"
                    inputMode="numeric"
                    value={draft.valor_venta}
                    disabled={isSaving || isSavingAll}
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
                    disabled={isSaving || isSavingAll}
                    onClick={() => void saveProject(project)}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isSaving ? "Guardando..." : "Guardar fila"}
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
      </div>
    </div>
  );
}
