-- Amplía los datos de contacto del cliente y permite administrar el catálogo
-- a cualquier persona activa de MARTES. El borrado físico permanece bloqueado.

alter table public.clientes
  add column if not exists contacto_nombre text,
  add column if not exists contacto_correo text,
  add column if not exists contacto_celular text;

alter table public.clientes enable row level security;

drop policy if exists "Enable read access for all users"
on public.clientes;

drop policy if exists clientes_select_active_users
on public.clientes;

create policy clientes_select_active_users
on public.clientes
for select
to authenticated
using (
  exists (
    select 1
    from public.personas
    where personas.auth_user_id = (select auth.uid())
      and personas.activo = true
  )
);

drop policy if exists clientes_insert_active_users
on public.clientes;

create policy clientes_insert_active_users
on public.clientes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.personas
    where personas.auth_user_id = (select auth.uid())
      and personas.activo = true
  )
);

drop policy if exists clientes_update_active_users
on public.clientes;

create policy clientes_update_active_users
on public.clientes
for update
to authenticated
using (
  exists (
    select 1
    from public.personas
    where personas.auth_user_id = (select auth.uid())
      and personas.activo = true
  )
)
with check (
  exists (
    select 1
    from public.personas
    where personas.auth_user_id = (select auth.uid())
      and personas.activo = true
  )
);
