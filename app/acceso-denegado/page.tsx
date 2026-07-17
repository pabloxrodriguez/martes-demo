import { LogoutButton } from "@/components/layout/LogoutButton";

export default function AccesoDenegadoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Acceso no autorizado
        </h1>

        <p className="mt-4 text-sm leading-6 text-zinc-600">
          Tu cuenta de Google inició sesión correctamente, pero no está
          autorizada para acceder a Martes.
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Solicita acceso al administrador del sistema.
        </p>

        <div className="mt-6 flex justify-center">
  <LogoutButton />
</div>
      </div>
    </main>
  );
}