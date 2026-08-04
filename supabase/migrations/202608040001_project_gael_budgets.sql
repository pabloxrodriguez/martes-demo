create table if not exists public.proyecto_presupuestos_gael (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  gael_presupuesto_id integer not null,
  nombre text null,
  estado text null,
  empresa_nombre text null,
  ucontrol_nombre text null,
  valor_proyectado numeric null,
  fecha_creacion_gael timestamp with time zone null,
  fecha_importacion timestamp with time zone not null default now(),
  fecha_actualizacion timestamp with time zone not null default now(),
  creado_por_id uuid null references public.personas(id),
  actualizado_por_id uuid null references public.personas(id),
  raw jsonb null,
  constraint proyecto_presupuestos_gael_proyecto_presupuesto_key unique (
    proyecto_id,
    gael_presupuesto_id
  )
);

create table if not exists public.proyecto_presupuesto_gael_lineas (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.proyecto_presupuestos_gael(id) on delete cascade,
  gael_linea_id integer not null,
  categoria text null,
  concepto text null,
  cantidad numeric null,
  veces numeric null,
  unitario numeric null,
  total_proyectado numeric null,
  operacion text null,
  orden integer not null default 0,
  raw jsonb null,
  constraint proyecto_presupuesto_gael_lineas_presupuesto_linea_key unique (
    presupuesto_id,
    gael_linea_id
  )
);

create index if not exists proyecto_presupuestos_gael_proyecto_id_idx
  on public.proyecto_presupuestos_gael(proyecto_id);

create index if not exists proyecto_presupuesto_gael_lineas_presupuesto_id_idx
  on public.proyecto_presupuesto_gael_lineas(presupuesto_id);

alter table public.proyecto_presupuestos_gael enable row level security;
alter table public.proyecto_presupuesto_gael_lineas enable row level security;

drop policy if exists "Usuarios activos pueden ver presupuestos Gael" on public.proyecto_presupuestos_gael;
create policy "Usuarios activos pueden ver presupuestos Gael"
  on public.proyecto_presupuestos_gael
  for select
  to authenticated
  using (public.is_active_person());

drop policy if exists "Editores pueden crear presupuestos Gael" on public.proyecto_presupuestos_gael;
create policy "Editores pueden crear presupuestos Gael"
  on public.proyecto_presupuestos_gael
  for insert
  to authenticated
  with check (public.is_editor_person());

drop policy if exists "Editores pueden actualizar presupuestos Gael" on public.proyecto_presupuestos_gael;
create policy "Editores pueden actualizar presupuestos Gael"
  on public.proyecto_presupuestos_gael
  for update
  to authenticated
  using (public.is_editor_person())
  with check (public.is_editor_person());

drop policy if exists "Editores pueden borrar presupuestos Gael" on public.proyecto_presupuestos_gael;
create policy "Editores pueden borrar presupuestos Gael"
  on public.proyecto_presupuestos_gael
  for delete
  to authenticated
  using (public.is_editor_person());

drop policy if exists "Usuarios activos pueden ver lineas Gael" on public.proyecto_presupuesto_gael_lineas;
create policy "Usuarios activos pueden ver lineas Gael"
  on public.proyecto_presupuesto_gael_lineas
  for select
  to authenticated
  using (
    public.is_active_person()
    and exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
    )
  );

drop policy if exists "Editores pueden crear lineas Gael" on public.proyecto_presupuesto_gael_lineas;
create policy "Editores pueden crear lineas Gael"
  on public.proyecto_presupuesto_gael_lineas
  for insert
  to authenticated
  with check (public.is_editor_person());

drop policy if exists "Editores pueden actualizar lineas Gael" on public.proyecto_presupuesto_gael_lineas;
create policy "Editores pueden actualizar lineas Gael"
  on public.proyecto_presupuesto_gael_lineas
  for update
  to authenticated
  using (public.is_editor_person())
  with check (public.is_editor_person());

drop policy if exists "Editores pueden borrar lineas Gael" on public.proyecto_presupuesto_gael_lineas;
create policy "Editores pueden borrar lineas Gael"
  on public.proyecto_presupuesto_gael_lineas
  for delete
  to authenticated
  using (public.is_editor_person());

grant select, insert, update, delete on public.proyecto_presupuestos_gael to authenticated;
grant select, insert, update, delete on public.proyecto_presupuesto_gael_lineas to authenticated;
