import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import {
  getCalendarDashboard,
  type CalendarMilestone,
} from "@/lib/services/calendar.service";
import { getProjectEditOptions } from "@/lib/services/project.service";
import { getProjectStatusStyle } from "@/lib/project-status-style";

type PageProps = {
  searchParams?: Promise<{
    year?: string | string[];
    month?: string | string[];
  }>;
};

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [dashboard, editOptions] = await Promise.all([
    getCalendarDashboard({
      year: params?.year,
      month: params?.month,
    }),
    getProjectEditOptions(),
  ]);

  const peopleOptions = editOptions.people.map((person) => ({
    value: person.id,
    label: person.nombre,
  }));
  const statusOptions = editOptions.statuses.map((status) => ({
    value: status.id,
    label: status.nombre,
  }));
  const prospectStatus =
    editOptions.statuses.find(
      (status) => Number(status.codigo) === 1
    ) ?? editOptions.statuses[0];
  const legendStatuses = editOptions.statuses.filter((status) =>
    [1, 2, 3, 4].includes(Number(status.codigo))
  );

  return (
    <>
      <CalendarHeader
        peopleOptions={peopleOptions}
        statusOptions={statusOptions}
        defaultStatusId={prospectStatus?.id ?? ""}
      />

      <main className="p-8">
        <div className="mx-auto grid w-full max-w-screen-2xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <Link
                  href={dashboard.previousHref}
                  className="flex h-11 w-12 items-center justify-center border-r border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>

                <div className="flex h-11 min-w-52 items-center justify-center px-5 text-lg font-semibold capitalize text-zinc-950">
                  {dashboard.title}
                </div>

                <Link
                  href={dashboard.nextHref}
                  className="flex h-11 w-12 items-center justify-center border-l border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>

              <Link
                href={dashboard.todayHref}
                className="h-11 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
              >
                Hoy
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
                {WEEK_DAYS.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-3 text-center text-sm font-semibold text-zinc-600"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {dashboard.days.map((day) => (
                  <div
                    key={day.date}
                    className={`min-h-36 border-b border-r border-zinc-100 p-2 last:border-r-0 ${
                      day.isCurrentMonth ? "bg-white" : "bg-zinc-50"
                    }`}
                  >
                    <div
                      className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                        day.isToday
                          ? "bg-zinc-950 text-white"
                          : day.isCurrentMonth
                            ? "text-zinc-950"
                            : "text-zinc-400"
                      }`}
                    >
                      {day.dayNumber}
                    </div>

                    <div className="space-y-1.5">
                      {day.milestones.map((milestone) => (
                        <CalendarCard
                          key={milestone.id}
                          milestone={milestone}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-sm text-zinc-500">
              Fechas según la planificación actual de cada proyecto.
            </p>
          </section>

          <aside className="space-y-5">
            <SidePanel title="Resumen del mes">
              <div className="grid grid-cols-2 gap-3">
                <SummaryNumber
                  value={dashboard.summary.proposals}
                  label="Propuestas vigentes"
                  tone="amber"
                />
                <SummaryNumber
                  value={dashboard.summary.events}
                  label="Eventos en calendario"
                  tone="green"
                />
              </div>
            </SidePanel>

            <SidePanel title="Leyenda">
              <div className="space-y-3">
                {legendStatuses.map((status) => {
                  const style = getProjectStatusStyle(Number(status.codigo));

                  return (
                    <div key={status.id} className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 rounded-full ${style.dot}`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-zinc-700">
                        {status.nombre}
                      </span>
                    </div>
                  );
                })}
              </div>
            </SidePanel>

            <SidePanel title="Hitos del mes">
              {dashboard.monthlyMilestones.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.monthlyMilestones.map((milestone) => (
                    <MonthMilestone
                      key={milestone.id}
                      milestone={milestone}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  No hay hitos este mes.
                </p>
              )}
            </SidePanel>
          </aside>
        </div>
      </main>
    </>
  );
}

function CalendarCard({
  milestone,
}: {
  milestone: CalendarMilestone;
}) {
  const style = getProjectStatusStyle(milestone.statusCode);

  return (
    <Link
      href={`/proyectos/${milestone.projectId}`}
      className={`block rounded-xl border px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${style.softBackground} ${style.text}`}
    >
      <div className="line-clamp-2 text-sm font-semibold">
        {milestone.projectName}
      </div>
      <div className="mt-1 text-xs font-medium opacity-80">
        {milestone.label}
      </div>
    </Link>
  );
}

function SidePanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryNumber({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "amber" | "green";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 text-amber-800"
      : "bg-emerald-50 text-emerald-800";

  return (
    <div className={`rounded-2xl p-4 text-center ${toneClass}`}>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs font-medium">{label}</div>
    </div>
  );
}

function MonthMilestone({
  milestone,
}: {
  milestone: CalendarMilestone;
}) {
  const style = getProjectStatusStyle(milestone.statusCode);

  return (
    <Link
      href={`/proyectos/${milestone.projectId}`}
      className="block border-b border-zinc-100 pb-3 last:border-b-0 last:pb-0"
    >
      <div className={`text-xs font-semibold ${style.text}`}>
        {formatDate(milestone.date)}
      </div>
      <div className="mt-1 text-sm font-semibold text-zinc-950">
        {milestone.projectName}
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {milestone.label}
      </div>
    </Link>
  );
}
