-- Permite administrar los catálogos operativos a cualquier persona activa.
-- No se crean políticas DELETE: los registros se desactivan para conservar
-- el historial.

do $$
declare
  catalog_table text;
begin
  foreach catalog_table in array array[
    'clientes',
    'tipos_proyecto',
    'venues',
    'plantillas_tarea'
  ]
  loop
    execute format(
      'alter table public.%I enable row level security',
      catalog_table
    );

    execute format(
      'drop policy if exists %I on public.%I',
      'Enable read access for all users',
      catalog_table
    );

    execute format(
      'drop policy if exists %I on public.%I',
      catalog_table || '_select_active_users',
      catalog_table
    );

    execute format(
      'create policy %I on public.%I
       for select to authenticated
       using (
         exists (
           select 1
           from public.personas
           where personas.auth_user_id = (select auth.uid())
             and personas.activo = true
         )
       )',
      catalog_table || '_select_active_users',
      catalog_table
    );

    execute format(
      'drop policy if exists %I on public.%I',
      catalog_table || '_insert_active_users',
      catalog_table
    );

    execute format(
      'create policy %I on public.%I
       for insert to authenticated
       with check (
         exists (
           select 1
           from public.personas
           where personas.auth_user_id = (select auth.uid())
             and personas.activo = true
         )
       )',
      catalog_table || '_insert_active_users',
      catalog_table
    );

    execute format(
      'drop policy if exists %I on public.%I',
      catalog_table || '_update_active_users',
      catalog_table
    );

    execute format(
      'create policy %I on public.%I
       for update to authenticated
       using (
         exists (
           select 1
           from public.personas
           where personas.auth_user_id = (select auth.uid())
             and personas.activo = true
         )
       )
       with check (
         exists (
           select 1
           from public.personas
           where personas.auth_user_id = (select auth.uid())
             and personas.activo = true
         )
       )',
      catalog_table || '_update_active_users',
      catalog_table
    );
  end loop;
end
$$;
