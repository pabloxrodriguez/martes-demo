begin;

alter table public.venues
  add column if not exists contacto_nombre text,
  add column if not exists contacto_correo text,
  add column if not exists contacto_celular text;

commit;
