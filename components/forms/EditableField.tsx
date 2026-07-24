"use client";

import { useState } from "react";

type SelectOption = {
  value: string;
  label: string;
};

type EditableFieldProps = {
  label: string;
  value: string | number | null;
  type?:
    | "text"
    | "number"
    | "currency"
    | "date"
    | "textarea"
    | "select";
  placeholder?: string;
  options?: SelectOption[];
  onSave: (newValue: string) => Promise<void>;
};

function formatCurrency(value: string | number | null) {
  if (value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function EditableField({
  label,
  value,
  type = "text",
  placeholder = "Sin información",
  options = [],
  onSave,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(value ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const cleanValue = draftValue.trim();
    const currentValue = String(value ?? "").trim();

    if (cleanValue === currentValue) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onSave(cleanValue);
      setIsEditing(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el cambio."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setDraftValue(String(value ?? ""));
    setError(null);
    setIsEditing(false);
  }

  function renderEditor() {
    if (type === "select") {
      return (
        <select
          autoFocus
          value={draftValue}
          disabled={isSaving}
          onChange={(event) => setDraftValue(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
        >
          <option value="">Seleccionar</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          autoFocus
          value={draftValue}
          disabled={isSaving}
          onChange={(event) => setDraftValue(event.target.value)}
          rows={5}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
        />
      );
    }

    return (
      <input
        autoFocus
        type={type === "currency" ? "number" : type}
        value={draftValue}
        disabled={isSaving}
        min={type === "currency" ? "0" : undefined}
        step={type === "currency" ? "1" : undefined}
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
    );
  }

  const selectedOption = options.find(
    (option) => option.value === String(value ?? "")
  );

  const displayValue =
    type === "select"
      ? selectedOption?.label
      : type === "currency"
        ? formatCurrency(value)
        : value;

  return (
    <div>
      <div className="text-sm font-medium text-zinc-500">
        {label}
      </div>

      {isEditing ? (
        <div className="mt-2">
          {renderEditor()}

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
            setDraftValue(String(value ?? ""));
            setError(null);
            setIsEditing(true);
          }}
          className={`mt-1 block w-full rounded-lg px-2 py-2 text-left text-zinc-950 hover:bg-zinc-100 ${
            type === "textarea" ? "whitespace-pre-wrap" : ""
          }`}
        >
          {displayValue !== null &&
          displayValue !== undefined &&
          displayValue !== "" ? (
            displayValue
          ) : (
            <span className="text-zinc-400">
              {placeholder}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
