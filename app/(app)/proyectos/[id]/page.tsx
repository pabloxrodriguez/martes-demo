import { EditableField } from "@/components/forms/EditableField";
import { SearchSelect } from "@/components/forms/SearchSelect";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { TaskTable } from "@/components/tasks/TaskTable";
import {
  getProjectById,
  getProjectEditOptions,
} from "@/lib/services/project.service";
import {
  addProjectVenue,
  createProjectTask,
  createProjectVenue,
  deleteProjectTask,
  removeProjectVenue,
  toggleTaskCompleted,
  updateProjectField,
  updateTaskField,
} from "./actions";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { id } = await params;

  const project = await getProjectById(id);
  const editOptions = await getProjectEditOptions();

  const priorityOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
  ];

  const statusOptions = editOptions.statuses.map((status) => ({
    value: status.id,
    label: status.nombre,
  }));

  const typeOptions = editOptions.types.map((type) => ({
    value: type.id,
    label: type.nombre,
  }));

  const peopleOptions = editOptions.people.map((person) => ({
    value: person.id,
    label: person.nombre,
  }));

  const clientOptions = editOptions.clients.map((client) => ({
    value: client.id,
    label: client.nombre,
  }));

  const taskTemplateOptions = editOptions.taskTemplates.map(
    (template) => ({
      value: template.id,
      label: template.nombre,
    })
  );

  const taskStatusOptions = editOptions.taskStatuses.map(
    (status) => ({
      value: status.id,
      label: status.nombre,
    })
  );

  const defaultTaskStatusId =
    taskStatusOptions.find(
      (status) => status.label.toLowerCase() === "pendiente"
    )?.value ?? taskStatusOptions[0]?.value ?? "";

  const associatedVenueIds = new Set(
    project.proyecto_venues?.map((item) => item.venue_id) ?? []
  );

  const venueOptions = editOptions.venues
    .filter((venue) => !associatedVenueIds.has(venue.id))
    .map((venue) => ({
      value: venue.id,
      label: venue.nombre,
    }));

  const saveField = (
    field:
      | "nombre"
      | "prioridad"
      | "estado_id"
      | "tipo_id"
      | "responsable_id"
      | "cliente_id"
      | "fecha_propuesta"
      | "fecha_evento_inicio"
      | "fecha_evento_termino"
      | "publico_esperado"
      | "valor_venta"
      | "notas"
  ) => updateProjectField.bind(null, project.id, field);

  const saveVenue = addProjectVenue.bind(null, project.id);
  const createVenue = createProjectVenue.bind(null, project.id);
  const removeVenue = removeProjectVenue.bind(null, project.id);
  const createTask = createProjectTask.bind(null, project.id);
  const updateTask = updateTaskField.bind(null, project.id);
  const toggleCompleted = toggleTaskCompleted.bind(
    null,
    project.id
  );
  const deleteTask = deleteProjectTask.bind(null, project.id);

  return (
    <>
      <ProjectHeader
        project={project}
        statusOptions={statusOptions}
        typeOptions={typeOptions}
        clientOptions={clientOptions}
        peopleOptions={peopleOptions}
        priorityOptions={priorityOptions}
        onSaveName={saveField("nombre")}
        onSaveStatus={saveField("estado_id")}
        onSaveType={saveField("tipo_id")}
        onSaveClient={saveField("cliente_id")}
        onSaveResponsible={saveField("responsable_id")}
        onSaveAmount={saveField("valor_venta")}
        onSavePriority={saveField("prioridad")}
        onSaveProposalDate={saveField("fecha_propuesta")}
        onSaveEventStart={saveField("fecha_evento_inicio")}
        onSaveEventEnd={saveField("fecha_evento_termino")}
      />

      <main>
        <div className="mx-auto w-full max-w-screen-2xl px-5 py-10 sm:px-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Detalles
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
  <div>
    <EditableField
      label="Público esperado"
      value={project.publico_esperado}
      type="number"
      placeholder="Sin público esperado"
      onSave={saveField("publico_esperado")}
    />
  </div>

  <div>
    <EditableField
      label="Notas"
      value={project.notas}
      type="textarea"
      placeholder="Sin notas"
      onSave={saveField("notas")}
    />
  </div>

  <div>
    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
      Venues
    </h3>

    {project.proyecto_venues?.length ? (
      <div className="mt-3 space-y-3">
        {project.proyecto_venues.map((item) => (
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

            <form
              action={removeVenue.bind(
                null,
                item.venue_id
              )}
            >
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
        onSave={saveVenue}
        onCreate={createVenue}
      />
    </div>
  </div>
</div>
          </section>

          <TaskTable
            tasks={project.tareas}
            peopleOptions={peopleOptions}
            taskTemplateOptions={taskTemplateOptions}
            taskStatusOptions={taskStatusOptions}
            defaultTaskStatusId={defaultTaskStatusId}
            onCreate={createTask}
            onUpdate={updateTask}
            onToggleCompleted={toggleCompleted}
            onDelete={deleteTask}
          />
        </div>
      </main>
    </>
  );
}