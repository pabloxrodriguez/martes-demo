import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { StageSection } from "@/components/projects/StageSection";
import { getProjects } from "@/lib/services/project.service";

const stages = [
  { codigo: 1, nombre: "Prospecto" },
  { codigo: 2, nombre: "En preparación" },
  { codigo: 3, nombre: "Evaluación de cliente" },
  { codigo: 4, nombre: "En ejecución" },
  { codigo: 5, nombre: "Realizado" },
  { codigo: 6, nombre: "No ganado" },
  { codigo: 7, nombre: "No olvidar" },
];

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <AppHeader />

      <main className="p-8">
        <div className="space-y-10">
          {stages.map((stage) => {
            const stageProjects = projects
              .filter(
                (project) =>
                  Number(project.estados_proyecto?.codigo) === stage.codigo
              )
              .sort((a, b) => {
                const priorityA = Number(a.prioridad ?? 999);
                const priorityB = Number(b.prioridad ?? 999);

                if (priorityA !== priorityB) {
                  return priorityA - priorityB;
                }

                const dateA =
                  a.fecha_evento_inicio ?? "9999-12-31";
                const dateB =
                  b.fecha_evento_inicio ?? "9999-12-31";

                return dateA.localeCompare(dateB);
              });

            return (
              <StageSection
                key={stage.codigo}
                title={stage.nombre}
                count={stageProjects.length}
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