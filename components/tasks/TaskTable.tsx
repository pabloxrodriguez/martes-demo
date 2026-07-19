import { NewTaskRow } from "@/components/tasks/NewTaskRow";
import { TaskCard } from "@/components/tasks/TaskCard";
import {
  EditableTaskField,
  TaskRow,
  TaskRowData,
} from "@/components/tasks/TaskRow";

type SelectOption = {
  value: string;
  label: string;
};

type CreateTaskInput = {
  plantilla_tarea_id: string | null;
  nombre: string;
  responsable_id: string;
  estado_id: string;
  fecha_comprometida: string | null;
  url: string | null;
  comentario: string | null;
};

type TaskTableProps = {
  tasks: TaskRowData[] | null;
  peopleOptions: SelectOption[];
  taskTemplateOptions: SelectOption[];
  taskStatusOptions: SelectOption[];
  defaultTaskStatusId: string;
  onCreate: (input: CreateTaskInput) => Promise<void>;
  onUpdate: (
    taskId: string,
    field: EditableTaskField,
    value: string
  ) => Promise<void>;
  onToggleCompleted: (
    taskId: string,
    completed: boolean
  ) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

function isCompleted(task: TaskRowData) {
  return (
    task.estados_tarea?.nombre === "Completada" ||
    Boolean(task.fecha_completada)
  );
}

function isCancelled(task: TaskRowData) {
  return task.estados_tarea?.nombre === "Cancelada";
}

function getTaskGroup(task: TaskRowData) {
  if (isCancelled(task)) {
    return 3;
  }

  if (isCompleted(task)) {
    return 2;
  }

  if (!task.fecha_comprometida) {
    return 1;
  }

  return 0;
}

export function TaskTable({
  tasks,
  peopleOptions,
  taskTemplateOptions,
  taskStatusOptions,
  defaultTaskStatusId,
  onCreate,
  onUpdate,
  onToggleCompleted,
  onDelete,
}: TaskTableProps) {
  const sortedTasks = [...(tasks ?? [])].sort((a, b) => {
    const groupDifference =
      getTaskGroup(a) - getTaskGroup(b);

    if (groupDifference !== 0) {
      return groupDifference;
    }

    const dateA =
      a.fecha_comprometida ?? "9999-12-31";
    const dateB =
      b.fecha_comprometida ?? "9999-12-31";

    const dateDifference = dateA.localeCompare(dateB);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return a.orden - b.orden;
  });

  return (
  <TaskCard>
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-zinc-950">
          Tareas
        </h2>

        <span className="text-sm text-zinc-500">
          {sortedTasks.length}{" "}
          {sortedTasks.length === 1
            ? "tarea"
            : "tareas"}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-sm font-medium text-zinc-500">
              <th className="w-14 px-4 py-3 text-center">
                ✓
              </th>

              <th className="min-w-64 px-4 py-3">
                Tarea
              </th>

              <th className="min-w-48 px-4 py-3">
                Responsable
              </th>

              <th className="min-w-40 px-4 py-3">
                Compromiso
              </th>

              <th className="min-w-40 px-4 py-3">
                Estado
              </th>

              <th className="min-w-20 px-4 py-3 text-center">
                Enlace
              </th>

              <th className="min-w-72 px-4 py-3">
                Comentario
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                peopleOptions={peopleOptions}
                taskStatusOptions={taskStatusOptions}
                onUpdate={onUpdate}
                onToggleCompleted={onToggleCompleted}
                onDelete={onDelete}
              />
            ))}

            {sortedTasks.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-zinc-500"
                >
                  Este proyecto todavía no tiene tareas.
                </td>
              </tr>
            )}

            <NewTaskRow
              peopleOptions={peopleOptions}
              taskTemplateOptions={taskTemplateOptions}
              taskStatusOptions={taskStatusOptions}
              defaultTaskStatusId={defaultTaskStatusId}
              onCreate={onCreate}
            />
                    </tbody>
        </table>
      </div>
    </section>
  </TaskCard>
);
}