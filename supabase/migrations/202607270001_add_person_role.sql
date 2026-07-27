alter table public.personas
add column if not exists rol text not null default 'equipo';

alter table public.personas
drop constraint if exists personas_rol_check;

alter table public.personas
add constraint personas_rol_check
check (rol in ('admin', 'direccion', 'equipo'));
