# MARTES

> Sistema de gestión de proyectos y eventos de La Oreja Lab.

---

# PROJECT STATUS

Version: 1.0

Last Update: 2026-07-13, 13:42 CLT

Status:

🟢 Active Development

---

# PURPOSE

Martes es la plataforma interna de gestión de proyectos de La Oreja Lab.

Su objetivo es administrar el ciclo completo de un proyecto, desde la oportunidad comercial hasta el cierre y evaluación del evento.

No busca ser un ERP.

Es una plataforma especializada en la operación de proyectos y eventos.

---

# DESIGN PHILOSOPHY

Todas las decisiones del proyecto deben respetar los siguientes principios.

• Simplicidad

Mostrar únicamente la información necesaria.

•

Fuente única de información.

Cada dato debe existir una sola vez.

•

Arquitectura modular.

Cada componente debe evolucionar de manera independiente.

•

Escalabilidad.

El sistema debe crecer sin requerir rediseños completos.

•

Automatización.

Todo proceso repetitivo debe ser automatizable.

---

# CURRENT ARCHITECTURE

```
Usuario

↓

https://martes.laorejalab.cl

↓

Vercel

↓

Next.js

↓

Supabase

↓

PostgreSQL
```

---

# TECHNOLOGY STACK

Frontend

- Next.js 16
- React
- TypeScript
- TailwindCSS

Backend

- Supabase

Database

- PostgreSQL

Hosting

- Vercel

Version Control

- Git
- GitHub

---

# REPOSITORY

GitHub

LaOrejaLab/martes

Main Branch

main

---

# LOCAL DEVELOPMENT

Project folder

```
LAB 2026/

00_Martes_2027/

martes/
```

Run

```bash
npm install

npm run dev
```

Local URL

```
http://localhost:3000
```

---

# DEVELOPMENT WORKFLOW

```
Local Development

↓

Git

↓

GitHub

↓

Vercel

↓

Production
```

Nunca se desarrolla directamente sobre producción.

Todo cambio comienza localmente.

---

# DATABASE

Supabase

Region

São Paulo

Current Model

## Organización

- personas
- clientes

## Proyectos

- proyectos
- estados_proyecto
- tipos_proyecto
- venues
- proyecto_venues

## Trabajo

- tareas
- estados_tarea
- plantillas_tarea

---

# IMPORTANT DECISIONS

## Proyecto

Un proyecto puede tener múltiples venues.

Por ello existe la tabla

proyecto_venues

---

## Proyecto

El tipo del proyecto se determina mediante

tipo_id

No existe un campo "modalidad".

---

## Proyecto

Se agregó

publico_esperado

como atributo propio del proyecto.

---

## Tareas

Las tareas NO dependen del estado del proyecto.

Existe una entidad independiente

estados_tarea

---

# USER EXPERIENCE

Pantallas definidas

- Mi Martes
- Proyectos
- Proyecto
- Equipo
- Calendario
- Resultados
- Clientes

La UX fue diseñada antes del desarrollo.

---

# CODING CONVENTIONS

Código

English

Interfaz

Español

Database

snake_case

React Components

PascalCase

Variables

camelCase

---

# CURRENT STATUS

Completed

✔ UX
✔ Arquitectura
✔ Modelo de datos
✔ GitHub
✔ Git Local
✔ GitHub CLI
✔ Next.js
✔ Supabase
✔ Base de datos inicial
✔ Primer push
✔ Vercel
✔ Dominio

Pending

□ Conexión Supabase
□ Layout
□ Dashboard Mi Martes

---

# NEXT MILESTONE

1.

Conectar Vercel.

2.

Configurar

martes.laorejalab.cl

3.

Conectar Next.js con Supabase.

4.

Crear Layout principal.

5.

Implementar Mi Martes.

---

# HOW TO CONTINUE THIS PROJECT

Antes de desarrollar cualquier funcionalidad:

1.

Leer este documento completo.

2.

Revisar el último commit.

3.

Verificar el modelo de datos.

4.

Levantar el proyecto localmente.

5.

Continuar únicamente desde el estado descrito aquí.

Este documento representa la referencia principal del proyecto.

Toda decisión estructural importante debe actualizar este archivo antes de realizar un commit.

---

# AUTHORS

La Oreja Lab

Proyecto dirigido por Pablo Rodriguez.

Arquitectura y desarrollo realizados colaborativamente con ChatGPT.