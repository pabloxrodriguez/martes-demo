"use client";

import { useState } from "react";

type EditableValueProps = {
  label: string;
  value: string | null;
  placeholder?: string;
  onSave: (newValue: string) => Promise<void>;
};

export function EditableValue({
  label,
  value,
  placeholder = "Sin información",
  onSave,
}: EditableValueProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const cleanValue = draftValue.trim();

    if (cleanValue === (value ?? "").trim()) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onSave(cleanValue);

      setIsEditing(false);
    } catch {
      setError("No se pudo guardar el cambio.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setDraftValue(value ?? "");
    setError(null);
    setIsEditing(false);
  }

  return (
    <div>
      <div className="text-sm font-medium text-zinc-500">
        {label}
      </div>

      {isEditing ? (
        <div className="mt-2">
          <input
            autoFocus
            type="text"
            value={draftValue}
            disabled={isSaving}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleSave();
              }

              if (event.key === "Escape") {
                handleCancel();
              }
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
          />

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraftValue(value ?? "");
            setError(null);
            setIsEditing(true);
          }}
          className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-zinc-950 hover:bg-zinc-100"
        >
          {value || (
            <span className="text-zinc-400">
              {placeholder}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
