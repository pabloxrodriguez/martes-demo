export type CommitmentStatus =
  | "in_progress"
  | "due_today"
  | "overdue"
  | "completed";

type CommitmentStatusInput = {
  fecha_comprometida: string | null;
  fecha_completada: string | null;
};

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  in_progress: "En curso",
  due_today: "Vence hoy",
  overdue: "Atrasada",
  completed: "Cumplida",
};

export function getCommitmentStatus(
  commitment: CommitmentStatusInput,
  today: string
): CommitmentStatus {
  if (commitment.fecha_completada) {
    return "completed";
  }

  if (!commitment.fecha_comprometida || commitment.fecha_comprometida > today) {
    return "in_progress";
  }

  if (commitment.fecha_comprometida === today) {
    return "due_today";
  }

  return "overdue";
}

