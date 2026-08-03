-- Permite que usuarios admin gestionen personas desde la app.

begin;

drop policy if exists personas_insert_admin_users
on public.personas;

drop policy if exists personas_update_admin_users
on public.personas;

create policy personas_insert_admin_users
on public.personas
for insert
to authenticated
with check ((select public.es_administrador()));

create policy personas_update_admin_users
on public.personas
for update
to authenticated
using ((select public.es_administrador()))
with check ((select public.es_administrador()));

commit;
