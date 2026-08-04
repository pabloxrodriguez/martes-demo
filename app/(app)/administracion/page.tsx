import { createPerson, updatePerson } from "@/app/(app)/administracion/actions";
import { requireAdminPerson } from "@/lib/auth/requireAdminPerson";

const ROLE_OPTIONS = [
  { value: "equipo", label: "Equipo" },
  { value: "lector", label: "Lector" },
  { value: "direccion", label: "Dirección" },
  { value: "admin", label: "Admin" },
];

function formatAccessStatus(authUserId: string | null) {
  return authUserId ? "Vinculado" : "Pendiente primer acceso";
}

export default async function AdministrationPage() {
  const { supabase } = await requireAdminPerson();
  const { data: people, error } = await supabase
    .from("personas")
    .select(
      "id, nombre, email, activo, administrador, rol, auth_user_id, fecha_actualizacion"
    )
    .order("activo", { ascending: false })
    .order("nombre");

  if (error) {
    throw new Error(`No se pudieron cargar las personas: ${error.message}`);
  }

  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-950">
            Administración
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Gestiona personas, roles y estado de acceso a Martes.
          </p>
        </div>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">
            Nueva persona
          </h2>

          <form action={createPerson} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_180px_120px_auto]">
            <input
              name="nombre"
              required
              placeholder="Nombre"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <input
              name="email"
              required
              type="email"
              placeholder="correo@laoreja.com"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
            <select
              name="rol"
              defaultValue="equipo"
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
              <input name="activo" type="checkbox" defaultChecked />
              Activo
            </label>
            <button
              type="submit"
              className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Crear
            </button>
          </form>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-zinc-950">
              Personas
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {people?.length ?? 0} persona
              {(people?.length ?? 0) === 1 ? "" : "s"} registradas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1040px] text-sm">
              <div className="grid grid-cols-[1.2fr_1.3fr_180px_120px_180px_120px] border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <div className="px-4 py-3">Nombre</div>
                <div className="px-4 py-3">Correo</div>
                <div className="px-4 py-3">Rol</div>
                <div className="px-4 py-3">Activo</div>
                <div className="px-4 py-3">Acceso</div>
                <div className="px-4 py-3">Acción</div>
              </div>

              <div className="divide-y divide-zinc-100">
                {(people ?? []).map((person) => (
                  <form
                    key={person.id}
                    action={updatePerson}
                    className="grid grid-cols-[1.2fr_1.3fr_180px_120px_180px_120px] items-start"
                  >
                    <div className="px-4 py-3">
                      <input type="hidden" name="id" value={person.id} />
                      <input
                        name="nombre"
                        defaultValue={person.nombre}
                        required
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                      />
                    </div>
                    <div className="px-4 py-3">
                      <input
                        name="email"
                        type="email"
                        defaultValue={person.email}
                        required
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                      />
                    </div>
                    <div className="px-4 py-3">
                      <select
                        name="rol"
                        defaultValue={person.rol}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700">
                        <input
                          name="activo"
                          type="checkbox"
                          defaultChecked={person.activo}
                        />
                        {person.activo ? "Sí" : "No"}
                      </label>
                    </div>
                    <div className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          person.auth_user_id
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {formatAccessStatus(person.auth_user_id)}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
