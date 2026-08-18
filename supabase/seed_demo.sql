begin;

insert into public.estados_proyecto (codigo, nombre, orden, activo)
values
  (1, 'Prospecto', 1, true),
  (2, 'En preparación', 2, true),
  (3, 'Evaluación de cliente', 3, true),
  (4, 'En ejecución', 4, true),
  (5, 'Realizado', 5, true),
  (6, 'No ganado', 6, true),
  (7, 'Administrativo - Interno', 7, true),
  (8, 'Descartado - Cancelado', 8, true)
on conflict (codigo) do update
set
  nombre = excluded.nombre,
  orden = excluded.orden,
  activo = excluded.activo,
  fecha_actualizacion = now();

insert into public.estados_tarea (codigo, nombre, orden, activo)
values
  (1, 'Pendiente', 1, true),
  (2, 'En progreso', 2, true),
  (3, 'Programada', 3, true),
  (4, 'Completada', 4, true)
on conflict (codigo) do update
set
  nombre = excluded.nombre,
  orden = excluded.orden,
  activo = excluded.activo,
  fecha_actualizacion = now();

insert into public.personas (nombre, email, activo, administrador, rol)
values
  ('Pablo Demo', 'pablorodrigueztoledo@gmail.com', true, true, 'admin'),
  ('Sofía Dirección', 'sofia.direccion@martes.team', true, false, 'direccion'),
  ('Martín Productor', 'martin.productor@martes.team', true, false, 'equipo'),
  ('Clara Diseño', 'clara.diseno@martes.team', true, false, 'equipo'),
  ('Cliente Invitado', 'cliente.invitado@martes.team', true, false, 'lector')
on conflict (email) do update
set
  nombre = excluded.nombre,
  activo = excluded.activo,
  administrador = excluded.administrador,
  rol = excluded.rol,
  fecha_actualizacion = now();

insert into public.clientes (
  nombre,
  activo,
  contacto_nombre,
  contacto_correo,
  contacto_celular
)
values
  ('Andes Bank', true, 'Valentina Ruiz', 'valentina.ruiz@example.com', '+56 9 1111 1111'),
  ('Nova Retail', true, 'Tomás Herrera', 'tomas.herrera@example.com', '+56 9 2222 2222'),
  ('Fundación Horizonte', true, 'Camila Fuentes', 'camila.fuentes@example.com', '+56 9 3333 3333'),
  ('Astra Foods', true, 'Diego Salas', 'diego.salas@example.com', '+56 9 4444 4444'),
  ('Municipalidad del Norte', true, 'María López', 'maria.lopez@example.com', '+56 9 5555 5555')
on conflict (nombre) do update
set
  activo = excluded.activo,
  contacto_nombre = excluded.contacto_nombre,
  contacto_correo = excluded.contacto_correo,
  contacto_celular = excluded.contacto_celular,
  fecha_actualizacion = now();

insert into public.tipos_proyecto (nombre, activo)
values
  ('Congreso', true),
  ('Feria y Expo', true),
  ('Evento corporativo', true),
  ('Lanzamiento', true),
  ('Activación', true),
  ('Administrativo - Interno', true)
on conflict (nombre) do update
set
  activo = excluded.activo,
  fecha_actualizacion = now();

with venue_rows (
  nombre,
  direccion,
  comuna,
  ciudad,
  capacidad,
  activo,
  contacto_nombre,
  contacto_correo,
  contacto_celular
) as (
  values
    ('Centro Parque Demo', 'Av. Bicentenario 3800', 'Vitacura', 'Santiago', 1200, true, 'Andrea Molina', 'andrea.molina@example.com', '+56 9 6666 6666'),
    ('Espacio Cordillera', 'Camino El Alba 12000', 'Las Condes', 'Santiago', 650, true, 'Felipe Rojas', 'felipe.rojas@example.com', '+56 9 7777 7777'),
    ('Hub Creativo Demo', 'Los Militares 4500', 'Las Condes', 'Santiago', 250, true, 'Paula Reyes', 'paula.reyes@example.com', '+56 9 8888 8888'),
    ('Patio Industrial', 'Av. Central 900', 'Huechuraba', 'Santiago', 900, true, 'Ignacio Soto', 'ignacio.soto@example.com', '+56 9 9999 9999')
)
insert into public.venues (
  nombre,
  direccion,
  comuna,
  ciudad,
  capacidad,
  activo,
  contacto_nombre,
  contacto_correo,
  contacto_celular
)
select
  venue_rows.nombre,
  venue_rows.direccion,
  venue_rows.comuna,
  venue_rows.ciudad,
  venue_rows.capacidad,
  venue_rows.activo,
  venue_rows.contacto_nombre,
  venue_rows.contacto_correo,
  venue_rows.contacto_celular
from venue_rows
where not exists (
  select 1
  from public.venues existing
  where existing.nombre = venue_rows.nombre
);

insert into public.plantillas_tarea (nombre, orden, activa)
values
  ('Preparar presentación comercial', 1, true),
  ('Enviar propuesta al cliente', 2, true),
  ('Confirmar venue', 3, true),
  ('Validar presupuesto', 4, true),
  ('Coordinar proveedores', 5, true),
  ('Cerrar post evento', 6, true)
on conflict (nombre) do update
set
  orden = excluded.orden,
  activa = excluded.activa,
  fecha_actualizacion = now();

with refs as (
  select
    (select id from public.estados_proyecto where codigo = 1) as prospecto_id,
    (select id from public.estados_proyecto where codigo = 2) as preparacion_id,
    (select id from public.estados_proyecto where codigo = 3) as evaluacion_id,
    (select id from public.estados_proyecto where codigo = 4) as ejecucion_id,
    (select id from public.estados_proyecto where codigo = 5) as realizado_id,
    (select id from public.estados_proyecto where codigo = 6) as no_ganado_id,
    (select id from public.estados_proyecto where codigo = 7) as interno_id,
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
    (select id from public.tipos_proyecto where nombre = 'Administrativo - Interno') as admin_tipo_id
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
select * from (
  select 'demo-001', 'Summit Andes 2026', prospecto_id, congreso_id, sofia_id, andes_id, 2, date '2026-08-28', date '2026-11-12', date '2026-11-13', 450, 92000000, 'Demo: propuesta estratégica para banca regional.', pablo_id, pablo_id from refs
  union all
  select 'demo-002', 'Expo Nova Retail', preparacion_id, feria_id, martin_id, nova_id, 3, date '2026-08-22', date '2026-10-05', date '2026-10-07', 1200, 145000000, 'Demo: feria comercial con stands y activaciones.', pablo_id, pablo_id from refs
  union all
  select 'demo-003', 'Encuentro Horizonte', evaluacion_id, corporativo_id, clara_id, fundacion_id, 1, date '2026-08-18', date '2026-09-04', date '2026-09-04', 280, 38000000, 'Demo: evento de comunidad y fundraising.', pablo_id, pablo_id from refs
  union all
  select 'demo-004', 'Lanzamiento Astra Bio', ejecucion_id, lanzamiento_id, pablo_id, astra_id, 2, date '2026-07-30', date '2026-08-29', date '2026-08-29', 180, 56000000, 'Demo: lanzamiento con prensa y experiencia de marca.', pablo_id, pablo_id from refs
  union all
  select 'demo-005', 'Congreso Ciudad Futuro', realizado_id, congreso_id, sofia_id, muni_id, 4, date '2026-03-15', date '2026-05-20', date '2026-05-21', 700, 118000000, 'Demo: caso realizado para mostrar Resultados.', pablo_id, pablo_id from refs
  union all
  select 'demo-006', 'Activación Nova Verano', no_ganado_id, lanzamiento_id, martin_id, nova_id, 5, date '2026-02-10', date '2026-02-28', date '2026-02-28', 350, 24000000, 'Demo: proyecto no ganado para mostrar históricos/resultados.', pablo_id, pablo_id from refs
  union all
  select 'demo-007', 'Operación interna demo', interno_id, admin_tipo_id, pablo_id, null::uuid, 6, date '2026-08-01', date '2026-08-01', date '2026-08-01', null::integer, null::numeric, 'Demo: administrativo interno, excluido de informes comerciales.', pablo_id, pablo_id from refs
) as projects
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
select p.id, v.id
from public.proyectos p
join public.venues v on v.nombre = case p.legacy_id
  when 'demo-001' then 'Centro Parque Demo'
  when 'demo-002' then 'Patio Industrial'
  when 'demo-003' then 'Hub Creativo Demo'
  when 'demo-004' then 'Espacio Cordillera'
  when 'demo-005' then 'Centro Parque Demo'
end
where p.legacy_id in ('demo-001', 'demo-002', 'demo-003', 'demo-004', 'demo-005')
on conflict (proyecto_id, venue_id) do nothing;

with refs as (
  select
    (select id from public.estados_tarea where codigo = 1) as pendiente_id,
    (select id from public.estados_tarea where codigo = 2) as progreso_id,
    (select id from public.estados_tarea where codigo = 3) as programada_id,
    (select id from public.estados_tarea where codigo = 4) as completada_id,
    (select id from public.personas where email = 'pablorodrigueztoledo@gmail.com') as pablo_id,
    (select id from public.personas where email = 'sofia.direccion@martes.team') as sofia_id,
    (select id from public.personas where email = 'martin.productor@martes.team') as martin_id,
    (select id from public.personas where email = 'clara.diseno@martes.team') as clara_id
),
task_rows as (
  select 'Summit Andes 2026' as proyecto, 'Preparar presentación comercial' as nombre, sofia_id as responsable_id, progreso_id as estado_id, date '2026-08-20' as fecha_comprometida, null::date as fecha_completada, 1 as orden, 'Ajustar relato ejecutivo.' as comentario from refs
  union all select 'Summit Andes 2026', 'Enviar propuesta al cliente', sofia_id, pendiente_id, date '2026-08-28', null::date, 2, 'Enviar antes del cierre del viernes.' from refs
  union all select 'Expo Nova Retail', 'Confirmar venue', martin_id, completada_id, date '2026-08-12', date '2026-08-12', 1, 'Venue reservado para demo.' from refs
  union all select 'Expo Nova Retail', 'Validar presupuesto', pablo_id, pendiente_id, date '2026-08-21', null::date, 2, 'Revisar gastos principales.' from refs
  union all select 'Encuentro Horizonte', 'Enviar propuesta al cliente', clara_id, pendiente_id, date '2026-08-18', null::date, 1, 'Proyecto con entrega hoy para mostrar alertas.' from refs
  union all select 'Lanzamiento Astra Bio', 'Coordinar proveedores', martin_id, progreso_id, date '2026-08-23', null::date, 1, 'Producción en curso.' from refs
  union all select 'Lanzamiento Astra Bio', 'Cerrar post evento', pablo_id, programada_id, date '2026-08-31', null::date, 2, 'Programado posterior al evento.' from refs
  union all select 'Congreso Ciudad Futuro', 'Cerrar post evento', sofia_id, completada_id, date '2026-05-25', date '2026-05-24', 1, 'Caso histórico realizado.' from refs
)
insert into public.tareas (
  proyecto_id,
  nombre,
  responsable_id,
  estado_id,
  fecha_comprometida,
  fecha_completada,
  orden,
  comentario,
  creada_por_id,
  actualizada_por_id
)
select
  p.id,
  task_rows.nombre,
  task_rows.responsable_id,
  task_rows.estado_id,
  task_rows.fecha_comprometida,
  task_rows.fecha_completada,
  task_rows.orden,
  task_rows.comentario,
  (select pablo_id from refs),
  (select pablo_id from refs)
from task_rows
join public.proyectos p on p.nombre = task_rows.proyecto
where not exists (
  select 1
  from public.tareas existing
  where existing.proyecto_id = p.id
    and existing.nombre = task_rows.nombre
);

commit;
