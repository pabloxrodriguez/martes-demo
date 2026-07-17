import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/LogoutButton";

const menuItems = [
  { label: "Mi Martes", href: "/mi-martes" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Equipo", href: "/equipo" },
  { label: "Calendario", href: "/calendario" },
  { label: "Resultados", href: "/resultados" },
  { label: "Clientes", href: "/clientes" },
];

export async function Sidebar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "Usuario";

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-5">
        <h1 className="text-2xl font-semibold text-zinc-900">Martes</h1>
        <p className="mt-1 text-base text-zinc-500">
          Gestión de proyectos
        </p>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-4 py-3.5 text-base font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-4">
        <div className="px-4 pb-3">
          <p className="truncate text-base font-medium text-zinc-900">
            {displayName}
          </p>

          {user?.email && (
            <p className="mt-1 truncate text-sm text-zinc-500">
              {user.email}
            </p>
          )}
        </div>

        <LogoutButton />
      </div>
    </aside>
  );
}