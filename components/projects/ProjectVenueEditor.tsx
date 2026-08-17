"use client";

import { FormEvent, useState, useTransition } from "react";

type Venue = {
  id?: string | null;
  nombre?: string | null;
  direccion?: string | null;
  comuna?: string | null;
  ciudad?: string | null;
  capacidad?: number | null;
  contacto_nombre?: string | null;
  contacto_correo?: string | null;
  contacto_celular?: string | null;
};

type VenueDraft = {
  nombre: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  capacidad: string;
  contacto_nombre: string;
  contacto_correo: string;
  contacto_celular: string;
};

function buildDraft(venue: Venue | null | undefined): VenueDraft {
  return {
    nombre: venue?.nombre ?? "",
    direccion: venue?.direccion ?? "",
    comuna: venue?.comuna ?? "",
    ciudad: venue?.ciudad ?? "",
    capacidad: venue?.capacidad === null || venue?.capacidad === undefined
      ? ""
      : String(venue.capacidad),
    contacto_nombre: venue?.contacto_nombre ?? "",
    contacto_correo: venue?.contacto_correo ?? "",
    contacto_celular: venue?.contacto_celular ?? "",
  };
}

export function ProjectVenueEditor({
  venueId,
  venue,
  onUpdateVenue,
  onRemoveVenue,
}: {
  venueId: string;
  venue: Venue | null | undefined;
  onUpdateVenue: (venueId: string, input: VenueDraft) => Promise<void>;
  onRemoveVenue: (venueId: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(() => buildDraft(venue));
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof VenueDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);
        await onUpdateVenue(venueId, draft);
        setIsEditing(false);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo actualizar el venue."
        );
      }
    });
  }

  if (!isEditing) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-zinc-950">
              {venue?.nombre ?? "Venue sin nombre"}
            </div>

            <div className="mt-1 text-sm text-zinc-500">
              {[venue?.comuna, venue?.ciudad].filter(Boolean).join(", ") ||
                "Sin ubicación"}
            </div>

            <div className="mt-2 text-xs text-zinc-400">
              {venue?.contacto_nombre
                ? `Contacto: ${venue.contacto_nombre}`
                : "Sin contacto"}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Editar
            </button>

            <form action={onRemoveVenue.bind(null, venueId)}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600"
                title="Quitar del proyecto"
              >
                ✕
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 bg-white p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <VenueInput
          label="Nombre"
          value={draft.nombre}
          required
          disabled={isPending}
          onChange={(value) => updateField("nombre", value)}
        />
        <VenueInput
          label="Dirección"
          value={draft.direccion}
          disabled={isPending}
          onChange={(value) => updateField("direccion", value)}
        />
        <VenueInput
          label="Comuna"
          value={draft.comuna}
          disabled={isPending}
          onChange={(value) => updateField("comuna", value)}
        />
        <VenueInput
          label="Ciudad"
          value={draft.ciudad}
          disabled={isPending}
          onChange={(value) => updateField("ciudad", value)}
        />
        <VenueInput
          label="Capacidad"
          type="number"
          value={draft.capacidad}
          disabled={isPending}
          onChange={(value) => updateField("capacidad", value)}
        />
        <VenueInput
          label="Contacto"
          value={draft.contacto_nombre}
          disabled={isPending}
          onChange={(value) => updateField("contacto_nombre", value)}
        />
        <VenueInput
          label="Correo"
          type="email"
          value={draft.contacto_correo}
          disabled={isPending}
          onChange={(value) => updateField("contacto_correo", value)}
        />
        <VenueInput
          label="Celular"
          type="tel"
          value={draft.contacto_celular}
          disabled={isPending}
          onChange={(value) => updateField("contacto_celular", value)}
        />
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setDraft(buildDraft(venue));
            setError(null);
            setIsEditing(false);
          }}
          className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar venue"}
        </button>
      </div>
    </form>
  );
}

function VenueInput({
  label,
  value,
  type = "text",
  required = false,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  type?: "text" | "number" | "email" | "tel";
  required?: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-medium text-zinc-600">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        min={type === "number" ? 0 : undefined}
        max={type === "number" ? 10_000_000 : undefined}
        maxLength={type === "number" ? undefined : type === "email" ? 254 : 200}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500 disabled:bg-zinc-100"
      />
    </label>
  );
}
