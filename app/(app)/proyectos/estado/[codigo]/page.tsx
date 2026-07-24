import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getProjectEditOptions,
  getProjects,
} from "@/lib/services/project.service";

type ProjectStatusPageProps = {
  params: Promise<{
    codigo: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function ProjectStatusPage({
  params,
}: ProjectStatusPageProps) {
  const { codigo } = await params;
  const statusCode = Number(codigo);

  if (!Number.isInteger(statusCode)) {
    notFound();
  }

  const [projects, editOptions] = await Promise.all([
    getProjects(),
    getProjectEditOptions(),
  ]);

  const status = editOptions.statuses.find(
    (item) => Number(item.codigo) === statusCode
  );

  if (!status) {
    notFound();
  }

  const statusProjects = projects
    .filter(
      (project) =>
        Number(project.estados_proyecto?.codigo) === statusCode
    )
    .sort((a, b) => {
      const priorityDifference =
        Number(a.prioridad ?? 999) - Number(b.prioridad ?? 999);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (a.fecha_evento_inicio ?? "9999-12-31").localeCompare(
        b.fecha_evento_inicio ?? "9999-12-31"
      );
    });

  return (
    <main className="p-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <Link
          href="/proyectos"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
        >
          ← Proyectos
        </Link>

        <div className="mt-5 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              {status.nombre}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {statusProjects.length}{" "}
              {statusProjects.length === 1
                ? "proyecto"
                : "proyectos"}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-4">Prioridad</th>
                <th className="px-5 py-4">Proyecto</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Responsable</th>
                <th className="px-5 py-4">Propuesta</th>
                <th className="px-5 py-4">Evento</th>
                <th className="px-5 py-4">Tareas</th>
              </tr>
            </thead>

            <tbody>
              {statusProjects.map((project) => {
                const totalTasks = project.tareas.length;
                const completedTasks = project.tareas.filter(
                  (task) =>
                    task.estados_tarea?.nombre === "Completada"
                ).length;

                return (
                  <tr
                    key={project.id}
                    className="border-b border-zinc-100 text-sm text-zinc-700 last:border-b-0 hover:bg-zinc-50"
                  >
                    <td className="px-5 py-4 font-semibold text-zinc-500">
                      {project.prioridad ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/proyectos/${project.id}`}
                        className="font-semibold text-zinc-950 hover:underline"
                      >
                        {project.nombre}
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      {project.clientes?.nombre ?? "Sin cliente"}
                    </td>

                    <td className="px-5 py-4">
                      {project.tipos_proyecto?.nombre ?? "Sin tipo"}
                    </td>

                    <td className="px-5 py-4">
                      {project.responsable?.nombre ?? "Sin responsable"}
                    </td>

                    <td className="px-5 py-4">
                      {formatDate(project.fecha_propuesta)}
                    </td>

                    <td className="px-5 py-4">
                      {formatDate(project.fecha_evento_inicio)}
                    </td>

                    <td className="px-5 py-4">
                      {completedTasks} / {totalTasks}
                    </td>
                  </tr>
                );
              })}

              {statusProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-14 text-center text-zinc-500"
                  >
                    No hay proyectos en este estado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
