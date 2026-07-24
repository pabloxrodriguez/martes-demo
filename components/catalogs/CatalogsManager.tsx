"use client";

import {
  FormEvent,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  createClient,
  createProjectType,
  createTaskTemplate,
  createVenue,
  setClientActive,
  setProjectTypeActive,
  setTaskTemplateActive,
  setVenueActive,
  updateClient,
  updateProjectType,
  updateTaskTemplate,
  updateVenue,
} from "@/app/(app)/catalogos/actions";

type SectionId = "clients" | "projectTypes" | "venues" | "taskTemplates";
type NamedSectionId = "projectTypes" | "taskTemplates";

type NamedItem = {
  id: string;
  nombre: string;
  activo: boolean;
};

type VenueItem = NamedItem & {
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  capacidad: number | null;
};

type ClientItem = NamedItem & {
  contacto_nombre: string | null;
  contacto_correo: string | null;
  contacto_celular: string | null;
};

type ClientDraft = {
  nombre: string;
  contacto_nombre: string;
  contacto_correo: string;
  contacto_celular: string;
};

type VenueDraft = {
  nombre: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  capacidad: string;
};

type CatalogsManagerProps = {
  clients: ClientItem[];
  projectTypes: NamedItem[];
  venues: VenueItem[];
  taskTemplates: NamedItem[];
};

const sections: { id: SectionId; label: string }[] = [
  { id: "clients", label: "Clientes" },
  { id: "projectTypes", label: "Tipos de proyecto" },
  { id: "venues", label: "Venues" },
  { id: "taskTemplates", label: "Plantillas de tareas" },
];

const namedSectionConfig = {
  projectTypes: {
    title: "Tipos de proyecto",
    singular: "tipo de proyecto",
    placeholder: "Nombre del nuevo tipo",
  },
  taskTemplates: {
    title: "Plantillas de tareas",
    singular: "plantilla",
    placeholder: "Nombre de la nueva plantilla",
  },
} satisfies Record<
  NamedSectionId,
  {
    title: string;
    singular: string;
    placeholder: string;
  }
>;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeCatalogText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("es");
}

async function createNamedItem(
  section: NamedSectionId,
  name: string
) {
  if (section === "projectTypes") {
    return createProjectType(name);
  }

  return createTaskTemplate(name);
}

async function updateNamedItem(
  section: NamedSectionId,
  id: string,
  name: string
) {
  if (section === "projectTypes") {
    return updateProjectType(id, name);
  }

  return updateTaskTemplate(id, name);
}

async function toggleNamedItem(
  section: NamedSectionId,
  id: string,
  active: boolean
) {
  if (section === "projectTypes") {
    return setProjectTypeActive(id, active);
  }

  return setTaskTemplateActive(id, active);
}

function StatusMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

function emptyClientDraft(): ClientDraft {
  return {
    nombre: "",
    contacto_nombre: "",
    contacto_correo: "",
    contacto_celular: "",
  };
}

function ClientFields({
  draft,
  disabled,
  onChange,
}: {
  draft: ClientDraft;
  disabled: boolean;
  onChange: (field: keyof ClientDraft, value: string) => void;
}) {
  const fields: {
    key: keyof ClientDraft;
    label: string;
    type?: "text" | "email" | "tel";
    maxLength: number;
  }[] = [
    { key: "nombre", label: "Empresa", maxLength: 160 },
    {
      key: "contacto_nombre",
      label: "Nombre del contacto",
      maxLength: 160,
    },
    {
      key: "contacto_correo",
      label: "Correo",
      type: "email",
      maxLength: 254,
    },
    {
      key: "contacto_celular",
      label: "Celular",
      type: "tel",
      maxLength: 50,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((field) => (
        <label
          key={field.key}
          className="text-xs font-medium text-zinc-600"
        >
          {field.label}
          <input
            type={field.type ?? "text"}
            value={draft[field.key]}
            required
            maxLength={field.maxLength}
            disabled={disabled}
            onChange={(event) =>
              onChange(field.key, event.target.value)
            }
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500 disabled:bg-zinc-100"
          />
        </label>
      ))}
    </div>
  );
}

function ClientRow({ client }: { client: ClientItem }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ClientDraft>({
    nombre: client.nombre,
    contacto_nombre: client.contacto_nombre ?? "",
    contacto_correo: client.contacto_correo ?? "",
    contacto_celular: client.contacto_celular ?? "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function change(field: keyof ClientDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setMessage(null);
        await updateClient(client.id, draft);
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(error, "No se pudo actualizar el cliente.")
        );
      }
    });
  }

  function toggleActive() {
    if (
      client.activo &&
      !window.confirm(
        `¿Desactivar ${client.nombre}? Dejará de aparecer en nuevos proyectos.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        setMessage(null);
        await setClientActive(client.id, !client.activo);
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(
            error,
            "No se pudo cambiar el estado del cliente."
          )
        );
      }
    });
  }

  return (
    <div className="border-b border-zinc-200 px-5 py-4 last:border-b-0">
      {isEditing ? (
        <form onSubmit={save}>
          <ClientFields
            draft={draft}
            disabled={isPending}
            onChange={change}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium ${
                client.activo ? "text-zinc-950" : "text-zinc-400"
              }`}
            >
              {client.nombre}
            </p>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {client.contacto_nombre || "Sin contacto"}
              {client.contacto_correo
                ? ` · ${client.contacto_correo}`
                : ""}
              {client.contacto_celular
                ? ` · ${client.contacto_celular}`
                : ""}
              {!client.activo ? " · Inactivo" : ""}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              setIsEditing(true);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Editar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={toggleActive}
            className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
              client.activo
                ? "text-red-700 hover:bg-red-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {isPending
              ? "Procesando..."
              : client.activo
                ? "Desactivar"
                : "Reactivar"}
          </button>
        </div>
      )}
      <StatusMessage message={message} />
    </div>
  );
}

function ClientsSection({ clients }: { clients: ClientItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<ClientDraft>(emptyClientDraft);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const normalizedQuery = normalizeCatalogText(query);
  const normalizedNewName = normalizeCatalogText(draft.nombre);
  const suggestedClients =
    normalizedNewName.length >= 2
      ? clients
          .filter((client) =>
            normalizeCatalogText(client.nombre).includes(normalizedNewName)
          )
          .slice(0, 5)
      : [];
  const exactClient = suggestedClients.find(
    (client) =>
      normalizeCatalogText(client.nombre) === normalizedNewName
  );
  const filteredClients = normalizedQuery
    ? clients.filter((client) =>
        [
          client.nombre,
          client.contacto_nombre,
          client.contacto_correo,
          client.contacto_celular,
        ].some((value) =>
          value?.toLocaleLowerCase("es").includes(normalizedQuery)
        )
      )
    : clients;

  function change(field: keyof ClientDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setMessage(null);
        await createClient(draft);
        setDraft(emptyClientDraft());
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(error, "No se pudo crear el cliente.")
        );
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              Clientes
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {clients.filter((client) => client.activo).length} activos
              {" · "}
              {clients.length} en total
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar empresa o contacto"
            aria-label="Buscar clientes"
            className="h-10 w-64 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        <form onSubmit={create} className="mt-5">
          <ClientFields
            draft={draft}
            disabled={isPending}
            onChange={change}
          />

          {suggestedClients.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-900">
                Clientes existentes parecidos
              </p>
              <div className="mt-2 space-y-1">
                {suggestedClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-amber-950">
                      {client.nombre}
                      {client.contacto_nombre
                        ? ` · ${client.contacto_nombre}`
                        : ""}
                    </span>
                    <span className="text-xs text-amber-700">
                      {client.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                ))}
              </div>

              {exactClient && (
                <p className="mt-2 text-xs font-medium text-red-700">
                  {exactClient.activo
                    ? "Este cliente ya existe y no puede agregarse nuevamente."
                    : "Este cliente ya existe inactivo. Reactívalo desde la lista."}
                </p>
              )}
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isPending || Boolean(exactClient)}
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending ? "Agregando..." : "Agregar cliente"}
            </button>
          </div>
        </form>
        <StatusMessage message={message} />
      </div>

      {filteredClients.length ? (
        filteredClients.map((client) => (
          <ClientRow
            key={`${client.id}:${client.nombre}:${client.contacto_nombre}:${client.contacto_correo}:${client.contacto_celular}:${client.activo}`}
            client={client}
          />
        ))
      ) : (
        <p className="px-5 py-12 text-center text-sm text-zinc-500">
          No se encontraron clientes.
        </p>
      )}
    </section>
  );
}

function NamedItemRow({
  section,
  item,
}: {
  section: NamedSectionId;
  item: NamedItem;
}) {
  const router = useRouter();
  const config = namedSectionConfig[section];
  const [name, setName] = useState(item.nombre);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setMessage(null);
        await updateNamedItem(section, item.id, name);
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(
            error,
            `No se pudo actualizar el ${config.singular}.`
          )
        );
      }
    });
  }

  function toggleActive() {
    if (
      item.activo &&
      !window.confirm(
        `¿Desactivar ${item.nombre}? Dejará de aparecer en nuevas selecciones.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        setMessage(null);
        await toggleNamedItem(section, item.id, !item.activo);
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(
            error,
            `No se pudo cambiar el estado del ${config.singular}.`
          )
        );
      }
    });
  }

  return (
    <div className="border-b border-zinc-200 px-5 py-4 last:border-b-0">
      {isEditing ? (
        <form onSubmit={save} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={name}
            required
            maxLength={160}
            disabled={isPending}
            onChange={(event) => {
              setName(event.target.value);
              setMessage(null);
            }}
            aria-label={`Nombre de ${item.nombre}`}
            className="min-w-64 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-100"
          />

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setName(item.nombre);
              setMessage(null);
              setIsEditing(false);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium ${
                item.activo ? "text-zinc-950" : "text-zinc-400"
              }`}
            >
              {item.nombre}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {item.activo ? "Activo" : "Inactivo"}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              setIsEditing(true);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Editar
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={toggleActive}
            className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
              item.activo
                ? "text-red-700 hover:bg-red-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {isPending
              ? "Procesando..."
              : item.activo
                ? "Desactivar"
                : "Reactivar"}
          </button>
        </div>
      )}

      <StatusMessage message={message} />
    </div>
  );
}

function NamedCatalogSection({
  section,
  items,
}: {
  section: NamedSectionId;
  items: NamedItem[];
}) {
  const router = useRouter();
  const config = namedSectionConfig[section];
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredItems = normalizedQuery
    ? items.filter((item) =>
        item.nombre.toLocaleLowerCase("es").includes(normalizedQuery)
      )
    : items;
  const activeCount = items.filter((item) => item.activo).length;

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setMessage(null);
        await createNamedItem(section, newName);
        setNewName("");
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(
            error,
            `No se pudo crear el ${config.singular}.`
          )
        );
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              {config.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {activeCount} activos · {items.length} en total
            </p>
          </div>

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar ${config.singular}`}
            aria-label={`Buscar ${config.title.toLocaleLowerCase("es")}`}
            className="h-10 w-64 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        <form
          onSubmit={create}
          className="mt-5 flex flex-wrap items-start gap-3"
        >
          <input
            type="text"
            value={newName}
            required
            maxLength={160}
            disabled={isPending}
            onChange={(event) => {
              setNewName(event.target.value);
              setMessage(null);
            }}
            placeholder={config.placeholder}
            aria-label={config.placeholder}
            className="h-11 min-w-64 flex-1 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 disabled:bg-zinc-100"
          />

          <button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isPending ? "Agregando..." : `Agregar ${config.singular}`}
          </button>
        </form>

        <StatusMessage message={message} />
      </div>

      {filteredItems.length ? (
        filteredItems.map((item) => (
          <NamedItemRow
            key={`${item.id}:${item.nombre}:${item.activo}`}
            section={section}
            item={item}
          />
        ))
      ) : (
        <p className="px-5 py-12 text-center text-sm text-zinc-500">
          No se encontraron registros.
        </p>
      )}
    </section>
  );
}

function emptyVenueDraft(): VenueDraft {
  return {
    nombre: "",
    direccion: "",
    comuna: "",
    ciudad: "",
    capacidad: "",
  };
}

function VenueFields({
  draft,
  disabled,
  onChange,
}: {
  draft: VenueDraft;
  disabled: boolean;
  onChange: (field: keyof VenueDraft, value: string) => void;
}) {
  const fields: {
    key: keyof VenueDraft;
    label: string;
    type?: "text" | "number";
    required?: boolean;
  }[] = [
    { key: "nombre", label: "Nombre", required: true },
    { key: "direccion", label: "Dirección" },
    { key: "comuna", label: "Comuna" },
    { key: "ciudad", label: "Ciudad" },
    { key: "capacidad", label: "Capacidad", type: "number" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {fields.map((field) => (
        <label key={field.key} className="text-xs font-medium text-zinc-600">
          {field.label}
          <input
            type={field.type ?? "text"}
            value={draft[field.key]}
            required={field.required}
            min={field.type === "number" ? 0 : undefined}
            max={field.type === "number" ? 10_000_000 : undefined}
            maxLength={field.type === "number" ? undefined : 200}
            disabled={disabled}
            onChange={(event) => onChange(field.key, event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm font-normal outline-none focus:border-zinc-500 disabled:bg-zinc-100"
          />
        </label>
      ))}
    </div>
  );
}

function VenueRow({ venue }: { venue: VenueItem }) {
  const router = useRouter();
  const [draft, setDraft] = useState<VenueDraft>({
    nombre: venue.nombre,
    direccion: venue.direccion ?? "",
    comuna: venue.comuna ?? "",
    ciudad: venue.ciudad ?? "",
    capacidad: venue.capacidad === null ? "" : String(venue.capacidad),
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function change(field: keyof VenueDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setMessage(null);
        await updateVenue(venue.id, draft);
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(error, "No se pudo actualizar el venue.")
        );
      }
    });
  }

  function toggleActive() {
    if (
      venue.activo &&
      !window.confirm(
        `¿Desactivar ${venue.nombre}? Dejará de aparecer en nuevas selecciones.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        setMessage(null);
        await setVenueActive(venue.id, !venue.activo);
        router.refresh();
      } catch (error) {
        setMessage(
          getErrorMessage(
            error,
            "No se pudo cambiar el estado del venue."
          )
        );
      }
    });
  }

  return (
    <div className="border-b border-zinc-200 px-5 py-4 last:border-b-0">
      {isEditing ? (
        <form onSubmit={save}>
          <VenueFields
            draft={draft}
            disabled={isPending}
            onChange={change}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium ${
                venue.activo ? "text-zinc-950" : "text-zinc-400"
              }`}
            >
              {venue.nombre}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {[venue.direccion, venue.comuna, venue.ciudad]
                .filter(Boolean)
                .join(" · ") || "Sin ubicación"}
              {venue.capacidad !== null
                ? ` · Capacidad ${venue.capacidad.toLocaleString("es-CL")}`
                : ""}
              {!venue.activo ? " · Inactivo" : ""}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              setIsEditing(true);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
          >
            Editar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={toggleActive}
            className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
              venue.activo
                ? "text-red-700 hover:bg-red-50"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {isPending
              ? "Procesando..."
              : venue.activo
                ? "Desactivar"
                : "Reactivar"}
          </button>
        </div>
      )}
      <StatusMessage message={message} />
    </div>
  );
}

function VenuesSection({ venues }: { venues: VenueItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<VenueDraft>(emptyVenueDraft);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredVenues = normalizedQuery
    ? venues.filter((venue) =>
        [venue.nombre, venue.direccion, venue.comuna, venue.ciudad].some(
          (value) =>
            value?.toLocaleLowerCase("es").includes(normalizedQuery)
        )
      )
    : venues;

  function change(field: keyof VenueDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setMessage(null);
        await createVenue(draft);
        setDraft(emptyVenueDraft());
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error, "No se pudo crear el venue."));
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              Venues
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {venues.filter((venue) => venue.activo).length} activos ·{" "}
              {venues.length} en total
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar venue o ubicación"
            aria-label="Buscar venues"
            className="h-10 w-64 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
          />
        </div>

        <form onSubmit={create} className="mt-5">
          <VenueFields
            draft={draft}
            disabled={isPending}
            onChange={change}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending ? "Agregando..." : "Agregar venue"}
            </button>
          </div>
        </form>
        <StatusMessage message={message} />
      </div>

      {filteredVenues.length ? (
        filteredVenues.map((venue) => (
          <VenueRow
            key={`${venue.id}:${venue.nombre}:${venue.activo}:${venue.direccion}:${venue.comuna}:${venue.ciudad}:${venue.capacidad}`}
            venue={venue}
          />
        ))
      ) : (
        <p className="px-5 py-12 text-center text-sm text-zinc-500">
          No se encontraron venues.
        </p>
      )}
    </section>
  );
}

export function CatalogsManager({
  clients,
  projectTypes,
  venues,
  taskTemplates,
}: CatalogsManagerProps) {
  const [activeSection, setActiveSection] =
    useState<SectionId>("clients");

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-8 py-6">
        <h1 className="text-3xl font-semibold text-zinc-950">
          Catálogos
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Administra los datos reutilizables de MARTES.
        </p>
      </header>

      <main className="p-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((section) => {
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  aria-pressed={isActive}
                  className={`rounded-xl border px-4 py-4 text-left text-sm font-medium transition ${
                    isActive
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  {section.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            {activeSection === "clients" && (
              <ClientsSection clients={clients} />
            )}
            {activeSection === "projectTypes" && (
              <NamedCatalogSection
                section="projectTypes"
                items={projectTypes}
              />
            )}
            {activeSection === "venues" && (
              <VenuesSection venues={venues} />
            )}
            {activeSection === "taskTemplates" && (
              <NamedCatalogSection
                section="taskTemplates"
                items={taskTemplates}
              />
            )}
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            Los registros utilizados se desactivan en lugar de eliminarse
            para conservar el historial de proyectos.
          </p>
        </div>
      </main>
    </>
  );
}
