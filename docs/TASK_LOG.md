# MARTES — Registro de trabajo

Última actualización: 2026-07-25

Este documento es la fuente única para organizar, ejecutar y verificar el
trabajo pendiente de MARTES.

## Estados

| Estado | Significado |
|---|---|
| Pendiente | Todavía no se ha comenzado. |
| En curso | Se está trabajando activamente. |
| Bloqueada | Falta una decisión, acceso o dependencia externa. |
| Lista para probar | Implementada localmente; falta validación funcional. |
| En pruebas | Publicada; la validación funcional está en curso. |
| Lista para publicar | Validada localmente; falta commit, GitHub y Vercel. |
| Completada | Publicada y comprobada en producción. |

## Criterio de cumplimiento

Una tarea solo pasa a **Completada** cuando:

1. El cambio está implementado.
2. TypeScript y la compilación pasan.
3. Se realiza la prueba funcional correspondiente.
4. El cambio queda registrado en Git.
5. Se actualizan el número y la fecha visibles de la versión.
6. Se publica en Vercel.
7. Se comprueba el resultado en producción.

## Trabajo actual

| ID | Prioridad | Tarea | Estado | Próximo paso |
|---|---:|---|---|---|
| DEP-001 | Alta | Actualizar Next.js a 16.2.11 | Completada | Publicada y operativa en la versión 0.3. |
| SEC-001 | Alta | Proteger y validar las Server Actions | En pruebas | Continuar pruebas de creación, edición y eliminación con usuarios activos. |
| SEC-002 | Alta | Bloquear redirecciones externas en el callback OAuth | En pruebas | Confirmar explícitamente que un destino externo vuelve a `/proyectos`. |
| DATA-001 | Alta | Obtener los estados de proyecto desde Supabase | En pruebas | Confirmar que cambios de catálogo se reflejan sin estados invisibles. |
| AUTH-001 | Alta | Auto-vincular `auth_user_id` durante el primer login | En pruebas | Versión publicada; probar el lunes con Anai y confirmar una Persona ya vinculada. |
| DB-001 | Alta | Versionar esquema, migraciones y políticas RLS | Completada | Esquema publicado; RLS aplicado y validado con acceso anónimo y una Persona activa. |
| OPS-001 | Alta | Revisar deployments, runtime y functions de Vercel | Completada | Producción estable; errores históricos clasificados y sin incidencias vigentes. |
| REL-001 | Media | Mostrar versión y fecha de publicación | En pruebas | Versión 0.4 visible en el acceso; confirmar también el menú autenticado. |
| TASK-001 | Alta | Confirmar creación de tareas sin enlace | En pruebas | Versión publicada; repetir la prueba en producción. |
| TASK-002 | Alta | Corregir recuperación después de un error al crear tarea | En pruebas | Versión publicada; repetir error y corrección en producción. |
| CAT-001 | Media | Excluir catálogos inactivos de los selectores | En pruebas | Confirmar que solo aparecen personas, clientes, plantillas y estados activos. |
| TS-001 | Media | Limpiar tipos y consultas de proyectos | Completada | Esquema tipado publicado y compilación de producción aprobada. |
| SEARCH-001 | Media | Implementar búsqueda de proyectos | En pruebas | Buscar por proyecto, cliente, tipo y responsable; probar también Limpiar. |
| NAV-001 | Media | Mostrar la sección activa en el menú | En pruebas | Confirmar el indicador en la lista, ficha y módulos futuros. |
| NAV-002 | Media | Revisar actualización de lista y ficha | En pruebas | Continuar pruebas después de cada mutación. |
| TIME-001 | Media | Mostrar la hora en `America/Santiago` | Completada | Hora validada en producción. |
| TASK-003 | Media | Mostrar aviso al completar una tarea | En pruebas | Completar y reabrir una tarea; confirmar ambos avisos. |
| TASK-004 | Media | Validar funcionalmente el borrado de tareas | En pruebas | Borrado lógico publicado en versión 0.5; falta repetir flujo completo en producción. |
| UX-001 | Media | Definir e implementar “Ver todos” | En pruebas | Tabla editable implementada; probar guardado por fila en distintos estados. |
| CAT-002 | Media | Administrar catálogos operativos | En pruebas | CRUD validado inicialmente; falta prueba con más de un usuario activo. |
| CLIENT-001 | Media | Ampliar clientes con empresa, contactos y correos | En pruebas | Empresa y contacto principal implementados; continuar validación. |
| CLIENT-002 | Media | Agregar clientes desde el menú | Completada | Reemplazado por Catálogos y validado en producción. |
| VENUE-001 | Media | Agregar datos de contacto a Venues | En pruebas | Versión publicada; repetir alta/edición, recarga y búsqueda en producción. |
| AUTH-002 | Media | Probar Catálogos con más de un usuario activo | Pendiente | Iniciar sesión con un segundo usuario activo y repetir una mutación. |
| AUTH-003 | Media | Recuperar una sesión vencida sin error 500 | En pruebas | Versión publicada; validar redirección y mensaje con una sesión vencida. |
| THEME-001 | Baja | Corregir experiencia en modo nocturno | Pendiente | Definir si MARTES soportará tema oscuro o permanecerá claro. |
| MOD-001 | Baja | Implementar Mi Martes | En pruebas | Versión 0.5 publicada; falta validar edición de tareas y actividad reciente en producción. |
| MOD-002 | Baja | Implementar Equipo | Pendiente | Definir alcance funcional. |
| MOD-003 | Baja | Implementar Calendario | Lista para probar | MVP local implementado; revisar navegación mensual, hitos y Nuevo proyecto. |
| MOD-004 | Baja | Implementar Resultados | Lista para publicar | MVP local validado; publicar versión 0.6.0 y revisar en producción. |

## Evidencia local acumulada

### 2026-07-25

- Primer corte de Mi Martes implementado localmente como tablero personal de
  tareas abiertas asignadas a la Persona conectada, agrupadas por vencidas,
  para hoy, próximas y sin fecha.
- Mi Martes evolucionado al esquema de cuatro bloques: resumen, tareas
  editables, proyectos propios en fases 1 a 4 y actividad reciente basada en
  cambios de tareas.
- Versión 0.5 preparada para publicación el 25 de julio de 2026 a las 11:53,
  con TypeScript, ESLint y build de producción aprobados.
- Versión 0.5 publicada mediante el commit `d85716a`; Vercel la marcó como
  Ready/Production y la pantalla de acceso pública mostró “Versión 0.5”.
- Versión 0.5.1 preparada para publicación el 25 de julio de 2026 a las
  12:20, con entrada inicial a Mi Martes, logo en acceso, favicon del planeta
  y originales de marca ordenados en `assets/brand`.
- Versión 0.5.2 preparada para publicación el 25 de julio de 2026 a las
  12:25, corrigiendo también el destino post-login y el acceso a `/login`
  para usuarios ya autenticados hacia Mi Martes.
- Versión 0.5.3 preparada para publicación el 25 de julio de 2026 a las
  13:01, corrigiendo el render de proyectos después de editar fechas al
  filtrar tareas eliminadas en código en vez de usar filtros embebidos.
- Versión 0.5.4 preparada para publicación el 25 de julio de 2026 a las
  13:08, corrigiendo el mensaje al intentar guardar una fecha de término
  anterior a la fecha de inicio en la ficha de proyecto.
- Primer MVP de Resultados implementado localmente con selector de período,
  ventas ganadas, proyectos gestionados, ganados, no ganados, tasa de éxito,
  pipeline, cortes por cliente/tipo y proyectos realizados.
- Regla comercial aplicada en Resultados: En ejecución y Realizado cuentan
  como ventas ganadas y usan fecha de ejecución; En ejecución sin fecha de
  evento usa fecha de propuesta como respaldo; Realizado cuenta además como
  evento ejecutado; Prospecto, En preparación, Evaluación de cliente y No
  ganado usan fecha de propuesta; No olvidar y Administrativo - Interno quedan
  fuera de resultados comerciales.
- Las tarjetas Proyectos gestionados, Proyectos ganados y Proyectos no
  ganados abren un detalle editable para revisar y corregir estado, fechas y
  valor de venta de los proyectos que componen cada número.
- Estado de proyecto 8 preparado como Descartado - Cancelado. Este estado no
  entra en Resultados comerciales ni en la tasa de éxito.
- Criterios de Resultados documentados en `docs/RESULTADOS_CRITERIOS.md` y
  `docs/RESULTADOS_CRITERIOS.docx` para compartir con el equipo.
- Versión 0.6.0 preparada para publicación el 25 de julio de 2026 a las
  17:50, con MVP de Resultados, detalle editable y categoría Descartado -
  Cancelado.
- Versión 0.6.1 preparada para publicación el 25 de julio de 2026 a las
  18:24, con documento Word de criterios y gráfico de evolución mensual
  corregido para períodos multi-año.
- Primer MVP de Calendario implementado localmente con grilla mensual,
  navegación por mes, botón Hoy, Nuevo proyecto, resumen del mes, leyenda por
  estado y próximos hitos.
- Criterio de Calendario: muestra entregas de propuesta para Prospecto, En
  preparación, Evaluación de cliente y En ejecución; muestra eventos posibles
  como TBC para Prospecto, En preparación y Evaluación de cliente; muestra
  eventos confirmados para proyectos En ejecución; excluye Realizado, No
  ganado, No olvidar, Descartado - Cancelado y Administrativo - Interno.
- La vista “Ver todos” de cada estado de Proyectos ahora es editable por fila
  para estado, prioridad, responsable, fechas de propuesta/evento y valor de
  venta.
- Migración de autoría y borrado lógico de tareas aplicada en Supabase.
- Validación funcional aprobada: la tarea “Llamar a cliente” del proyecto
  “🧪 Martes” desaparece de la app al borrarse, pero permanece en Supabase con
  `eliminada = true`, `fecha_eliminacion` y `eliminada_por = Pablo Rodriguez`.
- Las tareas eliminadas lógicamente quedan excluidas de la ficha de proyecto,
  el tablero general y Mi Martes.

### 2026-07-24

- Versión 0.4 publicada el 24 de julio de 2026 a las 19:54 mediante el commit
  `1f2e756`; deployment de Vercel listo en 28 segundos y acceso público
  confirmado con la versión correcta.
- Versión 0.3 operativa en producción y todavía bajo pruebas funcionales.
- Hora de Chile validada.
- CRUD de Catálogos validado inicialmente y edición de Venues confirmada
  después de aplicar RLS.
- Pendiente agregar datos de contacto al catálogo de Venues.
- La creación de tareas sin enlace o con un enlace incompleto devolvía un
  error genérico de Server Components en producción.
- Corrección local: las tareas reciben orden automático y la Server Action
  devuelve un resultado seguro con mensajes comprensibles para el usuario.
- Prueba local aprobada para tareas sin enlace, enlace incompleto y corrección
  posterior del formulario.
- Auto-vinculación implementada localmente mediante una función atómica que
  usa el correo verificado de Supabase, conserva vínculos existentes y nunca
  reasigna una Persona ya vinculada.
- Migración de auto-vinculación aplicada en Supabase; Anai quedó como la única
  Persona activa viable para la prueba del primer acceso. Juanjo y Taki
  permanecen inactivos.
- Datos opcionales de contacto agregados localmente a Venues: nombre, correo y
  celular. El correo se valida cuando se informa y los tres campos participan
  en la búsqueda del catálogo.
- Migración de campos de contacto de Venues aplicada en Supabase.
- Consulta de inventario integral preparada para recuperar desde Supabase el
  esquema público, restricciones, índices, RLS, permisos, funciones y triggers
  sin modificar la base de datos.
- Inventario recibido: 10 tablas, 86 columnas, 39 restricciones, 36 índices,
  31 políticas RLS, cuatro funciones y ningún trigger personalizado.
- Auditoría detectó políticas heredadas con acceso `public` a proyectos,
  asociaciones de venues y varios catálogos, incluyendo escrituras abiertas.
- Esquema base versionado y migración transaccional preparada para retirar
  acceso anónimo, unificar RLS por Persona activa y reducir los grants del rol
  autenticado a las operaciones utilizadas por MARTES.
- Migración de endurecimiento RLS aplicada correctamente en Supabase.
- Prueba externa anónima aprobada: las 10 tablas públicas rechazaron lectura
  con estado 401 y código PostgreSQL 42501.
- Prueba autenticada aprobada para carga de proyectos, apertura de ficha,
  edición de un Venue, persistencia de sus contactos y búsqueda por contacto.
- Prueba autenticada aprobada para crear, completar, reabrir y borrar una
  tarea autorizada, además de asociar y quitar un Venue del proyecto.
- Tipos centrales de Supabase generados desde el inventario real y conectados
  a los clientes de navegador, servidor y administración.
- El tipado detectó y permitió corregir prioridad como texto, actualizaciones
  dinámicas demasiado amplias y campos incompatibles del importador.
- Tipos manuales principales de estados, tipos, catálogos y tarjetas de
  proyectos reemplazados por tipos derivados del esquema o del repositorio.
- TypeScript, ESLint y la compilación completa de producción aprobados después
  de la limpieza.
- Vercel revisado: despliegue `7ba89b0` estable, últimos tres deployments
  exitosos, sin timeouts ni presión de memoria y con 0% de errores en las
  últimas seis horas observadas.
- Los errores históricos de Vercel correspondían a interrupciones transitorias
  de Supabase, un token emitido a futuro, una sesión vencida y el error de URL
  de tarea ya corregido localmente.
- Las sesiones vencidas ahora redirigen al acceso con un mensaje comprensible,
  en vez de generar un error 500 en páginas protegidas o Server Actions.

### 2026-07-23

- Next.js y `eslint-config-next` actualizados de 16.2.10 a 16.2.11.
- Compilación de producción correcta con Next.js 16.2.11.
- TypeScript sin errores.
- Server Actions protegidas con autenticación de usuario activo y validación
  de entradas.
- Enlaces de tareas restringidos a `https:` y `http:`.
- Callback OAuth restringido a destinos internos.
- Etapas de proyectos obtenidas dinámicamente desde `estados_proyecto`.
- Personas, clientes, plantillas y estados inactivos excluidos de los
  selectores.
- Búsqueda de proyectos implementada por nombre, cliente, tipo y responsable.
- Menú lateral actualizado con indicador de sección activa.
- Hora de actualización fijada a `America/Santiago` en formato de 24 horas.
- Formulario de tareas recuperable después de un error y enlace marcado como
  opcional.
- Aviso temporal agregado al completar o reabrir una tarea.
- “Ver todos” abre una tabla dedicada con todos los proyectos del estado.
- Versión 0.2 y fecha de publicación centralizadas y visibles en el menú.
- Menú Clientes reemplazado por Catálogos para todos los usuarios activos.
- Catálogos implementado para clientes, tipos de proyecto, venues y plantillas
  de tareas, con búsqueda, alta, edición, desactivación y reactivación.
- Clientes ampliados con empresa, nombre del contacto, correo y celular.
- Sugerencias de clientes existentes agregadas durante el alta, con bloqueo de
  coincidencias exactas y una segunda validación en el servidor.
- Migración RLS agregada para que cualquier persona activa pueda leer, crear y
  actualizar clientes; el borrado físico permanece bloqueado.
- Políticas RLS unificadas para clientes, tipos de proyecto, venues y
  plantillas de tareas.
- El orden de las plantillas de tareas quedó interno y automático; no se
  solicita ni se muestra al usuario.
- Versión 0.3 preparada para publicación el 23 de julio de 2026 a las 22:03.
- Borrado de tareas corregido para verificar existencia antes y ausencia
  después, sin depender de que Supabase devuelva la fila eliminada.
- La prueba confirmó que la política RLS actual bloquea el borrado; no se
  utilizará la clave administrativa para eludirla.
- Regla de borrado definida: puede eliminar la persona asignada a la tarea o
  el responsable del proyecto. La acción ya la valida y existe una migración
  RLS local, aplicada manualmente en Supabase.
- Borrado de tareas probado correctamente después de aplicar la política RLS.
- ESLint completo sin errores ni advertencias; se eliminaron efectos
  innecesarios, imports sin uso y una expresión suelta.
- Las alertas previamente observadas sobre `@emnapi/*` y `@tybys/*` ya no
  aparecen en la instalación local.

## Rutina de trabajo

Para cada sesión:

1. Elegir una tarea de prioridad alta no bloqueada.
2. Cambiarla a **En curso**.
3. Implementar un alcance pequeño y verificable.
4. Registrar pruebas y resultados en este documento.
5. Moverla a **Lista para probar** o **Lista para publicar**.
6. Actualizar versión y fecha en `lib/app-version.ts`.
7. Publicar un grupo coherente de cambios.
8. Revisar Vercel, la pantalla de acceso y el menú lateral.
9. Marcar como **Completada** solo después de la comprobación final.

## Notas

- Todos los cambios actuales siguen locales mientras no exista commit, push y
  deployment.
- La política de red del navegador integrado impide probar `localhost`; las
  verificaciones funcionales quedan para una prueba manual o un deployment de
  preview.
- Los errores generales de lint de componentes visuales se controlarán dentro
  de TS-001 o en tareas específicas si requieren cambios funcionales.
- No se ejecutará `npm audit fix --force`, porque actualmente propone una
  degradación incompatible de Next.js.
- Cada publicación debe actualizar la versión y fecha centralizadas; ambas se
  muestran en el acceso y en el menú lateral.

## Publicación 0.7.0 — 26 julio 2026, 12:37

- Calendario implementado con vista mensual, hitos del mes, propuestas vigentes
  y eventos/TBC según estado del proyecto.
- “Nuevo proyecto” agregado desde Calendario usando el mismo formulario breve de
  Proyectos.
- “Ver todos” de Proyectos convertido en tabla editable con guardado por fila o
  guardado masivo.
- La tabla editable fija el nombre del proyecto, agrega desplazamiento
  horizontal superior y permite editar prioridad, estado, tipo, responsable,
  propuesta y valor.

## Publicación 0.7.1 — 27 julio 2026, 13:39

- Roles agregados a personas: admin, direccion y equipo.
- Resultados separado en vista operativa sin montos comerciales.
- Resultado Financiero agregado como vista con montos, visible solo para admin
  y dirección.
- Acceso directo a Resultado Financiero bloqueado para usuarios de equipo.

## Publicación 0.8.0 — 29 julio 2026, 13:27

- Módulo Equipo implementado con matriz por persona y estado de proyecto.
- Carga por miembro calculada desde tareas abiertas asignadas en proyectos
  activos.
- Tarjetas de proyecto muestran tareas abiertas, fechas comprometidas y enlace a
  la ficha del proyecto.
- Filtro por miembros agregado como chips seleccionables para enfocar la vista.

## Publicación 0.8.1 — 29 julio 2026, 13:50

- Indicador de carga de Equipo simplificado a cantidad de tareas abiertas.
- Se eliminaron porcentajes, barras y etiquetas interpretativas para evitar una
  lectura evaluativa de la carga del equipo.

## Publicación 0.9.0 — 3 agosto 2026, 12:56

- Proyectos Realizados y No ganados limitados al año en curso en la vista
  principal de Proyectos.
- Realizados se ordenan por fecha de evento más reciente; No ganados por fecha
  de propuesta más reciente.
- Histórico de proyectos agregado dentro de Proyectos para Realizados y No
  ganados de años anteriores.
- Acceso a Histórico movido al encabezado superior junto a Nuevo proyecto.
- Desplazamiento horizontal de secciones de Proyectos reforzado para usuarios
  con mouse.

## Publicación 0.9.1 — 3 agosto 2026, 13:06

- Fechas editables de tareas muestran formato legible para usuarios en Mi
  Martes y en la ficha de Proyecto.
- Se mantiene el selector nativo de fecha al editar, pero la lectura normal
  evita el formato técnico AAAA-MM-DD.

## Publicación 0.10.0 — 3 agosto 2026, 15:00

- Administración agregada para gestionar personas, roles y accesos.
- Rol lector agregado para accesos externos o de demostración sin permisos de
  escritura.
- Menú y acciones de servidor ajustadas para bloquear escrituras de lectores.
- Políticas RLS versionadas para que lectores mantengan solo lectura y editores
  puedan operar.
- Funciones legacy de acceso versionadas para reducir drift entre producción y
  migraciones.
