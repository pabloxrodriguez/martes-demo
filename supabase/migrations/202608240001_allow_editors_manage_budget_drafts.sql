create or replace function public.can_manage_project_budget_draft()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.personas current_person
    where current_person.auth_user_id = (select auth.uid())
      and current_person.activo = true
      and current_person.rol <> 'lector'
  );
$function$;

revoke all on function public.can_manage_project_budget_draft() from public;
grant execute on function public.can_manage_project_budget_draft() to authenticated;

drop policy if exists "Usuarios autorizados pueden ver presupuestos Gael" on public.proyecto_presupuestos_gael;
drop policy if exists "Usuarios autorizados pueden ver presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden ver presupuestos"
  on public.proyecto_presupuestos_gael
  for select
  to authenticated
  using (
    (
      origen = 'martes'
      and estado_registro = 'borrador'
      and public.can_manage_project_budget_draft()
    )
    or (
      origen = 'gael'
      and estado_registro = 'oficial'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  );

drop policy if exists "Usuarios autorizados pueden crear presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden crear presupuestos"
  on public.proyecto_presupuestos_gael
  for insert
  to authenticated
  with check (
    (
      origen = 'martes'
      and estado_registro = 'borrador'
      and public.can_manage_project_budget_draft()
    )
    or (
      origen = 'gael'
      and estado_registro = 'oficial'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  );

drop policy if exists "Usuarios autorizados pueden actualizar presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden actualizar presupuestos"
  on public.proyecto_presupuestos_gael
  for update
  to authenticated
  using (
    (
      origen = 'martes'
      and estado_registro = 'borrador'
      and public.can_manage_project_budget_draft()
    )
    or (
      origen = 'gael'
      and estado_registro = 'oficial'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  )
  with check (
    (
      origen = 'martes'
      and estado_registro = 'borrador'
      and public.can_manage_project_budget_draft()
    )
    or (
      origen = 'gael'
      and estado_registro = 'oficial'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  );

drop policy if exists "Usuarios autorizados pueden borrar presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden borrar presupuestos"
  on public.proyecto_presupuestos_gael
  for delete
  to authenticated
  using (
    (
      origen = 'martes'
      and estado_registro = 'borrador'
      and public.can_manage_project_budget_draft()
    )
    or (
      origen = 'gael'
      and estado_registro = 'oficial'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  );

drop policy if exists "Usuarios autorizados pueden ver lineas Gael" on public.proyecto_presupuesto_gael_lineas;
drop policy if exists "Usuarios autorizados pueden ver lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
create policy "Usuarios autorizados pueden ver lineas de presupuesto"
  on public.proyecto_presupuesto_gael_lineas
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (
            presupuesto.origen = 'martes'
            and presupuesto.estado_registro = 'borrador'
            and public.can_manage_project_budget_draft()
          )
          or (
            presupuesto.origen = 'gael'
            and presupuesto.estado_registro = 'oficial'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  );

drop policy if exists "Usuarios autorizados pueden crear lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
create policy "Usuarios autorizados pueden crear lineas de presupuesto"
  on public.proyecto_presupuesto_gael_lineas
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (
            presupuesto.origen = 'martes'
            and presupuesto.estado_registro = 'borrador'
            and public.can_manage_project_budget_draft()
          )
          or (
            presupuesto.origen = 'gael'
            and presupuesto.estado_registro = 'oficial'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  );

drop policy if exists "Usuarios autorizados pueden actualizar lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
create policy "Usuarios autorizados pueden actualizar lineas de presupuesto"
  on public.proyecto_presupuesto_gael_lineas
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (
            presupuesto.origen = 'martes'
            and presupuesto.estado_registro = 'borrador'
            and public.can_manage_project_budget_draft()
          )
          or (
            presupuesto.origen = 'gael'
            and presupuesto.estado_registro = 'oficial'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (
            presupuesto.origen = 'martes'
            and presupuesto.estado_registro = 'borrador'
            and public.can_manage_project_budget_draft()
          )
          or (
            presupuesto.origen = 'gael'
            and presupuesto.estado_registro = 'oficial'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  );

drop policy if exists "Usuarios autorizados pueden borrar lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
create policy "Usuarios autorizados pueden borrar lineas de presupuesto"
  on public.proyecto_presupuesto_gael_lineas
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (
            presupuesto.origen = 'martes'
            and presupuesto.estado_registro = 'borrador'
            and public.can_manage_project_budget_draft()
          )
          or (
            presupuesto.origen = 'gael'
            and presupuesto.estado_registro = 'oficial'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  );
