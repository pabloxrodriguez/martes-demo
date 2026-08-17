import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, FileText, Mail } from "lucide-react";

type PersonalWorkspacePanelProps = {
  isConnected: boolean;
  googleEmail: string | null;
  notice: string | null;
  noticeTone: "success" | "error";
  gmailSummary: {
    status: "ready" | "not_connected" | "error";
    inboxCount: number;
    unreadCount: number;
    recentMessages: {
      from: string;
      subject: string;
      date: string | null;
    }[];
  };
  calendarSummary: {
    status: "ready" | "not_connected" | "error";
    eventCount: number;
    events: {
      title: string;
      startsAt: string | null;
      url: string | null;
    }[];
  };
  calendarDate: string;
  previousCalendarHref: string;
  nextCalendarHref: string;
  driveSummary: {
    status: "ready" | "not_connected" | "error";
    recentCount: number;
    recentFiles: {
      name: string;
      url: string | null;
      modifiedAt: string | null;
    }[];
  };
};

export function PersonalWorkspacePanel({
  isConnected,
  googleEmail,
  notice,
  noticeTone,
  gmailSummary,
  calendarSummary,
  calendarDate,
  previousCalendarHref,
  nextCalendarHref,
  driveSummary,
}: PersonalWorkspacePanelProps) {
  const calendarDayLabel = formatCalendarDate(calendarDate);
  const gmailLines =
    gmailSummary.status === "error"
      ? ["No se pudo actualizar Gmail", "Abre Gmail para revisar"]
      : gmailSummary.unreadCount === 0
        ? ["Sin correos nuevos", "Inbox al día"]
        : [
            `${gmailSummary.unreadCount} ${
              gmailSummary.unreadCount === 1
                ? "correo nuevo"
                : "correos nuevos"
            }`,
            ...gmailSummary.recentMessages.map((message) => (
              <span key={`${message.from}-${message.subject}`}>
                <span className="font-semibold text-zinc-700">
                  {message.from}
                </span>{" "}
                <span>{message.subject}</span>
              </span>
            )),
          ];
  const calendarLines =
    calendarSummary.status === "error"
      ? ["No se pudo actualizar Calendar", "Abre Google Calendar para revisar"]
      : calendarSummary.eventCount === 0
        ? [`Sin eventos el ${calendarDayLabel}`, "Agenda despejada"]
        : [
            `${calendarSummary.eventCount} ${
              calendarSummary.eventCount === 1 ? "evento" : "eventos"
            }`,
            ...calendarSummary.events.map((event) =>
              formatCalendarEvent(event.startsAt, event.title)
            ),
          ];
  const driveLines =
    driveSummary.status === "error"
      ? ["No se pudo actualizar Drive", "Abre Google Drive para revisar"]
      : driveSummary.recentCount === 0
        ? ["Sin archivos recientes", "Drive sin cambios visibles"]
        : [
            `${driveSummary.recentCount} ${
              driveSummary.recentCount === 1
                ? "archivo reciente"
                : "archivos recientes"
            }`,
            ...driveSummary.recentFiles.map((file) => `• ${file.name}`),
          ];

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Escritorio personal
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Señales rápidas de Gmail, Calendar y Drive para entrar al día sin
            reemplazar las apps de Google.
          </p>
        </div>

        {isConnected ? (
          <div className="flex flex-wrap items-center gap-3">
            <form action="/api/google/disconnect" method="post">
              <button
                type="submit"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
              >
                Google conectado · Desconectar
              </button>
            </form>
          </div>
        ) : (
          <a
            href="/api/google/connect"
            className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Conectar Google
          </a>
        )}
      </div>

      {notice && noticeTone === "error" ? (
        <div
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {notice}
        </div>
      ) : null}

      {isConnected ? (
        <>
          <p className="mt-5 text-sm text-zinc-500">
            Google conectado{googleEmail ? ` como ${googleEmail}` : ""}.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <WorkspaceWidget
              icon={<Mail size={18} />}
              title="Correo"
              lines={gmailLines}
              href="https://mail.google.com/"
              action="Abrir Gmail"
            />
            <WorkspaceWidget
              icon={<CalendarDays size={18} />}
              title="Agenda del día"
              lines={calendarLines}
              href="https://calendar.google.com/"
              action="Abrir Calendar"
              controls={
                <div className="flex items-center gap-1 text-xs">
                  <Link
                    href={previousCalendarHref}
                    className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
                    aria-label="Ver día anterior"
                  >
                    ←
                  </Link>
                  <span className="min-w-16 text-center text-zinc-500">
                    {calendarDayLabel}
                  </span>
                  <Link
                    href={nextCalendarHref}
                    className="rounded-md border border-zinc-200 bg-white px-2 py-1 font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
                    aria-label="Ver día siguiente"
                  >
                    →
                  </Link>
                </div>
              }
            />
            <WorkspaceWidget
              icon={<FileText size={18} />}
              title="Drive"
              lines={driveLines}
              href="https://drive.google.com/"
              action="Abrir Drive"
            />
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
          Conecta tu cuenta Google para mostrar aquí un resumen liviano de tu
          correo, agenda y Drive. Cada usuario autoriza su propia cuenta.
        </div>
      )}
    </section>
  );
}

function formatCalendarEvent(value: string | null, title: string) {
  if (!value) {
    return title;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `Todo el día · ${title}`;
  }

  const time = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(new Date(value));

  return `${time} · ${title}`;
}

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function WorkspaceWidget({
  icon,
  title,
  lines,
  href,
  action,
  controls,
}: {
  icon: ReactNode;
  title: string;
  lines: ReactNode[];
  href: string;
  action: string;
  controls?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden>{icon}</span>
          <h3 className="font-semibold text-zinc-950">{title}</h3>
        </div>
        {controls}
      </div>

      <div className="mt-3 space-y-1 text-sm text-zinc-500">
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex text-sm font-medium text-zinc-950 underline-offset-4 hover:underline"
      >
        {action}
      </a>
    </div>
  );
}
