import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Trophy,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import {
  getResultsDashboard,
  type ResultsDashboard,
} from "@/lib/services/results.service";

type PageProps = {
  searchParams?: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
};

function formatMoney(value: number) {
  if (value >= 1_000_000) {
    return `$${Math.round(value / 1_000_000).toLocaleString("es-CL")} MM`;
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const dashboard = await getResultsDashboard(params);
  const hasMonthlySales = dashboard.monthlyEvolution.some(
    (month) => month.value > 0
  );
  const detailParams = `from=${dashboard.period.from}&to=${dashboard.period.to}`;

  return (
    <main className="p-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              Resultados
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Visión general del desempeño de La Oreja Lab según
              la fecha comercial de cada proyecto. No incluye
              Administrativos - Internos ni Descartados - Cancelados.
            </p>
          </div>

          <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
            <label className="text-sm font-medium text-zinc-600">
              Desde
              <input
                type="date"
                name="from"
                defaultValue={dashboard.period.from}
                className="mt-1 block rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
              />
            </label>

            <label className="text-sm font-medium text-zinc-600">
              Hasta
              <input
                type="date"
                name="to"
                defaultValue={dashboard.period.to}
                className="mt-1 block rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Aplicar
            </button>
          </form>
        </div>

        <p className="mt-4 text-sm text-zinc-500">
          Período: {formatDate(dashboard.period.from)} —{" "}
          {formatDate(dashboard.period.to)}
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Ventas ganadas"
            value={formatMoney(dashboard.summary.wonSalesValue)}
            detail="En ejecución + realizados"
            icon={<CircleDollarSign className="h-6 w-6" />}
            tone="green"
          />

          <SummaryCard
            title="Proyectos gestionados"
            value={dashboard.summary.managedProjects.toString()}
            detail="Estados comerciales 1 a 6"
            icon={<BriefcaseBusiness className="h-6 w-6" />}
            tone="blue"
            href={`/resultados/detalle?metric=gestionados&${detailParams}`}
          />

          <SummaryCard
            title="Proyectos ganados"
            value={dashboard.summary.wonProjects.toString()}
            detail="En ejecución + realizados"
            icon={<CheckCircle2 className="h-6 w-6" />}
            tone="green"
            href={`/resultados/detalle?metric=ganados&${detailParams}`}
          />

          <SummaryCard
            title="Proyectos no ganados"
            value={dashboard.summary.lostProjects.toString()}
            detail="Estado No ganado"
            icon={<XCircle className="h-6 w-6" />}
            tone="red"
            href={`/resultados/detalle?metric=no-ganados&${detailParams}`}
          />

          <SummaryCard
            title="Tasa de éxito"
            value={
              dashboard.summary.successRate === null
                ? "—"
                : `${dashboard.summary.successRate}%`
            }
            detail="Ganados / cerrados"
            icon={<Trophy className="h-6 w-6" />}
            tone="purple"
          />
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <Panel
            title="Evolución mensual"
            subtitle={
              hasMonthlySales
                ? "Ventas ganadas por mes (CLP)"
                : "Proyectos ganados por mes (cantidad, sin montos informados)"
            }
          >
            <MonthlyEvolutionChart
              data={dashboard.monthlyEvolution}
              mode={hasMonthlySales ? "money" : "projects"}
            />
          </Panel>

          <Panel title="Pipeline" subtitle="Valor potencial por estado">
            <MetricList
              items={dashboard.pipeline}
              emptyText="No hay proyectos en pipeline para el período."
            />
          </Panel>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-3">
          <Panel title="Ventas por cliente">
            <MetricTable
              items={dashboard.salesByClient.slice(0, 6)}
              valueLabel="Ventas"
              emptyText="No hay ventas ganadas para el período."
            />
          </Panel>

          <Panel title="Proyectos por tipo">
            <MetricTable
              items={dashboard.projectsByType.slice(0, 6)}
              valueLabel="Ventas"
              emptyText="No hay proyectos para el período."
            />
          </Panel>

          <Panel title="Ventas por tipo de proyecto">
            <MetricList
              items={dashboard.salesByType.slice(0, 6)}
              emptyText="No hay ventas ganadas para el período."
            />
          </Panel>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <Panel
            title="Proyectos realizados"
            subtitle="Eventos ejecutados dentro del período"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="rounded-full bg-green-50 p-8 text-center text-green-700">
                <div className="text-4xl font-semibold">
                  {dashboard.realized.projects}
                </div>
                <div className="mt-1 text-sm">eventos</div>
              </div>

              <div className="flex-1 space-y-3 text-sm">
                <MetricLine
                  label="Ventas realizadas"
                  value={formatMoney(dashboard.realized.value)}
                />
                <MetricLine
                  label="Ticket promedio"
                  value={
                    dashboard.realized.projects > 0
                      ? formatMoney(
                          dashboard.realized.value /
                            dashboard.realized.projects
                        )
                      : "—"
                  }
                />
              </div>
            </div>
          </Panel>

          <Panel title="Notas del reporte">
            <div className="space-y-3 text-sm text-zinc-600">
              <p>
                En ejecución cuenta como venta ganada. Realizado
                cuenta además como evento ejecutado.
              </p>

              <p>
                Los proyectos Administrativo - Interno y Descartado -
                Cancelado no entran en Resultados. Para ganados manda
                la fecha de ejecución y, si un proyecto En ejecución
                aún no la tiene, se usa fecha de propuesta como
                respaldo. Para pipeline y No ganado manda la fecha de
                propuesta.
              </p>

              {dashboard.reminders.noOlvidar > 0 && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">
                  Hay {dashboard.reminders.noOlvidar} proyecto(s) en
                  “No olvidar”. No se incluyen en los resultados
                  comerciales.
                </p>
              )}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  icon,
  tone,
  href,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: "green" | "blue" | "red" | "purple";
  href?: string;
}) {
  const toneClass = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  }[tone];

  const content = (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 ${toneClass}`}>{icon}</div>

        <div>
          <h2 className="text-sm font-medium text-zinc-600">
            {title}
          </h2>
          <div className="mt-1 text-3xl font-semibold text-zinc-950">
            {value}
          </div>
          <p className="mt-1 text-xs text-zinc-500">{detail}</p>
        </div>
      </div>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="block transition hover:-translate-y-0.5 hover:shadow-md"
      title={`Ver detalle de ${title.toLowerCase()}`}
    >
      {content}
    </Link>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          )}
        </div>

        <BarChart3 className="h-5 w-5 text-zinc-300" />
      </div>

      {children}
    </section>
  );
}

function MonthlyEvolutionChart({
  data,
  mode,
}: {
  data: ResultsDashboard["monthlyEvolution"];
  mode: "money" | "projects";
}) {
  const width = Math.max(760, data.length * 58);
  const height = 280;
  const padding = {
    top: 28,
    right: 22,
    bottom: 42,
    left: 54,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.map((month) =>
    mode === "money" ? month.value : month.projects
  );
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x =
      padding.left +
      (chartWidth / Math.max(data.length - 1, 1)) * index;
    const y =
      padding.top + chartHeight - (value / maxValue) * chartHeight;

    return {
      x,
      y,
      value,
      month: data[index].month,
    };
  });
  const linePath = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");
  const areaPath = `${linePath} L ${
    points[points.length - 1]?.x ?? padding.left
  } ${padding.top + chartHeight} L ${padding.left} ${
    padding.top + chartHeight
  } Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = padding.top + chartHeight - ratio * chartHeight;
    const value = maxValue * ratio;

    return {
      y,
      value,
    };
  });

  function formatMetric(value: number) {
    if (mode === "money") {
      return formatMoney(value);
    }

    return `${value} proyecto${value === 1 ? "" : "s"}`;
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          mode === "money"
            ? "Evolución mensual de ventas ganadas en pesos chilenos"
            : "Evolución mensual de proyectos ganados"
        }
        className="h-80 w-full"
        style={{
          minWidth: `${width}px`,
        }}
      >
        <defs>
          <linearGradient
            id="monthly-evolution-area"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => (
          <g key={line.y}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={line.y}
              y2={line.y}
              stroke="#e4e4e7"
              strokeDasharray="4 6"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              className="fill-zinc-400 text-[11px]"
            >
              {mode === "money"
                ? formatMoney(line.value)
                : Math.round(line.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#monthly-evolution-area)" />
        <path
          d={linePath}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => {
          const monthData = data[index];
          const showYear =
            index === 0 ||
            monthData.year !== data[index - 1]?.year;
          const showValueLabel =
            point.value > 0 && data.length <= 24;

          return (
            <g key={monthData.key}>
              <line
                x1={point.x}
                x2={point.x}
                y1={padding.top + chartHeight}
                y2={padding.top + chartHeight + 6}
                stroke="#d4d4d8"
              />

              <text
                x={point.x}
                y={height - (showYear ? 22 : 16)}
                textAnchor="middle"
                className="fill-zinc-500 text-[12px]"
              >
                {point.month}
              </text>

              {showYear && (
                <text
                  x={point.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[11px] font-medium"
                >
                  {monthData.year}
                </text>
              )}

              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                className="fill-white"
                stroke="#2563eb"
                strokeWidth="3"
                aria-label={`${point.month}: ${formatMetric(point.value)}`}
              />

              {showValueLabel && (
                <text
                x={point.x}
                y={Math.max(14, point.y - 12)}
                textAnchor="middle"
                className="fill-zinc-700 text-[11px] font-medium"
                >
                  {mode === "money"
                    ? formatMoney(point.value)
                    : point.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MetricList({
  items,
  emptyText,
}: {
  items: ResultsDashboard["pipeline"];
  emptyText: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.name}>
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="font-medium text-zinc-950">
                {item.name}
              </div>
              <div className="text-sm text-zinc-500">
                {item.projects} proyecto(s)
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold text-zinc-950">
                {formatMoney(item.value)}
              </div>
              <div className="text-sm text-zinc-500">
                {item.percentage}%
              </div>
            </div>
          </div>

          <div className="mt-2 h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-blue-600"
              style={{
                width: `${Math.max(
                  4,
                  Math.round((item.value / maxValue) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricTable({
  items,
  valueLabel,
  emptyText,
}: {
  items: ResultsDashboard["salesByClient"];
  valueLabel: string;
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            <th className="py-2 font-semibold">Nombre</th>
            <th className="py-2 text-right font-semibold">
              {valueLabel}
            </th>
            <th className="py-2 text-right font-semibold">
              Proyectos
            </th>
            <th className="py-2 text-right font-semibold">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item) => (
            <tr key={item.name}>
              <td className="py-3 font-medium text-zinc-950">
                {item.name}
              </td>
              <td className="py-3 text-right text-zinc-700">
                {formatMoney(item.value)}
              </td>
              <td className="py-3 text-right text-zinc-700">
                {item.projects}
              </td>
              <td className="py-3 text-right text-zinc-700">
                {item.percentage}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between border-b border-zinc-100 pb-2">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-950">{value}</span>
    </div>
  );
}
