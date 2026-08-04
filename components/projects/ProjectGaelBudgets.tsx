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
  onImport: (formData: FormData) => Promise<void>;
  canImport?: boolean;
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
  onImport,
  canImport = true,
}: ProjectGaelBudgetsProps) {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            Presupuestos Gael
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Importa presupuestos de gasto por número. La ejecución se mantiene
            en Gael; Martes solo muestra una copia de consulta.
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

      {budgets.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
          Este proyecto todavía no tiene presupuestos Gael importados.
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
