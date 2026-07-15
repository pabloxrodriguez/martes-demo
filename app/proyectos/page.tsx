import { getProjects } from "@/lib/services/project.service";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-4xl font-bold">Proyectos</h1>

      <p className="mt-2 text-zinc-600">
        {projects.length} proyectos
      </p>

      <ul className="mt-8 space-y-4">
        {projects.map((project) => (
          <li
            key={project.id}
            className="rounded-lg border border-zinc-200 p-4"
          >
            <h2 className="text-lg font-semibold">{project.nombre}</h2>

            <p className="mt-1 text-sm text-zinc-600">
              {project.tipos_proyecto?.nombre ?? "Sin tipo"}
              {" · "}
              {project.estados_proyecto?.nombre ?? "Sin estado"}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}