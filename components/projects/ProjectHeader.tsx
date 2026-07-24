import { HeaderField } from "@/components/project-header/HeaderField";
import { HeaderSearchSelect } from "@/components/project-header/HeaderSearchSelect";
import { ProjectHeaderCard } from "@/components/projects/ProjectHeaderCard";
import Link from "next/link";
import {
  Building2,
  BriefcaseBusiness,
  Calendar,
  CalendarDays,
  CalendarRange,
  CircleAlert,
  Clock3,
  MapPin,
  User,
  Wallet,
} from "lucide-react";

type SelectOption = {
  value: string;
  label: string;
};

type Venue = {
  id: string;
  nombre: string;
};

type ProjectVenue = {
  venue_id: string;
  venues: Venue | null;
};

type SaveAction = (newValue: string) => Promise<void>;

type ProjectHeaderProps = {
  project: {
    nombre: string;
    prioridad: string | number | null;
    fecha_propuesta: string | null;
    fecha_evento_inicio: string | null;
    fecha_evento_termino: string | null;
    fecha_actualizacion: string | null;
    valor_venta: string | number | null;

    estados_proyecto: {
      id: string;
      codigo: string | number;
      nombre: string;
    } | null;

    tipos_proyecto: {
      id: string;
      nombre: string;
    } | null;

    clientes: {
      id: string;
      nombre: string;
    } | null;

    responsable: {
      id: string;
      nombre: string;
    } | null;

    proyecto_venues: ProjectVenue[] | null;
  };

  statusOptions: SelectOption[];
  typeOptions: SelectOption[];
  clientOptions: SelectOption[];
  peopleOptions: SelectOption[];
  priorityOptions: SelectOption[];

  onSaveName: SaveAction;
  onSaveStatus: SaveAction;
  onSaveType: SaveAction;
  onSaveClient: SaveAction;
  onSaveResponsible: SaveAction;
  onSaveAmount: SaveAction;
  onSavePriority: SaveAction;
  onSaveProposalDate: SaveAction;
  onSaveEventStart: SaveAction;
  onSaveEventEnd: SaveAction;
};

const statusStyles: Record<
  number,
  {
    dot: string;
    text: string;
  }
> = {
  1: {
    dot: "bg-amber-400",
    text: "text-amber-800",
  },
  2: {
    dot: "bg-blue-500",
    text: "text-blue-800",
  },
  3: {
    dot: "bg-violet-500",
    text: "text-violet-800",
  },
  4: {
    dot: "bg-emerald-500",
    text: "text-emerald-800",
  },
  5: {
    dot: "bg-zinc-700",
    text: "text-zinc-800",
  },
  6: {
    dot: "bg-red-500",
    text: "text-red-800",
  },
  7: {
    dot: "bg-amber-800",
    text: "text-amber-950",
  },
};

function formatVenues(
  projectVenues: ProjectVenue[] | null
) {
  const names =
    projectVenues
      ?.map((item) => item.venues?.nombre)
      .filter(
        (name): name is string => Boolean(name)
      ) ?? [];

  if (names.length === 0) {
    return "Sin venue";
  }

  if (names.length === 1) {
    return names[0];
  }

  return `${names[0]} (+${names.length - 1})`;
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Sin actualización";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  }).format(new Date(value));
}

export function ProjectHeader({
  project,
  statusOptions,
  typeOptions,
  clientOptions,
  peopleOptions,
  priorityOptions,
  onSaveName,
  onSaveStatus,
  onSaveType,
  onSaveClient,
  onSaveResponsible,
  onSaveAmount,
  onSavePriority,
  onSaveProposalDate,
  onSaveEventStart,
  onSaveEventEnd,
}: ProjectHeaderProps) {
  const statusCode =
    Number(project.estados_proyecto?.codigo) || 1;

  const statusStyle =
    statusStyles[statusCode] ?? statusStyles[1];

  return (
    <ProjectHeaderCard>
    <header className="bg-white px-5 pb-8 pt-6 sm:px-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <Link
          href="/proyectos"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
        >
          ← Proyectos
        </Link>

        <div className="mt-6">
          <div className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            <HeaderField
              value={project.nombre}
              type="text"
              placeholder="Proyecto sin nombre"
              onSave={onSaveName}
              className="font-semibold tracking-tight"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-5 text-xl text-zinc-700">
            <span
              className={`inline-flex items-center gap-1 font-semibold ${statusStyle.text}`}
            >
              <span
                className={`h-3 w-3 rounded-full ${statusStyle.dot}`}
              />

              <HeaderField
                value={
                  project.estados_proyecto?.id ?? null
                }
                type="select"
                options={statusOptions}
                placeholder="Sin estado"
                onSave={onSaveStatus}
                className="font-semibold"
              />
            </span>

            <HeaderField
              value={
                project.tipos_proyecto?.id ?? null
              }
              type="select"
              options={typeOptions}
              icon={<BriefcaseBusiness size={18} />}
              placeholder="Sin tipo"
              onSave={onSaveType}
            />

            <HeaderSearchSelect
              value={project.clientes?.id ?? null}
              options={clientOptions}
              icon={<Building2 size={18} />}
              placeholder="Sin cliente"
              onSave={onSaveClient}
            />

            <span
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5"
              title="Los venues se editan en Detalles"
            >
              <MapPin size={18} aria-hidden="true" />

              <span>
                {formatVenues(
                  project.proyecto_venues
                )}
              </span>
            </span>

            <HeaderSearchSelect
              value={project.responsable?.id ?? null}
              options={peopleOptions}
              icon={<User size={18} />}
              placeholder="Sin responsable"
              required
              onSave={onSaveResponsible}
            />

            <HeaderField
              value={project.valor_venta}
              type="currency"
              icon={<Wallet size={18} />}
              placeholder="Sin monto"
              onSave={onSaveAmount}
              className="font-semibold text-zinc-900"
            />

            <HeaderField
              value={project.prioridad}
              type="select"
              options={priorityOptions}
              icon={<CircleAlert size={18} />}
              prefix="Prioridad"
              placeholder="Sin prioridad"
              onSave={onSavePriority}
              className="font-semibold text-zinc-900"
            />

            <span className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-zinc-500">
              <Clock3 size={18} aria-hidden="true" />

              <span>
                Actualizado{" "}
                {formatUpdatedAt(
                  project.fecha_actualizacion
                )}
              </span>
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-zinc-100 pt-5 text-xl text-zinc-700">
            <HeaderField
              value={project.fecha_propuesta}
              type="date"
              icon={<Calendar size={18} />}
              prefix="Propuesta:"
              placeholder="Sin fecha"
              onSave={onSaveProposalDate}
              className="font-semibold text-zinc-950"
            />

            <HeaderField
              value={project.fecha_evento_inicio}
              type="date"
              icon={<CalendarDays size={18} />}
              prefix="Inicio:"
              placeholder="Sin fecha"
              onSave={onSaveEventStart}
              className="font-semibold text-zinc-950"
            />

            <HeaderField
              value={project.fecha_evento_termino}
              type="date"
              icon={<CalendarRange size={18} />}
              prefix="Término:"
              placeholder="Misma fecha de inicio"
              onSave={onSaveEventEnd}
              className="font-semibold text-zinc-950"
            />
          </div>
        </div>
      </div>
    </header>
    </ProjectHeaderCard>
  );
}
