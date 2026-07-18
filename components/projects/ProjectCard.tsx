import Link from "next/link";

type ProjectCardProps = {
  project: {
    id: string;
    nombre: string;
    fecha_propuesta: string | null;
    fecha_evento_inicio: string | null;
    prioridad: string | null;
    clientes: {
      nombre: string;
    } | null;
    tipos_proyecto: {
      nombre: string;
    } | null;
    responsable: {
      nombre: string;
    } | null;
    tareas: {
      estados_tarea: {
        nombre: string;
      } | null;
    }[];
  };
};

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

export function ProjectCard({ project }: ProjectCardProps) {
  const totalTasks = project.tareas.length;

  const completedTasks = project.tareas.filter(
    (task) => task.estados_tarea?.nombre === "Completada"
  ).length;

  const progress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <Link
      href={`/proyectos/${project.id}`}
      className="block min-w-[300px] max-w-[300px] rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-semibold text-zinc-950">
            {project.nombre}
          </h3>

          <p className="mt-1 truncate text-sm text-zinc-500">
            {project.clientes?.nombre ?? "Sin cliente"}
          </p>
        </div>

        {project.prioridad && (
          <span className="shrink-0 text-3xl font-semibold leading-none text-zinc-400">
            {project.prioridad}
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 text-sm text-zinc-600">
        <span className="truncate">
          {project.tipos_proyecto?.nombre ?? "Sin tipo"}
        </span>

        <span className="truncate text-right">
          {project.responsable?.nombre ?? "Sin responsable"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-zinc-600">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Propuesta
          </div>
          <div className="mt-1 font-medium">
            {formatDate(project.fecha_propuesta)}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-400">
            Evento
          </div>
          <div className="mt-1 font-medium">
            {formatDate(project.fecha_evento_inicio)}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Tareas</span>
          <span>
            {completedTasks} / {totalTasks}
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-zinc-900"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}