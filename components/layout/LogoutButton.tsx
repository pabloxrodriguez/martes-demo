"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
    >
      Cerrar sesión
    </button>
  );
}