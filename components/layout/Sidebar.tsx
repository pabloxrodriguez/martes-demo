import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { APP_RELEASED_AT, APP_VERSION } from "@/lib/app-version";

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

      <SidebarNav />

      <div className="border-t border-zinc-200 p-4">
        <div className="px-4 pb-4 text-xs text-zinc-400">
          <p className="font-medium text-zinc-500">
            Versión {APP_VERSION}
          </p>
          <time dateTime="2026-07-23T21:10:00-04:00">
            {APP_RELEASED_AT}
          </time>
        </div>

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
