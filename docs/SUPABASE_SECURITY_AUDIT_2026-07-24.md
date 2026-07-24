# Auditoría de Supabase — 24 de julio de 2026

## Alcance

Inventario de las 10 tablas del esquema `public`, sus 86 columnas, 39
restricciones, 36 índices, 31 políticas RLS, permisos, funciones y triggers.

## Resultado

Todas las tablas tenían RLS habilitado, pero varias políticas heredadas
permitían acceso al rol `public` con condición `true`. En PostgreSQL/Supabase,
ese rol abarca también solicitudes anónimas.

Los accesos públicos encontrados fueron:

- Lectura de estados de proyecto, estados de tarea, tipos de proyecto,
  plantillas de tareas, venues, proyectos y asociaciones proyecto-venue.
- Creación de venues, proyectos y asociaciones proyecto-venue.
- Actualización de proyectos.
- Eliminación de asociaciones proyecto-venue.

Además, `anon` y `authenticated` conservaban los grants predeterminados para
todas las operaciones de todas las tablas, aunque RLS bloqueaba parte de ellas.

## Corrección preparada

La migración `202607240006_harden_public_rls.sql`:

1. Elimina las políticas públicas y las políticas duplicadas.
2. Exige una Persona activa para leer o modificar datos.
3. Conserva la regla de borrado de tareas: asignado o responsable del proyecto.
4. Conserva el borrado de proyectos solo para su responsable.
5. Impide borrado físico de catálogos.
6. Revoca todos los permisos de tablas para `anon`.
7. Sustituye los grants amplios de `authenticated` por las operaciones mínimas
   utilizadas por MARTES.
8. Restringe las funciones auxiliares al rol `authenticated`.

## Esquema versionado

La migración `202607220000_initial_public_schema.sql` documenta la estructura
base recuperada desde producción. Las migraciones fechadas posteriores
conservan la evolución de contactos, catálogos, RLS y auto-vinculación.

## Pruebas requeridas

Después de aplicar la migración de seguridad:

- Acceso y carga de proyectos con un usuario activo.
- Alta y edición de un proyecto.
- Alta, edición, desactivación y reactivación de catálogos.
- Asociación y eliminación de un venue en un proyecto.
- Alta, edición, finalización y borrado autorizado de tareas.
- Confirmación de acceso denegado para una Persona inactiva.
- Confirmación de que una solicitud anónima no puede leer ni escribir tablas.
