"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { CreateProjectModal } from "@/components/projects/CreateProjectModal";

type SelectOption = {
  value: string;
  label: string;
};

type AppHeaderProps = {
  peopleOptions: SelectOption[];
  statusOptions: SelectOption[];
  defaultStatusId: string;
  initialSearch: string;
  canCreateProjects?: boolean;
};

export function AppHeader({
  peopleOptions,
  statusOptions,
  defaultStatusId,
  initialSearch,
  canCreateProjects = true,
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [isSearching, startSearchTransition] = useTransition();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = search.trim();

    startSearchTransition(() => {
      router.replace(
        query
          ? `${pathname}?q=${encodeURIComponent(query)}`
          : pathname
      );
    });
  }

  function clearSearch() {
    setSearch("");

    startSearchTransition(() => {
      router.replace(pathname);
    });
  }

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
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2"
              role="search"
            >
              <input
                type="search"
                value={search}
                disabled={isSearching}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Proyecto, cliente o responsable"
                aria-label="Buscar proyectos"
                className="h-11 w-72 rounded-xl border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-zinc-500 disabled:bg-zinc-100"
              />

              <button
                type="submit"
                disabled={isSearching}
                className="h-11 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                {isSearching ? "Buscando..." : "Buscar"}
              </button>

              {initialSearch && (
                <button
                  type="button"
                  disabled={isSearching}
                  onClick={clearSearch}
                  className="h-11 rounded-xl px-3 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50"
                >
                  Limpiar
                </button>
              )}
            </form>

            <Link
              href="/proyectos/historico"
              className="flex h-11 items-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              Histórico
            </Link>

            {canCreateProjects && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Nuevo proyecto
              </button>
            )}
          </div>
        </div>
      </header>

      {canCreateProjects && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          peopleOptions={peopleOptions}
          statusOptions={statusOptions}
          defaultStatusId={defaultStatusId}
        />
      )}
    </>
  );
}
