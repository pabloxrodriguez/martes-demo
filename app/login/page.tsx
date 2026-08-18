"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { APP_VERSION } from "@/lib/app-version";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionMessage =
    searchParams.get("reason") === "session_expired"
      ? "Tu sesión expiró. Vuelve a ingresar para continuar."
      : null;
  const visibleError = error ?? sessionMessage;

  async function handleGoogleLogin() {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (signInError) {
        throw signInError;
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo iniciar sesión con Google."
      );

      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
        <div className="text-center">
          <Image
            src="/icon.png"
            alt="Martes"
            width={112}
            height={112}
            priority
            className="mx-auto mb-5 rounded-full"
          />

          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
            MARTES
          </h1>

          <p className="mt-3 text-lg text-zinc-600">
            Sistema de Gestión de Proyectos
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            Versión demo para clientes
          </p>
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.6-4.6 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8H6.4C9.7 39.5 16.2 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6 7.1l6.2 5.2C39.1 37.1 44 31.2 44 24c0-1.3-.1-2.3-.4-3.5z"
              />
            </svg>

            {isLoading
              ? "Conectando..."
              : "Continuar con Google"}
          </button>
        </div>

        {visibleError && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {visibleError}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-zinc-400">
          Acceso demo para usuarios autorizados. Versión {APP_VERSION}
        </p>

        <div className="mt-10 border-t pt-6 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Martes Demo - Pablo Rodríguez T.
        </div>
      </div>
    </main>
  );
}
