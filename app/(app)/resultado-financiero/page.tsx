import { redirect } from "next/navigation";

import { ResultsPageContent } from "@/app/(app)/resultados/page";
import { requireActivePerson } from "@/lib/auth/requireActivePerson";

type PageProps = {
  searchParams?: Promise<{
    from?: string | string[];
    to?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { person } = await requireActivePerson();

  if (person.rol !== "admin" && person.rol !== "direccion") {
    redirect("/acceso-denegado");
  }

  return (
    <ResultsPageContent
      searchParams={searchParams}
      title="Resultado Financiero"
      description="Visión financiera del desempeño de La Oreja Lab según la fecha comercial de cada proyecto. Incluye valores comerciales y no considera Administrativos - Internos ni Descartados - Cancelados."
      showFinancialValues
    />
  );
}
