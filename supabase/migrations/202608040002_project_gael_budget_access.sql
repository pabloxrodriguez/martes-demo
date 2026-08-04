create table if not exists public.proyecto_presupuesto_gael_accesos (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  persona_id uuid not null references public.personas(id) on delete cascade,
  creado_por_id uuid null references public.personas(id),
  fecha_creacion timestamp with time zone not null default now(),
  constraint proyecto_presupuesto_gael_accesos_proyecto_persona_key unique (
    proyecto_id,
    persona_id
  )
);

create index if not exists proyecto_presupuesto_gael_accesos_proyecto_id_idx
  on public.proyecto_presupuesto_gael_accesos(proyecto_id);

create index if not exists proyecto_presupuesto_gael_accesos_persona_id_idx
  on public.proyecto_presupuesto_gael_accesos(persona_id);

alter table public.proyecto_presupuesto_gael_accesos enable row level security;

drop policy if exists "Usuarios activos pueden ver accesos Gael" on public.proyecto_presupuesto_gael_accesos;
create policy "Usuarios activos pueden ver accesos Gael"
  on public.proyecto_presupuesto_gael_accesos
  for select
  to authenticated
  using (public.is_active_person());

drop policy if exists "Editores pueden crear accesos Gael" on public.proyecto_presupuesto_gael_accesos;
create policy "Editores pueden crear accesos Gael"
  on public.proyecto_presupuesto_gael_accesos
  for insert
  to authenticated
  with check (public.is_editor_person());

drop policy if exists "Editores pueden borrar accesos Gael" on public.proyecto_presupuesto_gael_accesos;
create policy "Editores pueden borrar accesos Gael"
  on public.proyecto_presupuesto_gael_accesos
  for delete
  to authenticated
  using (public.is_editor_person());

grant select, insert, delete on public.proyecto_presupuesto_gael_accesos to authenticated;
