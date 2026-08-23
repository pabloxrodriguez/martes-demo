export const GAEL_BUDGET_CATEGORIES = [
  "Ambientación",
  "Artística",
  "Aseo",
  "Banquetería",
  "Branding",
  "Catering",
  "Comunicaciones",
  "Estadía",
  "Implementaciones",
  "Insumos",
  "Logística",
  "Mobiliario",
  "Otros Gastos",
  "Personal",
  "Prod. Promocionales",
  "Provisiones",
  "Recinto",
  "Seguridad",
  "Seguros",
  "Servicios",
  "Técnica",
  "Trámites y Permisos",
  "Vehiculos",
  "Viaticos",
] as const;

export const GAEL_BUDGET_OPERATIONS = [
  "Compra Afecta",
  "Compra Afecta + Imp. Especifico",
  "Compra Afecta en Otra Moneda",
  "Compra Boleta",
  "Compra Exenta",
  "Compra Exenta Otra Moneda",
  "Compra Exportación",
  "Compra Honor. P/Solidario",
  "Compra Honorarios",
  "Compra Internacional",
  "Compra Intl Afecta",
  "Compra Invoice Pesos",
  "Compra Mexico",
  "Compra Mixta",
  "Contrato Intl 20%",
  "Egreso con Recibo",
  "Egreso Otra Moneda (Intl)",
  "Egreso Otra Moneda (local)",
  "Fondo por Rendir",
  "Fondo por Rendir Otra Moneda",
  "NO USAR Compra Honorarios Prest.Solidario",
  "Requisicion Interna (Despacho)",
] as const;

export type GaelBudgetDraftLine = {
  categoria: string;
  concepto: string;
  cantidad: number;
  veces: number;
  unitario: number;
  operacion: string;
  notas: string;
};

export type GaelBudgetExportPayload = {
  projectId: string;
  projectName: string;
  lines: GaelBudgetDraftLine[];
};
