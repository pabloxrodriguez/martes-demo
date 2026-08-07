create table if not exists public.google_connections (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  google_email text null,
  access_token_encrypted text not null,
  refresh_token_encrypted text null,
  scope text not null,
  expires_at timestamp with time zone not null,
  connected_at timestamp with time zone not null default now(),
  fecha_actualizacion timestamp with time zone not null default now(),
  constraint google_connections_persona_id_key unique (persona_id)
);

create index if not exists google_connections_persona_id_idx
  on public.google_connections(persona_id);

alter table public.google_connections enable row level security;

drop policy if exists "Usuarios pueden ver su conexion Google" on public.google_connections;
create policy "Usuarios pueden ver su conexion Google"
  on public.google_connections
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.personas
      where personas.id = google_connections.persona_id
        and personas.auth_user_id = (select auth.uid())
        and personas.activo = true
    )
  );

drop policy if exists "Usuarios pueden crear su conexion Google" on public.google_connections;
create policy "Usuarios pueden crear su conexion Google"
  on public.google_connections
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.personas
      where personas.id = google_connections.persona_id
        and personas.auth_user_id = (select auth.uid())
        and personas.activo = true
    )
  );

drop policy if exists "Usuarios pueden actualizar su conexion Google" on public.google_connections;
create policy "Usuarios pueden actualizar su conexion Google"
  on public.google_connections
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.personas
      where personas.id = google_connections.persona_id
        and personas.auth_user_id = (select auth.uid())
        and personas.activo = true
    )
  )
  with check (
    exists (
      select 1
      from public.personas
      where personas.id = google_connections.persona_id
        and personas.auth_user_id = (select auth.uid())
        and personas.activo = true
    )
  );

drop policy if exists "Usuarios pueden borrar su conexion Google" on public.google_connections;
create policy "Usuarios pueden borrar su conexion Google"
  on public.google_connections
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.personas
      where personas.id = google_connections.persona_id
        and personas.auth_user_id = (select auth.uid())
        and personas.activo = true
    )
  );

grant select, insert, update, delete on public.google_connections to authenticated;
