"use client";

import { useState } from "react";

import {
  COMMITMENT_STATUS_LABELS,
  getCommitmentStatus,
  type CommitmentStatus,
} from "@/lib/tasks/commitment-status";

const STATUS_BADGE_CLASSES: Record<CommitmentStatus, string> = {
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  due_today: "bg-amber-50 text-amber-800 ring-amber-200",
  overdue: "bg-red-50 text-red-700 ring-red-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

type SelectOption = {
  value: string;
  label: string;
};

type CreateTaskInput = {
  plantilla_tarea_id: string | null;
  nombre: string;
  responsable_id: string;
  fecha_comprometida: string | null;
  url: string | null;
  comentario: string | null;
};

type CreateTaskResult = {
  success: boolean;
  error: string | null;
};

type NewTaskRowProps = {
  today: string;
  peopleOptions: SelectOption[];
  taskTemplateOptions: SelectOption[];
  onCreate: (input: CreateTaskInput) => Promise<CreateTaskResult>;
};

export function NewTaskRow({
  today,
  peopleOptions,
  taskTemplateOptions,
  onCreate,
}: NewTaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [taskName, setTaskName] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(
    null
  );
  const [responsibleId, setResponsibleId] = useState("");
  const [committedDate, setCommittedDate] = useState("");
  const [url, setUrl] = useState("");
  const [comment, setComment] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialStatus = getCommitmentStatus(
    {
      fecha_comprometida: committedDate || null,
      fecha_completada: null,
    },
    today
  );

  function resetForm() {
    setTaskName("");
    setTemplateId(null);
    setResponsibleId("");
    setCommittedDate("");
    setUrl("");
    setComment("");
    setError(null);
  }

  function clearError() {
    if (error) {
      setError(null);
    }
  }

  function handleTaskNameChange(newName: string) {
    clearError();
    setTaskName(newName);

    const matchingTemplate = taskTemplateOptions.find(
      (option) =>
        option.label.trim().toLowerCase() ===
        newName.trim().toLowerCase()
    );

    setTemplateId(matchingTemplate?.value ?? null);
  }

  function handleCancel() {
    resetForm();
    setIsEditing(false);
  }

  async function handleSave() {
    const cleanTaskName = taskName.trim();

    if (!cleanTaskName) {
      setError("Debes escribir o seleccionar un compromiso.");
      return;
    }

    if (!responsibleId) {
      setError("Debes seleccionar un responsable.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const result = await onCreate({
        plantilla_tarea_id: templateId,
        nombre: cleanTaskName,
        responsable_id: responsibleId,
        fecha_comprometida:
          committedDate.trim() || null,
        url: url.trim() || null,
        comentario: comment.trim() || null,
      });

      if (!result.success) {
        setError(result.error ?? "No se pudo crear el compromiso.");
        return;
      }

      resetForm();
      setIsEditing(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo crear el compromiso."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <tr className="bg-zinc-50">
        <td className="px-4 py-4" />

        <td colSpan={6} className="px-4 py-4">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="font-medium text-zinc-500 transition hover:text-zinc-950"
          >
            + Nuevo compromiso…
          </button>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="border-t border-zinc-200 bg-zinc-50 align-top">
        <td className="px-4 py-3 text-center">
          <span className="inline-flex h-5 w-5 rounded border border-zinc-300 bg-white" />
        </td>

        <td className="px-3 py-3">
          <input
            autoFocus
            type="text"
            list="task-template-options"
            value={taskName}
            disabled={isSaving}
            placeholder="Buscar o escribir compromiso"
            onChange={(event) =>
              handleTaskNameChange(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                handleCancel();
              }
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
          />

          <datalist id="task-template-options">
            {taskTemplateOptions.map((option) => (
              <option
                key={option.value}
                value={option.label}
              />
            ))}
          </datalist>

          {templateId ? (
            <p className="mt-1 text-xs text-zinc-400">
              Compromiso de plantilla
            </p>
          ) : taskName.trim() ? (
            <p className="mt-1 text-xs text-zinc-400">
              Compromiso libre
            </p>
          ) : null}
        </td>

        <td className="px-3 py-3">
          <select
            value={responsibleId}
            disabled={isSaving}
            onChange={(event) =>
              {
                clearError();
                setResponsibleId(event.target.value);
              }
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
          >
            <option value="">
              Seleccionar responsable
            </option>

            {peopleOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </td>

        <td className="px-3 py-3">
          <input
            type="date"
            value={committedDate}
            disabled={isSaving}
            onChange={(event) =>
              {
                clearError();
                setCommittedDate(event.target.value);
              }
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
          />
        </td>

        <td className="px-3 py-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE_CLASSES[initialStatus]}`}
          >
            {COMMITMENT_STATUS_LABELS[initialStatus]}
          </span>
        </td>

        <td className="px-3 py-3">
          <input
            type="url"
            value={url}
            disabled={isSaving}
            placeholder="Enlace opcional"
            onChange={(event) => {
              clearError();
              setUrl(event.target.value);
            }}
            className="w-full min-w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
          />
        </td>

        <td className="px-3 py-3">
          <textarea
            value={comment}
            disabled={isSaving}
            rows={2}
            placeholder="Comentario"
            onChange={(event) => {
              clearError();
              setComment(event.target.value)
            }}
            className="w-full min-w-64 resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
          />
        </td>
      </tr>

      <tr className="bg-zinc-50">
        <td />

        <td colSpan={6} className="px-3 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSaving
                ? "Creando..."
                : "Crear compromiso"}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancelar
            </button>

            {error && (
              <p
                className="text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}
