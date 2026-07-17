"use client";

import { useState } from "react";

import { CreateProjectModal } from "@/components/projects/CreateProjectModal";

type SelectOption = {
  value: string;
  label: string;
};

type AppHeaderProps = {
  peopleOptions: SelectOption[];
  statusOptions: SelectOption[];
  defaultStatusId: string;
};

export function AppHeader({
  peopleOptions,
  statusOptions,
  defaultStatusId,
}: AppHeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              Proyectos
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Vista general de proyectos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="Buscar proyectos"
              className="h-11 w-72 rounded-xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-500"
            />

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Nuevo proyecto
            </button>
          </div>
        </div>
      </header>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        peopleOptions={peopleOptions}
        statusOptions={statusOptions}
        defaultStatusId={defaultStatusId}
      />
    </>
  );
}