begin;

-- Amplía el universo de demostración con proyectos ficticios distribuidos
-- entre todas las fases. Puede ejecutarse más de una vez sin duplicar filas.

with refs as (
  select
    (select id from public.estados_proyecto where codigo = 1) as prospecto_id,
    (select id from public.estados_proyecto where codigo = 2) as preparacion_id,
    (select id from public.estados_proyecto where codigo = 3) as evaluacion_id,
    (select id from public.estados_proyecto where codigo = 4) as ejecucion_id,
    (select id from public.estados_proyecto where codigo = 5) as realizado_id,
    (select id from public.estados_proyecto where codigo = 6) as no_ganado_id,
    (select id from public.estados_proyecto where codigo = 7) as interno_id,
    (select id from public.estados_proyecto where codigo = 8) as cancelado_id,
    (select id from public.personas where email = 'pablorodrigueztoledo@gmail.com') as pablo_id,
    (select id from public.personas where email = 'sofia.direccion@martes.team') as sofia_id,
    (select id from public.personas where email = 'martin.productor@martes.team') as martin_id,
    (select id from public.personas where email = 'clara.diseno@martes.team') as clara_id,
    (select id from public.clientes where nombre = 'Andes Bank') as andes_id,
    (select id from public.clientes where nombre = 'Nova Retail') as nova_id,
    (select id from public.clientes where nombre = 'Fundación Horizonte') as fundacion_id,
    (select id from public.clientes where nombre = 'Astra Foods') as astra_id,
    (select id from public.clientes where nombre = 'Municipalidad del Norte') as muni_id,
    (select id from public.tipos_proyecto where nombre = 'Congreso') as congreso_id,
    (select id from public.tipos_proyecto where nombre = 'Feria y Expo') as feria_id,
    (select id from public.tipos_proyecto where nombre = 'Evento corporativo') as corporativo_id,
    (select id from public.tipos_proyecto where nombre = 'Lanzamiento') as lanzamiento_id,
    (select id from public.tipos_proyecto where nombre = 'Activación') as activacion_id,
    (select id from public.tipos_proyecto where nombre = 'Administrativo - Interno') as admin_tipo_id
),
project_rows as (
  select * from (
    values
      ('demo-008', 'Foro Innovación Financiera', 1, 2, 'sofia', 'andes', 'congreso', 600, 78000000::numeric, 12, 45, 'Prospecto para un foro de innovación y tecnología financiera.'),
      ('demo-009', 'Festival Sabores del Sur', 1, 3, 'martin', 'astra', 'feria', 1800, 132000000::numeric, 18, 70, 'Prospecto de feria gastronómica abierta a público.'),
      ('demo-010', 'Encuentro Ciudades Verdes', 1, 1, 'clara', 'muni', 'corporativo', 320, 41000000::numeric, 9, 35, 'Encuentro ciudadano sobre sostenibilidad urbana.'),
      ('demo-011', 'Convención Comercial Nova', 2, 2, 'martin', 'nova', 'corporativo', 520, 86000000::numeric, 7, 28, 'Convención anual para equipos comerciales regionales.'),
      ('demo-012', 'Expo Emprende Horizonte', 2, 3, 'sofia', 'fundacion', 'feria', 950, 69000000::numeric, 10, 40, 'Expo para emprendimientos con impacto social.'),
      ('demo-013', 'Lanzamiento Andes Digital', 2, 1, 'clara', 'andes', 'lanzamiento', 220, 47000000::numeric, 6, 24, 'Lanzamiento de nueva plataforma para clientes.'),
      ('demo-014', 'Gala Fundación Horizonte', 3, 2, 'sofia', 'fundacion', 'corporativo', 400, 74000000::numeric, 5, 20, 'Propuesta en evaluación para gala anual de recaudación.'),
      ('demo-015', 'Ruta Nova Experiencia', 3, 3, 'martin', 'nova', 'activacion', 1500, 99000000::numeric, 8, 32, 'Activación itinerante en cuatro ciudades.'),
      ('demo-016', 'Congreso Alimentación 2030', 3, 1, 'clara', 'astra', 'congreso', 680, 108000000::numeric, 11, 38, 'Congreso sectorial con charlas y exhibición.'),
      ('demo-017', 'Semana del Futuro Laboral', 4, 2, 'pablo', 'muni', 'congreso', 850, 126000000::numeric, -12, 6, 'Producción en curso con programación de tres jornadas.'),
      ('demo-018', 'Astra Cocina Abierta', 4, 3, 'martin', 'astra', 'activacion', 700, 59000000::numeric, -6, 4, 'Activación de marca actualmente en montaje.'),
      ('demo-019', 'Premios Nova Talento', 4, 1, 'clara', 'nova', 'corporativo', 340, 82000000::numeric, -3, 10, 'Ceremonia corporativa en etapa de ejecución.'),
      ('demo-020', 'Cumbre Andes Pyme', 5, 2, 'sofia', 'andes', 'congreso', 760, 114000000::numeric, -140, -105, 'Caso realizado con evaluación positiva del cliente.'),
      ('demo-021', 'Horizonte Voluntariado', 5, 3, 'martin', 'fundacion', 'activacion', 500, 36000000::numeric, -105, -75, 'Jornada masiva de voluntariado ya realizada.'),
      ('demo-022', 'Feria Ciudad Circular', 5, 1, 'clara', 'muni', 'feria', 2100, 148000000::numeric, -80, -48, 'Feria ciudadana realizada para mostrar resultados históricos.'),
      ('demo-023', 'Roadshow Andes Regiones', 6, 4, 'pablo', 'andes', 'activacion', 900, 93000000::numeric, -55, -25, 'Propuesta no adjudicada; se conserva para análisis comercial.'),
      ('demo-024', 'Planificación Comercial Interna', 7, 5, 'pablo', null, 'interno', null, null::numeric, -15, 20, 'Proyecto administrativo interno para planificación del equipo.'),
      ('demo-025', 'Expo Nova Invierno', 8, 5, 'martin', 'nova', 'feria', 1100, 88000000::numeric, -45, -10, 'Proyecto cancelado por cambio de calendario del cliente.')
  ) as rows (
    legacy_id,
    nombre,
    estado_codigo,
    prioridad,
    responsable_key,
    cliente_key,
    tipo_key,
    publico_esperado,
    valor_venta,
    propuesta_offset,
    evento_offset,
    notas
  )
)
insert into public.proyectos (
  legacy_id,
  nombre,
  estado_id,
  tipo_id,
  responsable_id,
  cliente_id,
  prioridad,
  fecha_propuesta,
  fecha_evento_inicio,
  fecha_evento_termino,
  publico_esperado,
  valor_venta,
  notas,
  creado_por_id,
  actualizado_por_id
)
select
  seed.legacy_id,
  seed.nombre,
  case seed.estado_codigo
    when 1 then refs.prospecto_id
    when 2 then refs.preparacion_id
    when 3 then refs.evaluacion_id
    when 4 then refs.ejecucion_id
    when 5 then refs.realizado_id
    when 6 then refs.no_ganado_id
    when 7 then refs.interno_id
    when 8 then refs.cancelado_id
  end,
  case seed.tipo_key
    when 'congreso' then refs.congreso_id
    when 'feria' then refs.feria_id
    when 'corporativo' then refs.corporativo_id
    when 'lanzamiento' then refs.lanzamiento_id
    when 'activacion' then refs.activacion_id
    when 'interno' then refs.admin_tipo_id
  end,
  case seed.responsable_key
    when 'pablo' then refs.pablo_id
    when 'sofia' then refs.sofia_id
    when 'martin' then refs.martin_id
    when 'clara' then refs.clara_id
  end,
  case seed.cliente_key
    when 'andes' then refs.andes_id
    when 'nova' then refs.nova_id
    when 'fundacion' then refs.fundacion_id
    when 'astra' then refs.astra_id
    when 'muni' then refs.muni_id
    else null
  end,
  seed.prioridad,
  current_date + seed.propuesta_offset,
  current_date + seed.evento_offset,
  current_date + seed.evento_offset + case when seed.tipo_key in ('congreso', 'feria') then 1 else 0 end,
  seed.publico_esperado,
  seed.valor_venta,
  'Demo: ' || seed.notas,
  refs.pablo_id,
  refs.pablo_id
from project_rows seed
cross join refs
on conflict (legacy_id) do update
set
  nombre = excluded.nombre,
  estado_id = excluded.estado_id,
  tipo_id = excluded.tipo_id,
  responsable_id = excluded.responsable_id,
  cliente_id = excluded.cliente_id,
  prioridad = excluded.prioridad,
  fecha_propuesta = excluded.fecha_propuesta,
  fecha_evento_inicio = excluded.fecha_evento_inicio,
  fecha_evento_termino = excluded.fecha_evento_termino,
  publico_esperado = excluded.publico_esperado,
  valor_venta = excluded.valor_venta,
  notas = excluded.notas,
  actualizado_por_id = excluded.actualizado_por_id,
  fecha_actualizacion = now();

insert into public.proyecto_venues (proyecto_id, venue_id)
select
  project.id,
  venue.id
from public.proyectos project
join public.venues venue
  on venue.nombre = case project.legacy_id
    when 'demo-008' then 'Centro Parque Demo'
    when 'demo-009' then 'Patio Industrial'
    when 'demo-010' then 'Hub Creativo Demo'
    when 'demo-011' then 'Espacio Cordillera'
    when 'demo-012' then 'Patio Industrial'
    when 'demo-013' then 'Hub Creativo Demo'
    when 'demo-014' then 'Centro Parque Demo'
    when 'demo-015' then 'Patio Industrial'
    when 'demo-016' then 'Espacio Cordillera'
    when 'demo-017' then 'Centro Parque Demo'
    when 'demo-018' then 'Hub Creativo Demo'
    when 'demo-019' then 'Espacio Cordillera'
    when 'demo-020' then 'Centro Parque Demo'
    when 'demo-021' then 'Patio Industrial'
    when 'demo-022' then 'Patio Industrial'
    when 'demo-023' then 'Espacio Cordillera'
    when 'demo-025' then 'Patio Industrial'
  end
where project.legacy_id between 'demo-008' and 'demo-025'
  and project.legacy_id <> 'demo-024'
on conflict (proyecto_id, venue_id) do nothing;

commit;
