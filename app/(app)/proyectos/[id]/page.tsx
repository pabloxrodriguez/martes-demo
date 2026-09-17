import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectBudgets } from "@/components/projects/ProjectBudgets";
import { ProjectBudgetEditor } from "@/components/projects/ProjectBudgetEditor";
import { TaskTable } from "@/components/tasks/TaskTable";
import { ProjectDetails } from "@/components/projects/ProjectDetails";
import { getCurrentPerson } from "@/lib/auth/getCurrentPerson";
import { todayInSantiago } from "@/lib/tasks/today";
import {
  canEditProjectBudget,
  canManageProjectBudgetAccess,
  canViewProjectBudgets,
} from "@/lib/auth/projectBudgetAccess";
import {
  getProjectById,
  getProjectEditOptions,
} from "@/lib/services/project.service";
import {
  addProjectVenue,
  addProjectBudgetAccess,
  createProjectTask,
  createProjectVenue,
  deleteProject,
  deleteProjectTask,
  duplicateProject,
  removeProjectVenue,
  updateProjectVenue,
  removeProjectBudgetAccess,
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

  const [project, editOptions, currentPerson] = await Promise.all([
    getProjectById(id),
    getProjectEditOptions(),
    getCurrentPerson(),
  ]);

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
  const updateVenue = updateProjectVenue.bind(null, project.id);
  const createTask = createProjectTask.bind(null, project.id);
  const updateTask = updateTaskField.bind(null, project.id);
  const toggleCompleted = toggleTaskCompleted.bind(
    null,
    project.id
  );
  const deleteTask = deleteProjectTask.bind(null, project.id);
  const duplicateCurrentProject = duplicateProject.bind(null, project.id);
  const deleteCurrentProject = deleteProject.bind(null, project.id);
  const addBudgetAccess = addProjectBudgetAccess.bind(null, project.id);
  const removeBudgetAccess = removeProjectBudgetAccess.bind(null, project.id);
  const budgetAccessPersonIds =
    project.proyecto_presupuesto_accesos?.map(
      (access) => access.persona_id
    ) ?? [];
  const canViewBudgets = canViewProjectBudgets({
    person: currentPerson,
    projectResponsibleId: project.responsable?.id ?? null,
    explicitAccessPersonIds: budgetAccessPersonIds,
  });
  const canEditBudget = canEditProjectBudget(currentPerson);
  const canManageBudgetAccess = canManageProjectBudgetAccess({
    person: currentPerson,
    projectResponsibleId: project.responsable?.id ?? null,
  });
  const projectBudgets = project.proyecto_presupuestos ?? [];
  const draftBudget = projectBudgets.find(
    (budget) =>
      budget.origen === "martes" &&
      budget.estado_registro === "borrador"
  );
  const existingBudgets = projectBudgets.filter(
    (budget) => budget.estado_registro === "oficial"
  );
  const budgetAccessPeopleOptions = editOptions.people
    .filter((person) => person.id !== project.responsable?.id)
    .map((person) => ({
      value: person.id,
      label: person.nombre,
    }));

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
          <TaskTable
            tasks={project.tareas}
            currentPersonId={currentPerson!.id}
            today={todayInSantiago()}
            peopleOptions={peopleOptions}
            taskTemplateOptions={taskTemplateOptions}
            onCreate={createTask}
            onUpdate={updateTask}
            onToggleCompleted={toggleCompleted}
            onDelete={deleteTask}
          />

          <ProjectDetails
            publicoEsperado={project.publico_esperado}
            notas={project.notas}
            venues={project.proyecto_venues ?? []}
            venueOptions={venueOptions}
            onSaveAudience={saveField("publico_esperado")}
            onSaveNotes={saveField("notas")}
            onSaveVenue={saveVenue}
            onCreateVenue={createVenue}
            onUpdateVenue={updateVenue}
            onRemoveVenue={removeVenue}
            onDuplicateProject={duplicateCurrentProject}
            onDeleteProject={deleteCurrentProject}
          />

          {canViewBudgets || canEditBudget ? (
            <ProjectBudgets
              budgets={existingBudgets}
              accessList={project.proyecto_presupuesto_accesos ?? []}
              peopleOptions={budgetAccessPeopleOptions}
              onAddAccess={addBudgetAccess}
              onRemoveAccess={removeBudgetAccess}
              canManageAccess={canManageBudgetAccess}
              editor={
                canEditBudget ? (
                  <ProjectBudgetEditor
                    project={{ id: project.id, nombre: project.nombre }}
                    initialDraft={
                      draftBudget
                        ? {
                            id: draftBudget.id,
                            lines:
                              draftBudget.proyecto_presupuesto_lineas.map(
                                (line) => ({
                                  id: line.id,
                                  categoria: line.categoria ?? "Catering",
                                  concepto: line.concepto ?? "",
                                  cantidad: line.cantidad ?? 1,
                                  veces: line.veces ?? 1,
                                  unitario: line.unitario ?? 0,
                                  operacion:
                                    line.operacion ?? "Compra Afecta",
                                  notas: line.notas ?? "",
                                })
                              ),
                          }
                        : null
                    }
                  />
                ) : null
              }
            />
          ) : null}
        </div>
      </main>
    </>
  );
}
