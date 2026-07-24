# MARTES — Registro de trabajo

Última actualización: 2026-07-23

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
| AUTH-001 | Alta | Auto-vincular `auth_user_id` durante el primer login | Lista para probar | Migración aplicada; publicar y probar el lunes con Anai, además de una Persona ya vinculada. |
| DB-001 | Alta | Versionar esquema, migraciones y políticas RLS | Lista para publicar | Esquema versionado; RLS aplicado y validado con acceso anónimo y una Persona activa. |
| OPS-001 | Alta | Revisar deployments, runtime y functions de Vercel | Completada | Producción estable; errores históricos clasificados y sin incidencias vigentes. |
| REL-001 | Media | Mostrar versión y fecha de publicación | Lista para publicar | Versión 0.4 preparada; confirmar acceso y menú después del deployment. |
| TASK-001 | Alta | Confirmar creación de tareas sin enlace | Lista para publicar | Prueba local aprobada; incluir en la próxima versión. |
| TASK-002 | Alta | Corregir recuperación después de un error al crear tarea | Lista para publicar | Prueba local aprobada; incluir en la próxima versión. |
| CAT-001 | Media | Excluir catálogos inactivos de los selectores | En pruebas | Confirmar que solo aparecen personas, clientes, plantillas y estados activos. |
| TS-001 | Media | Limpiar tipos y consultas de proyectos | Lista para publicar | Esquema tipado, clientes Supabase conectados y duplicados principales reemplazados por tipos derivados. |
| SEARCH-001 | Media | Implementar búsqueda de proyectos | En pruebas | Buscar por proyecto, cliente, tipo y responsable; probar también Limpiar. |
| NAV-001 | Media | Mostrar la sección activa en el menú | En pruebas | Confirmar el indicador en la lista, ficha y módulos futuros. |
| NAV-002 | Media | Revisar actualización de lista y ficha | En pruebas | Continuar pruebas después de cada mutación. |
| TIME-001 | Media | Mostrar la hora en `America/Santiago` | Completada | Hora validada en producción. |
| TASK-003 | Media | Mostrar aviso al completar una tarea | En pruebas | Completar y reabrir una tarea; confirmar ambos avisos. |
| TASK-004 | Media | Validar funcionalmente el borrado de tareas | Completada | Publicada y validada con la política RLS correspondiente. |
| UX-001 | Media | Definir e implementar “Ver todos” | En pruebas | Abrir cada estado, revisar la tabla y entrar a una ficha desde una fila. |
| CAT-002 | Media | Administrar catálogos operativos | En pruebas | CRUD validado inicialmente; falta prueba con más de un usuario activo. |
| CLIENT-001 | Media | Ampliar clientes con empresa, contactos y correos | En pruebas | Empresa y contacto principal implementados; continuar validación. |
| CLIENT-002 | Media | Agregar clientes desde el menú | Completada | Reemplazado por Catálogos y validado en producción. |
| VENUE-001 | Media | Agregar datos de contacto a Venues | Lista para publicar | Alta/edición, recarga y búsqueda por contacto validadas localmente. |
| AUTH-002 | Media | Probar Catálogos con más de un usuario activo | Pendiente | Iniciar sesión con un segundo usuario activo y repetir una mutación. |
| AUTH-003 | Media | Recuperar una sesión vencida sin error 500 | Lista para publicar | Redirigir al acceso con un mensaje claro y validar el flujo después de publicar. |
| THEME-001 | Baja | Corregir experiencia en modo nocturno | Pendiente | Definir si MARTES soportará tema oscuro o permanecerá claro. |
| MOD-001 | Baja | Implementar Mi Martes | Pendiente | Definir alcance funcional. |
| MOD-002 | Baja | Implementar Equipo | Pendiente | Definir alcance funcional. |
| MOD-003 | Baja | Implementar Calendario | Pendiente | Definir alcance funcional. |
| MOD-004 | Baja | Implementar Resultados | Pendiente | Definir alcance funcional. |

## Evidencia local acumulada

### 2026-07-24

- Versión 0.4 preparada para publicación el 24 de julio de 2026 a las 19:54.
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
