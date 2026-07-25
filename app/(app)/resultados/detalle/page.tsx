import Link from "next/link";
import { notFound } from "next/navigation";

import { ResultsEditableProjectsTable } from "@/components/results/ResultsEditableProjectsTable";
import {
  getResultsDetail,
  isResultMetric,
} from "@/lib/services/results.service";
import { getProjectEditOptions } from "@/lib/services/project.service";

type PageProps = {
  searchParams?: Promise<{
    metric?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function ResultsDetailPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const metric = getFirst(params?.metric);

  if (!isResultMetric(metric)) {
    notFound();
  }

  const [detail, editOptions] = await Promise.all([
    getResultsDetail(metric, {
      from: params?.from,
      to: params?.to,
    }),
    getProjectEditOptions(),
  ]);

  const statusOptions = editOptions.statuses.map((status) => ({
    value: status.id,
    label: status.nombre,
  }));

  const backHref = `/resultados?from=${detail.period.from}&to=${detail.period.to}`;

  return (
    <main className="p-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <Link
          href={backHref}
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-950"
        >
          ← Resultados
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950">
              {detail.title}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {detail.projects.length} proyecto(s) entre{" "}
              {formatDate(detail.period.from)} y{" "}
              {formatDate(detail.period.to)}.
            </p>
          </div>

          <Link
            href={backHref}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Actualizar reporte
          </Link>
        </div>

        <p className="mt-4 max-w-4xl text-sm text-zinc-500">
          Edita solo los campos que afectan Resultados. Al guardar,
          usa “Actualizar reporte” para volver al dashboard con los
          números recalculados.
        </p>

        <div className="mt-8">
          <ResultsEditableProjectsTable
            projects={detail.projects}
            statusOptions={statusOptions}
          />
        </div>
      </div>
    </main>
  );
}
