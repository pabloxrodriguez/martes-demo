import {
  getResultsProjects,
  type ResultsProject,
} from "@/lib/repositories/results.repository";

const PIPELINE_STATUS_CODES = [1, 2, 3, 4];
const COMMERCIAL_STATUS_CODES = [1, 2, 3, 4, 5, 6];
const WON_STATUS_CODES = [4, 5];
const REALIZED_STATUS_CODE = 5;
const LOST_STATUS_CODE = 6;
const EXCLUDED_TYPE_NAMES = ["Administrativo - Interno"];

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

type ResultsProjectItem = ResultsProject & {
  statusCode: number;
  statusName: string;
  metricDate: string | null;
  value: number;
};

type GroupedMetric = {
  name: string;
  projects: number;
  value: number;
  percentage: number;
};

export type ResultsPeriod = {
  from: string;
  to: string;
};

export type ResultsDashboard = {
  period: ResultsPeriod;
  summary: {
    wonSalesValue: number;
    managedProjects: number;
    wonProjects: number;
    lostProjects: number;
    successRate: number | null;
  };
  monthlyEvolution: {
    key: string;
    month: string;
    year: string;
    value: number;
    projects: number;
  }[];
  pipeline: GroupedMetric[];
  salesByClient: GroupedMetric[];
  salesByType: GroupedMetric[];
  projectsByType: GroupedMetric[];
  realized: {
    projects: number;
    value: number;
  };
  reminders: {
    noOlvidar: number;
  };
};

export const RESULT_METRICS = [
  "gestionados",
  "ganados",
  "no-ganados",
] as const;

export type ResultMetric = (typeof RESULT_METRICS)[number];

export type ResultsDetailProject = ResultsProjectItem;

function buildDefaultPeriod(): ResultsPeriod {
  const currentYear = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
  }).format(new Date());

  return {
    from: `${currentYear}-01-01`,
    to: `${currentYear}-12-31`,
  };
}

function isDateOnly(value: string | null | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function normalizePeriod(
  from?: string | string[],
  to?: string | string[]
): ResultsPeriod {
  const defaultPeriod = buildDefaultPeriod();
  const fromValue = Array.isArray(from) ? from[0] : from;
  const toValue = Array.isArray(to) ? to[0] : to;

  const cleanFrom = isDateOnly(fromValue) ? fromValue! : defaultPeriod.from;
  const cleanTo = isDateOnly(toValue) ? toValue! : defaultPeriod.to;

  if (cleanFrom > cleanTo) {
    return {
      from: cleanTo,
      to: cleanFrom,
    };
  }

  return {
    from: cleanFrom,
    to: cleanTo,
  };
}

export function isResultMetric(value: unknown): value is ResultMetric {
  return (
    typeof value === "string" &&
    RESULT_METRICS.includes(value as ResultMetric)
  );
}

export function getResultMetricLabel(metric: ResultMetric) {
  if (metric === "gestionados") {
    return "Proyectos gestionados";
  }

  if (metric === "ganados") {
    return "Proyectos ganados";
  }

  return "Proyectos no ganados";
}

function getMetricDate(project: ResultsProjectItem) {
  if (project.statusCode === LOST_STATUS_CODE) {
    return project.fecha_propuesta;
  }

  if (project.fecha_evento_inicio) {
    return project.fecha_evento_inicio;
  }

  if (project.statusCode <= 4) {
    return project.fecha_propuesta;
  }

  return null;
}

function isReportableProject(project: ResultsProjectItem) {
  const typeName = project.tipos_proyecto?.nombre;

  return !typeName || !EXCLUDED_TYPE_NAMES.includes(typeName);
}

function asResultsProject(project: ResultsProject): ResultsProjectItem {
  const statusCode = Number(project.estados_proyecto?.codigo ?? 0);
  const metricDate = getMetricDate({
    ...project,
    statusCode,
    statusName: project.estados_proyecto?.nombre ?? "Sin estado",
    metricDate: null,
    value: Number(project.valor_venta ?? 0),
  });

  return {
    ...project,
    statusCode,
    statusName: project.estados_proyecto?.nombre ?? "Sin estado",
    metricDate,
    value: Number(project.valor_venta ?? 0),
  };
}

function inPeriod(project: ResultsProjectItem, period: ResultsPeriod) {
  return (
    project.metricDate !== null &&
    project.metricDate >= period.from &&
    project.metricDate <= period.to
  );
}

function calculatePercentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 1000) / 10;
}

function groupProjects(
  projects: ResultsProjectItem[],
  getName: (project: ResultsProjectItem) => string,
  percentageBasis: "value" | "projects" = "value"
): GroupedMetric[] {
  const groups = new Map<string, { projects: number; value: number }>();

  projects.forEach((project) => {
    const name = getName(project);
    const current = groups.get(name) ?? {
      projects: 0,
      value: 0,
    };

    groups.set(name, {
      projects: current.projects + 1,
      value: current.value + project.value,
    });
  });

  const totals = [...groups.values()].reduce(
    (accumulator, group) => ({
      projects: accumulator.projects + group.projects,
      value: accumulator.value + group.value,
    }),
    {
      projects: 0,
      value: 0,
    }
  );

  return [...groups.entries()]
    .map(([name, group]) => ({
      name,
      ...group,
      percentage: calculatePercentage(
        percentageBasis === "value" ? group.value : group.projects,
        percentageBasis === "value" ? totals.value : totals.projects
      ),
    }))
    .sort((a, b) => b.value - a.value || b.projects - a.projects);
}

function buildMonthlyBuckets(period: ResultsPeriod) {
  const buckets: {
    key: string;
    month: string;
    year: string;
    value: number;
    projects: number;
  }[] = [];
  const [fromYear, fromMonth] = period.from
    .split("-")
    .map(Number);
  const [toYear, toMonth] = period.to.split("-").map(Number);
  let year = fromYear;
  let month = fromMonth;

  while (
    year < toYear ||
    (year === toYear && month <= toMonth)
  ) {
    buckets.push({
      key: `${year}-${String(month).padStart(2, "0")}`,
      month: MONTH_LABELS[month - 1],
      year: String(year),
      value: 0,
      projects: 0,
    });

    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return buckets;
}

export async function getResultsDashboard(
  params: {
    from?: string | string[];
    to?: string | string[];
  } = {}
): Promise<ResultsDashboard> {
  const period = normalizePeriod(params.from, params.to);
  const projects = (await getResultsProjects()).map(asResultsProject);

  const commercialProjects = projects.filter(
    (project) =>
      isReportableProject(project) &&
      COMMERCIAL_STATUS_CODES.includes(project.statusCode) &&
      inPeriod(project, period)
  );
  const wonProjects = commercialProjects.filter((project) =>
    WON_STATUS_CODES.includes(project.statusCode)
  );
  const lostProjects = commercialProjects.filter(
    (project) => project.statusCode === LOST_STATUS_CODE
  );
  const pipelineProjects = commercialProjects.filter((project) =>
    PIPELINE_STATUS_CODES.includes(project.statusCode)
  );
  const realizedProjects = commercialProjects.filter(
    (project) => project.statusCode === REALIZED_STATUS_CODE
  );

  const monthlyEvolution = buildMonthlyBuckets(period);

  wonProjects.forEach((project) => {
    const monthKey = project.metricDate?.slice(0, 7);
    const bucket = monthlyEvolution.find(
      (item) => item.key === monthKey
    );

    if (!bucket) {
      return;
    }

    bucket.value += project.value;
    bucket.projects += 1;
  });

  const closedProjects = wonProjects.length + lostProjects.length;

  return {
    period,
    summary: {
      wonSalesValue: wonProjects.reduce(
        (total, project) => total + project.value,
        0
      ),
      managedProjects: commercialProjects.length,
      wonProjects: wonProjects.length,
      lostProjects: lostProjects.length,
      successRate:
        closedProjects > 0
          ? Math.round((wonProjects.length / closedProjects) * 100)
          : null,
    },
    monthlyEvolution,
    pipeline: groupProjects(
      pipelineProjects,
      (project) => project.statusName,
      "value"
    ),
    salesByClient: groupProjects(
      wonProjects,
      (project) => project.clientes?.nombre ?? "Sin cliente",
      "value"
    ),
    salesByType: groupProjects(
      wonProjects,
      (project) => project.tipos_proyecto?.nombre ?? "Sin tipo",
      "value"
    ),
    projectsByType: groupProjects(
      commercialProjects,
      (project) => project.tipos_proyecto?.nombre ?? "Sin tipo",
      "projects"
    ),
    realized: {
      projects: realizedProjects.length,
      value: realizedProjects.reduce(
        (total, project) => total + project.value,
        0
      ),
    },
    reminders: {
      noOlvidar: projects.filter(
        (project) =>
          isReportableProject(project) && project.statusCode === 7
      ).length,
    },
  };
}

export async function getResultsDetail(
  metric: ResultMetric,
  params: {
    from?: string | string[];
    to?: string | string[];
  } = {}
) {
  const period = normalizePeriod(params.from, params.to);
  const projects = (await getResultsProjects())
    .map(asResultsProject)
    .filter(
      (project) =>
        isReportableProject(project) &&
        COMMERCIAL_STATUS_CODES.includes(project.statusCode) &&
        inPeriod(project, period)
    );

  const filteredProjects =
    metric === "gestionados"
      ? projects
      : metric === "ganados"
        ? projects.filter((project) =>
            WON_STATUS_CODES.includes(project.statusCode)
          )
        : projects.filter(
            (project) => project.statusCode === LOST_STATUS_CODE
          );

  return {
    period,
    metric,
    title: getResultMetricLabel(metric),
    projects: filteredProjects.sort((a, b) => {
      const dateComparison = (a.metricDate ?? "9999-12-31").localeCompare(
        b.metricDate ?? "9999-12-31"
      );

      if (dateComparison !== 0) {
        return dateComparison;
      }

      return a.nombre.localeCompare(b.nombre, "es");
    }),
  };
}
