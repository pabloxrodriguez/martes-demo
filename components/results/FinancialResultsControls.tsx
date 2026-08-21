"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateCommercialTarget } from "@/app/(app)/resultado-financiero/actions";
import type { ResultsDashboard } from "@/lib/services/results.service";

type WonProject = ResultsDashboard["wonProjectList"][number];

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

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
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
          <ComparisonValue
            label="Ventas ganadas"
            value={formatMoney(salesValue)}
          />
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
            value={
              target.value === 0 ? "—" : formatMoney(Math.abs(target.gap))
            }
            tone={
              target.value > 0 && target.gap <= 0 ? "green" : "default"
            }
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

export function WonProjectsTable({
  projects,
}: {
  projects: ResultsDashboard["wonProjectList"];
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-50 px-5 py-10 text-center text-sm text-zinc-500">
        No hay proyectos ganados para el período.
      </div>
    );
  }

  const groups = [
    { code: 4, title: "En ejecución", dotClass: "bg-green-500" },
    { code: 5, title: "Realizados", dotClass: "bg-violet-500" },
  ].map((group) => ({
    ...group,
    projects: projects.filter((project) => project.statusCode === group.code),
  }));
  const total = projects.reduce((sum, project) => sum + project.value, 0);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <ProjectGroup
          key={group.code}
          title={group.title}
          dotClass={group.dotClass}
          projects={group.projects}
        />
      ))}

      <div className="flex items-center justify-between rounded-xl bg-zinc-950 px-5 py-4 text-white">
        <span className="font-semibold">Total proyectos ganados</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}

function ProjectGroup({
  title,
  dotClass,
  projects,
}: {
  title: string;
  dotClass: string;
  projects: WonProject[];
}) {
  const total = projects.reduce((sum, project) => sum + project.value, 0);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 font-semibold text-zinc-950">
          <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
          {title}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
            {projects.length}
          </span>
        </h3>
        <span className="text-sm font-semibold tabular-nums text-zinc-700">
          {formatMoney(total)}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 px-5 py-6 text-center text-sm text-zinc-500">
          No hay proyectos en este estado.
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="border-b border-zinc-200 px-4 py-3">Proyecto</th>
                <th className="border-b border-zinc-200 px-4 py-3">Cliente</th>
                <th className="border-b border-zinc-200 px-4 py-3">
                  Fecha comercial
                </th>
                <th className="border-b border-zinc-200 px-4 py-3 text-right">
                  Valor de venta
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {projects.map((project) => (
                <tr key={project.id} className="bg-white">
                  <td className="px-4 py-3">
                    <Link
                      href={`/proyectos/${project.id}`}
                      className="font-semibold text-zinc-950 hover:text-blue-700 hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {project.clientName}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatDate(project.commercialDate)}
                    {project.commercialDateSource === "propuesta" && (
                      <p className="mt-0.5 text-xs text-amber-700">
                        Fecha de propuesta usada como respaldo
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-950">
                    {formatMoney(project.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
