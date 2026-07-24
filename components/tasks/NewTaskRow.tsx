"use client";

import { useState } from "react";

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

type CreateTaskResult = {
  success: boolean;
  error: string | null;
};

type NewTaskRowProps = {
  peopleOptions: SelectOption[];
  taskTemplateOptions: SelectOption[];
  taskStatusOptions: SelectOption[];
  defaultTaskStatusId: string;
  onCreate: (input: CreateTaskInput) => Promise<CreateTaskResult>;
};

export function NewTaskRow({
  peopleOptions,
  taskTemplateOptions,
  taskStatusOptions,
  defaultTaskStatusId,
  onCreate,
}: NewTaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [taskName, setTaskName] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(
    null
  );
  const [responsibleId, setResponsibleId] = useState("");
  const [committedDate, setCommittedDate] = useState("");
  const [statusId, setStatusId] = useState(
    defaultTaskStatusId
  );
  const [url, setUrl] = useState("");
  const [comment, setComment] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTaskName("");
    setTemplateId(null);
    setResponsibleId("");
    setCommittedDate("");
    setStatusId(defaultTaskStatusId);
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
      setError("Debes escribir o seleccionar una tarea.");
      return;
    }

    if (!responsibleId) {
      setError("Debes seleccionar un responsable.");
      return;
    }

    if (!statusId) {
      setError("Debes seleccionar un estado.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const result = await onCreate({
        plantilla_tarea_id: templateId,
        nombre: cleanTaskName,
        responsable_id: responsibleId,
        estado_id: statusId,
        fecha_comprometida:
          committedDate.trim() || null,
        url: url.trim() || null,
        comentario: comment.trim() || null,
      });

      if (!result.success) {
        setError(result.error ?? "No se pudo crear la tarea.");
        return;
      }

      resetForm();
      setIsEditing(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo crear la tarea."
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
            + Nueva tarea…
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
            placeholder="Buscar o escribir tarea"
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
              Tarea de plantilla
            </p>
          ) : taskName.trim() ? (
            <p className="mt-1 text-xs text-zinc-400">
              Tarea libre
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
          <select
            value={statusId}
            disabled={isSaving}
            onChange={(event) =>
              {
                clearError();
                setStatusId(event.target.value);
              }
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-500"
          >
            <option value="">
              Seleccionar estado
            </option>

            {taskStatusOptions.map((option) => (
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
                : "Crear tarea"}
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
