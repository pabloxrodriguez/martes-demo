"use client";

import { useState } from "react";

type DuplicateProjectButtonProps = {
  onDuplicate: () => Promise<void>;
};

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function DuplicateProjectButton({
  onDuplicate,
}: DuplicateProjectButtonProps) {
  const [isDuplicating, setIsDuplicating] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      "¿Duplicar proyecto?\n\nSe creará una copia con la misma información base y venues, pero sin tareas."
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDuplicating(true);
      await onDuplicate();
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      setIsDuplicating(false);

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo duplicar el proyecto.";

      window.alert(message);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDuplicating}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDuplicating ? "Duplicando..." : "Duplicar proyecto"}
    </button>
  );
}
