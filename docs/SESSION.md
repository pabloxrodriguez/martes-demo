# Sesión 2026-07-17 PM

## Cambios
- Se reemplazaron emojis por Lucide.
- Se creó ProjectHeaderCard.
- Se creó ProjectDetailsCard.
- Se encapsularon Header y Detalles en cards.
- Se mejoró la jerarquía visual.

## Próximo paso
- Extraer ProjectDetails.tsx.

## 2026-07-17 AM

### Autenticación

- Implementado login con Google mediante Supabase Auth.
- Protección de rutas mediante proxy.
- Integración de usuarios autenticados con la tabla `personas`.
- Nuevo campo `auth_user_id` en `personas`.
- Creado helper `getCurrentPerson()`.
- Acceso permitido únicamente a usuarios existentes y activos.
- Implementada pantalla `Acceso no autorizado`.
- Reutilizado `LogoutButton` para cerrar sesión desde dicha pantalla.
- Verificado flujo completo:
  - Usuario activo → acceso permitido.
  - Usuario inactivo → acceso denegado.
  - Logout desde acceso denegado → correcto.

# Sesión – 16 de julio de 2026 23:56

## Objetivo

Completar la ficha editable del proyecto.

## Completado

### Base de datos

- Se creó `docs/DATABASE.md`.
- Se documentaron las 10 tablas de Supabase.
- La prioridad pasó de `text` a `smallint`.
- La prioridad quedó normalizada al rango **1–9**.

### Ficha del Proyecto

Se implementó la edición inline de:

- Nombre
- Estado
- Tipo
- Responsable
- Cliente
- Prioridad
- Público esperado
- Valor venta
- Notas
- Fecha propuesta
- Fecha inicio
- Fecha término

### Componentes

Se consolidó `EditableField`, que ahora soporta:

- text
- textarea
- number
- currency
- date
- select

Se creó `SearchSelect` para búsquedas de Personas y Clientes.

### Arquitectura

Toda la edición de proyectos utiliza una única Server Action:

`updateProjectField()`

La ficha del proyecto quedó como el centro de trabajo de MARTES.

## Pendientes

- Implementar Venues (`proyecto_venues`).
- Revisión visual y de UX de la ficha.
- Comenzar el módulo Tareas.

## Commit

`0ca04bf`

**Completa ficha editable de proyectos**

---

SESSION – 2026-07-15
Estado general

Se completó la primera versión funcional del módulo Proyectos.

El sistema ya permite:

Mostrar proyectos agrupados por etapa.
Ordenarlos por prioridad.
Abrir la ficha individual de un proyecto.
Editar la prioridad y persistir el cambio en Supabase mediante Server Actions.

Se tomó la decisión de comenzar el desarrollo de la aplicación real, dejando atrás las pruebas de conexión e importación.

Decisiones de arquitectura
1. La ficha del proyecto será el centro de trabajo

No existirán formularios separados de edición.

El usuario trabaja directamente sobre la ficha del proyecto.

Los campos serán editables "inline", al estilo Notion.

2. Componente único de edición

Se descartó la estrategia inicial basada en múltiples componentes:

EditableValue
EditableSelect
EditableDate
EditableTextarea
EditableNumber

Se reemplazó por un único componente:

EditableField

Este componente soportará distintos tipos:

text
number
date
textarea
select

Más adelante se agregará únicamente:

SearchSelect

para búsquedas sobre personas y clientes.

3. Sin wrappers por campo

Se decidió eliminar componentes como:

ProjectPriority
ProjectStatus
ProjectType

La ficha utilizará directamente:

EditableField

configurado para cada caso.

4. Edición mediante Server Actions

Toda modificación utilizará una única Server Action:

updateProjectField()

Esta acción actualizará cualquier campo permitido de la tabla proyectos.

Estado actual del módulo Proyectos
Vista Proyectos
/proyectos

Estado:

✅ Operativa

Incluye:

Header
Botón Nuevo Proyecto
Etapas
Tarjetas
Orden por prioridad
Apertura de ficha
Vista Proyecto
/proyectos/[id]

Estado:

Operativa.

Actualmente:

lectura completa
prioridad editable

Pendiente:

Estado
Tipo
Cliente
Responsable
Fechas
Notas
Público esperado
Valor venta
Tareas
Dependencias actuales
app/
app/

page.tsx
    ↓ redirect
/proyectos

proyectos/

page.tsx
    ↓
ProjectCard
StageSection
AppHeader

[id]/

page.tsx
    ↓
EditableField

actions.ts
    ↓
updateProjectField()
components/
components/

layout/

AppHeader

projects/

ProjectCard
StageSection

forms/

EditableField
services
project.service.ts

↓

project.repository.ts
repositories
project.repository.ts

↓

Supabase

Funciones actuales:

getProjects()

getProjectById()

getProjectEditOptions()
Server Actions
updateProjectField()

Responsabilidades:

validar campo editable
actualizar Supabase
revalidatePath()
refrescar Proyecto
refrescar Proyectos
Flujo actual
Proyectos

↓

ProjectCard

↓

Ficha Proyecto

↓

EditableField

↓

updateProjectField()

↓

Supabase

↓

revalidatePath()

↓

Vista actualizada
Próxima sesión

Objetivo:

Completar la edición de la ficha del proyecto.

Orden acordado:

Estado
Tipo
Responsable
Cliente
Nombre
Fechas
Notas
Público esperado
Valor venta

Una vez completada la ficha, comenzar el módulo Tareas, reutilizando EditableField y creando SearchSelect para la asignación de responsables.

# Sesión – 15 de julio de 2026 18:12

## Base de datos

- Se habilitaron las políticas RLS de lectura para:
  - tipos_proyecto
  - proyectos
  - personas
  - clientes

- Se importaron 292 proyectos históricos desde el sistema anterior.
- Se crearon automáticamente 102 clientes durante la importación.
- Se validaron responsables, tipos y estados.

## Arquitectura

- Se implementó la arquitectura:
  - Repository
  - Service
  - Components

- Se creó la primera navegación real de la aplicación.

## Navegación

Se implementó la estructura inicial:

- Sidebar
- Vista Proyectos

## Componentes creados

Layout
- Sidebar
- AppHeader

Projects
- StageSection
- ProjectCard

## Vista Proyectos

Implementada utilizando datos reales de Supabase.

Características:

- Etapas ordenadas verticalmente.
- Tarjetas con scroll horizontal.
- Contador de proyectos por etapa.
- Orden por prioridad.
- Cliente.
- Tipo de proyecto.
- Responsable.
- Fecha propuesta.
- Fecha evento.
- Barra de avance de tareas (preparada).

## Decisiones de UX

Se definieron los siguientes principios:

- Menos es más.
- La tarjeta no reemplaza la ficha del proyecto.
- La tarjeta completa es el botón para abrir el proyecto.
- La prioridad se representa mediante un número.
- La prioridad ordena los proyectos dentro de cada etapa.
- Las tarjetas muestran únicamente la información necesaria para decidir qué proyecto abrir.
- La información detallada pertenece exclusivamente a la ficha del proyecto.

## Decisiones de producto

Se acordó que:

- Martes comenzará a utilizarse antes de estar "terminado".
- No se importarán tareas históricas.
- Las tareas comenzarán a generarse desde el uso real de la aplicación.
- Mi Martes se alimentará automáticamente a partir de las tareas creadas por los usuarios.

## Próximo objetivo

Completar la vista Proyectos:

- ProjectCard definitiva.
- Ver todos.
- Nuevo Proyecto.
- Ficha del proyecto.
## 2026-07-15

- Se conectó Martes a Supabase.
- Se implementó la arquitectura Repository → Service.
- Se creó el cliente administrador para scripts.
- Se desarrolló el primer importador de proyectos.
- Se importaron 292 proyectos.
- Se crearon automáticamente 102 clientes.
- Se creó la ruta /proyectos.
- Se implementó la lectura de proyectos desde Supabase.

# MARTES

## SESSION 001

Date

2026-07-13

Started

13:42 CLT

Finished

18:23 CLT

Status

✅ Completed

---

## Objective

Conectar Vercel y preparar la integración con Supabase.

---

## Completed

- ✔ Proyecto creado en Vercel.
- ✔ Repositorio GitHub conectado.
- ✔ Dominio `martes.laorejalab.cl` configurado.
- ✔ DNS actualizado en DreamHost.
- ✔ Valid Configuration obtenido.
- ✔ `PROJECT.md` actualizado.
- ✔ `SESSION.md` incorporado al proyecto.
- ✔ Instalados `@supabase/supabase-js` y `@supabase/ssr`.
- ✔ Archivo `.env.local` creado.
- ✔ Cliente inicial de Supabase creado (`lib/supabase/client.ts`).
- ✔ Proyecto ejecutándose correctamente en `http://localhost:3000`.

---

## Decisions

- La documentación del proyecto se edita desde Visual Studio Code.
- Cada sesión tendrá un único objetivo principal.
- Al finalizar cada sesión se actualizarán `PROJECT.md` y `SESSION.md`.
- El desarrollo seguirá el flujo:
  - Leer `PROJECT.md`.
  - Leer `SESSION.md`.
  - Desarrollar.
  - Actualizar documentación.
  - Commit.
  - Push.

---

## Next Session

**SESSION 002**

Objetivo:

Diseñar la arquitectura de la aplicación antes de implementar nuevas funcionalidades.

Temas:

- Estructura de carpetas.
- Arquitectura de Next.js.
- Organización de componentes.
- Integración con Supabase.
- Tipos TypeScript.
- Layout principal.
- Pantalla **Mi Martes**.

---

## Notes

La infraestructura base del proyecto quedó completamente operativa:

**GitHub → Vercel → martes.laorejalab.cl → Next.js**

La siguiente etapa corresponde al diseño de la arquitectura de la aplicación.