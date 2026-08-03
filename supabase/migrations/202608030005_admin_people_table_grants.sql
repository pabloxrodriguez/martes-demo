-- Permisos base para que las políticas RLS de administración de personas
-- puedan operar desde usuarios autenticados. RLS sigue restringiendo a admin.

begin;

grant insert, update on public.personas to authenticated;

commit;
