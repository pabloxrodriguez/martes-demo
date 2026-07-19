"use client";

import { useState } from "react";

type DeleteProjectButtonProps = {
  onDelete: () => Promise<void>;
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

export function DeleteProjectButton({
  onDelete,
}: DeleteProjectButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      "¿Borrar proyecto?\n\nSe eliminará el proyecto junto con todas sus tareas y datos asociados.\n\nEsta acción no se puede deshacer."
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete();
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      setIsDeleting(false);

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo borrar el proyecto.";

      window.alert(message);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDeleting}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDeleting ? "Borrando..." : "Borrar proyecto"}
    </button>
  );
}
