import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react";

const modules = [
  {
    title: "Mi Martes",
    description:
      "Reúne tus tareas pendientes, proyectos activos, agenda y actividad reciente en un solo escritorio.",
    href: "/mi-martes",
    icon: LayoutDashboard,
  },
  {
    title: "Proyectos",
    description:
      "Organiza cada oportunidad por etapa, responsable, fechas, tareas, clientes, venues y presupuesto.",
    href: "/proyectos",
    icon: FolderKanban,
  },
  {
    title: "Equipo",
    description:
      "Permite ver las tareas abiertas de cada persona y los proyectos en los que está participando.",
    href: "/equipo",
    icon: Users,
  },
  {
    title: "Calendario",
    description:
      "Muestra las entregas de propuestas y las fechas tentativas o confirmadas de los eventos.",
    href: "/calendario",
    icon: CalendarDays,
  },
  {
    title: "Resultados",
    description:
      "Resume proyectos gestionados, ganados, no ganados y realizados en el período seleccionado.",
    href: "/resultados",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Presupuestos",
    description:
      "Desde la ficha de un proyecto puedes preparar un borrador colaborativo y exportarlo para Gael.",
    href: "/proyectos",
    icon: FileSpreadsheet,
  },
];

const stages = [
  "Prospecto",
  "En preparación",
  "Evaluación de cliente",
  "En ejecución",
  "Realizado",
];

export default function GuidePage() {
  return (
    <main className="px-5 py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Guía rápida
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            ¿Qué hace Martes?
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
            Martes acompaña el ciclo completo de un proyecto: desde que aparece
            una oportunidad hasta que se ejecuta y queda registrada en los
            resultados. Centraliza responsables, fechas, tareas y contexto para
            que el equipo trabaje sobre la misma información.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ListChecks className="mt-0.5 h-6 w-6 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                El flujo de un proyecto
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                El estado muestra en qué momento comercial u operativo se
                encuentra el proyecto. Si no avanza, también puede terminar como
                No ganado o Descartado - Cancelado.
              </p>
            </div>
          </div>

          <ol className="mt-6 grid gap-3 md:grid-cols-5">
            {stages.map((stage, index) => (
              <li
                key={stage}
                className="relative rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4"
              >
                <span className="text-xs font-semibold text-zinc-400">
                  PASO {index + 1}
                </span>
                <p className="mt-2 font-semibold text-zinc-900">{stage}</p>
                {index < stages.length - 1 && (
                  <ArrowRight
                    className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-white text-zinc-400 md:block"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-950">
            Las áreas de Martes
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  key={module.title}
                  href={module.href}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <ArrowRight
                      className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-zinc-600"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-950">
                    {module.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {module.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-6 text-white">
            <h2 className="text-xl font-semibold">Recorrido recomendado</h2>
            <ol className="mt-5 space-y-4">
              {[
                "Crea un proyecto y define sus fechas principales.",
                "Asigna un responsable y agrega tareas al equipo.",
                "Cambia su estado para observar cómo se mueve en Proyectos.",
                "Revisa su aparición en Calendario, Equipo y Resultados.",
                "Prepara un borrador de presupuesto desde su ficha.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-zinc-200">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-950">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <CheckCircle2 className="h-6 w-6 text-amber-700" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-amber-950">
              Estás en una versión demo
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              Los nombres, clientes y proyectos son ficticios. Los cambios que
              hagas sirven para probar el flujo y pueden ser visibles para otras
              personas autorizadas en esta demostración.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
