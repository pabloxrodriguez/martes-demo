-- Esquema público base recuperado desde producción el 24 de julio de 2026.
-- No contiene datos de negocio. Los cambios posteriores permanecen en las
-- migraciones fechadas que siguen a este archivo.

begin;

create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  contacto_nombre text,
  contacto_correo text,
  contacto_celular text
);

create table if not exists public.estados_proyecto (
  id uuid primary key default gen_random_uuid(),
  codigo smallint not null unique,
  nombre text not null unique,
  orden smallint not null unique,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.estados_tarea (
  id uuid primary key default gen_random_uuid(),
  codigo smallint not null unique,
  nombre text not null unique,
  orden smallint not null unique,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  activo boolean not null default true,
  administrador boolean not null default false,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  auth_user_id uuid unique references auth.users(id)
);

create table if not exists public.plantillas_tarea (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden integer not null default 0,
  activa boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.tipos_proyecto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  comuna text,
  ciudad text,
  capacidad integer check (capacidad is null or capacidad >= 0),
  activo boolean not null default true,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  contacto_nombre text,
  contacto_correo text,
  contacto_celular text
);

create table if not exists public.proyectos (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  nombre text not null,
  estado_id uuid not null
    references public.estados_proyecto(id)
    on update cascade on delete restrict,
  tipo_id uuid
    references public.tipos_proyecto(id)
    on update cascade on delete set null,
  responsable_id uuid
    references public.personas(id)
    on update cascade on delete set null,
  cliente_id uuid
    references public.clientes(id)
    on update cascade on delete set null,
  prioridad smallint check (prioridad >= 1 and prioridad <= 9),
  fecha_propuesta date,
  fecha_evento_inicio date,
  fecha_evento_termino date,
  publico_esperado integer
    check (publico_esperado is null or publico_esperado >= 0),
  valor_venta numeric check (valor_venta is null or valor_venta >= 0),
  notas text,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  constraint fechas_evento_validas check (
    fecha_evento_termino is null
    or fecha_evento_inicio is null
    or fecha_evento_termino >= fecha_evento_inicio
  )
);

create table if not exists public.proyecto_venues (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null
    references public.proyectos(id)
    on update cascade on delete cascade,
  venue_id uuid not null
    references public.venues(id)
    on update cascade on delete restrict,
  fecha_creacion timestamptz not null default now(),
  constraint proyecto_venues_unico unique (proyecto_id, venue_id)
);

create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null
    references public.proyectos(id)
    on update cascade on delete cascade,
  plantilla_tarea_id uuid
    references public.plantillas_tarea(id)
    on update cascade on delete set null,
  nombre text not null,
  responsable_id uuid
    references public.personas(id)
    on update cascade on delete set null,
  estado_id uuid not null
    references public.estados_tarea(id)
    on update cascade on delete restrict,
  fecha_comprometida date,
  fecha_completada date,
  url text,
  orden integer not null default 0,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  comentario text
);

create index if not exists proyecto_venues_proyecto_id_idx
  on public.proyecto_venues (proyecto_id);
create index if not exists proyecto_venues_venue_id_idx
  on public.proyecto_venues (venue_id);
create index if not exists proyectos_cliente_id_idx
  on public.proyectos (cliente_id);
create index if not exists proyectos_estado_id_idx
  on public.proyectos (estado_id);
create index if not exists proyectos_fecha_evento_inicio_idx
  on public.proyectos (fecha_evento_inicio);
create index if not exists proyectos_responsable_id_idx
  on public.proyectos (responsable_id);
create index if not exists proyectos_tipo_id_idx
  on public.proyectos (tipo_id);
create index if not exists tareas_estado_id_idx
  on public.tareas (estado_id);
create index if not exists tareas_fecha_comprometida_idx
  on public.tareas (fecha_comprometida);
create index if not exists tareas_proyecto_id_idx
  on public.tareas (proyecto_id);
create index if not exists tareas_responsable_id_idx
  on public.tareas (responsable_id);
create unique index if not exists tareas_plantilla_unica_por_proyecto_idx
  on public.tareas (proyecto_id, plantilla_tarea_id)
  where plantilla_tarea_id is not null;

commit;
