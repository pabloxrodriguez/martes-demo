import { EditableField } from "@/components/forms/EditableField";
import { SearchSelect } from "@/components/forms/SearchSelect";
import { ProjectDetailsCard } from "./ProjectDetailsCard";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { DuplicateProjectButton } from "./DuplicateProjectButton";
import { ProjectVenueEditor } from "./ProjectVenueEditor";

type Option = {
  value: string;
  label: string;
};

type VenueItem = {
  venue_id: string;
  venues?: {
    id?: string | null;
    nombre?: string | null;
    direccion?: string | null;
    comuna?: string | null;
    ciudad?: string | null;
    capacidad?: number | null;
    contacto_nombre?: string | null;
    contacto_correo?: string | null;
    contacto_celular?: string | null;
  } | null;
};

type SaveResult =
  | void
  | {
      success: boolean;
      error: string | null;
    };

type ProjectDetailsProps = {
  publicoEsperado: number | null;
  notas: string | null;
  venues: VenueItem[];
  venueOptions: Option[];
  onSaveAudience: (value: string) => Promise<SaveResult>;
  onSaveNotes: (value: string) => Promise<SaveResult>;
  onSaveVenue: (value: string) => Promise<void>;
  onCreateVenue: (value: string) => Promise<void>;
  onUpdateVenue: (venueId: string, input: unknown) => Promise<void>;
  onRemoveVenue: (venueId: string) => Promise<void>;
  onDuplicateProject: () => Promise<void>;
  onDeleteProject: () => Promise<
    | void
    | {
        success: false;
        error: string | null;
      }
  >;
};


export function ProjectDetails({
  publicoEsperado,
  notas,
  venues,
  venueOptions,
  onSaveAudience,
  onSaveNotes,
  onSaveVenue,
  onCreateVenue,
  onUpdateVenue,
  onRemoveVenue,
  onDuplicateProject,
  onDeleteProject,
}: ProjectDetailsProps) {
  return (
    <ProjectDetailsCard>
      <section>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Detalles del proyecto
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <EditableField
              label="Público esperado"
              value={publicoEsperado}
              type="number"
              placeholder="Sin público esperado"
              onSave={onSaveAudience}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <DuplicateProjectButton onDuplicate={onDuplicateProject} />
              <DeleteProjectButton onDelete={onDeleteProject} />
            </div>
          </div>

          <div>
            <EditableField
              label="Notas"
              value={notas}
              type="textarea"
              placeholder="Sin notas"
              onSave={onSaveNotes}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Venues
            </h3>

            {venues.length ? (
              <div className="mt-3 space-y-3">
                {venues.map((item) => (
                  <ProjectVenueEditor
                    key={item.venue_id}
                    venueId={item.venue_id}
                    venue={item.venues}
                    onUpdateVenue={onUpdateVenue}
                    onRemoveVenue={onRemoveVenue}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-zinc-400">
                Sin venues asociados.
              </p>
            )}

            <div className="mt-4">
              <SearchSelect
                label="Agregar venue"
                value={null}
                options={venueOptions}
                placeholder="Seleccionar venue"
                required
                onSave={onSaveVenue}
                onCreate={onCreateVenue}
              />
            </div>
          </div>
        </div>
      </section>
    </ProjectDetailsCard>
  );
}
