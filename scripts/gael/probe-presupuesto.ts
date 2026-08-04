import "dotenv/config";
import { config } from "dotenv";

import { gaelRequest } from "../../lib/integrations/gael/client";

config({ path: ".env.local" });

const presupuestoId = process.argv[2];

if (!presupuestoId) {
  console.error(
    "Uso: npx tsx scripts/gael/probe-presupuesto.ts <numero-o-id-presupuesto>"
  );
  process.exit(1);
}

function summarizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      firstItem:
        value.length > 0 && typeof value[0] === "object" && value[0] !== null
          ? Object.keys(value[0]).slice(0, 30)
          : value[0],
    };
  }

  if (typeof value === "object" && value !== null) {
    return {
      type: "object",
      keys: Object.keys(value).slice(0, 50),
    };
  }

  return value;
}

function summarizeJson(value: unknown) {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      firstItem: value[0],
    };
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      summarizeValue(entry),
    ])
  );
}

function previewRecord(record: unknown) {
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return record;
  }

  return Object.fromEntries(
    Object.entries(record)
      .slice(0, 40)
      .map(([key, value]) => [key, summarizeValue(value)])
  );
}

async function main() {
  const detail = await gaelRequest<unknown>({
    path: "/v2/presupuestos/detalle",
    searchParams: {
      id: presupuestoId,
    },
  });

  const detailObject =
    typeof detail === "object" && detail !== null && !Array.isArray(detail)
      ? (detail as Record<string, unknown>)
      : null;
  const headerRows = Array.isArray(detailObject?.data)
    ? detailObject.data
    : [];
  const detalles =
    typeof detailObject?.detalles === "object" &&
    detailObject.detalles !== null &&
    !Array.isArray(detailObject.detalles)
      ? (detailObject.detalles as Record<string, unknown>)
      : null;
  const detailRows = Array.isArray(detalles?.data) ? detalles.data : [];

  console.log(
    JSON.stringify(
      {
        resumen_estructura: summarizeJson(detail),
        presupuesto: previewRecord(headerRows[0]),
        primera_linea: previewRecord(detailRows[0]),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
