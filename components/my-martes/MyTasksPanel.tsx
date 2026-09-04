"use client";

import Link from "next/link";
import { useState } from "react";

import {
  deleteMyTask,
  toggleMyTaskCompleted,
  updateMyTaskField,
} from "@/app/(app)/mi-martes/actions";
import {
  CommitmentStatusBadge,
  EditableCell,
  EditableSelectCell,
  type EditableTaskField,
} from "@/components/tasks/TaskRow";
import type { MyOpenTaskItem } from "@/lib/services/project.service";
import { getCommitmentStatus } from "@/lib/tasks/commitment-status";

type SelectOption = {
  value: string;
  label: string;
};

type MyTasksPanelProps = {
  tasks: MyOpenTaskItem[];
  peopleOptions: SelectOption[];
  currentPersonId: string;
  today: string;
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
  peopleOptions,
  currentPersonId,
  today,
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
          : "No se pudo cambiar el estado del compromiso."
      );
    }
  }

  async function deleteTask(task: MyOpenTaskItem) {
    const confirmed = window.confirm(
      `¿Eliminar el compromiso “${task.nombre}”?`
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
          : "No se pudo eliminar el compromiso."
      );
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Mis compromisos
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Los estados cambian automáticamente según la fecha. Solo quien
            creó un compromiso puede modificarlo.
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
              <th className="w-56 px-4 py-3">Compromiso</th>
              <th className="w-48 px-4 py-3">Proyecto</th>
              <th className="w-44 px-4 py-3">Responsable</th>
              <th className="w-36 px-4 py-3">Fecha límite</th>
              <th className="w-40 px-4 py-3">Estado</th>
              <th className="w-44 px-4 py-3">Enlace</th>
              <th className="px-4 py-3">Comentario</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const status = getCommitmentStatus(task, today);
              const completed = status === "completed";
              const canEdit = task.creada_por_id === currentPersonId;

              return (
                <tr
                  key={task.id}
                  className="border-b border-zinc-100 align-top text-sm text-zinc-800 last:border-b-0 hover:bg-zinc-50"
                >
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() =>
                        void toggleCompleted(task.id, !completed)
                      }
                      className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        completed
                          ? "border-zinc-800 bg-zinc-800 text-white"
                          : "border-zinc-300 bg-white text-transparent hover:border-zinc-500"
                      }`}
                      title={
                        completed
                          ? "Reabrir compromiso"
                          : "Marcar como cumplido"
                      }
                    >
                      ✓
                    </button>
                  </td>

                  <td className="px-2 py-3">
                    <EditableCell
                      canEdit={canEdit}
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
                      canEdit={canEdit}
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
                      canEdit={canEdit}
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

                  <td className="px-4 py-4">
                    <CommitmentStatusBadge status={status} />
                    {!canEdit && (
                      <div className="mt-1 text-xs text-zinc-400">
                        Solo lectura
                      </div>
                    )}
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
                          canEdit={canEdit}
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
                          canEdit={canEdit}
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
                        disabled={!canEdit}
                        onClick={() => void deleteTask(task)}
                        className="rounded-md px-2 py-1 text-zinc-400 transition enabled:hover:bg-zinc-100 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title={canEdit ? "Eliminar compromiso" : "Solo quien creó el compromiso puede eliminarlo"}
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
                  No tienes compromisos abiertos asignados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
