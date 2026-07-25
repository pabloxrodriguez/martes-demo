begin;

insert into public.estados_proyecto (
  codigo,
  nombre,
  orden,
  activo
)
values (
  8,
  'Descartado - Cancelado',
  8,
  true
)
on conflict (codigo) do update
set
  nombre = excluded.nombre,
  orden = excluded.orden,
  activo = true,
  fecha_actualizacion = now();

commit;
