-- Agrega rol lector para accesos externos o de demostración sin permisos de escritura.

begin;

alter table public.personas
drop constraint if exists personas_rol_check;

alter table public.personas
add constraint personas_rol_check
check (rol in ('admin', 'direccion', 'equipo', 'lector'));

commit;
