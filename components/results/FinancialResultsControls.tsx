"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { updateCommercialTarget } from "@/app/(app)/resultado-financiero/actions";
import { updateProjectField } from "@/app/(app)/proyectos/[id]/actions";
import type { ResultsDashboard } from "@/lib/services/results.service";

type WonProject = ResultsDashboard["wonProjectList"][number];
type ProjectDraft = {
  name: string;
  clientId: string;
  commercialDate: string;
  value: string;
};
type EditableField = keyof ProjectDraft;

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEditableMoney(value: number) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(value);
}

function cleanMoney(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatMoneyInput(value: string) {
  const cleanValue = cleanMoney(value);
  return cleanValue ? formatEditableMoney(Number(cleanValue)) : "";
}

function buildDraft(project: WonProject): ProjectDraft {
  return {
    name: project.name,
    clientId: project.clientId ?? "",
    commercialDate: project.commercialDate ?? "",
    value: formatEditableMoney(project.value),
  };
}

function getChangedFields(original: ProjectDraft, draft: ProjectDraft) {
  return (Object.keys(draft) as EditableField[]).filter((field) => {
    if (field === "value") {
      return cleanMoney(original.value) !== cleanMoney(draft.value);
    }

    return original[field].trim() !== draft[field].trim();
  });
}

export function CommercialTargetComparison({
  target,
  salesValue,
}: {
  target: NonNullable<ResultsDashboard["commercialTarget"]>;
  salesValue: number;
}) {
  const router = useRouter();
  const [targetValue, setTargetValue] = useState(
    formatEditableMoney(target.value)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  async function saveTarget() {
    setIsSaving(true);
    setMessage(null);
    const result = await updateCommercialTarget(target.year, targetValue);
    setIsSaving(false);

    if (!result.success) {
      setMessage({
        tone: "error",
        text: result.error ?? "No se pudo guardar la meta.",
      });
      return;
    }

    setMessage({ tone: "ok", text: "Meta comercial actualizada." });
    router.refresh();
  }

  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Meta comercial {target.year}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-500">$</span>
            <input
              value={targetValue}
              inputMode="numeric"
              aria-label={`Meta comercial ${target.year}`}
              onChange={(event) =>
                setTargetValue(formatMoneyInput(event.target.value))
              }
              className="w-52 rounded-xl border border-zinc-300 px-3 py-2 text-xl font-semibold text-zinc-950 outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveTarget()}
              className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar meta"}
            </button>
          </div>
          {message && (
            <p
              className={`mt-2 text-xs ${
                message.tone === "ok" ? "text-green-700" : "text-red-700"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-3 lg:max-w-3xl">
          <ComparisonValue label="Ventas ganadas" value={formatMoney(salesValue)} />
          <ComparisonValue
            label="Cumplimiento"
            value={target.value > 0 ? `${target.achievement}%` : "—"}
          />
          <ComparisonValue
            label={
              target.value === 0
                ? "Diferencia"
                : target.gap >= 0
                  ? "Falta para la meta"
                  : "Sobre la meta"
            }
            value={target.value === 0 ? "—" : formatMoney(Math.abs(target.gap))}
            tone={target.value > 0 && target.gap <= 0 ? "green" : "default"}
          />
        </div>
      </div>
    </section>
  );
}

function ComparisonValue({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green";
}) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold ${
          tone === "green" ? "text-green-700" : "text-zinc-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function EditableWonProjectsTable({
  projects,
  clientOptions,
}: {
  projects: ResultsDashboard["wonProjectList"];
  clientOptions: ResultsDashboard["clientOptions"];
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, ProjectDraft>>(() =>
    Object.fromEntries(projects.map((project) => [project.id, buildDraft(project)]))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  const changedProjectIds = projects
    .filter((project) =>
      getChangedFields(
        buildDraft(project),
        drafts[project.id] ?? buildDraft(project)
      ).length > 0
    )
    .map((project) => project.id);

  const draftTotal = useMemo(
    () =>
      projects.reduce((total, project) => {
        const draft = drafts[project.id] ?? buildDraft(project);
        return total + Number(cleanMoney(draft.value) || 0);
      }, 0),
    [drafts, projects]
  );

  function updateDraft(projectId: string, field: EditableField, value: string) {
    setDrafts((current) => ({
      ...current,
      [projectId]: {
        ...(current[projectId] ?? buildDraft(
          projects.find((project) => project.id === projectId)!
        )),
        [field]: value,
      },
    }));
  }

  function discardChanges() {
    setDrafts(
      Object.fromEntries(projects.map((project) => [project.id, buildDraft(project)]))
    );
    setMessage(null);
  }

  async function saveAll() {
    setIsSaving(true);
    setMessage(null);

    for (const project of projects) {
      if (!changedProjectIds.includes(project.id)) {
        continue;
      }

      const original = buildDraft(project);
      const draft = drafts[project.id] ?? original;
      const changedFields = getChangedFields(original, draft);

      for (const field of changedFields) {
        const mapping = {
          name: "nombre",
          clientId: "cliente_id",
          commercialDate: "fecha_evento_inicio",
          value: "valor_venta",
        } as const;
        const rawValue = field === "value" ? cleanMoney(draft[field]) : draft[field];
        const result = await updateProjectField(project.id, mapping[field], rawValue);

        if (!result.success) {
          setIsSaving(false);
          setMessage({
            tone: "error",
            text: `${project.name}: ${result.error ?? "No se pudo guardar el cambio."}`,
          });
          return;
        }
      }
    }

    setIsSaving(false);
    setMessage({ tone: "ok", text: "Cambios guardados y resultados recalculados." });
    router.refresh();
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-500">
        No hay proyectos ganados para el período.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-sm font-medium text-zinc-700">
            {changedProjectIds.length === 0
              ? "Sin cambios pendientes."
              : `${changedProjectIds.length} proyecto(s) con cambios pendientes.`}
          </p>
          {message && (
            <p
              className={`mt-1 text-xs ${
                message.tone === "ok" ? "text-green-700" : "text-red-700"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={changedProjectIds.length === 0 || isSaving}
            onClick={discardChanges}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Descartar
          </button>
          <button
            type="button"
            disabled={changedProjectIds.length === 0 || isSaving}
            onClick={() => void saveAll()}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div className="max-h-[620px] overflow-auto rounded-xl border border-zinc-200">
        <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="border-b border-zinc-200 px-4 py-3">Proyecto</th>
              <th className="border-b border-zinc-200 px-4 py-3">Cliente</th>
              <th className="border-b border-zinc-200 px-4 py-3">Fecha comercial</th>
              <th className="border-b border-zinc-200 px-4 py-3 text-right">Valor de venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {projects.map((project) => {
              const draft = drafts[project.id] ?? buildDraft(project);
              const changed = changedProjectIds.includes(project.id);

              return (
                <tr key={project.id} className={changed ? "bg-amber-50/60" : "bg-white"}>
                  <td className="px-4 py-3">
                    <input
                      value={draft.name}
                      disabled={isSaving}
                      onChange={(event) => updateDraft(project.id, "name", event.target.value)}
                      className="w-full min-w-64 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-medium text-zinc-950 outline-none focus:border-zinc-500"
                    />
                    <Link
                      href={`/proyectos/${project.id}`}
                      className="mt-1 inline-block text-xs text-blue-700 hover:underline"
                    >
                      Abrir ficha
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={draft.clientId}
                      disabled={isSaving}
                      onChange={(event) => updateDraft(project.id, "clientId", event.target.value)}
                      className="w-full min-w-48 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                    >
                      <option value="">Sin cliente</option>
                      {project.clientId &&
                        !clientOptions.some(
                          (option) => option.value === project.clientId
                        ) && (
                          <option value={project.clientId}>
                            {project.clientName} (inactivo)
                          </option>
                        )}
                      {clientOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={draft.commercialDate}
                      disabled={isSaving}
                      onChange={(event) =>
                        updateDraft(project.id, "commercialDate", event.target.value)
                      }
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
                    />
                    {project.commercialDateSource === "propuesta" && (
                      <p className="mt-1 text-xs text-amber-700">
                        Usa propuesta como respaldo; al editar se guardará como fecha de evento.
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-zinc-400">$</span>
                      <input
                        value={draft.value}
                        inputMode="numeric"
                        disabled={isSaving}
                        onChange={(event) =>
                          updateDraft(
                            project.id,
                            "value",
                            formatMoneyInput(event.target.value)
                          )
                        }
                        className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-right tabular-nums text-zinc-950 outline-none focus:border-zinc-500"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-zinc-950 text-white">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                Total
              </td>
              <td className="px-4 py-3 text-right text-base font-semibold tabular-nums">
                {formatMoney(draftTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
