"use server";

import { revalidatePath } from "next/cache";

import { requireActivePerson } from "@/lib/auth/requireActivePerson";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireClientName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";

  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  if (name.length > 160) {
    throw new Error(
      "El nombre del cliente no puede superar los 160 caracteres."
    );
  }

  return name;
}

type ClientInput = {
  nombre?: unknown;
  contacto_nombre?: unknown;
  contacto_correo?: unknown;
  contacto_celular?: unknown;
};

function requireClientInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos del cliente no son válidos.");
  }

  const client = input as ClientInput;
  const contactoNombre = requireClientName(client.contacto_nombre);
  const contactoCorreo =
    typeof client.contacto_correo === "string"
      ? client.contacto_correo.trim().toLowerCase()
      : "";
  const contactoCelular =
    typeof client.contacto_celular === "string"
      ? client.contacto_celular.trim()
      : "";

  if (
    !contactoCorreo ||
    contactoCorreo.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactoCorreo)
  ) {
    throw new Error("El correo del contacto no es válido.");
  }

  if (!contactoCelular) {
    throw new Error("El celular del contacto es obligatorio.");
  }

  if (contactoCelular.length > 50) {
    throw new Error(
      "El celular del contacto no puede superar los 50 caracteres."
    );
  }

  return {
    nombre: requireClientName(client.nombre),
    contacto_nombre: contactoNombre,
    contacto_correo: contactoCorreo,
    contacto_celular: contactoCelular,
  };
}

function normalizeCatalogName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("es");
}

async function requireUniqueClientName(
  supabase: Awaited<ReturnType<typeof requireActivePerson>>["supabase"],
  nombre: string,
  currentClientId?: string
) {
  const { data: clients, error } = await supabase
    .from("clientes")
    .select("id, nombre, activo");

  if (error) {
    throw new Error(
      `No se pudo comprobar si el cliente ya existe: ${error.message}`
    );
  }

  const normalizedName = normalizeCatalogName(nombre);
  const existingClient = clients?.find(
    (client) =>
      client.id !== currentClientId &&
      normalizeCatalogName(client.nombre) === normalizedName
  );

  if (existingClient) {
    throw new Error(
      existingClient.activo
        ? `El cliente “${existingClient.nombre}” ya existe.`
        : `El cliente “${existingClient.nombre}” ya existe y está inactivo. Reactívalo en lugar de crear otro.`
    );
  }
}

function requireClientId(value: unknown) {
  const id = typeof value === "string" ? value.trim() : "";

  if (!uuidPattern.test(id)) {
    throw new Error("El cliente seleccionado no es válido.");
  }

  return id;
}

function clientWriteError(
  error: { code?: string; message: string },
  fallback: string
) {
  if (error.code === "23505") {
    return new Error("Ya existe un cliente con ese nombre.");
  }

  return new Error(`${fallback}: ${error.message}`);
}

export async function createClient(input: unknown) {
  const { supabase } = await requireActivePerson();
  const client = requireClientInput(input);

  await requireUniqueClientName(supabase, client.nombre);

  const { data, error } = await supabase
    .from("clientes")
    .insert({ ...client, activo: true })
    .select("id")
    .single();

  if (error) {
    throw clientWriteError(error, "No se pudo crear el cliente");
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");

  return { id: data.id };
}

export async function updateClient(
  clientIdInput: unknown,
  input: unknown
) {
  const { supabase } = await requireActivePerson();
  const clientId = requireClientId(clientIdInput);
  const client = requireClientInput(input);

  await requireUniqueClientName(supabase, client.nombre, clientId);

  const { data, error } = await supabase
    .from("clientes")
    .update({
      ...client,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(error, "No se pudo actualizar el cliente");
  }

  if (!data) {
    throw new Error(
      "El cliente no existe o no tienes permiso para modificarlo."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function setClientActive(
  clientIdInput: unknown,
  activeInput: unknown
) {
  const { supabase } = await requireActivePerson();
  const clientId = requireClientId(clientIdInput);

  if (typeof activeInput !== "boolean") {
    throw new Error("El estado solicitado no es válido.");
  }

  const { data, error } = await supabase
    .from("clientes")
    .update({
      activo: activeInput,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(
      error,
      activeInput
        ? "No se pudo reactivar el cliente"
        : "No se pudo desactivar el cliente"
    );
  }

  if (!data) {
    throw new Error(
      "El cliente no existe o no tienes permiso para modificarlo."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function createProjectType(nameInput: unknown) {
  const { supabase } = await requireActivePerson();
  const nombre = requireClientName(nameInput);

  const { error } = await supabase
    .from("tipos_proyecto")
    .insert({ nombre, activo: true });

  if (error) {
    throw clientWriteError(
      error,
      "No se pudo crear el tipo de proyecto"
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function updateProjectType(
  typeIdInput: unknown,
  nameInput: unknown
) {
  const { supabase } = await requireActivePerson();
  const typeId = requireClientId(typeIdInput);
  const nombre = requireClientName(nameInput);

  const { data, error } = await supabase
    .from("tipos_proyecto")
    .update({
      nombre,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", typeId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(
      error,
      "No se pudo actualizar el tipo de proyecto"
    );
  }

  if (!data) {
    throw new Error(
      "El tipo de proyecto no existe o no tienes permiso para modificarlo."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function setProjectTypeActive(
  typeIdInput: unknown,
  activeInput: unknown
) {
  const { supabase } = await requireActivePerson();
  const typeId = requireClientId(typeIdInput);

  if (typeof activeInput !== "boolean") {
    throw new Error("El estado solicitado no es válido.");
  }

  const { data, error } = await supabase
    .from("tipos_proyecto")
    .update({
      activo: activeInput,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", typeId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(
      error,
      "No se pudo cambiar el estado del tipo de proyecto"
    );
  }

  if (!data) {
    throw new Error(
      "El tipo de proyecto no existe o no tienes permiso para modificarlo."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function createTaskTemplate(nameInput: unknown) {
  const { supabase } = await requireActivePerson();
  const nombre = requireClientName(nameInput);
  const { data: lastTemplate, error: orderError } = await supabase
    .from("plantillas_tarea")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    throw new Error(
      `No se pudo preparar la plantilla de tarea: ${orderError.message}`
    );
  }

  const orden = Number(lastTemplate?.orden ?? 0) + 1;

  const { error } = await supabase
    .from("plantillas_tarea")
    .insert({ nombre, orden, activa: true });

  if (error) {
    throw clientWriteError(
      error,
      "No se pudo crear la plantilla de tarea"
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function updateTaskTemplate(
  templateIdInput: unknown,
  nameInput: unknown
) {
  const { supabase } = await requireActivePerson();
  const templateId = requireClientId(templateIdInput);
  const nombre = requireClientName(nameInput);

  const { data, error } = await supabase
    .from("plantillas_tarea")
    .update({
      nombre,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", templateId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(
      error,
      "No se pudo actualizar la plantilla de tarea"
    );
  }

  if (!data) {
    throw new Error(
      "La plantilla no existe o no tienes permiso para modificarla."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function setTaskTemplateActive(
  templateIdInput: unknown,
  activeInput: unknown
) {
  const { supabase } = await requireActivePerson();
  const templateId = requireClientId(templateIdInput);

  if (typeof activeInput !== "boolean") {
    throw new Error("El estado solicitado no es válido.");
  }

  const { data, error } = await supabase
    .from("plantillas_tarea")
    .update({
      activa: activeInput,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", templateId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(
      error,
      "No se pudo cambiar el estado de la plantilla"
    );
  }

  if (!data) {
    throw new Error(
      "La plantilla no existe o no tienes permiso para modificarla."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

type VenueInput = {
  nombre?: unknown;
  direccion?: unknown;
  comuna?: unknown;
  ciudad?: unknown;
  capacidad?: unknown;
  contacto_nombre?: unknown;
  contacto_correo?: unknown;
  contacto_celular?: unknown;
};

function optionalText(value: unknown, label: string) {
  const text = typeof value === "string" ? value.trim() : "";

  if (text.length > 200) {
    throw new Error(`${label} no puede superar los 200 caracteres.`);
  }

  return text || null;
}

function requireVenueInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Los datos del venue no son válidos.");
  }

  const venue = input as VenueInput;
  const capacidadText =
    typeof venue.capacidad === "string"
      ? venue.capacidad.trim()
      : venue.capacidad;
  const capacidad =
    capacidadText === "" || capacidadText === null || capacidadText === undefined
      ? null
      : Number(capacidadText);

  if (
    capacidad !== null &&
    (!Number.isInteger(capacidad) || capacidad < 0 || capacidad > 10_000_000)
  ) {
    throw new Error(
      "La capacidad debe ser un número entero entre 0 y 10.000.000."
    );
  }

  const contactoCorreo =
    typeof venue.contacto_correo === "string"
      ? venue.contacto_correo.trim().toLowerCase()
      : "";

  if (
    contactoCorreo &&
    (contactoCorreo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactoCorreo))
  ) {
    throw new Error("El correo del contacto no es válido.");
  }

  return {
    nombre: requireClientName(venue.nombre),
    direccion: optionalText(venue.direccion, "La dirección"),
    comuna: optionalText(venue.comuna, "La comuna"),
    ciudad: optionalText(venue.ciudad, "La ciudad"),
    capacidad,
    contacto_nombre: optionalText(
      venue.contacto_nombre,
      "El nombre del contacto"
    ),
    contacto_correo: contactoCorreo || null,
    contacto_celular: optionalText(
      venue.contacto_celular,
      "El celular del contacto"
    ),
  };
}

export async function createVenue(input: unknown) {
  const { supabase } = await requireActivePerson();
  const venue = requireVenueInput(input);

  const { error } = await supabase
    .from("venues")
    .insert({ ...venue, activo: true });

  if (error) {
    throw clientWriteError(error, "No se pudo crear el venue");
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function updateVenue(
  venueIdInput: unknown,
  input: unknown
) {
  const { supabase } = await requireActivePerson();
  const venueId = requireClientId(venueIdInput);
  const venue = requireVenueInput(input);

  const { data, error } = await supabase
    .from("venues")
    .update({
      ...venue,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", venueId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(error, "No se pudo actualizar el venue");
  }

  if (!data) {
    throw new Error(
      "El venue no existe o no tienes permiso para modificarlo."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}

export async function setVenueActive(
  venueIdInput: unknown,
  activeInput: unknown
) {
  const { supabase } = await requireActivePerson();
  const venueId = requireClientId(venueIdInput);

  if (typeof activeInput !== "boolean") {
    throw new Error("El estado solicitado no es válido.");
  }

  const { data, error } = await supabase
    .from("venues")
    .update({
      activo: activeInput,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id", venueId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw clientWriteError(
      error,
      "No se pudo cambiar el estado del venue"
    );
  }

  if (!data) {
    throw new Error(
      "El venue no existe o no tienes permiso para modificarlo."
    );
  }

  revalidatePath("/catalogos");
  revalidatePath("/proyectos");
}
