create or replace function public.can_view_project_gael_budgets(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.personas current_person
    left join public.proyectos target_project
      on target_project.id = target_project_id
    where current_person.auth_user_id = (select auth.uid())
      and current_person.activo = true
      and current_person.rol <> 'lector'
      and (
        current_person.rol in ('admin', 'direccion')
        or target_project.responsable_id = current_person.id
        or exists (
          select 1
          from public.proyecto_presupuesto_gael_accesos access
          where access.proyecto_id = target_project_id
            and access.persona_id = current_person.id
        )
      )
  );
$function$;

create or replace function public.can_manage_project_gael_budgets(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.personas current_person
    left join public.proyectos target_project
      on target_project.id = target_project_id
    where current_person.auth_user_id = (select auth.uid())
      and current_person.activo = true
      and current_person.rol <> 'lector'
      and (
        current_person.rol in ('admin', 'direccion')
        or target_project.responsable_id = current_person.id
      )
  );
$function$;

revoke all on function public.can_view_project_gael_budgets(uuid) from public;
revoke all on function public.can_manage_project_gael_budgets(uuid) from public;
grant execute on function public.can_view_project_gael_budgets(uuid) to authenticated;
grant execute on function public.can_manage_project_gael_budgets(uuid) to authenticated;

drop policy if exists "Usuarios activos pueden ver presupuestos Gael" on public.proyecto_presupuestos_gael;
drop policy if exists "Usuarios autorizados pueden ver presupuestos Gael" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden ver presupuestos Gael"
  on public.proyecto_presupuestos_gael
  for select
  to authenticated
  using (public.can_view_project_gael_budgets(proyecto_id));

drop policy if exists "Usuarios activos pueden ver lineas Gael" on public.proyecto_presupuesto_gael_lineas;
drop policy if exists "Usuarios autorizados pueden ver lineas Gael" on public.proyecto_presupuesto_gael_lineas;
create policy "Usuarios autorizados pueden ver lineas Gael"
  on public.proyecto_presupuesto_gael_lineas
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
    )
  );

drop policy if exists "Usuarios activos pueden ver accesos Gael" on public.proyecto_presupuesto_gael_accesos;
drop policy if exists "Usuarios autorizados pueden ver accesos Gael" on public.proyecto_presupuesto_gael_accesos;
create policy "Usuarios autorizados pueden ver accesos Gael"
  on public.proyecto_presupuesto_gael_accesos
  for select
  to authenticated
  using (public.can_view_project_gael_budgets(proyecto_id));

drop policy if exists "Editores pueden crear accesos Gael" on public.proyecto_presupuesto_gael_accesos;
drop policy if exists "Responsable direccion admin pueden crear accesos Gael" on public.proyecto_presupuesto_gael_accesos;
create policy "Responsable direccion admin pueden crear accesos Gael"
  on public.proyecto_presupuesto_gael_accesos
  for insert
  to authenticated
  with check (public.can_manage_project_gael_budgets(proyecto_id));

drop policy if exists "Editores pueden borrar accesos Gael" on public.proyecto_presupuesto_gael_accesos;
drop policy if exists "Responsable direccion admin pueden borrar accesos Gael" on public.proyecto_presupuesto_gael_accesos;
create policy "Responsable direccion admin pueden borrar accesos Gael"
  on public.proyecto_presupuesto_gael_accesos
  for delete
  to authenticated
  using (public.can_manage_project_gael_budgets(proyecto_id));
