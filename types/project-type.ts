import type { TableRow } from "@/types/database";

export type ProjectType = Pick<
  TableRow<"tipos_proyecto">,
  "id" | "nombre"
>;
