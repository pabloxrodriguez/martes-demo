import { getProjectTypes as getProjectTypesFromRepository } from "@/lib/repositories/project-type.repository";
import type { ProjectType } from "@/types/project-type";

export async function getProjectTypes(): Promise<ProjectType[]> {
  return getProjectTypesFromRepository();
}