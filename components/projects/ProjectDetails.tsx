import { EditableField } from "@/components/forms/EditableField";
import { SearchSelect } from "@/components/forms/SearchSelect";
import { ProjectDetailsCard } from "./ProjectDetailsCard";
import { DeleteProjectButton } from "./DeleteProjectButton";

type Option = {
  value: string;
  label: string;
};

type VenueItem = {
  venue_id: string;
  venues?: {
    nombre?: string | null;
    comuna?: string | null;
    ciudad?: string | null;
  } | null;
};

type ProjectDetailsProps = {
  publicoEsperado: number | null;
  notas: string | null;
  venues: VenueItem[];
  venueOptions: Option[];
  onSaveAudience: (value: string) => Promise<void>;
  onSaveNotes: (value: string) => Promise<void>;
  onSaveVenue: (value: string) => Promise<void>;
  onCreateVenue: (value: string) => Promise<void>;
  onRemoveVenue: (venueId: string) => Promise<void>;
  onDeleteProject: () => Promise<void>;
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
  onRemoveVenue,
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
            <div className="mt-6">
    <div className="mt-6">
  <DeleteProjectButton onDelete={onDeleteProject} />
</div>
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
                  <div
                    key={item.venue_id}
                    className="flex items-start justify-between rounded-xl border border-zinc-200 bg-white p-4"
                  >
                    <div>
                      <div className="font-medium text-zinc-950">
                        {item.venues?.nombre ?? "Venue sin nombre"}
                      </div>

                      <div className="mt-1 text-sm text-zinc-500">
                        {[item.venues?.comuna, item.venues?.ciudad]
                          .filter(Boolean)
                          .join(", ") || "Sin ubicación"}
                      </div>

                      <div className="mt-2 text-xs text-zinc-400">
                        Contacto: —
                      </div>
                    </div>

                    <form action={onRemoveVenue.bind(null, item.venue_id)}>
                      <button
                        type="submit"
                        className="rounded-md px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600"
                        title="Quitar del proyecto"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
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
