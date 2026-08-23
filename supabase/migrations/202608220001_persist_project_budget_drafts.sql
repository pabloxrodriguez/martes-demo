alter table public.proyecto_presupuestos_gael
  alter column gael_presupuesto_id drop not null;

alter table public.proyecto_presupuestos_gael
  add column if not exists origen text not null default 'gael',
  add column if not exists estado_registro text not null default 'oficial';

alter table public.proyecto_presupuestos_gael
  drop constraint if exists proyecto_presupuestos_gael_origen_check;

alter table public.proyecto_presupuestos_gael
  add constraint proyecto_presupuestos_gael_origen_check
  check (origen in ('martes', 'gael'));

alter table public.proyecto_presupuestos_gael
  drop constraint if exists proyecto_presupuestos_gael_estado_registro_check;

alter table public.proyecto_presupuestos_gael
  add constraint proyecto_presupuestos_gael_estado_registro_check
  check (estado_registro in ('borrador', 'oficial'));

create unique index if not exists proyecto_presupuestos_gael_borrador_unico_idx
  on public.proyecto_presupuestos_gael(proyecto_id)
  where origen = 'martes' and estado_registro = 'borrador';

alter table public.proyecto_presupuesto_gael_lineas
  alter column gael_linea_id drop not null;

alter table public.proyecto_presupuesto_gael_lineas
  add column if not exists notas text null;

drop policy if exists "Usuarios autorizados pueden ver presupuestos Gael" on public.proyecto_presupuestos_gael;
drop policy if exists "Usuarios autorizados pueden ver presupuestos" on public.proyecto_presupuestos_gael;
create policy "Usuarios autorizados pueden ver presupuestos"
  on public.proyecto_presupuestos_gael
  for select
  to authenticated
  using (public.can_view_project_gael_budgets(proyecto_id));

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
        and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
    )
  );

drop policy if exists "Editores pueden crear presupuestos Gael" on public.proyecto_presupuestos_gael;
drop policy if exists "Administradores y gestores pueden crear presupuestos" on public.proyecto_presupuestos_gael;
create policy "Administradores y gestores pueden crear presupuestos"
  on public.proyecto_presupuestos_gael
  for insert
  to authenticated
  with check (
    (
      origen = 'martes'
      and estado_registro = 'borrador'
      and (select public.es_administrador())
    )
    or (
      origen = 'gael'
      and estado_registro = 'oficial'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  );

drop policy if exists "Editores pueden actualizar presupuestos Gael" on public.proyecto_presupuestos_gael;
drop policy if exists "Administradores y gestores pueden actualizar presupuestos" on public.proyecto_presupuestos_gael;
create policy "Administradores y gestores pueden actualizar presupuestos"
  on public.proyecto_presupuestos_gael
  for update
  to authenticated
  using (
    (origen = 'martes' and (select public.es_administrador()))
    or (
      origen = 'gael'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  )
  with check (
    (
      origen = 'martes'
      and estado_registro = 'borrador'
      and (select public.es_administrador())
    )
    or (
      origen = 'gael'
      and estado_registro = 'oficial'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  );

drop policy if exists "Editores pueden borrar presupuestos Gael" on public.proyecto_presupuestos_gael;
drop policy if exists "Administradores y gestores pueden borrar presupuestos" on public.proyecto_presupuestos_gael;
create policy "Administradores y gestores pueden borrar presupuestos"
  on public.proyecto_presupuestos_gael
  for delete
  to authenticated
  using (
    (origen = 'martes' and (select public.es_administrador()))
    or (
      origen = 'gael'
      and public.can_view_project_gael_budgets(proyecto_id)
    )
  );

drop policy if exists "Editores pueden crear lineas Gael" on public.proyecto_presupuesto_gael_lineas;
drop policy if exists "Administradores y gestores pueden crear lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
create policy "Administradores y gestores pueden crear lineas de presupuesto"
  on public.proyecto_presupuesto_gael_lineas
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (presupuesto.origen = 'martes' and (select public.es_administrador()))
          or (
            presupuesto.origen = 'gael'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  );

drop policy if exists "Editores pueden actualizar lineas Gael" on public.proyecto_presupuesto_gael_lineas;
drop policy if exists "Administradores y gestores pueden actualizar lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
create policy "Administradores y gestores pueden actualizar lineas de presupuesto"
  on public.proyecto_presupuesto_gael_lineas
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (presupuesto.origen = 'martes' and (select public.es_administrador()))
          or (
            presupuesto.origen = 'gael'
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
          (presupuesto.origen = 'martes' and (select public.es_administrador()))
          or (
            presupuesto.origen = 'gael'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  );

drop policy if exists "Editores pueden borrar lineas Gael" on public.proyecto_presupuesto_gael_lineas;
drop policy if exists "Administradores y gestores pueden borrar lineas de presupuesto" on public.proyecto_presupuesto_gael_lineas;
create policy "Administradores y gestores pueden borrar lineas de presupuesto"
  on public.proyecto_presupuesto_gael_lineas
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.proyecto_presupuestos_gael presupuesto
      where presupuesto.id = proyecto_presupuesto_gael_lineas.presupuesto_id
        and (
          (presupuesto.origen = 'martes' and (select public.es_administrador()))
          or (
            presupuesto.origen = 'gael'
            and public.can_view_project_gael_budgets(presupuesto.proyecto_id)
          )
        )
    )
  );
