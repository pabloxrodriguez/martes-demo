-- Agrega autoría básica y borrado lógico de tareas.
-- No borra datos existentes; prepara la base para Mi Martes y actividad reciente.

begin;

alter table public.proyectos
  add column if not exists creado_por_id uuid null references public.personas(id),
  add column if not exists actualizado_por_id uuid null references public.personas(id);

alter table public.tareas
  add column if not exists creada_por_id uuid null references public.personas(id),
  add column if not exists actualizada_por_id uuid null references public.personas(id),
  add column if not exists eliminada boolean not null default false,
  add column if not exists fecha_eliminacion timestamp with time zone null,
  add column if not exists eliminada_por_id uuid null references public.personas(id);

create index if not exists proyectos_creado_por_id_idx
  on public.proyectos (creado_por_id);

create index if not exists proyectos_actualizado_por_id_idx
  on public.proyectos (actualizado_por_id);

create index if not exists tareas_creada_por_id_idx
  on public.tareas (creada_por_id);

create index if not exists tareas_actualizada_por_id_idx
  on public.tareas (actualizada_por_id);

create index if not exists tareas_eliminada_idx
  on public.tareas (eliminada);

create index if not exists tareas_eliminada_por_id_idx
  on public.tareas (eliminada_por_id);

create index if not exists tareas_responsable_abiertas_idx
  on public.tareas (responsable_id, fecha_comprometida, orden)
  where eliminada = false;

drop index if exists public.tareas_plantilla_unica_por_proyecto_idx;

create unique index tareas_plantilla_unica_por_proyecto_idx
  on public.tareas (proyecto_id, plantilla_tarea_id)
  where plantilla_tarea_id is not null
    and eliminada = false;

-- El borrado físico queda fuera del uso normal de la app.
drop policy if exists tareas_delete_assignee_or_project_owner on public.tareas;
drop policy if exists task_delete_assignee_or_project_owner on public.tareas;

revoke delete on public.tareas from authenticated;

commit;
