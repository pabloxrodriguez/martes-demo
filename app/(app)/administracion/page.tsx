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
            <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Activo</th>
                  <th className="px-4 py-3">Acceso</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(people ?? []).map((person) => {
                  const formId = `person-form-${person.id}`;

                  return (
                    <tr key={person.id} className="align-top">
                      <td className="px-4 py-3">
                        <input
                          form={formId}
                          type="hidden"
                          name="id"
                          value={person.id}
                        />
                        <input
                          form={formId}
                          name="nombre"
                          defaultValue={person.nombre}
                          required
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          form={formId}
                          name="email"
                          type="email"
                          defaultValue={person.email}
                          required
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          form={formId}
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
                      </td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700">
                          <input
                            form={formId}
                            name="activo"
                            type="checkbox"
                            defaultChecked={person.activo}
                          />
                          {person.activo ? "Sí" : "No"}
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            person.auth_user_id
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {formatAccessStatus(person.auth_user_id)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <form id={formId} action={updatePerson} />
                        <button
                          form={formId}
                          type="submit"
                          className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                        >
                          Guardar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
