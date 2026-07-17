import { redirect } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentPerson } from "@/lib/auth/getCurrentPerson";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const person = await getCurrentPerson();

  if (!person || !person.activo) {
    redirect("/acceso-denegado");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}