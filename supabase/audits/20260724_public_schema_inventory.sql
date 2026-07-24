-- Inventario de solo lectura para versionar y auditar el esquema público.
-- No crea, modifica ni elimina datos u objetos.

select jsonb_build_object(
  'objetos',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'nombre', c.relname,
        'tipo', case c.relkind
          when 'r' then 'tabla'
          when 'p' then 'tabla_particionada'
          when 'v' then 'vista'
          when 'm' then 'vista_materializada'
          else c.relkind::text
        end,
        'rls_activo', c.relrowsecurity,
        'rls_forzado', c.relforcerowsecurity
      )
      order by c.relname
    )
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm')
  ), '[]'::jsonb),
  'columnas',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'tabla', c.table_name,
        'posicion', c.ordinal_position,
        'nombre', c.column_name,
        'tipo', c.data_type,
        'tipo_interno', c.udt_name,
        'permite_null', c.is_nullable = 'YES',
        'default', c.column_default,
        'identidad', c.is_identity,
        'generada', c.is_generated
      )
      order by c.table_name, c.ordinal_position
    )
    from information_schema.columns c
    where c.table_schema = 'public'
  ), '[]'::jsonb),
  'restricciones',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'tabla', rel.relname,
        'nombre', con.conname,
        'tipo', con.contype,
        'definicion', pg_get_constraintdef(con.oid, true)
      )
      order by rel.relname, con.conname
    )
    from pg_catalog.pg_constraint con
    join pg_catalog.pg_class rel on rel.oid = con.conrelid
    join pg_catalog.pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
  ), '[]'::jsonb),
  'indices',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'tabla', i.tablename,
        'nombre', i.indexname,
        'definicion', i.indexdef
      )
      order by i.tablename, i.indexname
    )
    from pg_catalog.pg_indexes i
    where i.schemaname = 'public'
  ), '[]'::jsonb),
  'politicas_rls',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'tabla', p.tablename,
        'nombre', p.policyname,
        'permisiva', p.permissive,
        'roles', p.roles,
        'operacion', p.cmd,
        'using', p.qual,
        'with_check', p.with_check
      )
      order by p.tablename, p.policyname
    )
    from pg_catalog.pg_policies p
    where p.schemaname = 'public'
  ), '[]'::jsonb),
  'permisos',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'tabla', g.table_name,
        'rol', g.grantee,
        'permiso', g.privilege_type
      )
      order by g.table_name, g.grantee, g.privilege_type
    )
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.grantee in ('anon', 'authenticated', 'public', 'service_role')
  ), '[]'::jsonb),
  'funciones',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'nombre', p.proname,
        'argumentos', pg_get_function_identity_arguments(p.oid),
        'definicion', pg_get_functiondef(p.oid)
      )
      order by p.proname, pg_get_function_identity_arguments(p.oid)
    )
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  ), '[]'::jsonb),
  'triggers',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'tabla', c.relname,
        'nombre', t.tgname,
        'definicion', pg_get_triggerdef(t.oid, true)
      )
      order by c.relname, t.tgname
    )
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid = t.tgrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and not t.tgisinternal
  ), '[]'::jsonb),
  'vistas',
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'nombre', v.viewname,
        'definicion', v.definition
      )
      order by v.viewname
    )
    from pg_catalog.pg_views v
    where v.schemaname = 'public'
  ), '[]'::jsonb)
) as inventario;
