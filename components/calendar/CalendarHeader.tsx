"use client";

import { useState } from "react";

import { CreateProjectModal } from "@/components/projects/CreateProjectModal";

type SelectOption = {
  value: string;
  label: string;
};

type CalendarHeaderProps = {
  peopleOptions: SelectOption[];
  statusOptions: SelectOption[];
  defaultStatusId: string;
};

export function CalendarHeader({
  peopleOptions,
  statusOptions,
  defaultStatusId,
}: CalendarHeaderProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              Calendario
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Agenda de entregas de propuesta y eventos en ejecución
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Nuevo proyecto
          </button>
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
