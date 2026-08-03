-- Versiona funciones legacy detectadas en producción y las alinea con el
-- modelo actual de roles. Mantiene compatibilidad con administrador boolean.

begin;

create or replace function public.es_usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.is_active_person();
$function$;

create or replace function public.es_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.personas
    where personas.auth_user_id = (select auth.uid())
      and personas.activo = true
      and (
        personas.rol = 'admin'
        or personas.administrador = true
      )
  );
$function$;

revoke all on function public.es_usuario_activo() from public, anon;
revoke all on function public.es_administrador() from public, anon;

grant execute on function public.es_usuario_activo() to authenticated;
grant execute on function public.es_administrador() to authenticated;

commit;
