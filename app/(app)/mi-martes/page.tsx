import Link from "next/link";

import { MyTasksPanel } from "@/components/my-martes/MyTasksPanel";
import { PersonalWorkspacePanel } from "@/components/my-martes/PersonalWorkspacePanel";
import { getCurrentPerson } from "@/lib/auth/getCurrentPerson";
import {
  getGoogleCalendarSummary,
  getGoogleDriveSummary,
  getGoogleGmailSummary,
} from "@/lib/integrations/google/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  getMyActiveProjects,
  getMyOpenTasks,
  getProjectEditOptions,
  getRecentTaskActivity,
  type MyActiveProjectItem,
  type MyOpenTaskItem,
  type RecentTaskActivityItem,
} from "@/lib/services/project.service";

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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

function todayAsDateOnly() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function sortTasksByUrgency(tasks: MyOpenTaskItem[]) {
  return [...tasks].sort((a, b) => {
    const dateA = a.fecha_comprometida ?? "9999-12-31";
    const dateB = b.fecha_comprometida ?? "9999-12-31";
    const dateDifference = dateA.localeCompare(dateB);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return a.orden - b.orden;
  });
}

function countCompletedTasks(project: MyActiveProjectItem) {
  return project.tareas.filter(
    (task) =>
      task.estados_tarea?.nombre === "Completada" ||
      Boolean(task.fecha_completada)
  ).length;
}

function buildActivityText(activity: RecentTaskActivityItem) {
  const actor =
    activity.eliminador?.nombre ??
    activity.actualizador?.nombre ??
    activity.creador?.nombre ??
    "Alguien";

  if (activity.eliminada) {
    return `${actor} eliminó ${activity.nombre}`;
  }

  if (
    activity.estados_tarea?.nombre === "Completada" ||
    activity.fecha_completada
  ) {
    return `${actor} completó ${activity.nombre}`;
  }

  return `${actor} actualizó ${activity.nombre}`;
}

type PageProps = {
  searchParams?: Promise<{
    google?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const googleNoticeCode =
    typeof params?.google === "string" ? params.google : null;
  const person = await getCurrentPerson();
  const today = todayAsDateOnly();
  const supabase = await createClient();

  const [
    tasks,
    projects,
    activity,
    editOptions,
    googleConnectionResult,
    gmailSummary,
    calendarSummary,
    driveSummary,
  ] = await Promise.all([
    getMyOpenTasks(person!.id),
    getMyActiveProjects(person!.id),
    getRecentTaskActivity(8),
    getProjectEditOptions(),
    supabase
      .from("google_connections")
      .select("google_email, expires_at")
      .eq("persona_id", person!.id)
      .maybeSingle(),
    getGoogleGmailSummary({
      supabase,
      personId: person!.id,
    }),
    getGoogleCalendarSummary({
      supabase,
      personId: person!.id,
    }),
    getGoogleDriveSummary({
      supabase,
      personId: person!.id,
    }),
  ]);
  const googleConnection = googleConnectionResult.data;

  const sortedTasks = sortTasksByUrgency(tasks);
  const overdueTasks = tasks.filter(
    (task) =>
      task.fecha_comprometida !== null &&
      task.fecha_comprometida < today
  );
  const nextProposal = projects
    .filter((project) => {
      const statusName =
        project.estados_proyecto?.nombre.toLocaleLowerCase("es");

      return (
        project.fecha_propuesta !== null &&
        (statusName === "prospecto" ||
          statusName === "en preparación")
      );
    })
    .sort((a, b) =>
      (a.fecha_propuesta ?? "9999-12-31").localeCompare(
        b.fecha_propuesta ?? "9999-12-31"
      )
    )[0];
  const nextProposalIsOverdue =
    nextProposal?.fecha_propuesta !== null &&
    nextProposal?.fecha_propuesta !== undefined &&
    nextProposal.fecha_propuesta < today;
  const nextEvent = projects
    .filter(
      (project) =>
        project.fecha_evento_inicio !== null &&
        project.fecha_evento_inicio >= today
    )
    .sort((a, b) =>
      (a.fecha_evento_inicio ?? "9999-12-31").localeCompare(
        b.fecha_evento_inicio ?? "9999-12-31"
      )
    )[0];

  const taskStatusOptions = editOptions.taskStatuses.map((status) => ({
    value: status.id,
    label: status.nombre,
  }));
  const peopleOptions = editOptions.people.map((person) => ({
    value: person.id,
    label: person.nombre,
  }));
  const googleNotice =
    googleNoticeCode === "connected"
      ? "Google quedó conectado a Mi Martes."
      : googleNoticeCode === "disconnected"
        ? "Google fue desconectado de Mi Martes."
        : googleNoticeCode === "missing-refresh-token"
          ? "Google no entregó permiso de actualización. Vuelve a conectar y acepta todos los permisos."
          : googleNoticeCode === "disconnect-error" ||
              googleNoticeCode === "error"
            ? "No se pudo completar la conexión Google. Inténtalo nuevamente."
            : null;
  const googleNoticeTone =
    googleNoticeCode === "connected" || googleNoticeCode === "disconnected"
      ? "success"
      : "error";

  return (
    <main className="p-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              Mi Martes
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Buenos días, {person!.nombre}. Esta es tu vista de
              tareas, proyectos y movimientos recientes.
            </p>
          </div>

          <Link
            href="/proyectos"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Ver proyectos
          </Link>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Tareas atrasadas"
            value={overdueTasks.length}
            detail="Requieren atención"
          />

          <SummaryCard
            title="Próxima entrega proyecto"
            value={
              nextProposal?.fecha_propuesta
                ? formatDate(nextProposal.fecha_propuesta)
                : "Sin fecha"
            }
            detail={
              nextProposal
                ? nextProposalIsOverdue
                  ? `${nextProposal.nombre} · Atrasada`
                  : nextProposal.nombre
                : "No hay entregas pendientes"
            }
            tone={nextProposalIsOverdue ? "warning" : "default"}
          />

          <SummaryCard
            title="Próximo evento"
            value={
              nextEvent?.fecha_evento_inicio
                ? formatDate(nextEvent.fecha_evento_inicio)
                : "Sin fecha"
            }
            detail={nextEvent?.nombre ?? "No hay eventos próximos"}
          />

          <SummaryCard
            title="Mis proyectos"
            value={projects.length}
            detail="Activos"
          />
        </section>

        <PersonalWorkspacePanel
          isConnected={Boolean(googleConnection)}
          googleEmail={googleConnection?.google_email ?? null}
          notice={googleNotice}
          noticeTone={googleNoticeTone}
          gmailSummary={gmailSummary}
          calendarSummary={calendarSummary}
          driveSummary={driveSummary}
        />

        <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
          <MyTasksPanel
            tasks={sortedTasks}
            taskStatusOptions={taskStatusOptions}
            peopleOptions={peopleOptions}
          />

          <MyProjectsPanel projects={projects} />
        </section>

        <RecentActivityPanel activity={activity} />
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  tone = "default",
}: {
  title: string;
  value: string | number;
  detail: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        tone === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-sm font-medium text-zinc-500">
        {title}
      </p>

      <p
        className={`mt-3 text-3xl font-semibold ${
          tone === "warning"
            ? "text-amber-950"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-2 line-clamp-2 text-sm ${
          tone === "warning"
            ? "text-amber-800"
            : "text-zinc-500"
        }`}
      >
        {detail}
      </p>
    </div>
  );
}

function MyProjectsPanel({
  projects,
}: {
  projects: MyActiveProjectItem[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Mis proyectos
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Proyectos activos bajo tu responsabilidad.
          </p>
        </div>

        <span className="text-sm text-zinc-500">
          {projects.length}
        </span>
      </div>

      <div className="divide-y divide-zinc-100">
        {projects.map((project) => {
          const totalTasks = project.tareas.length;
          const completedTasks = countCompletedTasks(project);

          return (
            <Link
              key={project.id}
              href={`/proyectos/${project.id}`}
              className="block px-5 py-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-zinc-950">
                    {project.nombre}
                  </h3>

                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {project.clientes?.nombre ?? "Sin cliente"}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {project.estados_proyecto?.nombre ?? "Sin estado"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                <span>
                  Evento {formatDate(project.fecha_evento_inicio)}
                </span>

                <span>
                  {completedTasks} / {totalTasks} tareas
                </span>
              </div>
            </Link>
          );
        })}

        {projects.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">
            No tienes proyectos activos bajo tu responsabilidad.
          </p>
        )}
      </div>
    </section>
  );
}

function RecentActivityPanel({
  activity,
}: {
  activity: RecentTaskActivityItem[];
}) {
  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Actividad reciente
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Cambios recientes sobre tareas.
          </p>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {activity.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 px-5 py-4 text-sm text-zinc-700 md:grid-cols-[minmax(0,1fr)_220px_140px]"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-950">
                {buildActivityText(item)}
              </p>
            </div>

            <div className="truncate text-zinc-500">
              {item.proyectos?.nombre ?? "Sin proyecto"}
            </div>

            <div className="text-zinc-500 md:text-right">
              {formatDateTime(item.fecha_actualizacion)}
            </div>
          </div>
        ))}

        {activity.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-zinc-500">
            Todavía no hay actividad reciente.
          </p>
        )}
      </div>
    </section>
  );
}
