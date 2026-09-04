"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import {
  COMMITMENT_STATUS_LABELS,
  getCommitmentStatus,
  type CommitmentStatus,
} from "@/lib/tasks/commitment-status";

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
  creada_por_id: string | null;
  responsable: TaskPerson | null;
  estados_tarea: TaskStatus | null;
};

export type EditableTaskField =
  | "nombre"
  | "responsable_id"
  | "fecha_comprometida"
  | "url"
  | "comentario";

type TaskRowProps = {
  task: TaskRowData;
  currentPersonId: string;
  today: string;
  peopleOptions: SelectOption[];
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
  displayValue?: string | null;
  placeholder: string;
  type?: "text" | "date" | "url";
  multiline?: boolean;
  canEdit?: boolean;
  onSave: (value: string) => Promise<void>;
};

export function EditableCell({
  value,
  displayValue,
  placeholder,
  type = "text",
  multiline = false,
  canEdit = true,
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
        disabled={!canEdit}
        onClick={() => {
          setDraft(value ?? "");
          setError(null);
          setIsEditing(true);
        }}
        className="block min-h-9 w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-md px-2 py-1.5 text-left transition enabled:hover:bg-zinc-100 disabled:cursor-default"
        title={canEdit ? "Haz clic para editar" : "Solo quien creó el compromiso puede modificarlo"}
      >
        {value ? (
          displayValue ?? value
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
  canEdit?: boolean;
  onSave: (value: string) => Promise<void>;
};

export function EditableSelectCell({
  value,
  options,
  placeholder,
  required = false,
  canEdit = true,
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
        disabled={!canEdit}
        onClick={() => {
          setDraft(value ?? "");
          setError(null);
          setIsEditing(true);
        }}
        className="block min-h-9 w-full rounded-md px-2 py-1.5 text-left transition enabled:hover:bg-zinc-100 disabled:cursor-default"
        title={canEdit ? "Haz clic para editar" : "Solo quien creó el compromiso puede modificarlo"}
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
  currentPersonId,
  today,
  peopleOptions,
  onUpdate,
  onToggleCompleted,
  onDelete,
}: TaskRowProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const status = getCommitmentStatus(task, today);
  const completed = status === "completed";
  const canEdit = task.creada_por_id === currentPersonId;

  async function toggleCompleted() {
    try {
      setIsCompleting(true);
      setRowError(null);
      setSuccessMessage(null);
      await onToggleCompleted(task.id, !completed);

      setSuccessMessage(
        completed
          ? "El compromiso volvió a estado abierto."
          : "Compromiso marcado como cumplido."
      );

      window.setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (caughtError) {
      setRowError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cambiar el estado del compromiso."
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function deleteTask() {
    const confirmed = window.confirm(
      `¿Eliminar el compromiso “${task.nombre}”?`
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
          : "No se pudo eliminar el compromiso."
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
            disabled={!canEdit || isCompleting || isDeleting}
            onClick={() => void toggleCompleted()}
            className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs transition disabled:opacity-50 ${
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
          <div className={completed ? "line-through" : ""}>
            <EditableCell
              canEdit={canEdit}
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
            canEdit={canEdit}
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
            canEdit={canEdit}
            value={task.fecha_comprometida}
            displayValue={formatDate(task.fecha_comprometida)}
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

            <div className="w-28">
              <EditableCell
                canEdit={canEdit}
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
                canEdit={canEdit}
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
              disabled={!canEdit || isDeleting || isCompleting}
              onClick={() => void deleteTask()}
              className="rounded-md px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50"
              title={canEdit ? "Eliminar compromiso" : "Solo quien creó el compromiso puede eliminarlo"}
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

const STATUS_BADGE_CLASSES: Record<CommitmentStatus, string> = {
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  due_today: "bg-amber-50 text-amber-800 ring-amber-200",
  overdue: "bg-red-50 text-red-700 ring-red-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function CommitmentStatusBadge({
  status,
}: {
  status: CommitmentStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE_CLASSES[status]}`}
    >
      {COMMITMENT_STATUS_LABELS[status]}
    </span>
  );
}
