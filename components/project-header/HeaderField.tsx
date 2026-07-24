"use client";

import { ReactNode, useState } from "react";

type HeaderFieldOption = {
  value: string;
  label: string;
};

type HeaderFieldProps = {
  value: string | number | null;
  onSave: (newValue: string) => Promise<void>;
  icon?: ReactNode;
  prefix?: string;
  placeholder?: string;
  type?: "text" | "number" | "currency" | "date" | "select";
  options?: HeaderFieldOption[];
  className?: string;
  displayValue?: string;
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

function formatDate(value: string | number | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${String(value)}T00:00:00Z`));
}

export function HeaderField({
  value,
  onSave,
  icon,
  prefix,
  placeholder = "Sin información",
  type = "text",
  options = [],
  className = "",
  displayValue,
}: HeaderFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(
    String(value ?? "")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = options.find(
    (option) => option.value === String(value ?? "")
  );

  const formattedValue =
    displayValue ??
    (type === "select"
      ? selectedOption?.label
      : type === "currency"
        ? formatCurrency(value)
        : type === "date"
          ? formatDate(value)
          : value !== null && value !== ""
            ? String(value)
            : null);

  async function handleSave(newValue?: string) {
    const cleanValue = (
      newValue ?? draftValue
    ).trim();

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

  function handleCancel() {
    setDraftValue(String(value ?? ""));
    setError(null);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <span className={`relative inline-flex ${className}`}>
        {type === "select" ? (
          <select
            autoFocus
            value={draftValue}
            disabled={isSaving}
            onChange={(event) => {
              const newValue = event.target.value;

              setDraftValue(newValue);
              void handleSave(newValue);
            }}
            onBlur={() => {
              if (!isSaving) {
                handleCancel();
              }
            }}
            className="min-w-48 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 shadow-sm outline-none focus:border-zinc-500"
          >
            <option value="">Seleccionar</option>

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex items-center gap-2">
            <input
              autoFocus
              type={
                type === "currency"
                  ? "number"
                  : type
              }
              value={draftValue}
              disabled={isSaving}
              min={
                type === "currency" ||
                type === "number"
                  ? "0"
                  : undefined
              }
              step={
                type === "currency" ||
                type === "number"
                  ? "1"
                  : undefined
              }
              onChange={(event) =>
                setDraftValue(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSave();
                }

                if (event.key === "Escape") {
                  handleCancel();
                }
              }}
              className="min-w-44 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 shadow-sm outline-none focus:border-zinc-500"
            />

            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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
          </span>
        )}

        {error && (
          <span className="absolute left-0 top-full z-20 mt-2 min-w-64 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraftValue(String(value ?? ""));
        setError(null);
        setIsEditing(true);
      }}
      className={`inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-zinc-100 ${className}`}
      title="Haz clic para editar"
    >
      {icon && (
        <span aria-hidden="true">
          {icon}
        </span>
      )}

      <span>
        {prefix && (
          <span className="mr-1">
            {prefix}
          </span>
        )}

        {formattedValue ? (
          formattedValue
        ) : (
          <span className="text-zinc-400">
            {placeholder}
          </span>
        )}
      </span>
    </button>
  );
}
