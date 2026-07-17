"use client";

import {
  FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { createProject } from "@/app/(app)/proyectos/actions";

type SelectOption = {
  value: string;
  label: string;
};

type CreateProjectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  peopleOptions: SelectOption[];
  statusOptions: SelectOption[];
  defaultStatusId: string;
};

function getToday() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  peopleOptions,
  statusOptions,
  defaultStatusId,
}: CreateProjectModalProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const input = {
      nombre: String(formData.get("nombre") ?? ""),
      responsable_id: String(
        formData.get("responsable_id") ?? ""
      ),
      estado_id: String(formData.get("estado_id") ?? ""),
      fecha_propuesta: String(
        formData.get("fecha_propuesta") ?? ""
      ),
    };

    startTransition(async () => {
      try {
        setError(null);

        await createProject(input);

        form.reset();
        onClose();
        router.refresh();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo crear el proyecto."
        );
      }
    });
  }

  function handleClose() {
    if (isPending) {
      return;
    }

    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              Nuevo proyecto
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Ingresa la información inicial del proyecto.
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form
          className="space-y-5 px-6 py-6"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="project-name"
              className="text-sm font-medium text-zinc-700"
            >
              Nombre del proyecto *
            </label>

            <input
              id="project-name"
              name="nombre"
              type="text"
              required
              autoFocus
              disabled={isPending}
              placeholder="Ej. Convención anual 2027"
              className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none focus:border-zinc-500 disabled:bg-zinc-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-responsible"
              className="text-sm font-medium text-zinc-700"
            >
              Responsable *
            </label>

            <select
              id="project-responsible"
              name="responsable_id"
              required
              defaultValue=""
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-zinc-500 disabled:bg-zinc-100"
            >
              <option value="" disabled>
                Seleccionar responsable
              </option>

              {peopleOptions.map((person) => (
                <option
                  key={person.value}
                  value={person.value}
                >
                  {person.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="project-status"
              className="text-sm font-medium text-zinc-700"
            >
              Estado *
            </label>

            <select
              id="project-status"
              name="estado_id"
              required
              defaultValue={defaultStatusId}
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-950 outline-none focus:border-zinc-500 disabled:bg-zinc-100"
            >
              {statusOptions.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="proposal-date"
              className="text-sm font-medium text-zinc-700"
            >
              Fecha propuesta *
            </label>

            <input
              id="proposal-date"
              name="fecha_propuesta"
              type="date"
              required
              defaultValue={getToday()}
              disabled={isPending}
              className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-950 outline-none focus:border-zinc-500 disabled:bg-zinc-100"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-200 pt-5">
            <button
              type="button"
              disabled={isPending}
              onClick={handleClose}
              className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Creando..." : "Crear proyecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}