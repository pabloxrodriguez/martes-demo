import { getProjects as getProjectsFromRepository } from "@/lib/repositories/project.repository";

export async function getProjects() {
  return getProjectsFromRepository();
}