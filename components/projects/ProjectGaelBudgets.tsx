import type { ReactNode } from "react";

type GaelBudgetLine = {
  id: string;
  categoria: string | null;
  concepto: string | null;
  cantidad: number | null;
  veces: number | null;
  unitario: number | null;
  total_proyectado: number | null;
  operacion: string | null;
};

type GaelBudget = {
  id: string;
  gael_presupuesto_id: number;
  nombre: string | null;
  estado: string | null;
  ucontrol_nombre: string | null;
  valor_proyectado: number | null;
  fecha_actualizacion: string;
  proyecto_presupuesto_gael_lineas: GaelBudgetLine[];
};

type ProjectGaelBudgetsProps = {
  budgets: GaelBudget[];
  accessList: Array<{
    id: string;
    persona_id: string;
    personas: {
      nombre: string;
    } | null;
  }>;
  peopleOptions: Array<{
    value: string;
    label: string;
  }>;
  onImport: (formData: FormData) => Promise<void>;
  onRefresh: (budgetNumber: number) => Promise<void>;
  onRemoveBudget: (budgetId: string) => Promise<void>;
  onAddAccess: (formData: FormData) => Promise<void>;
  onRemoveAccess: (accessId: string) => Promise<void>;
  canImport?: boolean;
  canManageAccess?: boolean;
  notice?: string | null;
  noticeTone?: "success" | "error";
  draftExporter?: ReactNode;
};

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 2,
});

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
  }

  return currencyFormatter.format(value);
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  return numberFormatter.format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

export function ProjectGaelBudgets({
  budgets,
  accessList,
  peopleOptions,
  onImport,
  onRefresh,
  onRemoveBudget,
  onAddAccess,
  onRemoveAccess,
  canImport = true,
  canManageAccess = false,
  notice = null,
  noticeTone = "success",
  draftExporter = null,
}: ProjectGaelBudgetsProps) {
  const authorizedPersonIds = new Set(
    accessList.map((access) => access.persona_id)
  );
  const availablePeopleOptions = peopleOptions.filter(
    (person) => !authorizedPersonIds.has(person.value)
  );

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Presupuestos Gael
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {canImport
              ? "Crea un borrador en Martes o importa el presupuesto definitivo desde Gael."
              : "Crea, guarda y exporta un borrador compatible con Gael desde este proyecto."}
          </p>
        </div>

        {canImport ? (
          <form action={onImport} className="flex flex-col gap-3 sm:flex-row">
            <input
              name="gael_presupuesto_id"
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Nº presupuesto"
              className="h-11 w-full rounded-xl border border-zinc-300 px-4 text-sm outline-none transition focus:border-zinc-950 sm:w-48"
              required
            />
            <button
              type="submit"
              className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Importar
            </button>
          </form>
        ) : null}
      </div>

      {notice ? (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
            noticeTone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice}
        </div>
      ) : null}

      {budgets.length === 0 ? draftExporter : null}

      {canManageAccess ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Acceso a presupuestos
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Autoriza a personas del equipo para ver e importar presupuestos
                Gael en este proyecto.
              </p>
            </div>

            {availablePeopleOptions.length ? (
              <form
                action={onAddAccess}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <select
                  name="persona_id"
                  className="h-10 min-w-60 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500"
                  required
                >
                  <option value="">Seleccionar persona</option>
                  {availablePeopleOptions.map((person) => (
                    <option key={person.value} value={person.value}>
                      {person.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 ring-1 ring-zinc-300 transition hover:bg-zinc-100"
                >
                  Autorizar
                </button>
              </form>
            ) : null}
          </div>

          {accessList.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {accessList.map((access) => (
                <form
                  key={access.id}
                  action={onRemoveAccess.bind(null, access.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-zinc-700 ring-1 ring-zinc-200"
                >
                  <span>{access.personas?.nombre ?? "Persona"}</span>
                  <button
                    type="submit"
                    className="text-zinc-400 transition hover:text-red-600"
                    title="Quitar acceso"
                  >
                    ×
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              No hay personas autorizadas adicionalmente.
            </p>
          )}
        </div>
      ) : null}

      {budgets.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
          Este proyecto todavía no tiene un presupuesto oficial importado desde
          Gael.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {budgets.map((budget) => (
            <article
              key={budget.id}
              className="overflow-hidden rounded-xl border border-zinc-200"
            >
              <div className="flex flex-col gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-950">
                    Presupuesto de Gasto {budget.gael_presupuesto_id}
                    {budget.nombre ? ` · ${budget.nombre}` : ""}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {[
                      budget.estado,
                      budget.ucontrol_nombre
                        ? `Gael: ${budget.ucontrol_nombre}`
                        : null,
                      `Actualizado ${formatDateTime(
                        budget.fecha_actualizacion
                      )}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="text-sm font-semibold text-zinc-950">
                  Total(P): {formatCurrency(budget.valor_proyectado)}
                </div>

                {canImport ? (
                  <div className="flex flex-wrap gap-2">
                    <form
                      action={onRefresh.bind(
                        null,
                        budget.gael_presupuesto_id
                      )}
                    >
                      <button
                        type="submit"
                        className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-950 ring-1 ring-zinc-300 transition hover:bg-zinc-100"
                      >
                        Actualizar desde Gael
                      </button>
                    </form>
                    <form action={onRemoveBudget.bind(null, budget.id)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 transition hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-white text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3 text-right">Cant</th>
                      <th className="px-4 py-3 text-right">Veces</th>
                      <th className="px-4 py-3 text-right">Unitario</th>
                      <th className="px-4 py-3 text-right">Total(P)</th>
                      <th className="px-4 py-3">Operación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {budget.proyecto_presupuesto_gael_lineas.map((line) => (
                      <tr key={line.id} className="align-top">
                        <td className="px-4 py-3 text-zinc-600">
                          {line.categoria ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-950">
                          {line.concepto ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600">
                          {formatNumber(line.cantidad)}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600">
                          {formatNumber(line.veces)}
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-600">
                          {formatCurrency(line.unitario)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-950">
                          {formatCurrency(line.total_proyectado)}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {line.operacion ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
