import Link from "next/link";

const menuItems = [
  { label: "Mi Martes", href: "/mi-martes" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Equipo", href: "/equipo" },
  { label: "Calendario", href: "/calendario" },
  { label: "Resultados", href: "/resultados" },
  { label: "Clientes", href: "/clientes" },
];

export function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-6 py-5">
        <h1 className="text-xl font-semibold text-zinc-900">Martes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestión de proyectos
        </p>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}