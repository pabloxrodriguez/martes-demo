"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type SelectOption = {
  value: string;
  label: string;
};

type TaskPerson = {
  id: string;
  nombre: string;
};

type TaskStatus = {
  id: string;
  nombre: string;
};

export type TaskRowData = {
  id: string;
  plantilla_tarea_id: string | null;
  nombre: string;
  fecha_comprometida: string | null;
  fecha_completada: string | null;
  url: string | null;
  comentario: string | null;
  orden: number;
  responsable: TaskPerson | null;
  estados_tarea: TaskStatus | null;
};

export type EditableTaskField =
  | "nombre"
  | "responsable_id"
  | "estado_id"
  | "fecha_comprometida"
  | "url"
  | "comentario";

type TaskRowProps = {
  task: TaskRowData;
  peopleOptions: SelectOption[];
  taskStatusOptions: SelectOption[];
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

type EditableCellProps = {
  value: string | null;
  placeholder: string;
  type?: "text" | "date" | "url";
  multiline?: boolean;
  onSave: (value: string) => Promise<void>;
};

export function EditableCell({
  value,
  placeholder,
  type = "text",
  multiline = false,
  onSave,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const cleanValue = draft.trim();
    const currentValue = (value ?? "").trim();

    if (cleanValue === currentValue) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(cleanValue);
      setIsEditing(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar el cambio."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function cancel() {
    setDraft(value ?? "");
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? "");
          setError(null);
          setIsEditing(true);
        }}
        className="block min-h-9 w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md px-2 py-1.5 text-left transition hover:bg-zinc-100"
        title="Haz clic para editar"
      >
        {value ? (
          value
        ) : (
          <span className="text-zinc-400">
            {placeholder}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="min-w-0">
      {multiline ? (
        <textarea
          autoFocus
          rows={2}
          value={draft}
          disabled={isSaving}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              cancel();
            }

            if (
              event.key === "Enter" &&
              (event.metaKey || event.ctrlKey)
            ) {
              event.preventDefault();
              void save();
            }
          }}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
        />
      ) : (
        <input
          autoFocus
          type={type}
          value={draft}
          disabled={isSaving}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void save();
            }

            if (event.key === "Escape") {
              cancel();
            }
          }}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
        />
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void save()}
          className="rounded-md bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={cancel}
          className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type EditableSelectCellProps = {
  value: string | null;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
  onSave: (value: string) => Promise<void>;
};

export function EditableSelectCell({
  value,
  options,
  placeholder,
  required = false,
  onSave,
}: EditableSelectCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  async function save(newValue: string) {
    if (required && !newValue) {
      setError("Debes seleccionar una opción.");
      return;
    }

    if (newValue === (value ?? "")) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(newValue);
      setIsEditing(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar el cambio."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? "");
          setError(null);
          setIsEditing(true);
        }}
        className="block min-h-9 w-full rounded-md px-2 py-1.5 text-left transition hover:bg-zinc-100"
        title="Haz clic para editar"
      >
        {selectedOption?.label ?? (
          <span className="text-zinc-400">
            {placeholder}
          </span>
        )}
      </button>
    );
  }

  return (
    <div>
      <select
        autoFocus
        value={draft}
        disabled={isSaving}
        onChange={(event) => {
          const newValue = event.target.value;
          setDraft(newValue);
          void save(newValue);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDraft(value ?? "");
            setError(null);
            setIsEditing(false);
          }
        }}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
      >
        {!required && (
          <option value="">
            Sin asignar
          </option>
        )}

        {required && !draft && (
          <option value="" disabled>
            Seleccionar
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={isSaving}
        onClick={() => {
          setDraft(value ?? "");
          setError(null);
          setIsEditing(false);
        }}
        className="mt-2 rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
      >
        Cancelar
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

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

export function TaskRow({
  task,
  peopleOptions,
  taskStatusOptions,
  onUpdate,
  onToggleCompleted,
  onDelete,
}: TaskRowProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const completed =
    task.estados_tarea?.nombre === "Completada" ||
    Boolean(task.fecha_completada);

  async function toggleCompleted() {
    try {
      setIsCompleting(true);
      setRowError(null);
      setSuccessMessage(null);
      await onToggleCompleted(task.id, !completed);

      setSuccessMessage(
        completed
          ? "La tarea volvió a estado pendiente."
          : "Tarea marcada como completada."
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (caughtError) {
      setRowError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cambiar el estado de la tarea."
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function deleteTask() {
    const confirmed = window.confirm(
      `¿Quitar la tarea “${task.nombre}”?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setRowError(null);
      await onDelete(task.id);
    } catch (caughtError) {
      setRowError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar la tarea."
      );
      setIsDeleting(false);
    }
  }

  return (
    <>
      <tr
        className={`border-b border-zinc-100 align-top last:border-b-0 ${
          completed
            ? "bg-zinc-50 text-zinc-400"
            : "text-zinc-800"
        }`}
      >
        <td className="px-4 py-4 text-center">
          <button
            type="button"
            disabled={isCompleting || isDeleting}
            onClick={() => void toggleCompleted()}
            className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs transition disabled:opacity-50 ${
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
          <div className={completed ? "line-through" : ""}>
            <EditableCell
              value={task.nombre}
              placeholder="Sin nombre"
              onSave={(value) =>
                onUpdate(task.id, "nombre", value)
              }
            />
          </div>
        </td>

        <td className="px-2 py-3">
          <EditableSelectCell
            value={task.responsable?.id ?? null}
            options={peopleOptions}
            placeholder="Sin responsable"
            required
            onSave={(value) =>
              onUpdate(
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
            placeholder="Sin fecha"
            type="date"
            onSave={(value) =>
              onUpdate(
                task.id,
                "fecha_comprometida",
                value
              )
            }
          />

          {!task.fecha_comprometida ? null : (
            <div className="mt-1 px-2 text-xs text-zinc-400">
              {formatDate(task.fecha_comprometida)}
            </div>
          )}
        </td>

        <td className="px-2 py-3">
          <EditableSelectCell
            value={task.estados_tarea?.id ?? null}
            options={taskStatusOptions}
            placeholder="Sin estado"
            required
            onSave={(value) =>
              onUpdate(task.id, "estado_id", value)
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

            <div className="w-28">
              <EditableCell
                value={task.url}
                placeholder="Sin enlace"
                type="url"
                onSave={(value) =>
                  onUpdate(task.id, "url", value)
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
                  onUpdate(
                    task.id,
                    "comentario",
                    value
                  )
                }
              />
            </div>

            <button
              type="button"
              disabled={isDeleting || isCompleting}
              onClick={() => void deleteTask()}
              className="rounded-md px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50"
              title="Eliminar tarea"
            >
              {isDeleting ? "…" : "✕"}
            </button>
          </div>
        </td>
      </tr>

      {rowError && (
        <tr className="border-b border-zinc-100 bg-red-50">
          <td />

          <td
            colSpan={6}
            className="px-4 py-2 text-sm text-red-700"
          >
            {rowError}
          </td>
        </tr>
      )}

      {successMessage &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white shadow-lg"
          >
            {successMessage}
          </div>,
          document.body
        )}
    </>
  );
}
