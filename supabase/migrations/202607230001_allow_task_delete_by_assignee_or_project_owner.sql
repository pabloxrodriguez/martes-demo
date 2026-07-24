-- Permite borrar una tarea a:
-- 1. La persona asignada como responsable de la tarea.
-- 2. La persona responsable del proyecto al que pertenece la tarea.

alter table public.tareas enable row level security;

drop policy if exists task_delete_assignee_or_project_owner
on public.tareas;

create policy task_delete_assignee_or_project_owner
on public.tareas
for delete
to authenticated
using (
  exists (
    select 1
    from public.personas as current_person
    where current_person.auth_user_id = (select auth.uid())
      and current_person.activo = true
      and (
        current_person.id = tareas.responsable_id
        or exists (
          select 1
          from public.proyectos
          where proyectos.id = tareas.proyecto_id
            and proyectos.responsable_id = current_person.id
        )
      )
  )
);
