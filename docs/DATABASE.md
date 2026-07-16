# 1 Estados Proyecto

## Descripción

Catálogo que define las etapas del flujo de un proyecto en MARTES.

Cada proyecto pertenece obligatoriamente a un único estado.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|------|-------------|
| id | uuid | No | Identificador único |
| codigo | smallint | No | Código interno del estado |
| nombre | text | No | Nombre del estado |
| orden | smallint | No | Orden de visualización y flujo |
| activo | boolean | No | Permite desactivar un estado sin eliminarlo |
| fecha_creacion | timestamptz | No | Fecha de creación |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización |

## Relaciones

- Un estado puede estar asociado a muchos proyectos.
- Un proyecto pertenece a un único estado.

## Reglas de negocio

- Los estados representan el flujo operativo de MARTES.
- El campo **orden** determina el orden en que se muestran las columnas de la vista Proyectos.
- No se eliminan estados; se desactivan mediante **activo = false**.
- El código es un identificador interno y no se muestra al usuario.

# 2 Proyectos

## Descripción

Representa un proyecto gestionado por MARTES.

Es la entidad principal del sistema.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único del proyecto. |
| legacy_id | text | Sí | Identificador del sistema anterior para migraciones. |
| nombre | text | No | Nombre del proyecto. |
| estado_id | uuid | No | Estado actual del proyecto. |
| tipo_id | uuid | Sí | Tipo de proyecto. |
| responsable_id | uuid | Sí* | Responsable del proyecto. |
| cliente_id | uuid | Sí | Cliente asociado al proyecto. |
| prioridad | text | Sí* | Prioridad del proyecto. *(Pendiente migrar a integer 1–9).* |
| fecha_propuesta | date | Sí* | Fecha de propuesta. |
| fecha_evento_inicio | date | Sí* | Fecha de inicio del evento. |
| fecha_evento_termino | date | Sí | Fecha de término del evento. |
| publico_esperado | integer | Sí | Público esperado. |
| valor_venta | numeric(15,2) | Sí | Valor de venta del proyecto. |
| notas | text | Sí | Observaciones generales. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

> (*) El schema actual permite valores nulos. Esto será corregido en una futura migración.

## Relaciones

- Un Proyecto pertenece a un Estado.
- Un Proyecto puede pertenecer a un Tipo de Proyecto.
- Un Proyecto tiene un Responsable.
- Un Proyecto puede pertenecer a un Cliente.
- Un Proyecto puede tener uno o más Venues mediante `proyecto_venues`.
- Un Proyecto tiene muchas Tareas.

## Reglas de negocio

- El nombre es obligatorio.
- Todo proyecto debe tener un estado.
- Todo proyecto debe tener un responsable.
- El cliente es opcional.
- La prioridad es un número entre **1 y 9**.
- La fecha de propuesta es obligatoria.
- La fecha de inicio del evento es obligatoria.
- Si no se informa la fecha de término, el sistema utilizará la fecha de inicio.
- El público esperado debe ser mayor o igual a cero.
- El valor de venta debe ser mayor o igual a cero.
- El proyecto puede tener uno o más venues.
- El proyecto es el eje central de MARTES; tareas, venues y demás entidades dependen de él.

## Pendientes de migración

- Cambiar `prioridad` de `text` a `smallint`.
- Hacer obligatorio `responsable_id`.
- Hacer obligatoria `fecha_propuesta`.
- Hacer obligatoria `fecha_evento_inicio`.
- Evaluar almacenar siempre `fecha_evento_termino`.

# 3 Tipos Proyecto

## Descripción

Catálogo que clasifica los proyectos según su naturaleza.

Permite agrupar y filtrar proyectos dentro de MARTES.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único del tipo de proyecto. |
| nombre | text | No | Nombre del tipo de proyecto. |
| activo | boolean | No | Indica si el tipo está disponible para nuevos proyectos. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

## Relaciones

- Un Tipo de Proyecto puede estar asociado a muchos Proyectos.
- Un Proyecto puede tener un único Tipo de Proyecto.

## Reglas de negocio

- El nombre debe ser único.
- Los tipos no se eliminan; se desactivan mediante el campo **activo**.
- El tipo de proyecto es opcional al crear un proyecto.
- Los tipos permiten clasificar proyectos comerciales, internos y administrativos, entre otros.

# 4 Personas

## Descripción

Representa a los usuarios de MARTES.

Las personas pueden ser responsables de proyectos y tareas. Algunas personas pueden tener permisos de administración del sistema.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único de la persona. |
| nombre | text | No | Nombre completo. |
| email | text | No | Correo electrónico. Debe ser único. |
| activo | boolean | No | Indica si la persona puede seguir siendo asignada a proyectos y tareas. |
| administrador | boolean | No | Indica si la persona tiene permisos administrativos. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

## Relaciones

- Una Persona puede ser responsable de muchos Proyectos.
- Una Persona puede ser responsable de muchas Tareas.

## Reglas de negocio

- El correo electrónico debe ser único.
- Las personas no se eliminan; se desactivan mediante el campo **activo**.
- Sólo las personas activas pueden asignarse como responsables de proyectos o tareas.
- El campo **administrador** controla los permisos de administración del sistema.

# 5 Clientes

## Descripción

Representa las empresas, organizaciones o instituciones para las cuales se desarrollan proyectos.

Un cliente puede tener múltiples proyectos asociados.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único del cliente. |
| nombre | text | No | Nombre del cliente. Debe ser único. |
| activo | boolean | No | Indica si el cliente puede asociarse a nuevos proyectos. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

## Relaciones

- Un Cliente puede estar asociado a muchos Proyectos.
- Un Proyecto puede tener un único Cliente.

## Reglas de negocio

- El nombre del cliente debe ser único.
- Los clientes no se eliminan; se desactivan mediante el campo **activo**.
- El cliente es opcional en un proyecto.
- Sólo los clientes activos pueden asociarse a nuevos proyectos.

# 6 Venues

## Descripción

Representa los recintos o lugares donde se realizan los eventos asociados a los proyectos.

Un mismo venue puede utilizarse en múltiples proyectos.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único del venue. |
| nombre | text | No | Nombre del venue. |
| direccion | text | Sí | Dirección del venue. |
| comuna | text | Sí | Comuna donde se ubica. |
| ciudad | text | Sí | Ciudad donde se ubica. |
| capacidad | integer | Sí | Capacidad máxima de asistentes. |
| activo | boolean | No | Indica si el venue puede utilizarse en nuevos proyectos. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

## Relaciones

- Un Venue puede estar asociado a muchos Proyectos.
- Un Proyecto puede tener uno o más Venues mediante la tabla `proyecto_venues`.

## Reglas de negocio

- El nombre del venue es obligatorio.
- La capacidad, cuando exista, debe ser mayor o igual a cero.
- Los venues no se eliminan; se desactivan mediante el campo **activo**.
- Sólo los venues activos pueden asociarse a nuevos proyectos.
# 7 Proyecto Venues

## Descripción

Tabla de relación entre Proyectos y Venues.

Permite asociar uno o más venues a un mismo proyecto y reutilizar un venue en múltiples proyectos.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único de la relación. |
| proyecto_id | uuid | No | Proyecto asociado. |
| venue_id | uuid | No | Venue asociado. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |

## Relaciones

- Cada registro pertenece a un único Proyecto.
- Cada registro pertenece a un único Venue.
- Un Proyecto puede tener muchos Venues.
- Un Venue puede estar asociado a muchos Proyectos.

## Reglas de negocio

- Un mismo venue solo puede asociarse una vez a un proyecto.
- Si un Proyecto se elimina, todas sus relaciones con Venues se eliminan automáticamente.
- Un Venue no puede eliminarse mientras esté asociado a uno o más Proyectos.

# 8 Estados Tarea

## Descripción

Catálogo que define los estados por los que transita una tarea durante su ciclo de vida.

Cada tarea pertenece obligatoriamente a un único estado.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único del estado. |
| codigo | smallint | No | Código interno único. |
| nombre | text | No | Nombre del estado. |
| orden | smallint | No | Orden en que se muestran los estados. |
| activo | boolean | No | Indica si el estado puede utilizarse en nuevas tareas. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

## Relaciones

- Un Estado de Tarea puede estar asociado a muchas Tareas.
- Una Tarea pertenece a un único Estado.

## Reglas de negocio

- Los estados representan el flujo de trabajo de las tareas.
- El campo **orden** define la secuencia lógica de los estados.
- Los estados no se eliminan; se desactivan mediante el campo **activo**.
- El campo **codigo** es de uso interno y no se muestra al usuario.

# 9 Plantillas Tarea

## Descripción

Representa plantillas reutilizables para la creación de tareas.

Permiten estandarizar el flujo de trabajo de distintos tipos de proyectos.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único de la plantilla. |
| nombre | text | No | Nombre de la plantilla. Debe ser único. |
| orden | integer | No | Orden de presentación de la plantilla. |
| activa | boolean | No | Indica si la plantilla puede utilizarse para crear nuevas tareas. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

## Relaciones

- Una Plantilla puede utilizarse para crear muchas Tareas.
- Una Tarea puede originarse desde una Plantilla.

## Reglas de negocio

- El nombre de la plantilla debe ser único.
- Las plantillas no se eliminan; se desactivan mediante el campo **activa**.
- El campo **orden** determina el orden en que se presentan las plantillas al usuario.
- Las plantillas permiten estandarizar la creación de tareas para distintos tipos de proyectos.

# 10 Tareas

## Descripción

Representa la unidad básica de trabajo de MARTES.

Toda tarea pertenece a un proyecto y permite planificar, asignar, ejecutar y controlar el trabajo necesario para completar un proyecto.

## Schema

| Campo | Tipo | Nulo | Descripción |
|--------|------|:----:|-------------|
| id | uuid | No | Identificador único de la tarea. |
| proyecto_id | uuid | No | Proyecto al que pertenece la tarea. |
| plantilla_tarea_id | uuid | Sí | Plantilla desde la cual se originó la tarea. |
| nombre | text | No | Nombre o descripción de la tarea. |
| responsable_id | uuid | Sí | Persona responsable de ejecutar la tarea. |
| estado_id | uuid | No | Estado actual de la tarea. |
| fecha_comprometida | date | Sí | Fecha comprometida de ejecución. |
| fecha_completada | date | Sí | Fecha en que la tarea fue completada. |
| url | text | Sí | Enlace asociado a la tarea. |
| orden | integer | No | Orden de presentación dentro del proyecto. |
| fecha_creacion | timestamptz | No | Fecha de creación del registro. |
| fecha_actualizacion | timestamptz | No | Fecha de última actualización. |

## Relaciones

- Toda Tarea pertenece a un Proyecto.
- Una Tarea puede originarse desde una Plantilla de Tarea.
- Toda Tarea tiene un Responsable.
- Toda Tarea pertenece a un Estado de Tarea.

## Reglas de negocio

- Toda tarea pertenece obligatoriamente a un proyecto.
- Toda tarea debe tener un responsable.
- Toda tarea debe tener un estado.
- Una tarea puede crearse manualmente o a partir de una plantilla.
- La fecha comprometida es opcional.
- La fecha completada sólo se registra cuando la tarea finaliza.
- El campo **orden** determina la posición de la tarea dentro del proyecto.
- El campo **url** permite asociar documentos, formularios, archivos o recursos externos relacionados con la tarea.

## Pendientes de migración

- Hacer obligatorio `responsable_id`.