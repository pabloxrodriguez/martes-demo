"use server";

import { revalidatePath } from "next/cache";

import {
  deleteProjectTask,
  toggleTaskCompleted,
  updateTaskField,
} from "@/app/(app)/proyectos/[id]/actions";
import { requireEditablePerson } from "@/lib/auth/requireActivePerson";
import type { EditableTaskField } from "@/components/tasks/TaskRow";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireTaskId(value: string) {
  const taskId = value.trim();

  if (!uuidPattern.test(taskId)) {
    throw new Error("La tarea seleccionada no es válida.");
  }

  return taskId;
}

async function getTaskProjectId(taskId: string) {
  const { supabase } = await requireEditablePerson();

  const { data, error } = await supabase
    .from("tareas")
    .select("proyecto_id")
    .eq("id", taskId)
    .eq("eliminada", false)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo verificar la tarea: ${error.message}`
    );
  }

  if (!data) {
    throw new Error("La tarea ya no existe.");
  }

  return data.proyecto_id;
}

export async function updateMyTaskField(
  taskIdInput: string,
  field: EditableTaskField,
  value: string
) {
  const taskId = requireTaskId(taskIdInput);
  const projectId = await getTaskProjectId(taskId);

  await updateTaskField(projectId, taskId, field, value);
  revalidatePath("/mi-martes");
}

export async function toggleMyTaskCompleted(
  taskIdInput: string,
  completed: boolean
) {
  const taskId = requireTaskId(taskIdInput);
  const projectId = await getTaskProjectId(taskId);

  await toggleTaskCompleted(projectId, taskId, completed);
  revalidatePath("/mi-martes");
}

export async function deleteMyTask(taskIdInput: string) {
  const taskId = requireTaskId(taskIdInput);
  const projectId = await getTaskProjectId(taskId);

  await deleteProjectTask(projectId, taskId);
  revalidatePath("/mi-martes");
}
