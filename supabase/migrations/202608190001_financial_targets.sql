create table if not exists public.metas_comerciales (
  anio integer primary key,
  meta numeric(15, 2) not null default 0,
  actualizado_por_id uuid null references public.personas(id),
  fecha_creacion timestamp with time zone not null default now(),
  fecha_actualizacion timestamp with time zone not null default now(),
  constraint metas_comerciales_anio_check check (anio between 2000 and 2100),
  constraint metas_comerciales_meta_check check (meta >= 0)
);

alter table public.metas_comerciales enable row level security;

revoke all on table public.metas_comerciales from anon;
revoke all on table public.metas_comerciales from authenticated;
grant select, insert, update on table public.metas_comerciales to authenticated;

drop policy if exists "Direccion puede ver metas comerciales"
  on public.metas_comerciales;
create policy "Direccion puede ver metas comerciales"
  on public.metas_comerciales
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.personas
      where personas.auth_user_id = (select auth.uid())
        and personas.activo = true
        and personas.rol in ('admin', 'direccion')
    )
  );

drop policy if exists "Direccion puede crear metas comerciales"
  on public.metas_comerciales;
create policy "Direccion puede crear metas comerciales"
  on public.metas_comerciales
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.personas
      where personas.auth_user_id = (select auth.uid())
        and personas.activo = true
        and personas.rol in ('admin', 'direccion')
    )
  );

drop policy if exists "Direccion puede actualizar metas comerciales"
  on public.metas_comerciales;
create policy "Direccion puede actualizar metas comerciales"
  on public.metas_comerciales
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.personas
      where personas.auth_user_id = (select auth.uid())
        and personas.activo = true
        and personas.rol in ('admin', 'direccion')
    )
  )
  with check (
    exists (
      select 1
      from public.personas
      where personas.auth_user_id = (select auth.uid())
        and personas.activo = true
        and personas.rol in ('admin', 'direccion')
    )
  );
