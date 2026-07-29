import {
  getTeamOpenTasks,
  getTeamPeople,
  type TeamOpenTask,
  type TeamPerson,
} from "@/lib/repositories/team.repository";

const ACTIVE_PROJECT_STATUS_CODES = [1, 2, 3, 4];
const EXCLUDED_TASK_STATUS_NAMES = ["Completada", "Cancelada"];

type TeamProjectGroup = {
  projectId: string;
  projectName: string;
  clientName: string;
  statusCode: number;
  statusName: string;
  statusOrder: number;
  taskCount: number;
  nextDueDate: string | null;
  tasks: {
    id: string;
    name: string;
    dueDate: string | null;
  }[];
};

export type TeamMatrixRow = {
  person: TeamPerson;
  totalOpenTasks: number;
  load: {
    label: "Sin carga" | "Óptima" | "Media" | "Alta" | "Sobrecarga";
    percentage: number;
    tone: "zinc" | "green" | "amber" | "red";
  };
  projectsByStatus: Record<number, TeamProjectGroup[]>;
};

export type TeamDashboard = {
  statuses: {
    code: number;
    name: string;
    order: number;
    projectCount: number;
  }[];
  rows: TeamMatrixRow[];
  summary: {
    activeMembers: number;
    activeProjects: number;
    assignedTasks: number;
  };
};

function getLoad(totalOpenTasks: number): TeamMatrixRow["load"] {
  if (totalOpenTasks === 0) {
    return {
      label: "Sin carga",
      percentage: 0,
      tone: "zinc",
    };
  }

  if (totalOpenTasks <= 3) {
    return {
      label: "Óptima",
      percentage: Math.round((totalOpenTasks / 10) * 100),
      tone: "green",
    };
  }

  if (totalOpenTasks <= 6) {
    return {
      label: "Media",
      percentage: Math.round((totalOpenTasks / 10) * 100),
      tone: "amber",
    };
  }

  if (totalOpenTasks <= 9) {
    return {
      label: "Alta",
      percentage: Math.round((totalOpenTasks / 10) * 100),
      tone: "red",
    };
  }

  return {
    label: "Sobrecarga",
    percentage: Math.max(100, Math.round((totalOpenTasks / 10) * 100)),
    tone: "red",
  };
}

function isVisibleTask(task: TeamOpenTask) {
  const statusName = task.estados_tarea?.nombre;
  const project = task.proyectos;
  const projectStatusCode = Number(project?.estados_proyecto?.codigo ?? 0);

  return (
    task.responsable_id !== null &&
    project !== null &&
    !EXCLUDED_TASK_STATUS_NAMES.includes(statusName ?? "") &&
    ACTIVE_PROJECT_STATUS_CODES.includes(projectStatusCode)
  );
}

export async function getTeamDashboard(): Promise<TeamDashboard> {
  const [people, tasks] = await Promise.all([
    getTeamPeople(),
    getTeamOpenTasks(),
  ]);
  const visibleTasks = tasks.filter(isVisibleTask);
  const statusMap = new Map<
    number,
    { code: number; name: string; order: number; projectIds: Set<string> }
  >();
  const personProjectMap = new Map<string, Map<string, TeamProjectGroup>>();

  visibleTasks.forEach((task) => {
    const project = task.proyectos!;
    const statusCode = Number(project.estados_proyecto?.codigo ?? 0);
    const statusName = project.estados_proyecto?.nombre ?? "Sin estado";
    const statusOrder = Number(project.estados_proyecto?.orden ?? statusCode);
    const status = statusMap.get(statusCode) ?? {
      code: statusCode,
      name: statusName,
      order: statusOrder,
      projectIds: new Set<string>(),
    };
    status.projectIds.add(project.id);
    statusMap.set(statusCode, status);

    const personProjects =
      personProjectMap.get(task.responsable_id!) ??
      new Map<string, TeamProjectGroup>();
    const group = personProjects.get(project.id) ?? {
      projectId: project.id,
      projectName: project.nombre,
      clientName: project.clientes?.nombre ?? "Sin cliente",
      statusCode,
      statusName,
      statusOrder,
      taskCount: 0,
      nextDueDate: null,
      tasks: [],
    };

    group.taskCount += 1;
    group.tasks.push({
      id: task.id,
      name: task.nombre,
      dueDate: task.fecha_comprometida,
    });

    if (
      task.fecha_comprometida &&
      (!group.nextDueDate || task.fecha_comprometida < group.nextDueDate)
    ) {
      group.nextDueDate = task.fecha_comprometida;
    }

    personProjects.set(project.id, group);
    personProjectMap.set(task.responsable_id!, personProjects);
  });

  const statuses = ACTIVE_PROJECT_STATUS_CODES.map((code) => {
    const status = statusMap.get(code);

    return {
      code,
      name: status?.name ?? `Estado ${code}`,
      order: status?.order ?? code,
      projectCount: status?.projectIds.size ?? 0,
    };
  }).sort((a, b) => a.order - b.order);
  const rows = people.map((person) => {
    const projects = [
      ...(personProjectMap.get(person.id)?.values() ?? []),
    ].sort(
      (a, b) =>
        b.taskCount - a.taskCount ||
        (a.nextDueDate ?? "9999-12-31").localeCompare(
          b.nextDueDate ?? "9999-12-31"
        ) ||
        a.projectName.localeCompare(b.projectName, "es")
    );
    const projectsByStatus = Object.fromEntries(
      statuses.map((status) => [
        status.code,
        projects.filter((project) => project.statusCode === status.code),
      ])
    ) as Record<number, TeamProjectGroup[]>;
    const totalOpenTasks = projects.reduce(
      (total, project) => total + project.taskCount,
      0
    );

    return {
      person,
      totalOpenTasks,
      load: getLoad(totalOpenTasks),
      projectsByStatus,
    };
  });
  return {
    statuses,
    rows,
    summary: {
      activeMembers: people.length,
      activeProjects: new Set(
        visibleTasks
          .map((task) => task.proyectos?.id)
          .filter(Boolean)
      ).size,
      assignedTasks: visibleTasks.length,
    },
  };
}
