-- Convierte las tareas en compromisos administrados exclusivamente por su creador.
-- Los estados visibles se calculan en la aplicación desde la fecha comprometida.

begin;

-- Normaliza compromisos históricos que ya estaban completados.
update public.tareas as task
set fecha_completada = task.fecha_actualizacion::date
from public.estados_tarea as status
where task.estado_id = status.id
  and status.nombre = 'Completada'
  and task.fecha_completada is null;

-- "Cancelada" deja de existir en la experiencia: se conserva como borrado lógico.
update public.tareas as task
set
  eliminada = true,
  fecha_eliminacion = coalesce(task.fecha_eliminacion, now()),
  eliminada_por_id = coalesce(
    task.eliminada_por_id,
    task.actualizada_por_id,
    task.creada_por_id
  ),
  fecha_actualizacion = now()
from public.estados_tarea as status
where task.estado_id = status.id
  and status.nombre = 'Cancelada'
  and task.eliminada = false;

drop policy if exists tareas_insert_active_users on public.tareas;
drop policy if exists tareas_update_active_users on public.tareas;
drop policy if exists tareas_update_creator_only on public.tareas;
drop policy if exists tareas_delete_assignee_or_project_owner on public.tareas;

revoke delete on public.tareas from authenticated;

create policy tareas_insert_active_users
on public.tareas for insert to authenticated
with check (
  (select public.is_editor_person())
  and exists (
    select 1
    from public.personas current_person
    where current_person.auth_user_id = (select auth.uid())
      and current_person.id = tareas.creada_por_id
  )
);

create policy tareas_update_creator_only
on public.tareas for update to authenticated
using (
  (select public.is_editor_person())
  and exists (
    select 1
    from public.personas current_person
    where current_person.auth_user_id = (select auth.uid())
      and current_person.id = tareas.creada_por_id
  )
)
with check (
  (select public.is_editor_person())
  and exists (
    select 1
    from public.personas current_person
    where current_person.auth_user_id = (select auth.uid())
      and current_person.id = tareas.creada_por_id
  )
);

commit;
