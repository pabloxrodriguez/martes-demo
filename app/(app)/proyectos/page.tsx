import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { StageSection } from "@/components/projects/StageSection";
import { getCurrentPerson } from "@/lib/auth/getCurrentPerson";
import {
  getProjectEditOptions,
  getProjects,
} from "@/lib/services/project.service";

type ProjectsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function getCurrentYear() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
  }).format(new Date());
}

function getProjectCommercialDate(project: Awaited<ReturnType<typeof getProjects>>[number]) {
  const statusCode = Number(project.estados_proyecto?.codigo);

  if (statusCode === 6) {
    return project.fecha_propuesta;
  }

  return project.fecha_evento_inicio;
}

function shouldShowOnMainProjectsPage(
  project: Awaited<ReturnType<typeof getProjects>>[number],
  currentYear: string
) {
  const statusCode = Number(project.estados_proyecto?.codigo);

  if (statusCode !== 5 && statusCode !== 6) {
    return true;
  }

  return getProjectCommercialDate(project)?.startsWith(currentYear);
}

function sortProjectsForStage(
  a: Awaited<ReturnType<typeof getProjects>>[number],
  b: Awaited<ReturnType<typeof getProjects>>[number]
) {
  const statusCode = Number(a.estados_proyecto?.codigo);

  if (statusCode === 5 || statusCode === 6) {
    return (getProjectCommercialDate(b) ?? "0000-00-00").localeCompare(
      getProjectCommercialDate(a) ?? "0000-00-00"
    );
  }

  const priorityA = Number(a.prioridad ?? 999);
  const priorityB = Number(b.prioridad ?? 999);

  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  const dateA = a.fecha_evento_inicio ?? "9999-12-31";
  const dateB = b.fecha_evento_inicio ?? "9999-12-31";

  return dateA.localeCompare(dateB);
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const normalizedSearch = normalizeSearch(search);
  const currentYear = getCurrentYear();
  const [projects, editOptions, currentPerson] = await Promise.all([
    getProjects(),
    getProjectEditOptions(),
    getCurrentPerson(),
  ]);
  const stages = editOptions.statuses;
  const filteredProjects = normalizedSearch
    ? projects.filter((project) =>
        [
          project.nombre,
          project.clientes?.nombre,
          project.tipos_proyecto?.nombre,
          project.responsable?.nombre,
        ].some(
          (value) =>
            value &&
            normalizeSearch(value).includes(normalizedSearch)
        )
      )
    : projects;
  const visibleProjects = filteredProjects.filter((project) =>
    shouldShowOnMainProjectsPage(project, currentYear)
  );

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
      (status) => status.nombre === "Prospecto"
    ) ?? editOptions.statuses[0];

  return (
    <>
      <AppHeader
        key={search}
        peopleOptions={peopleOptions}
        statusOptions={statusOptions}
        defaultStatusId={prospectStatus?.id ?? ""}
        initialSearch={search}
        canCreateProjects={currentPerson?.rol !== "lector"}
      />

      <main className="p-8">
        <div className="space-y-10">
          {stages.map((stage) => {
            const stageProjects = visibleProjects
              .filter(
                (project) =>
                  Number(project.estados_proyecto?.codigo) ===
                  stage.codigo
              )
              .sort(sortProjectsForStage);

            return (
              <StageSection
                key={stage.id}
                title={stage.nombre}
                count={stageProjects.length}
                viewAllHref={`/proyectos/estado/${stage.codigo}`}
                statusCode={Number(stage.codigo)}
              >
                {stageProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                  />
                ))}
              </StageSection>
            );
          })}
        </div>
      </main>
    </>
  );
}
