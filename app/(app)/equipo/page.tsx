import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  UsersRound,
} from "lucide-react";

import { getTeamDashboard } from "@/lib/services/team.service";

type PageProps = {
  searchParams?: Promise<{
    persona?: string | string[];
  }>;
};

const STATUS_TONES: Record<
  number,
  {
    dot: string;
    card: string;
  }
> = {
  1: {
    dot: "bg-zinc-400",
    card: "border-zinc-200 bg-zinc-50",
  },
  2: {
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50",
  },
  3: {
    dot: "bg-blue-500",
    card: "border-blue-200 bg-blue-50",
  },
  4: {
    dot: "bg-green-600",
    card: "border-green-200 bg-green-50",
  },
};

function formatShortDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRole(role: string) {
  if (role === "admin") {
    return "Admin";
  }

  if (role === "direccion") {
    return "Dirección";
  }

  if (role === "lector") {
    return "Lector";
  }

  return "Equipo";
}

function getSelectedPeople(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values.filter((item) => item !== "todos");
}

function buildPeopleHref(selectedPersonIds: string[], personId: string) {
  const nextSelection = selectedPersonIds.includes(personId)
    ? selectedPersonIds.filter((id) => id !== personId)
    : [...selectedPersonIds, personId];

  if (nextSelection.length === 0) {
    return "/equipo";
  }

  const params = new URLSearchParams();
  nextSelection.forEach((id) => params.append("persona", id));

  return `/equipo?${params.toString()}`;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedPersonIds = getSelectedPeople(params?.persona);
  const dashboard = await getTeamDashboard();
  const visibleRows =
    selectedPersonIds.length === 0
      ? dashboard.rows
      : dashboard.rows.filter((row) =>
          selectedPersonIds.includes(row.person.id)
        );

  return (
    <main className="py-8 pl-4 pr-5 sm:pl-6 sm:pr-8">
      <div className="w-full">
        <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              Equipo
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Carga y asignaciones del equipo en proyectos activos.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-950">
                  Ver miembros
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Selecciona uno o varios para enfocar la matriz.
                </p>
              </div>

              <Link
                href="/equipo"
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedPersonIds.length === 0
                    ? "bg-zinc-950 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                Todos
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {dashboard.rows.map((row) => {
                const isSelected = selectedPersonIds.includes(row.person.id);

                return (
                  <Link
                    key={row.person.id}
                    href={buildPeopleHref(
                      selectedPersonIds,
                      row.person.id
                    )}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {row.person.nombre}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Miembros activos"
            value={dashboard.summary.activeMembers.toString()}
            detail="Personas con acceso activo"
            icon={<UsersRound className="h-6 w-6" />}
            tone="green"
          />
          <SummaryCard
            title="Proyectos activos"
            value={dashboard.summary.activeProjects.toString()}
            detail="Con tareas abiertas"
            icon={<BriefcaseBusiness className="h-6 w-6" />}
            tone="blue"
          />
          <SummaryCard
            title="Tareas asignadas"
            value={dashboard.summary.assignedTasks.toString()}
            detail="Pendientes o en curso"
            icon={<CheckCircle2 className="h-6 w-6" />}
            tone="amber"
          />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-left text-sm">
              <thead className="sticky top-0 z-20 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 shadow-sm">
                <tr>
                  <th className="sticky left-0 z-30 w-60 min-w-60 border-b border-r border-zinc-200 bg-zinc-50 px-4 py-3">
                    Miembro
                  </th>
                  {dashboard.statuses.map((status) => (
                    <th
                      key={status.code}
                      className="w-56 min-w-56 border-b border-r border-zinc-200 px-4 py-3"
                    >
                      <div className="text-zinc-950">
                        {status.name}
                      </div>
                      <div className="mt-1 font-normal normal-case text-zinc-500">
                        {status.projectCount} proyecto
                        {status.projectCount === 1 ? "" : "s"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {visibleRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={dashboard.statuses.length + 1}
                      className="px-6 py-14 text-center text-zinc-500"
                    >
                      No hay información para la persona seleccionada.
                    </td>
                  </tr>
                )}

                {visibleRows.map((row) => (
                  <tr key={row.person.id} className="align-top">
                    <td className="sticky left-0 z-10 w-60 min-w-60 border-r border-zinc-200 bg-white px-3 py-5 shadow-[8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                          {getInitials(row.person.nombre)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-zinc-950">
                            {row.person.nombre}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {formatRole(row.person.rol)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
                        {row.totalOpenTasks} tarea
                        {row.totalOpenTasks === 1 ? "" : "s"} abiertas
                      </div>
                    </td>

                    {dashboard.statuses.map((status) => {
                      const projects =
                        row.projectsByStatus[status.code] ?? [];

                      return (
                        <td
                          key={`${row.person.id}-${status.code}`}
                          className="border-r border-zinc-100 px-3 py-4"
                        >
                          {projects.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-400">
                              Sin asignaciones
                            </div>
                          ) : (
                            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                              {projects.map((project) => {
                                const tone =
                                  STATUS_TONES[project.statusCode] ??
                                  STATUS_TONES[1];

                                return (
                                  <div
                                    key={project.projectId}
                                    className={`rounded-xl border px-3 py-2 ${tone.card}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span
                                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <Link
                                          href={`/proyectos/${project.projectId}`}
                                          className="block truncate font-medium text-zinc-950 hover:underline"
                                        >
                                          {project.projectName}
                                        </Link>
                                        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-zinc-500">
                                          <span className="truncate">
                                            {project.clientName}
                                          </span>
                                          <span className="shrink-0">
                                            {project.taskCount} tarea
                                            {project.taskCount === 1
                                              ? ""
                                              : "s"}
                                          </span>
                                        </div>

                                        <ul className="mt-2 space-y-1.5 border-t border-black/5 pt-2">
                                          {project.tasks.map((task) => (
                                            <li
                                              key={task.id}
                                              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-lg bg-white/45 px-2 py-1.5 text-xs text-zinc-700"
                                            >
                                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400" />
                                              <span className="line-clamp-2 leading-snug">
                                                {task.name}
                                              </span>
                                              <span className="shrink-0 text-zinc-400">
                                                {formatShortDate(task.dueDate)}
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Cuenta tareas abiertas asignadas en proyectos activos, incluyendo
          Administrativo - Interno. No incluye tareas completadas, canceladas
          ni eliminadas.
        </p>
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
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: "green" | "blue" | "amber" | "purple";
}) {
  const toneClass = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  }[tone];

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`rounded-full p-3 ${toneClass}`}>{icon}</div>
        <div>
          <h2 className="text-sm font-medium text-zinc-600">{title}</h2>
          <div className="mt-1 text-3xl font-semibold text-zinc-950">
            {value}
          </div>
          <p className="mt-1 text-xs text-zinc-500">{detail}</p>
        </div>
      </div>
    </article>
  );
}
