import type { ReactNode } from "react";

type ProjectBudgetsProps = {
  budgets: Array<{
    id: string;
    numero_referencia: number | null;
    nombre: string | null;
    estado: string | null;
    ucontrol_nombre: string | null;
    valor_proyectado: number | null;
    fecha_actualizacion: string;
    proyecto_presupuesto_lineas: Array<{
      id: string;
      categoria: string | null;
      concepto: string | null;
      cantidad: number | null;
      veces: number | null;
      unitario: number | null;
      total_proyectado: number | null;
      operacion: string | null;
    }>;
  }>;
  accessList: Array<{
    id: string;
    persona_id: string;
    personas: { nombre: string } | null;
  }>;
  peopleOptions: Array<{ value: string; label: string }>;
  onAddAccess: (formData: FormData) => Promise<void>;
  onRemoveAccess: (accessId: string) => Promise<void>;
  canManageAccess?: boolean;
  editor: ReactNode;
};

export function ProjectBudgets({
  budgets,
  accessList,
  peopleOptions,
  onAddAccess,
  onRemoveAccess,
  canManageAccess = false,
  editor,
}: ProjectBudgetsProps) {
  const authorizedPersonIds = new Set(
    accessList.map((access) => access.persona_id)
  );
  const availablePeopleOptions = peopleOptions.filter(
    (person) => !authorizedPersonIds.has(person.value)
  );

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-950">
          Presupuesto
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Prepara, guarda y exporta el presupuesto del proyecto directamente
          desde Martes.
        </p>
      </div>

      {canManageAccess ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Acceso al presupuesto
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Autoriza a otras personas del equipo para consultar el
                presupuesto de este proyecto.
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
                    aria-label={`Quitar acceso de ${access.personas?.nombre ?? "esta persona"}`}
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

      {budgets.length ? (
        <div className="mt-6 space-y-6">
          {budgets.map((budget) => (
            <article
              key={budget.id}
              className="overflow-hidden rounded-xl border border-zinc-200"
            >
              <div className="flex flex-col gap-2 border-b border-zinc-200 bg-zinc-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-zinc-950">
                    Presupuesto
                    {budget.numero_referencia
                      ? ` ${budget.numero_referencia}`
                      : ""}
                    {budget.nombre ? ` · ${budget.nombre}` : ""}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {[
                      budget.estado,
                      budget.ucontrol_nombre,
                      `Actualizado ${formatDateTime(budget.fecha_actualizacion)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="text-sm font-semibold text-zinc-950">
                  Total: {formatCurrency(budget.valor_proyectado)}
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
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Operación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {budget.proyecto_presupuesto_lineas.map((line) => (
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
      ) : null}

      {editor}
    </section>
  );
}

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 2,
});

function formatCurrency(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatNumber(value: number | null) {
  return value === null ? "—" : numberFormatter.format(value);
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
