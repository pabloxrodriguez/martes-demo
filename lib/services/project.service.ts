import {
  getProjectById as getProjectByIdFromRepository,
  getProjectEditOptions as getProjectEditOptionsFromRepository,
  getProjects as getProjectsFromRepository,
} from "@/lib/repositories/project.repository";

export async function getProjects() {
  return getProjectsFromRepository();
}

export async function getProjectById(id: string) {
  return getProjectByIdFromRepository(id);
}

export async function getProjectEditOptions() {
  return getProjectEditOptionsFromRepository();
}