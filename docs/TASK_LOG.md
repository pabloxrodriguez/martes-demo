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
| DEP-001 | Alta | Actualizar Next.js a 16.2.11 | Lista para publicar | Incluir en el próximo commit y deployment. |
| SEC-001 | Alta | Proteger y validar las Server Actions | Lista para probar | Probar creación, edición y eliminación con un usuario activo. |
| SEC-002 | Alta | Bloquear redirecciones externas en el callback OAuth | Lista para publicar | Incluir en el próximo commit y probar un login real. |
| DATA-001 | Alta | Obtener los estados de proyecto desde Supabase | Lista para probar | Confirmar que todas las etapas activas y sus proyectos aparecen. |
| AUTH-001 | Alta | Auto-vincular `auth_user_id` durante el primer login | Pendiente | Diseñar vinculación segura mediante correo verificado y evitar reasignaciones. |
| DB-001 | Alta | Versionar esquema, migraciones y políticas RLS | Pendiente | Recuperar el esquema actual de Supabase y auditar sus políticas. |
| OPS-001 | Alta | Revisar deployments, runtime y functions de Vercel | Bloqueada | Obtener acceso al dashboard o vincular la carpeta con Vercel. |
| REL-001 | Media | Mostrar versión y fecha de publicación | Lista para publicar | Versión 0.3 preparada; comprobarla en el menú lateral y acceso. |
| TASK-001 | Alta | Confirmar creación de tareas sin enlace | Lista para probar | Crear una tarea real con `url = null`. |
| TASK-002 | Alta | Corregir recuperación después de un error al crear tarea | Lista para probar | Provocar un error, modificar un campo y confirmar que el aviso desaparece. |
| CAT-001 | Media | Excluir catálogos inactivos de los selectores | Lista para probar | Confirmar que solo aparecen personas, clientes, plantillas y estados activos. |
| TS-001 | Media | Limpiar tipos y consultas de proyectos | En curso | Lint ya está limpio; falta tipar Supabase y reducir tipos manuales duplicados. |
| SEARCH-001 | Media | Implementar búsqueda de proyectos | Lista para probar | Buscar por proyecto, cliente, tipo y responsable; probar también Limpiar. |
| NAV-001 | Media | Mostrar la sección activa en el menú | Lista para probar | Confirmar el indicador en la lista, ficha y módulos futuros. |
| NAV-002 | Media | Revisar actualización de lista y ficha | Pendiente | Probar navegación y datos después de cada mutación. |
| TIME-001 | Media | Mostrar la hora en `America/Santiago` | Lista para probar | Comparar la hora mostrada con la hora local de Chile. |
| TASK-003 | Media | Mostrar aviso al completar una tarea | Lista para probar | Completar y reabrir una tarea; confirmar ambos avisos. |
| TASK-004 | Media | Validar funcionalmente el borrado de tareas | Lista para publicar | Prueba funcional aprobada; incluir código y migración en el próximo commit. |
| UX-001 | Media | Definir e implementar “Ver todos” | Lista para probar | Abrir cada estado, revisar la tabla y entrar a una ficha desde una fila. |
| CAT-002 | Media | Administrar catálogos operativos | Lista para probar | Probar clientes, tipos, venues y plantillas con distintos usuarios activos. |
| CLIENT-001 | Media | Ampliar clientes con empresa, contactos y correos | Pendiente | Diseñar y migrar el modelo sin mezclar contactos con el nombre del cliente. |
| CLIENT-002 | Media | Agregar clientes desde el menú | Lista para probar | Reemplazado por Catálogos; validar el flujo de clientes con un administrador. |
| THEME-001 | Baja | Corregir experiencia en modo nocturno | Pendiente | Definir si MARTES soportará tema oscuro o permanecerá claro. |
| MOD-001 | Baja | Implementar Mi Martes | Pendiente | Definir alcance funcional. |
| MOD-002 | Baja | Implementar Equipo | Pendiente | Definir alcance funcional. |
| MOD-003 | Baja | Implementar Calendario | Pendiente | Definir alcance funcional. |
| MOD-004 | Baja | Implementar Resultados | Pendiente | Definir alcance funcional. |

## Evidencia local acumulada

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
