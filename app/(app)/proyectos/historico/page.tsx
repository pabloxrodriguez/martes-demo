import Link from "next/link";

import { EditableStatusProjectsTable } from "@/components/projects/EditableStatusProjectsTable";
import { getProjectStatusStyle } from "@/lib/project-status-style";
import {
  getProjectEditOptions,
  getProjects,
} from "@/lib/services/project.service";

type ProjectItem = Awaited<ReturnType<typeof getProjects>>[number];
type PageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

const HISTORIC_STATUS_CODES = [5, 6];

function getCurrentYear() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
  }).format(new Date());
}

function getCommercialDate(project: ProjectItem) {
  const statusCode = Number(project.estados_proyecto?.codigo);

  if (statusCode === 6) {
    return project.fecha_propuesta;
  }

  return project.fecha_evento_inicio;
}

function isHistoricProject(project: ProjectItem, currentYear: string) {
  const statusCode = Number(project.estados_proyecto?.codigo);

  return (
    HISTORIC_STATUS_CODES.includes(statusCode) &&
    !getCommercialDate(project)?.startsWith(currentYear)
  );
}

function sortHistoricProjects(a: ProjectItem, b: ProjectItem) {
  return (getCommercialDate(b) ?? "0000-00-00").localeCompare(
    getCommercialDate(a) ?? "0000-00-00"
  );
}

function getSearchText(project: ProjectItem) {
  return [
    project.nombre,
    project.clientes?.nombre,
    project.responsable?.nombre,
    project.tipos_proyecto?.nombre,
    project.estados_proyecto?.nombre,
    project.fecha_propuesta,
    project.fecha_evento_inicio,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("es");
}

export default async function ProjectHistoryPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const searchQuery =
    typeof params?.q === "string" ? params.q.trim() : "";
  const normalizedSearchQuery = searchQuery.toLocaleLowerCase("es");
  const currentYear = getCurrentYear();
  const [projects, editOptions] = await Promise.all([
    getProjects(),
    getProjectEditOptions(),
  ]);
  const statusOptions = editOptions.statuses.map((status) => ({
    value: status.id,
    label: status.nombre,
  }));
  const peopleOptions = editOptions.people.map((person) => ({
    value: person.id,
    label: person.nombre,
  }));
  const typeOptions = editOptions.types.map((type) => ({
    value: type.id,
    label: type.nombre,
  }));
  const historicProjects = projects
    .filter((project) => isHistoricProject(project, currentYear))
    .filter((project) =>
      normalizedSearchQuery
        ? getSearchText(project).includes(normalizedSearchQuery)
        : true
    )
    .sort(sortHistoricProjects);

  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="w-full">
        <Link
          href="/proyectos"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
        >
          ← Proyectos
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              Histórico de proyectos
            </h1>

            <p className="mt-2 max-w-4xl text-sm text-zinc-500">
              Realizados y No ganados fuera del año {currentYear}. La vista
              principal de Proyectos mantiene solo los cerrados del año en
              curso para evitar ruido operativo.
            </p>
          </div>

          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
            {historicProjects.length} proyecto
            {historicProjects.length === 1 ? "" : "s"}
          </span>
        </div>

        <form
          action="/proyectos/historico"
          role="search"
          className="mt-6 flex flex-wrap items-center gap-3"
        >
          <input
            type="search"
            name="q"
            defaultValue={searchQuery}
            placeholder="Buscar proyecto, cliente o responsable"
            className="h-11 min-w-72 rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-500"
          />

          <button
            type="submit"
            className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Buscar
          </button>

          {searchQuery ? (
            <Link
              href="/proyectos/historico"
              className="h-11 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Limpiar
            </Link>
          ) : null}
        </form>

        <div className="mt-8 space-y-12">
          {HISTORIC_STATUS_CODES.map((statusCode) => {
            const status = editOptions.statuses.find(
              (item) => Number(item.codigo) === statusCode
            );
            const statusStyle = getProjectStatusStyle(statusCode);
            const statusProjects = historicProjects.filter(
              (project) =>
                Number(project.estados_proyecto?.codigo) === statusCode
            );

            return (
              <section key={statusCode}>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={`h-4 w-4 rounded-full ${statusStyle.dot}`}
                    aria-hidden="true"
                  />

                  <h2
                    className={`text-2xl font-semibold ${statusStyle.text}`}
                  >
                    {status?.nombre ?? `Estado ${statusCode}`}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-sm ${statusStyle.badge}`}
                  >
                    {statusProjects.length}
                  </span>
                </div>

                <EditableStatusProjectsTable
                  projects={statusProjects}
                  statusOptions={statusOptions}
                  peopleOptions={peopleOptions}
                  typeOptions={typeOptions}
                />
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
