"use client";

import Link from "next/link";
import { useState } from "react";

import {
  deleteMyTask,
  toggleMyTaskCompleted,
  updateMyTaskField,
} from "@/app/(app)/mi-martes/actions";
import {
  EditableCell,
  EditableSelectCell,
  type EditableTaskField,
} from "@/components/tasks/TaskRow";
import type { MyOpenTaskItem } from "@/lib/services/project.service";

type SelectOption = {
  value: string;
  label: string;
};

type MyTasksPanelProps = {
  tasks: MyOpenTaskItem[];
  taskStatusOptions: SelectOption[];
  peopleOptions: SelectOption[];
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function MyTasksPanel({
  tasks,
  taskStatusOptions,
  peopleOptions,
}: MyTasksPanelProps) {
  const [rowError, setRowError] = useState<string | null>(null);

  async function saveTaskField(
    taskId: string,
    field: EditableTaskField,
    value: string
  ) {
    setRowError(null);
    await updateMyTaskField(taskId, field, value);
  }

  async function toggleCompleted(
    taskId: string,
    completed: boolean
  ) {
    try {
      setRowError(null);
      await toggleMyTaskCompleted(taskId, completed);
    } catch (error) {
      setRowError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado de la tarea."
      );
    }
  }

  async function deleteTask(task: MyOpenTaskItem) {
    const confirmed = window.confirm(
      `¿Quitar la tarea “${task.nombre}”?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRowError(null);
      await deleteMyTask(task.id);
    } catch (error) {
      setRowError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la tarea."
      );
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Mis tareas
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Edita responsable, compromiso, estado, enlace y comentario
            sin salir de esta vista.
          </p>
        </div>

        <span className="text-sm text-zinc-500">
          {tasks.length} abiertas
        </span>
      </div>

      {rowError && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
          {rowError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] table-fixed border-collapse text-left">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="w-14 px-4 py-3 text-center">✓</th>
              <th className="w-56 px-4 py-3">Tarea</th>
              <th className="w-48 px-4 py-3">Proyecto</th>
              <th className="w-44 px-4 py-3">Responsable</th>
              <th className="w-36 px-4 py-3">Compromiso</th>
              <th className="w-40 px-4 py-3">Estado</th>
              <th className="w-44 px-4 py-3">Enlace</th>
              <th className="px-4 py-3">Comentario</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const completed =
                task.estados_tarea?.nombre === "Completada" ||
                Boolean(task.fecha_completada);

              return (
                <tr
                  key={task.id}
                  className="border-b border-zinc-100 align-top text-sm text-zinc-800 last:border-b-0 hover:bg-zinc-50"
                >
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        void toggleCompleted(task.id, !completed)
                      }
                      className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs transition ${
                        completed
                          ? "border-zinc-800 bg-zinc-800 text-white"
                          : "border-zinc-300 bg-white text-transparent hover:border-zinc-500"
                      }`}
                      title={
                        completed
                          ? "Marcar como pendiente"
                          : "Marcar como completada"
                      }
                    >
                      ✓
                    </button>
                  </td>

                  <td className="px-2 py-3">
                    <EditableCell
                      value={task.nombre}
                      placeholder="Sin nombre"
                      multiline
                      onSave={(value) =>
                        saveTaskField(task.id, "nombre", value)
                      }
                    />
                  </td>

                  <td className="px-4 py-4">
                    {task.proyectos ? (
                      <>
                        <Link
                          href={`/proyectos/${task.proyectos.id}`}
                          className="line-clamp-2 font-semibold text-zinc-950 hover:underline"
                        >
                          {task.proyectos.nombre}
                        </Link>

                        <div className="mt-1 text-xs text-zinc-500">
                          {task.proyectos.clientes?.nombre ??
                            "Sin cliente"}
                        </div>
                      </>
                    ) : (
                      "Sin proyecto"
                    )}
                  </td>

                  <td className="px-2 py-3">
                    <EditableSelectCell
                      value={task.responsable?.id ?? null}
                      options={peopleOptions}
                      placeholder="Sin responsable"
                      required
                      onSave={(value) =>
                        saveTaskField(
                          task.id,
                          "responsable_id",
                          value
                        )
                      }
                    />
                  </td>

                  <td className="px-2 py-3">
                    <EditableCell
                      value={task.fecha_comprometida}
                      displayValue={formatDate(task.fecha_comprometida)}
                      placeholder="Sin fecha"
                      type="date"
                      onSave={(value) =>
                        saveTaskField(
                          task.id,
                          "fecha_comprometida",
                          value
                        )
                      }
                    />
                  </td>

                  <td className="px-2 py-3">
                    <EditableSelectCell
                      value={task.estados_tarea?.id ?? null}
                      options={taskStatusOptions}
                      placeholder="Sin estado"
                      required
                      onSave={(value) =>
                        saveTaskField(task.id, "estado_id", value)
                      }
                    />
                  </td>

                  <td className="px-2 py-3">
                    <div className="flex items-start gap-1">
                      {task.url && (
                        <a
                          href={task.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition hover:bg-zinc-100"
                          title="Abrir enlace"
                        >
                          🔗
                        </a>
                      )}

                      <div className="w-32">
                        <EditableCell
                          value={task.url}
                          placeholder="Sin enlace"
                          type="url"
                          onSave={(value) =>
                            saveTaskField(task.id, "url", value)
                          }
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-64 flex-1">
                        <EditableCell
                          value={task.comentario}
                          placeholder="Sin comentario"
                          multiline
                          onSave={(value) =>
                            saveTaskField(
                              task.id,
                              "comentario",
                              value
                            )
                          }
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => void deleteTask(task)}
                        className="rounded-md px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600"
                        title="Eliminar tarea"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {tasks.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-zinc-500"
                >
                  No tienes tareas abiertas asignadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
