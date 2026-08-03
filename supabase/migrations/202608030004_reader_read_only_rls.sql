-- Endurece RLS para que rol lector tenga solo lectura.

begin;

create or replace function public.is_editor_person()
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
      and personas.rol in ('admin', 'direccion', 'equipo')
  );
$function$;

revoke all on function public.is_editor_person() from public, anon;
grant execute on function public.is_editor_person() to authenticated;

drop policy if exists clientes_insert_active_users on public.clientes;
drop policy if exists clientes_update_active_users on public.clientes;
drop policy if exists tipos_proyecto_insert_active_users on public.tipos_proyecto;
drop policy if exists tipos_proyecto_update_active_users on public.tipos_proyecto;
drop policy if exists venues_insert_active_users on public.venues;
drop policy if exists venues_update_active_users on public.venues;
drop policy if exists plantillas_tarea_insert_active_users on public.plantillas_tarea;
drop policy if exists plantillas_tarea_update_active_users on public.plantillas_tarea;
drop policy if exists proyecto_venues_insert_active_users on public.proyecto_venues;
drop policy if exists proyecto_venues_delete_active_users on public.proyecto_venues;
drop policy if exists proyectos_insert_active_users on public.proyectos;
drop policy if exists proyectos_update_active_users on public.proyectos;
drop policy if exists proyectos_delete_project_owner on public.proyectos;
drop policy if exists tareas_insert_active_users on public.tareas;
drop policy if exists tareas_update_active_users on public.tareas;
drop policy if exists tareas_delete_assignee_or_project_owner on public.tareas;

create policy clientes_insert_active_users
on public.clientes for insert to authenticated
with check ((select public.is_editor_person()));

create policy clientes_update_active_users
on public.clientes for update to authenticated
using ((select public.is_editor_person()))
with check ((select public.is_editor_person()));

create policy tipos_proyecto_insert_active_users
on public.tipos_proyecto for insert to authenticated
with check ((select public.is_editor_person()));

create policy tipos_proyecto_update_active_users
on public.tipos_proyecto for update to authenticated
using ((select public.is_editor_person()))
with check ((select public.is_editor_person()));

create policy venues_insert_active_users
on public.venues for insert to authenticated
with check ((select public.is_editor_person()));

create policy venues_update_active_users
on public.venues for update to authenticated
using ((select public.is_editor_person()))
with check ((select public.is_editor_person()));

create policy plantillas_tarea_insert_active_users
on public.plantillas_tarea for insert to authenticated
with check ((select public.is_editor_person()));

create policy plantillas_tarea_update_active_users
on public.plantillas_tarea for update to authenticated
using ((select public.is_editor_person()))
with check ((select public.is_editor_person()));

create policy proyecto_venues_insert_active_users
on public.proyecto_venues for insert to authenticated
with check ((select public.is_editor_person()));

create policy proyecto_venues_delete_active_users
on public.proyecto_venues for delete to authenticated
using ((select public.is_editor_person()));

create policy proyectos_insert_active_users
on public.proyectos for insert to authenticated
with check ((select public.is_editor_person()));

create policy proyectos_update_active_users
on public.proyectos for update to authenticated
using ((select public.is_editor_person()))
with check ((select public.is_editor_person()));

create policy proyectos_delete_project_owner
on public.proyectos for delete to authenticated
using (
  (select public.is_editor_person())
  and exists (
    select 1
    from public.personas current_person
    where current_person.auth_user_id = (select auth.uid())
      and current_person.id = proyectos.responsable_id
  )
);

create policy tareas_insert_active_users
on public.tareas for insert to authenticated
with check ((select public.is_editor_person()));

create policy tareas_update_active_users
on public.tareas for update to authenticated
using ((select public.is_editor_person()))
with check ((select public.is_editor_person()));

create policy tareas_delete_assignee_or_project_owner
on public.tareas for delete to authenticated
using (
  (select public.is_editor_person())
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

commit;
