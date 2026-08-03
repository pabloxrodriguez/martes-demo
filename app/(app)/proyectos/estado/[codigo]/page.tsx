import Link from "next/link";
import { notFound } from "next/navigation";

import { EditableStatusProjectsTable } from "@/components/projects/EditableStatusProjectsTable";
import {
  getProjectEditOptions,
  getProjects,
} from "@/lib/services/project.service";
import { getProjectStatusStyle } from "@/lib/project-status-style";

type ProjectStatusPageProps = {
  params: Promise<{
    codigo: string;
  }>;
};

function getCurrentYear() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
  }).format(new Date());
}

function getCommercialDate(
  project: Awaited<ReturnType<typeof getProjects>>[number],
  statusCode: number
) {
  if (statusCode === 6) {
    return project.fecha_propuesta;
  }

  return project.fecha_evento_inicio;
}

function isVisibleInCurrentStatusView(
  project: Awaited<ReturnType<typeof getProjects>>[number],
  statusCode: number,
  currentYear: string
) {
  if (statusCode !== 5 && statusCode !== 6) {
    return true;
  }

  return getCommercialDate(project, statusCode)?.startsWith(currentYear);
}

function sortStatusProjects(
  a: Awaited<ReturnType<typeof getProjects>>[number],
  b: Awaited<ReturnType<typeof getProjects>>[number],
  statusCode: number
) {
  if (statusCode === 5 || statusCode === 6) {
    return (getCommercialDate(b, statusCode) ?? "0000-00-00").localeCompare(
      getCommercialDate(a, statusCode) ?? "0000-00-00"
    );
  }

  const priorityDifference =
    Number(a.prioridad ?? 999) - Number(b.prioridad ?? 999);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return (a.fecha_evento_inicio ?? "9999-12-31").localeCompare(
    b.fecha_evento_inicio ?? "9999-12-31"
  );
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

  const statusStyle = getProjectStatusStyle(statusCode);
  const currentYear = getCurrentYear();
  const statusOptions = editOptions.statuses.map((statusOption) => ({
    value: statusOption.id,
    label: statusOption.nombre,
  }));
  const peopleOptions = editOptions.people.map((person) => ({
    value: person.id,
    label: person.nombre,
  }));
  const typeOptions = editOptions.types.map((type) => ({
    value: type.id,
    label: type.nombre,
  }));

  const statusProjects = projects
    .filter(
      (project) =>
        Number(project.estados_proyecto?.codigo) === statusCode &&
        isVisibleInCurrentStatusView(project, statusCode, currentYear)
    )
    .sort((a, b) => sortStatusProjects(a, b, statusCode));

  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="w-full">
        <Link
          href="/proyectos"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
        >
          ← Proyectos
        </Link>

        <div className="mt-5 flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`h-4 w-4 rounded-full ${statusStyle.dot}`}
                aria-hidden="true"
              />

              <h1 className={`text-3xl font-semibold ${statusStyle.text}`}>
                {status.nombre}
              </h1>
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              {statusProjects.length}{" "}
              {statusProjects.length === 1
                ? "proyecto"
                : "proyectos"}
              {(statusCode === 5 || statusCode === 6) &&
                ` del año ${currentYear}`}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <EditableStatusProjectsTable
            projects={statusProjects}
            statusOptions={statusOptions}
            peopleOptions={peopleOptions}
            typeOptions={typeOptions}
          />
        </div>
      </div>
    </main>
  );
}
