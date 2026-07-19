"use client";

export default function ComingSoonPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-zinc-600">
          Este módulo se encuentra en desarrollo.
        </p>

        <button
          type="button"
          onClick={() => window.history.back()}
          className="mt-8 rounded-md bg-zinc-900 px-4 py-2 text-white transition hover:bg-zinc-700"
        >
          Volver
        </button>
      </div>
    </div>
  );
}