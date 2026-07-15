import { getProjectStatuses as getProjectStatusesFromRepository } from "@/lib/repositories/project-status.repository";
import type { ProjectStatus } from "@/types/project-status";

export async function getProjectStatuses(): Promise<ProjectStatus[]> {
  return getProjectStatusesFromRepository();
}