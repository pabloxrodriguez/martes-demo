-- Elimina políticas públicas heredadas y limita el acceso a Personas activas.
-- No modifica datos. Toda la operación es atómica.

begin;

-- Estas funciones legacy existían en producción antes de versionar el
-- endurecimiento RLS. Se definen aquí para que una base limpia pueda ejecutar
-- los revoke/grant posteriores sin depender de estado creado manualmente.
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
      and personas.administrador = true
  );
$function$;

alter table public.clientes enable row level security;
alter table public.estados_proyecto enable row level security;
alter table public.estados_tarea enable row level security;
alter table public.personas enable row level security;
alter table public.plantillas_tarea enable row level security;
alter table public.proyecto_venues enable row level security;
alter table public.proyectos enable row level security;
alter table public.tareas enable row level security;
alter table public.tipos_proyecto enable row level security;
alter table public.venues enable row level security;

-- Retira todas las políticas conocidas para evitar que una política antigua
-- más permisiva anule las reglas canónicas que se crean a continuación.
drop policy if exists "Enable read access for all users" on public.clientes;
drop policy if exists clientes_select_active_users on public.clientes;
drop policy if exists clientes_insert_active_users on public.clientes;
drop policy if exists clientes_update_active_users on public.clientes;

drop policy if exists "Enable read access for all users" on public.estados_proyecto;

drop policy if exists "Anon users can read task statuses" on public.estados_tarea;
drop policy if exists "Authenticated users can read task statuses" on public.estados_tarea;

drop policy if exists "Enable read access for all users" on public.personas;
drop policy if exists personas_select_active_users on public.personas;

drop policy if exists "Enable read access for all users" on public.plantillas_tarea;
drop policy if exists plantillas_tarea_select_active_users on public.plantillas_tarea;
drop policy if exists plantillas_tarea_insert_active_users on public.plantillas_tarea;
drop policy if exists plantillas_tarea_update_active_users on public.plantillas_tarea;

drop policy if exists "Enable read access for all users" on public.proyecto_venues;
drop policy if exists "Enable insert access for all users" on public.proyecto_venues;
drop policy if exists "Enable delete access for all users" on public.proyecto_venues;

drop policy if exists "Enable read access for all users" on public.proyectos;
drop policy if exists "Enable insert access for all users" on public.proyectos;
drop policy if exists "Enable update access for all users" on public.proyectos;
drop policy if exists "Responsable can delete project" on public.proyectos;

drop policy if exists "Usuarios activos pueden ver tareas" on public.tareas;
drop policy if exists "Usuarios activos pueden crear tareas" on public.tareas;
drop policy if exists "Usuarios activos pueden actualizar tareas" on public.tareas;
drop policy if exists task_delete_assignee_or_project_owner on public.tareas;

drop policy if exists "Enable read access for all users" on public.tipos_proyecto;
drop policy if exists tipos_proyecto_select_active_users on public.tipos_proyecto;
drop policy if exists tipos_proyecto_insert_active_users on public.tipos_proyecto;
drop policy if exists tipos_proyecto_update_active_users on public.tipos_proyecto;

drop policy if exists "Enable read access for all users" on public.venues;
drop policy if exists "Enable insert access for all users" on public.venues;
drop policy if exists venues_select_active_users on public.venues;
drop policy if exists venues_insert_active_users on public.venues;
drop policy if exists venues_update_active_users on public.venues;

create policy clientes_select_active_users
on public.clientes for select to authenticated
using ((select public.is_active_person()));

create policy clientes_insert_active_users
on public.clientes for insert to authenticated
with check ((select public.is_active_person()));

create policy clientes_update_active_users
on public.clientes for update to authenticated
using ((select public.is_active_person()))
with check ((select public.is_active_person()));

create policy estados_proyecto_select_active_users
on public.estados_proyecto for select to authenticated
using ((select public.is_active_person()));

create policy estados_tarea_select_active_users
on public.estados_tarea for select to authenticated
using ((select public.is_active_person()));

create policy personas_select_active_users
on public.personas for select to authenticated
using ((select public.is_active_person()));

create policy plantillas_tarea_select_active_users
on public.plantillas_tarea for select to authenticated
using ((select public.is_active_person()));

create policy plantillas_tarea_insert_active_users
on public.plantillas_tarea for insert to authenticated
with check ((select public.is_active_person()));

create policy plantillas_tarea_update_active_users
on public.plantillas_tarea for update to authenticated
using ((select public.is_active_person()))
with check ((select public.is_active_person()));

create policy proyecto_venues_select_active_users
on public.proyecto_venues for select to authenticated
using ((select public.is_active_person()));

create policy proyecto_venues_insert_active_users
on public.proyecto_venues for insert to authenticated
with check ((select public.is_active_person()));

create policy proyecto_venues_delete_active_users
on public.proyecto_venues for delete to authenticated
using ((select public.is_active_person()));

create policy proyectos_select_active_users
on public.proyectos for select to authenticated
using ((select public.is_active_person()));

create policy proyectos_insert_active_users
on public.proyectos for insert to authenticated
with check ((select public.is_active_person()));

create policy proyectos_update_active_users
on public.proyectos for update to authenticated
using ((select public.is_active_person()))
with check ((select public.is_active_person()));

create policy proyectos_delete_project_owner
on public.proyectos for delete to authenticated
using (
  (select public.is_active_person())
  and exists (
    select 1
    from public.personas current_person
    where current_person.auth_user_id = (select auth.uid())
      and current_person.id = proyectos.responsable_id
  )
);

create policy tareas_select_active_users
on public.tareas for select to authenticated
using ((select public.is_active_person()));

create policy tareas_insert_active_users
on public.tareas for insert to authenticated
with check ((select public.is_active_person()));

create policy tareas_update_active_users
on public.tareas for update to authenticated
using ((select public.is_active_person()))
with check ((select public.is_active_person()));

create policy tareas_delete_assignee_or_project_owner
on public.tareas for delete to authenticated
using (
  (select public.is_active_person())
  and exists (
    select 1
    from public.personas current_person
    where current_person.auth_user_id = (select auth.uid())
      and (
        current_person.id = tareas.responsable_id
        or exists (
          select 1
          from public.proyectos project
          where project.id = tareas.proyecto_id
            and project.responsable_id = current_person.id
        )
      )
  )
);

create policy tipos_proyecto_select_active_users
on public.tipos_proyecto for select to authenticated
using ((select public.is_active_person()));

create policy tipos_proyecto_insert_active_users
on public.tipos_proyecto for insert to authenticated
with check ((select public.is_active_person()));

create policy tipos_proyecto_update_active_users
on public.tipos_proyecto for update to authenticated
using ((select public.is_active_person()))
with check ((select public.is_active_person()));

create policy venues_select_active_users
on public.venues for select to authenticated
using ((select public.is_active_person()));

create policy venues_insert_active_users
on public.venues for insert to authenticated
with check ((select public.is_active_person()));

create policy venues_update_active_users
on public.venues for update to authenticated
using ((select public.is_active_person()))
with check ((select public.is_active_person()));

-- Los grants por defecto de Supabase eran mucho más amplios que las
-- operaciones reales. Se reemplazan por una lista mínima explícita.
revoke all privileges on all tables in schema public from anon;
revoke all privileges on all tables in schema public from authenticated;

grant usage on schema public to authenticated;

grant select on
  public.clientes,
  public.estados_proyecto,
  public.estados_tarea,
  public.personas,
  public.plantillas_tarea,
  public.proyecto_venues,
  public.proyectos,
  public.tareas,
  public.tipos_proyecto,
  public.venues
to authenticated;

grant insert, update on
  public.clientes,
  public.plantillas_tarea,
  public.tipos_proyecto,
  public.venues
to authenticated;

grant insert, update, delete on
  public.proyectos,
  public.tareas
to authenticated;

grant insert, delete on public.proyecto_venues to authenticated;

revoke all on function public.es_administrador() from public, anon;
revoke all on function public.es_usuario_activo() from public, anon;
revoke all on function public.is_active_person() from public, anon;
revoke all on function public.link_current_auth_user() from public, anon;

grant execute on function public.es_administrador() to authenticated;
grant execute on function public.es_usuario_activo() to authenticated;
grant execute on function public.is_active_person() to authenticated;
grant execute on function public.link_current_auth_user() to authenticated;

commit;
