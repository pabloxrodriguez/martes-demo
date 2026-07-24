-- Vincula de forma atómica el usuario autenticado con una Persona existente.
-- La identidad se obtiene exclusivamente desde auth.users y nunca desde datos
-- enviados por el navegador.

begin;

create unique index if not exists personas_email_normalized_key
on public.personas ((lower(btrim(email))));

create or replace function public.is_active_person()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.personas
    where personas.auth_user_id = (select auth.uid())
      and personas.activo = true
  );
$$;

revoke all on function public.is_active_person() from public;
revoke all on function public.is_active_person() from anon;
grant execute on function public.is_active_person() to authenticated;

create or replace function public.link_current_auth_user()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_auth_user_id uuid := auth.uid();
  verified_email text;
  person_id uuid;
  person_active boolean;
  linked_auth_user_id uuid;
begin
  if current_auth_user_id is null then
    return 'invalid_session';
  end if;

  select lower(btrim(auth.users.email))
  into verified_email
  from auth.users
  where auth.users.id = current_auth_user_id
    and auth.users.email_confirmed_at is not null;

  if verified_email is null or verified_email = '' then
    return 'unverified_email';
  end if;

  -- Conserva las vinculaciones existentes, incluso si el correo cambió luego.
  select personas.id, personas.activo
  into person_id, person_active
  from public.personas
  where personas.auth_user_id = current_auth_user_id
  for update;

  if found then
    if person_active then
      return 'linked';
    end if;

    return 'inactive';
  end if;

  -- Solo una sesión puede reclamar una Persona pendiente a la vez.
  select personas.id, personas.activo, personas.auth_user_id
  into person_id, person_active, linked_auth_user_id
  from public.personas
  where lower(btrim(personas.email)) = verified_email
  for update;

  if not found then
    return 'not_found';
  end if;

  if not person_active then
    return 'inactive';
  end if;

  if linked_auth_user_id is not null then
    return 'conflict';
  end if;

  update public.personas
  set
    auth_user_id = current_auth_user_id,
    fecha_actualizacion = now()
  where personas.id = person_id
    and personas.auth_user_id is null;

  if not found then
    return 'conflict';
  end if;

  return 'linked';
end;
$$;

revoke all on function public.link_current_auth_user() from public;
revoke all on function public.link_current_auth_user() from anon;
grant execute on function public.link_current_auth_user() to authenticated;

alter table public.personas enable row level security;

drop policy if exists "Enable read access for all users"
on public.personas;

drop policy if exists personas_select_active_users
on public.personas;

create policy personas_select_active_users
on public.personas
for select
to authenticated
using ((select public.is_active_person()));

commit;
