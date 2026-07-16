"use client";

import { useMemo, useState } from "react";

type SearchOption = {
  value: string;
  label: string;
};

type SearchSelectProps = {
  label: string;
  value: string | null;
  options: SearchOption[];
  placeholder?: string;
  required?: boolean;
  onSave: (newValue: string) => Promise<void>;
};

export function SearchSelect({
  label,
  value,
  options,
  placeholder = "Sin información",
  required = false,
  onSave,
}: SearchSelectProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return options.slice(0, 10);
    }

    return options
      .filter((option) =>
        option.label.toLowerCase().includes(normalizedSearch)
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
    setSearch("");
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
            type="search"
            value={search}
            disabled={isSaving}
            placeholder={`Buscar ${label.toLowerCase()}...`}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                handleCancel();
              }
            }}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
          />

          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
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
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-zinc-950 hover:bg-zinc-100"
        >
          {selectedOption?.label ?? (
            <span className="text-zinc-400">
              {placeholder}
            </span>
          )}
        </button>
      )}
    </div>
  );
}