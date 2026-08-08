begin;

alter table public.proyectos
  add column if not exists eliminado boolean not null default false,
  add column if not exists fecha_eliminacion timestamp with time zone null,
  add column if not exists eliminado_por_id uuid null references public.personas(id);

create index if not exists proyectos_eliminado_idx
  on public.proyectos (eliminado);

create index if not exists proyectos_eliminado_por_id_idx
  on public.proyectos (eliminado_por_id);

drop policy if exists proyectos_delete_project_owner on public.proyectos;

commit;
