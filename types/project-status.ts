import type { TableRow } from "@/types/database";

export type ProjectStatus = Pick<
  TableRow<"estados_proyecto">,
  "id" | "nombre"
>;
