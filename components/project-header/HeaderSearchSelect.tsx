"use client";

import { ReactNode, useMemo, useState } from "react";

type SearchOption = {
  value: string;
  label: string;
};

type HeaderSearchSelectProps = {
  value: string | null;
  options: SearchOption[];
  onSave: (newValue: string) => Promise<void>;
  icon?: ReactNode;
  prefix?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function HeaderSearchSelect({
  value,
  options,
  onSave,
  icon,
  prefix,
  placeholder = "Sin información",
  required = false,
  className = "",
}: HeaderSearchSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  const filteredOptions = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) {
      return options.slice(0, 10);
    }

    return options
      .filter((option) =>
        option.label.toLowerCase().includes(cleanSearch)
      )
      .slice(0, 10);
  }, [options, search]);

  async function handleSelect(newValue: string) {
    try {
      setIsSaving(true);
      setError(null);

      await onSave(newValue);

      setSearch("");
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
    setSearch("");
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
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

          {selectedOption?.label ?? (
            <span className="text-zinc-400">
              {placeholder}
            </span>
          )}
        </span>
      </button>
    );
  }

  return (
    <span className={`relative inline-block ${className}`}>
      <div className="absolute left-0 top-0 z-30 w-80 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl">
        <input
          autoFocus
          type="search"
          value={search}
          disabled={isSaving}
          placeholder="Buscar..."
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              handleCancel();
            }
          }}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none focus:border-zinc-500"
        />

        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-zinc-200">
          {!required && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSelect("")}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Sin asignar
            </button>
          )}

          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isSaving}
              onClick={() => void handleSelect(option.value)}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-950 hover:bg-zinc-100"
            >
              {option.label}
            </button>
          ))}

          {filteredOptions.length === 0 && (
            <div className="px-3 py-3 text-sm text-zinc-400">
              No se encontraron resultados.
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleCancel}
          className="mt-2 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Cancelar
        </button>

        {error && (
          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <span className="invisible inline-flex px-2 py-1.5">
        {selectedOption?.label ?? placeholder}
      </span>
    </span>
  );
}