drop policy if exists "Administradores y gestores pueden crear presupuestos" on public.proyecto_presupuestos_gael;
drop policy if exists "Usuarios autorizados pueden crear presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden crear presupuestos"
  on public.proyecto_presupuestos_gael
  for insert
  to authenticated
  with check (public.can_view_project_gael_budgets(proyecto_id));

drop policy if exists "Administradores y gestores pueden actualizar presupuestos" on public.proyecto_presupuestos_gael;
drop policy if exists "Usuarios autorizados pueden actualizar presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden actualizar presupuestos"
  on public.proyecto_presupuestos_gael
  for update
  to authenticated
  using (public.can_view_project_gael_budgets(proyecto_id))
  with check (public.can_view_project_gael_budgets(proyecto_id));

drop policy if exists "Administradores y gestores pueden borrar presupuestos" on public.proyecto_presupuestos_gael;
drop policy if exists "Usuarios autorizados pueden borrar presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden borrar presupuestos"
  on public.proyecto_presupuestos_gael
  for delete
  to authenticated
  using (public.can_view_project_gael_budgets(proyecto_id));

drop policy if exists "Administradores y gestores pueden crear lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
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
        and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
    )
  );

drop policy if exists "Administradores y gestores pueden actualizar lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
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
        and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
    )
  )
  with check (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
    )
  );

drop policy if exists "Administradores y gestores pueden borrar lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
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
        and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
    )
  );
