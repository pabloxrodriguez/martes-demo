import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";

import { createAdminClient } from "../lib/supabase/admin";
import type { TableInsert } from "../types/database";

dotenv.config({ path: ".env.local" });

type CsvProject = {
  id_proyecto: string;
  nombre: string;
  estado_id: string;
  tipo_id: string;
  prioridad: string;
  fecha_evento_inicio: string;
  fecha_evento_termino: string;
  fecha_propuesta: string;
  notas: string;
  responsable_id: string;
  publico_esperado: string;
  venues: string;
  valor_venta: string;
  cliente_id: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseDate(value: string): string | null {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return null;
  }

  const [month, day, year] = cleanValue.split("/");

  if (!month || !day || !year) {
    throw new Error(`Fecha inválida: ${value}`);
  }

  return [
    year.padStart(4, "0"),
    month.padStart(2, "0"),
    day.padStart(2, "0"),
  ].join("-");
}

function parseInteger(value: string): number | null {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return null;
  }

  const parsedValue = Number.parseInt(cleanValue, 10);

  return Number.isNaN(parsedValue) ? null : parsedValue;
}

function parseNumber(value: string): number | null {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return null;
  }

  const parsedValue = Number(cleanValue);

  return Number.isNaN(parsedValue) ? null : parsedValue;
}

async function main() {
  const shouldApply = process.argv.includes("--apply");

  const csvPath = path.join(
    process.cwd(),
    "scripts",
    "data",
    "Tabla Proyectos.xlsx - DBOK(1).csv"
  );

  if (!fs.existsSync(csvPath)) {
    throw new Error(`No se encontró el CSV en: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");

  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvProject[];

  const supabase = createAdminClient();

  const [
    { data: projectStatuses, error: statusesError },
    { data: projectTypes, error: typesError },
    { data: people, error: peopleError },
    { data: existingClients, error: clientsError },
  ] = await Promise.all([
    supabase.from("estados_proyecto").select("id, codigo, nombre"),
    supabase.from("tipos_proyecto").select("id, nombre"),
    supabase.from("personas").select("id, nombre"),
    supabase.from("clientes").select("id, nombre"),
  ]);

  if (statusesError) {
    throw new Error(
      `No se pudieron leer los estados: ${statusesError.message}`
    );
  }

  if (typesError) {
    throw new Error(
      `No se pudieron leer los tipos: ${typesError.message}`
    );
  }

  if (peopleError) {
    throw new Error(
      `No se pudieron leer las personas: ${peopleError.message}`
    );
  }

  if (clientsError) {
    throw new Error(
      `No se pudieron leer los clientes: ${clientsError.message}`
    );
  }

  const statusByCode = new Map(
    (projectStatuses ?? []).map((status) => [
      String(status.codigo),
      status.id,
    ])
  );

  const typeByName = new Map(
    (projectTypes ?? []).map((type) => [
      normalizeText(type.nombre),
      type.id,
    ])
  );

  const personByName = new Map(
    (people ?? []).map((person) => [
      normalizeText(person.nombre),
      person.id,
    ])
  );

  const clientByName = new Map(
    (existingClients ?? []).map((client) => [
      normalizeText(client.nombre),
      client.id,
    ])
  );

  const clientNames = Array.from(
    new Set(
      rows
        .map((row) => row.cliente_id?.trim())
        .filter((name): name is string => Boolean(name))
    )
  );

  const missingClients = clientNames.filter(
    (name) => !clientByName.has(normalizeText(name))
  );

  if (shouldApply && missingClients.length > 0) {
    const { data: createdClients, error: createClientsError } =
      await supabase
        .from("clientes")
        .insert(missingClients.map((nombre) => ({ nombre })))
        .select("id, nombre");

    if (createClientsError) {
      throw new Error(
        `No se pudieron crear los clientes: ${createClientsError.message}`
      );
    }

    for (const client of createdClients ?? []) {
      clientByName.set(normalizeText(client.nombre), client.id);
    }
  }

  const missingStatuses = new Set<string>();
  const missingTypes = new Set<string>();
  const missingPeople = new Set<string>();

  const projects: TableInsert<"proyectos">[] = rows.map((row) => {
    const statusId = statusByCode.get(row.estado_id.trim());
    const typeId = typeByName.get(normalizeText(row.tipo_id));
    const personId = personByName.get(
      normalizeText(row.responsable_id)
    );
    const clientId = clientByName.get(normalizeText(row.cliente_id));

    if (!statusId) {
      missingStatuses.add(row.estado_id);
    }

    if (row.tipo_id && !typeId) {
      missingTypes.add(row.tipo_id);
    }

    if (row.responsable_id && !personId) {
      missingPeople.add(row.responsable_id);
    }

    return {
      legacy_id: row.id_proyecto,
      nombre: row.nombre,
      estado_id: statusId ?? "",
      tipo_id: typeId ?? null,
      responsable_id: personId ?? null,
      cliente_id: clientId ?? null,
      prioridad: parseInteger(row.prioridad),
      fecha_propuesta: parseDate(row.fecha_propuesta),
      fecha_evento_inicio: parseDate(row.fecha_evento_inicio),
      fecha_evento_termino: parseDate(row.fecha_evento_termino),
      publico_esperado: parseInteger(row.publico_esperado),
      valor_venta: parseNumber(row.valor_venta),
      notas: row.notas || null,
      fecha_creacion: parseDate(row.fecha_creacion) ?? undefined,
      fecha_actualizacion:
        parseDate(row.fecha_actualizacion) ?? undefined,
    };
  });

  console.log(`Proyectos encontrados: ${rows.length}`);
  console.log(`Clientes nuevos: ${missingClients.length}`);

  console.log(
    "Estados no encontrados:",
    Array.from(missingStatuses)
  );

  console.log(
    "Tipos no encontrados:",
    Array.from(missingTypes)
  );

  console.log(
    "Responsables no encontrados:",
    Array.from(missingPeople)
  );

  if (missingStatuses.size > 0) {
    throw new Error(
      "La importación se detuvo porque existen estados sin correspondencia."
    );
  }

  if (!shouldApply) {
    console.log("");
    console.log("Validación terminada. No se insertaron datos.");
    console.log(
      "Cuando el resultado esté correcto, ejecuta el script con --apply."
    );
    return;
  }

  const { error: importError } = await supabase
    .from("proyectos")
    .upsert(projects, {
      onConflict: "legacy_id",
    });

  if (importError) {
    throw new Error(
      `No se pudieron importar los proyectos: ${importError.message}`
    );
  }

  console.log("");
  console.log(`Importación completada: ${projects.length} proyectos.`);
}

main().catch((error) => {
  console.error("");
  console.error("IMPORTACIÓN FALLIDA");
  console.error(error);
  process.exit(1);
});
