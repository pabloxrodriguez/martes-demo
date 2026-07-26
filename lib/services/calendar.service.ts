import {
  getCalendarProjects,
  type CalendarProject,
} from "@/lib/repositories/calendar.repository";

const PROPOSAL_STATUS_CODES = [1, 2, 3, 4];
const EVENT_STATUS_CODES = [1, 2, 3, 4];
const CONFIRMED_EVENT_STATUS_CODE = 4;
const EXCLUDED_TYPE_NAMES = ["Administrativo - Interno"];

type CalendarPeriod = {
  year: number;
  month: number;
};

export type CalendarMilestone = {
  id: string;
  projectId: string;
  projectName: string;
  date: string;
  kind: "proposal" | "event";
  label:
    | "Entrega propuesta"
    | "Inicio evento"
    | "Evento"
    | "Fin evento"
    | "TBC";
  statusCode: number;
  statusName: string;
};

export type CalendarDay = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  milestones: CalendarMilestone[];
};

export type CalendarDashboard = {
  period: CalendarPeriod;
  title: string;
  previousHref: string;
  nextHref: string;
  todayHref: string;
  days: CalendarDay[];
  summary: {
    proposals: number;
    events: number;
  };
  monthlyMilestones: CalendarMilestone[];
};

function todayDateOnly() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function todayPeriod() {
  const [year, month] = todayDateOnly().split("-").map(Number);

  return {
    year,
    month,
  };
}

function normalizePeriod(params: {
  year?: string | string[];
  month?: string | string[];
}): CalendarPeriod {
  const fallback = todayPeriod();
  const yearValue = Array.isArray(params.year)
    ? params.year[0]
    : params.year;
  const monthValue = Array.isArray(params.month)
    ? params.month[0]
    : params.month;
  const year = Number(yearValue);
  const month = Number(monthValue);

  return {
    year:
      Number.isInteger(year) && year >= 2000 && year <= 2100
        ? year
        : fallback.year,
    month:
      Number.isInteger(month) && month >= 1 && month <= 12
        ? month
        : fallback.month,
  };
}

function dateOnly(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

function dateToDateOnly(date: Date) {
  return dateOnly(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function dateOnlyToUtcDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function addMonths(period: CalendarPeriod, delta: number) {
  const date = new Date(Date.UTC(period.year, period.month - 1 + delta, 1));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

function calendarHref(period: CalendarPeriod) {
  return `/calendario?year=${period.year}&month=${period.month}`;
}

function formatMonthTitle(period: CalendarPeriod) {
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(period.year, period.month - 1, 1)));
}

function isReportableProject(project: CalendarProject) {
  const typeName = project.tipos_proyecto?.nombre;

  return !typeName || !EXCLUDED_TYPE_NAMES.includes(typeName);
}

function normalizeEventEndDate(project: CalendarProject) {
  if (
    project.fecha_evento_termino &&
    project.fecha_evento_inicio &&
    project.fecha_evento_termino >= project.fecha_evento_inicio
  ) {
    return project.fecha_evento_termino;
  }

  return project.fecha_evento_inicio ?? null;
}

function buildMilestones(projects: CalendarProject[]) {
  const milestones: CalendarMilestone[] = [];

  projects
    .filter(isReportableProject)
    .forEach((project) => {
      const statusCode = Number(project.estados_proyecto?.codigo ?? 0);
      const statusName = project.estados_proyecto?.nombre ?? "Sin estado";

      if (
        PROPOSAL_STATUS_CODES.includes(statusCode) &&
        project.fecha_propuesta
      ) {
        milestones.push({
          id: `${project.id}-proposal`,
          projectId: project.id,
          projectName: project.nombre,
          date: project.fecha_propuesta,
          kind: "proposal",
          label: "Entrega propuesta",
          statusCode,
          statusName,
        });
      }

      if (
        EVENT_STATUS_CODES.includes(statusCode) &&
        project.fecha_evento_inicio
      ) {
        const startDate = project.fecha_evento_inicio;
        const endDate = normalizeEventEndDate(project);

        if (!endDate) {
          return;
        }

        const cursor = dateOnlyToUtcDate(startDate);
        const lastDate = dateOnlyToUtcDate(endDate);

        while (cursor <= lastDate) {
          const currentDate = dateToDateOnly(cursor);
          const isFirstDay = currentDate === startDate;
          const isLastDay = currentDate === endDate;
          const label =
            statusCode !== CONFIRMED_EVENT_STATUS_CODE
              ? "TBC"
              : startDate === endDate
              ? "Evento"
              : isFirstDay
                ? "Inicio evento"
                : isLastDay
                  ? "Fin evento"
                  : "Evento";

          milestones.push({
            id: `${project.id}-event-${currentDate}`,
            projectId: project.id,
            projectName: project.nombre,
            date: currentDate,
            kind: "event",
            label,
            statusCode,
            statusName,
          });

          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
      }
    });

  return milestones.sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return a.projectName.localeCompare(b.projectName, "es");
  });
}

function buildCalendarDays(
  period: CalendarPeriod,
  milestones: CalendarMilestone[]
) {
  const today = todayDateOnly();
  const firstDay = new Date(Date.UTC(period.year, period.month - 1, 1));
  const lastDay = new Date(Date.UTC(period.year, period.month, 0));
  const dayOfWeek = firstDay.getUTCDay() || 7;
  const lastDayOfWeek = lastDay.getUTCDay() || 7;
  const gridStart = new Date(firstDay);
  const gridEnd = new Date(lastDay);

  gridStart.setUTCDate(firstDay.getUTCDate() - (dayOfWeek - 1));
  gridEnd.setUTCDate(lastDay.getUTCDate() + (7 - lastDayOfWeek));

  const numberOfDays =
    Math.round(
      (gridEnd.getTime() - gridStart.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(gridStart);

    date.setUTCDate(gridStart.getUTCDate() + index);

    const dateValue = dateOnly(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate()
    );

    return {
      date: dateValue,
      dayNumber: date.getUTCDate(),
      isCurrentMonth:
        date.getUTCFullYear() === period.year &&
        date.getUTCMonth() + 1 === period.month,
      isToday: dateValue === today,
      milestones: milestones.filter(
        (milestone) => milestone.date === dateValue
      ),
    };
  });
}

export async function getCalendarDashboard(params: {
  year?: string | string[];
  month?: string | string[];
}): Promise<CalendarDashboard> {
  const period = normalizePeriod(params);
  const milestones = buildMilestones(await getCalendarProjects());
  const monthPrefix = `${period.year}-${String(period.month).padStart(2, "0")}`;
  const monthlyMilestones = milestones.filter((milestone) =>
    milestone.date.startsWith(monthPrefix)
  );
  const monthlyProposalProjectIds = new Set(
    monthlyMilestones
      .filter((milestone) => milestone.kind === "proposal")
      .map((milestone) => milestone.projectId)
  );
  const monthlyEventProjectIds = new Set(
    monthlyMilestones
      .filter((milestone) => milestone.kind === "event")
      .map((milestone) => milestone.projectId)
  );
  const previousPeriod = addMonths(period, -1);
  const nextPeriod = addMonths(period, 1);

  return {
    period,
    title: formatMonthTitle(period),
    previousHref: calendarHref(previousPeriod),
    nextHref: calendarHref(nextPeriod),
    todayHref: calendarHref(todayPeriod()),
    days: buildCalendarDays(period, milestones),
    summary: {
      proposals: monthlyProposalProjectIds.size,
      events: monthlyEventProjectIds.size,
    },
    monthlyMilestones: monthlyMilestones.slice(0, 8),
  };
}
