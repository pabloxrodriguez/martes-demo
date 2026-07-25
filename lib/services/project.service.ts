import {
  getMyActiveProjects as getMyActiveProjectsFromRepository,
  getMyOpenTasks as getMyOpenTasksFromRepository,
  getProjectById as getProjectByIdFromRepository,
  getProjectEditOptions as getProjectEditOptionsFromRepository,
  getProjects as getProjectsFromRepository,
  getRecentTaskActivity as getRecentTaskActivityFromRepository,
} from "@/lib/repositories/project.repository";
export type {
  MyActiveProjectItem,
  MyOpenTaskItem,
  RecentTaskActivityItem,
} from "@/lib/repositories/project.repository";

export async function getProjects() {
  return getProjectsFromRepository();
}

export async function getMyOpenTasks(personId: string) {
  return getMyOpenTasksFromRepository(personId);
}

export async function getMyActiveProjects(personId: string) {
  return getMyActiveProjectsFromRepository(personId);
}

export async function getRecentTaskActivity(limit?: number) {
  return getRecentTaskActivityFromRepository(limit);
}

export async function getProjectById(id: string) {
  return getProjectByIdFromRepository(id);
}

export async function getProjectEditOptions() {
  return getProjectEditOptionsFromRepository();
}
