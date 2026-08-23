import { gaelRequest } from "./client";

type GaelBudgetResponse = {
  count?: number;
  data?: GaelBudgetHeader[];
  detalles?: {
    count?: number;
    data?: GaelBudgetLine[];
  };
};

type GaelBudgetHeader = {
  id: number;
  presu_nombre?: string | null;
  estado?: string | null;
  empresa_nombre?: string | null;
  ucontrol_nombre?: string | null;
  valor_proyectado?: number | null;
  creado_fecha?: string | null;
};

type GaelBudgetLine = {
  id: number;
  categoria?: string | null;
  detalle?: string | null;
  prev_cantidad?: number | null;
  prev_veces?: number | null;
  prev_precio_unit?: number | null;
  prev_precio_total?: number | null;
  operacion?: string | null;
  observaciones?: string | null;
};

export type ImportedGaelBudget = {
  header: {
    gael_presupuesto_id: number;
    nombre: string | null;
    estado: string | null;
    empresa_nombre: string | null;
    ucontrol_nombre: string | null;
    valor_proyectado: number | null;
    fecha_creacion_gael: string | null;
    raw: Record<string, unknown>;
  };
  lines: Array<{
    gael_linea_id: number;
    categoria: string | null;
    concepto: string | null;
    cantidad: number | null;
    veces: number | null;
    unitario: number | null;
    total_proyectado: number | null;
    operacion: string | null;
    notas: string | null;
    orden: number;
    raw: Record<string, unknown>;
  }>;
};

export async function fetchGaelBudget(
  presupuestoId: number
): Promise<ImportedGaelBudget> {
  const response = await gaelRequest<GaelBudgetResponse>({
    path: "/v2/presupuestos/detalle",
    searchParams: {
      id: presupuestoId,
    },
  });

  const header = response.data?.[0];

  if (!header) {
    throw new Error(
      `Gael no encontró el presupuesto ${presupuestoId}.`
    );
  }

  const lines = response.detalles?.data ?? [];

  return {
    header: {
      gael_presupuesto_id: header.id,
      nombre: header.presu_nombre ?? null,
      estado: header.estado ?? null,
      empresa_nombre: header.empresa_nombre ?? null,
      ucontrol_nombre: header.ucontrol_nombre ?? null,
      valor_proyectado: header.valor_proyectado ?? null,
      fecha_creacion_gael: header.creado_fecha ?? null,
      raw: header as Record<string, unknown>,
    },
    lines: lines.map((line, index) => ({
      gael_linea_id: line.id,
      categoria: line.categoria ?? null,
      concepto: line.detalle ?? null,
      cantidad: line.prev_cantidad ?? null,
      veces: line.prev_veces ?? null,
      unitario: line.prev_precio_unit ?? null,
      total_proyectado: line.prev_precio_total ?? null,
      operacion: line.operacion ?? null,
      notas: line.observaciones?.trim() || null,
      orden: index + 1,
      raw: line as Record<string, unknown>,
    })),
  };
}
