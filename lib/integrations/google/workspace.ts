import "server-only";

import type { createClient } from "@/lib/supabase/server";

import { refreshGoogleAccessToken } from "./oauth";
import {
  decryptGoogleToken,
  encryptGoogleToken,
} from "./token-crypto";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type GoogleConnection = {
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  expires_at: string;
};

type CalendarEventDate = {
  date?: string;
  dateTime?: string;
};

type CalendarEvent = {
  id: string;
  summary?: string;
  htmlLink?: string;
  start?: CalendarEventDate;
  end?: CalendarEventDate;
};

type CalendarEventsResponse = {
  items?: CalendarEvent[];
};

type DriveFile = {
  id: string;
  name?: string;
  webViewLink?: string;
  modifiedTime?: string;
};

type DriveFilesResponse = {
  files?: DriveFile[];
};

type GmailLabelResponse = {
  messagesTotal?: number;
  messagesUnread?: number;
};

type GmailMessageListItem = {
  id: string;
};

type GmailMessagesResponse = {
  messages?: GmailMessageListItem[];
  resultSizeEstimate?: number;
};

type GmailMessageHeader = {
  name: string;
  value: string;
};

type GmailMessageResponse = {
  id: string;
  internalDate?: string;
  payload?: {
    headers?: GmailMessageHeader[];
  };
};

export type GoogleGmailSummary = {
  status: "ready" | "not_connected" | "error";
  inboxCount: number;
  unreadCount: number;
  recentMessages: {
    from: string;
    subject: string;
    date: string | null;
  }[];
};

export type GoogleCalendarSummary = {
  status: "ready" | "not_connected" | "error";
  eventCount: number;
  events: {
    title: string;
    startsAt: string | null;
    url: string | null;
  }[];
};

export type GoogleDriveSummary = {
  status: "ready" | "not_connected" | "error";
  recentCount: number;
  recentFiles: {
    name: string;
    url: string | null;
    modifiedAt: string | null;
  }[];
};

function getDayRangeInSantiago(date: string) {
  const start = new Date(`${date}T00:00:00-04:00`);
  const end = new Date(`${date}T23:59:59-04:00`);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function getValidGoogleAccessToken({
  supabase,
  personId,
  connection,
}: {
  supabase: SupabaseServerClient;
  personId: string;
  connection: GoogleConnection;
}) {
  const expiresAt = new Date(connection.expires_at).getTime();
  const shouldRefresh = expiresAt - Date.now() < 2 * 60 * 1000;

  if (!shouldRefresh) {
    return decryptGoogleToken(connection.access_token_encrypted);
  }

  if (!connection.refresh_token_encrypted) {
    throw new Error("La conexión Google no tiene refresh token.");
  }

  const refreshToken = decryptGoogleToken(
    connection.refresh_token_encrypted
  );
  const tokenResponse = await refreshGoogleAccessToken(refreshToken);
  const expiresAtUpdated = new Date(
    Date.now() + Number(tokenResponse.expires_in) * 1000
  ).toISOString();

  const { error } = await supabase
    .from("google_connections")
    .update({
      access_token_encrypted: encryptGoogleToken(
        tokenResponse.access_token!
      ),
      expires_at: expiresAtUpdated,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("persona_id", personId);

  if (error) {
    throw new Error(
      `No se pudo renovar la conexión Google: ${error.message}`
    );
  }

  return tokenResponse.access_token!;
}

function getHeaderValue(
  headers: GmailMessageHeader[] | undefined,
  name: string
) {
  return (
    headers?.find(
      (header) => header.name.toLowerCase() === name.toLowerCase()
    )?.value ?? null
  );
}

function simplifyEmailSender(value: string | null) {
  if (!value) {
    return "Remitente desconocido";
  }

  const match = value.match(/^"?([^"<]+)"?\s*</);

  return (match?.[1] ?? value).trim();
}

function timestampToIso(value: string | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = Number(value);

  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : null;
}

function logGoogleSummaryFailure(service: string, caughtError: unknown) {
  const detail =
    caughtError instanceof Error ? caughtError.message : "Error desconocido";

  console.warn(`No se pudo actualizar ${service}: ${detail}`);
}

export async function getGoogleGmailSummary({
  supabase,
  personId,
}: {
  supabase: SupabaseServerClient;
  personId: string;
}): Promise<GoogleGmailSummary> {
  const { data: connection, error } = await supabase
    .from("google_connections")
    .select(
      "access_token_encrypted, refresh_token_encrypted, expires_at"
    )
    .eq("persona_id", personId)
    .maybeSingle();

  if (error) {
    console.error("No se pudo leer la conexión Google.", error);

    return {
      status: "error",
      inboxCount: 0,
      unreadCount: 0,
      recentMessages: [],
    };
  }

  if (!connection) {
    return {
      status: "not_connected",
      inboxCount: 0,
      unreadCount: 0,
      recentMessages: [],
    };
  }

  try {
    const accessToken = await getValidGoogleAccessToken({
      supabase,
      personId,
      connection,
    });
    const inboxLabelUrl = new URL(
      "https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX"
    );
    const messagesUrl = new URL(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages"
    );

    messagesUrl.searchParams.set("labelIds", "INBOX");
    messagesUrl.searchParams.append("labelIds", "UNREAD");
    messagesUrl.searchParams.set("maxResults", "3");

    const [labelResponse, messagesResponse] = await Promise.all([
      fetch(inboxLabelUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }),
      fetch(messagesUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }),
    ]);

    if (!labelResponse.ok) {
      throw new Error(`Gmail respondió ${labelResponse.status}.`);
    }

    if (!messagesResponse.ok) {
      throw new Error(`Gmail respondió ${messagesResponse.status}.`);
    }

    const [labelPayload, messagesPayload] = (await Promise.all([
      labelResponse.json(),
      messagesResponse.json(),
    ])) as [GmailLabelResponse, GmailMessagesResponse];
    const messages = messagesPayload.messages ?? [];
    const recentMessages = await Promise.all(
      messages.map(async (message) => {
        const messageUrl = new URL(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`
        );

        messageUrl.searchParams.set("format", "metadata");
        messageUrl.searchParams.set(
          "metadataHeaders",
          "From"
        );
        messageUrl.searchParams.append(
          "metadataHeaders",
          "Subject"
        );

        const response = await fetch(messageUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Gmail respondió ${response.status}.`);
        }

        const payload = (await response.json()) as GmailMessageResponse;
        const headers = payload.payload?.headers;

        return {
          from: simplifyEmailSender(getHeaderValue(headers, "From")),
          subject:
            getHeaderValue(headers, "Subject") ?? "Correo sin asunto",
          date: timestampToIso(payload.internalDate),
        };
      })
    );

    return {
      status: "ready",
      inboxCount: labelPayload.messagesTotal ?? 0,
      unreadCount: labelPayload.messagesUnread ?? 0,
      recentMessages,
    };
  } catch (caughtError) {
    logGoogleSummaryFailure("Gmail", caughtError);

    return {
      status: "error",
      inboxCount: 0,
      unreadCount: 0,
      recentMessages: [],
    };
  }
}

export async function getGoogleCalendarSummary({
  supabase,
  personId,
  date,
}: {
  supabase: SupabaseServerClient;
  personId: string;
  date: string;
}): Promise<GoogleCalendarSummary> {
  const { data: connection, error } = await supabase
    .from("google_connections")
    .select(
      "access_token_encrypted, refresh_token_encrypted, expires_at"
    )
    .eq("persona_id", personId)
    .maybeSingle();

  if (error) {
    console.error("No se pudo leer la conexión Google.", error);

    return {
      status: "error",
      eventCount: 0,
      events: [],
    };
  }

  if (!connection) {
    return {
      status: "not_connected",
      eventCount: 0,
      events: [],
    };
  }

  try {
    const accessToken = await getValidGoogleAccessToken({
      supabase,
      personId,
      connection,
    });
    const { start, end } = getDayRangeInSantiago(date);
    const url = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    );

    url.searchParams.set("timeMin", start);
    url.searchParams.set("timeMax", end);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "10");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Google Calendar respondió ${response.status}.`);
    }

    const payload = (await response.json()) as CalendarEventsResponse;
    const events = payload.items ?? [];

    return {
      status: "ready",
      eventCount: events.length,
      events: events.slice(0, 4).map((event) => ({
        title: event.summary ?? "Evento sin título",
        startsAt: event.start?.dateTime ?? event.start?.date ?? null,
        url: event.htmlLink ?? null,
      })),
    };
  } catch (caughtError) {
    logGoogleSummaryFailure("Google Calendar", caughtError);

    return {
      status: "error",
      eventCount: 0,
      events: [],
    };
  }
}

export async function getGoogleDriveSummary({
  supabase,
  personId,
}: {
  supabase: SupabaseServerClient;
  personId: string;
}): Promise<GoogleDriveSummary> {
  const { data: connection, error } = await supabase
    .from("google_connections")
    .select(
      "access_token_encrypted, refresh_token_encrypted, expires_at"
    )
    .eq("persona_id", personId)
    .maybeSingle();

  if (error) {
    console.error("No se pudo leer la conexión Google.", error);

    return {
      status: "error",
      recentCount: 0,
      recentFiles: [],
    };
  }

  if (!connection) {
    return {
      status: "not_connected",
      recentCount: 0,
      recentFiles: [],
    };
  }

  try {
    const accessToken = await getValidGoogleAccessToken({
      supabase,
      personId,
      connection,
    });
    const url = new URL("https://www.googleapis.com/drive/v3/files");

    url.searchParams.set(
      "fields",
      "files(id,name,webViewLink,modifiedTime)"
    );
    url.searchParams.set("orderBy", "modifiedTime desc");
    url.searchParams.set("pageSize", "5");
    url.searchParams.set("q", "trashed=false");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Google Drive respondió ${response.status}.`);
    }

    const payload = (await response.json()) as DriveFilesResponse;
    const files = payload.files ?? [];

    return {
      status: "ready",
      recentCount: files.length,
      recentFiles: files.slice(0, 3).map((file) => ({
        name: file.name ?? "Archivo sin nombre",
        url: file.webViewLink ?? null,
        modifiedAt: file.modifiedTime ?? null,
      })),
    };
  } catch (caughtError) {
    logGoogleSummaryFailure("Google Drive", caughtError);

    return {
      status: "error",
      recentCount: 0,
      recentFiles: [],
    };
  }
}
