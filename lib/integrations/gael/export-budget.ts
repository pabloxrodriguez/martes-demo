import ExcelJS from "exceljs";

import {
  GAEL_BUDGET_CATEGORIES,
  GAEL_BUDGET_OPERATIONS,
  type GaelBudgetDraftLine,
} from "@/lib/integrations/gael/import-template-config";

const HEADER_FILL = "FFFFFF00";

function assertFiniteNumber(
  value: number,
  label: string,
  minimum: number
) {
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`${label} no tiene un valor válido.`);
  }
}

export function validateGaelBudgetLines(lines: GaelBudgetDraftLine[]) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Agrega al menos una línea al presupuesto.");
  }

  return lines.map((line, index) => {
    const row = index + 1;
    const categoria = line.categoria?.trim();
    const concepto = line.concepto?.trim();
    const operacion = line.operacion?.trim();

    if (!GAEL_BUDGET_CATEGORIES.includes(
      categoria as (typeof GAEL_BUDGET_CATEGORIES)[number]
    )) {
      throw new Error(`La categoría de la línea ${row} no es válida.`);
    }

    if (!concepto) {
      throw new Error(`El concepto de la línea ${row} es obligatorio.`);
    }

    if (!GAEL_BUDGET_OPERATIONS.includes(
      operacion as (typeof GAEL_BUDGET_OPERATIONS)[number]
    )) {
      throw new Error(`La operación de la línea ${row} no es válida.`);
    }

    assertFiniteNumber(line.cantidad, `La cantidad de la línea ${row}`, 0.01);
    assertFiniteNumber(line.veces, `Las veces de la línea ${row}`, 0.01);
    assertFiniteNumber(line.unitario, `El unitario de la línea ${row}`, 0);

    return {
      categoria,
      concepto,
      cantidad: line.cantidad,
      veces: line.veces,
      unitario: line.unitario,
      operacion,
      notas: line.notas?.trim() ?? "",
    };
  });
}

export async function createGaelBudgetWorkbook(
  lines: GaelBudgetDraftLine[]
) {
  const validatedLines = validateGaelBudgetLines(lines);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Hoja1", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.addRow([
    "Categoría",
    "Concepto",
    "Cantidad",
    "Veces",
    "Unitario",
    "Operación",
    "Notas",
    "Categoría",
    "Operación",
  ]);

  const catalogRows = Math.max(
    validatedLines.length,
    GAEL_BUDGET_CATEGORIES.length,
    GAEL_BUDGET_OPERATIONS.length
  );

  for (let index = 0; index < catalogRows; index += 1) {
    const line = validatedLines[index];

    worksheet.addRow([
      line?.categoria ?? null,
      line?.concepto ?? null,
      line?.cantidad ?? null,
      line?.veces ?? null,
      line?.unitario ?? null,
      line?.operacion ?? null,
      line?.notas || null,
      GAEL_BUDGET_CATEGORIES[index] ?? null,
      GAEL_BUDGET_OPERATIONS[index] ?? null,
    ]);
  }

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FF000000" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL },
  };
  header.height = 20;

  worksheet.columns = [
    { width: 24 },
    { width: 34 },
    { width: 12 },
    { width: 10 },
    { width: 16 },
    { width: 42 },
    { width: 32 },
    { width: 28 },
    { width: 48 },
  ];

  const lastCategoryRow = GAEL_BUDGET_CATEGORIES.length + 1;
  const lastOperationRow = GAEL_BUDGET_OPERATIONS.length + 1;

  for (let row = 2; row <= Math.max(200, catalogRows + 1); row += 1) {
    worksheet.getCell(`A${row}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'Hoja1'!$H$2:$H$${lastCategoryRow}`],
    };
    worksheet.getCell(`F${row}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`'Hoja1'!$I$2:$I$${lastOperationRow}`],
    };
  }

  worksheet.getColumn(3).numFmt = "0.##";
  worksheet.getColumn(4).numFmt = "0.##";
  worksheet.getColumn(5).numFmt = "0";

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function formatSantiagoTimestamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}${value("month")}${value("day")}_${value("hour")}${value("minute")}`;
}

export function buildGaelBudgetFileName(
  projectName: string,
  createdAt = new Date()
) {
  const safeName = projectName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return `${safeName || "proyecto"}_${formatSantiagoTimestamp(createdAt)}.xlsx`;
}
