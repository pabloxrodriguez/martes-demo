begin;

-- Conserva los presupuestos existentes y elimina nombres ligados al sistema
-- externo que dio origen al módulo.

alter table public.proyecto_presupuestos_gael
  rename to proyecto_presupuestos;

alter table public.proyecto_presupuestos
  rename column gael_presupuesto_id to numero_referencia;

alter table public.proyecto_presupuestos
  rename column fecha_creacion_gael to fecha_origen;

alter table public.proyecto_presupuesto_gael_lineas
  rename to proyecto_presupuesto_lineas;

alter table public.proyecto_presupuesto_lineas
  rename column gael_linea_id to linea_externa_id;

alter table public.proyecto_presupuesto_gael_accesos
  rename to proyecto_presupuesto_accesos;

update public.proyecto_presupuestos
set origen = 'importado'
where origen = 'gael';

alter table public.proyecto_presupuestos
  drop constraint if exists proyecto_presupuestos_gael_origen_check;

alter table public.proyecto_presupuestos
  add constraint proyecto_presupuestos_origen_check
  check (origen in ('martes', 'importado'));

alter table public.proyecto_presupuestos
  rename constraint proyecto_presupuestos_gael_pkey
  to proyecto_presupuestos_pkey;

alter table public.proyecto_presupuestos
  rename constraint proyecto_presupuestos_gael_estado_registro_check
  to proyecto_presupuestos_estado_registro_check;

alter table public.proyecto_presupuestos
  rename constraint proyecto_presupuestos_gael_proyecto_presupuesto_key
  to proyecto_presupuestos_proyecto_referencia_key;

alter table public.proyecto_presupuestos
  rename constraint proyecto_presupuestos_gael_proyecto_id_fkey
  to proyecto_presupuestos_proyecto_id_fkey;

alter table public.proyecto_presupuestos
  rename constraint proyecto_presupuestos_gael_creado_por_id_fkey
  to proyecto_presupuestos_creado_por_id_fkey;

alter table public.proyecto_presupuestos
  rename constraint proyecto_presupuestos_gael_actualizado_por_id_fkey
  to proyecto_presupuestos_actualizado_por_id_fkey;

alter table public.proyecto_presupuesto_lineas
  rename constraint proyecto_presupuesto_gael_lineas_presupuesto_linea_key
  to proyecto_presupuesto_lineas_presupuesto_linea_key;

alter table public.proyecto_presupuesto_lineas
  rename constraint proyecto_presupuesto_gael_lineas_pkey
  to proyecto_presupuesto_lineas_pkey;

alter table public.proyecto_presupuesto_lineas
  rename constraint proyecto_presupuesto_gael_lineas_presupuesto_id_fkey
  to proyecto_presupuesto_lineas_presupuesto_id_fkey;

alter table public.proyecto_presupuesto_accesos
  rename constraint proyecto_presupuesto_gael_accesos_proyecto_persona_key
  to proyecto_presupuesto_accesos_proyecto_persona_key;

alter table public.proyecto_presupuesto_accesos
  rename constraint proyecto_presupuesto_gael_accesos_pkey
  to proyecto_presupuesto_accesos_pkey;

alter table public.proyecto_presupuesto_accesos
  rename constraint proyecto_presupuesto_gael_accesos_proyecto_id_fkey
  to proyecto_presupuesto_accesos_proyecto_id_fkey;

alter table public.proyecto_presupuesto_accesos
  rename constraint proyecto_presupuesto_gael_accesos_persona_id_fkey
  to proyecto_presupuesto_accesos_persona_id_fkey;

alter table public.proyecto_presupuesto_accesos
  rename constraint proyecto_presupuesto_gael_accesos_creado_por_id_fkey
  to proyecto_presupuesto_accesos_creado_por_id_fkey;

alter index public.proyecto_presupuestos_gael_proyecto_id_idx
  rename to proyecto_presupuestos_proyecto_id_idx;

alter index public.proyecto_presupuesto_gael_lineas_presupuesto_id_idx
  rename to proyecto_presupuesto_lineas_presupuesto_id_idx;

alter index public.proyecto_presupuesto_gael_accesos_proyecto_id_idx
  rename to proyecto_presupuesto_accesos_proyecto_id_idx;

alter index public.proyecto_presupuesto_gael_accesos_persona_id_idx
  rename to proyecto_presupuesto_accesos_persona_id_idx;

alter index public.proyecto_presupuestos_gael_borrador_unico_idx
  rename to proyecto_presupuestos_borrador_unico_idx;

alter function public.can_view_project_gael_budgets(uuid)
  rename to can_view_project_budgets;

alter function public.can_manage_project_gael_budgets(uuid)
  rename to can_manage_project_budgets;

create or replace function public.can_view_project_budgets(target_project_id uuid)
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
          from public.proyecto_presupuesto_accesos access
          where access.proyecto_id = target_project_id
            and access.persona_id = current_person.id
        )
      )
  );
$function$;

create or replace function public.can_manage_project_budgets(target_project_id uuid)
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

revoke all on function public.can_view_project_budgets(uuid) from public;
revoke all on function public.can_manage_project_budgets(uuid) from public;
grant execute on function public.can_view_project_budgets(uuid) to authenticated;
grant execute on function public.can_manage_project_budgets(uuid) to authenticated;

drop policy if exists "Usuarios autorizados pueden ver presupuestos" on public.proyecto_presupuestos;
create policy "Usuarios autorizados pueden ver presupuestos"
  on public.proyecto_presupuestos for select to authenticated
  using (
    (estado_registro = 'borrador' and public.can_manage_project_budget_draft())
    or
    (estado_registro = 'oficial' and public.can_view_project_budgets(proyecto_id))
  );

drop policy if exists "Usuarios autorizados pueden crear presupuestos" on public.proyecto_presupuestos;
create policy "Usuarios autorizados pueden crear presupuestos"
  on public.proyecto_presupuestos for insert to authenticated
  with check (public.can_manage_project_budget_draft());

drop policy if exists "Usuarios autorizados pueden actualizar presupuestos" on public.proyecto_presupuestos;
create policy "Usuarios autorizados pueden actualizar presupuestos"
  on public.proyecto_presupuestos for update to authenticated
  using (public.can_manage_project_budget_draft())
  with check (public.can_manage_project_budget_draft());

drop policy if exists "Usuarios autorizados pueden borrar presupuestos" on public.proyecto_presupuestos;
create policy "Usuarios autorizados pueden borrar presupuestos"
  on public.proyecto_presupuestos for delete to authenticated
  using (public.can_manage_project_budget_draft());

drop policy if exists "Usuarios autorizados pueden ver lineas de presupuesto" on public.proyecto_presupuesto_lineas;
create policy "Usuarios autorizados pueden ver lineas de presupuesto"
  on public.proyecto_presupuesto_lineas for select to authenticated
  using (
    exists (
      select 1
      from public.proyecto_presupuestos presupuesto
      where presupuesto.id = proyecto_presupuesto_lineas.presupuesto_id
        and (
          public.can_manage_project_budget_draft()
          or public.can_view_project_budgets(presupuesto.proyecto_id)
        )
    )
  );

drop policy if exists "Usuarios autorizados pueden crear lineas de presupuesto" on public.proyecto_presupuesto_lineas;
create policy "Usuarios autorizados pueden crear lineas de presupuesto"
  on public.proyecto_presupuesto_lineas for insert to authenticated
  with check (public.can_manage_project_budget_draft());

drop policy if exists "Usuarios autorizados pueden actualizar lineas de presupuesto" on public.proyecto_presupuesto_lineas;
create policy "Usuarios autorizados pueden actualizar lineas de presupuesto"
  on public.proyecto_presupuesto_lineas for update to authenticated
  using (public.can_manage_project_budget_draft())
  with check (public.can_manage_project_budget_draft());

drop policy if exists "Usuarios autorizados pueden borrar lineas de presupuesto" on public.proyecto_presupuesto_lineas;
create policy "Usuarios autorizados pueden borrar lineas de presupuesto"
  on public.proyecto_presupuesto_lineas for delete to authenticated
  using (public.can_manage_project_budget_draft());

drop policy if exists "Usuarios autorizados pueden ver accesos Gael" on public.proyecto_presupuesto_accesos;
drop policy if exists "Responsable direccion admin pueden crear accesos Gael" on public.proyecto_presupuesto_accesos;
drop policy if exists "Responsable direccion admin pueden borrar accesos Gael" on public.proyecto_presupuesto_accesos;

create policy "Usuarios autorizados pueden ver accesos de presupuesto"
  on public.proyecto_presupuesto_accesos for select to authenticated
  using (public.can_view_project_budgets(proyecto_id));

create policy "Responsable direccion admin pueden crear accesos de presupuesto"
  on public.proyecto_presupuesto_accesos for insert to authenticated
  with check (public.can_manage_project_budgets(proyecto_id));

create policy "Responsable direccion admin pueden borrar accesos de presupuesto"
  on public.proyecto_presupuesto_accesos for delete to authenticated
  using (public.can_manage_project_budgets(proyecto_id));

commit;
