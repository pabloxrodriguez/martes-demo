import { NextResponse } from "next/server";

import { requireActivePerson } from "@/lib/auth/requireActivePerson";
import {
  exchangeGoogleCode,
  fetchGoogleUserEmail,
} from "@/lib/integrations/google/oauth";
import { encryptGoogleToken } from "@/lib/integrations/google/token-crypto";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("google_oauth_state="))
    ?.split("=")[1];
  const redirectToMiMartes = (status: string) =>
    NextResponse.redirect(new URL(`/mi-martes?google=${status}`, origin));

  if (!code || !state || !storedState || state !== storedState) {
    return redirectToMiMartes("error");
  }

  const { supabase, person } = await requireActivePerson();

  try {
    const tokenResponse = await exchangeGoogleCode(code);
    const googleEmail = await fetchGoogleUserEmail(
      tokenResponse.access_token!
    );
    const now = Date.now();
    const expiresAt = new Date(
      now + Number(tokenResponse.expires_in) * 1000
    ).toISOString();
    const { data: existingConnection } = await supabase
      .from("google_connections")
      .select("refresh_token_encrypted")
      .eq("persona_id", person.id)
      .maybeSingle();
    const refreshTokenEncrypted = tokenResponse.refresh_token
      ? encryptGoogleToken(tokenResponse.refresh_token)
      : existingConnection?.refresh_token_encrypted ?? null;

    if (!refreshTokenEncrypted) {
      return redirectToMiMartes("missing-refresh-token");
    }

    const { error } = await supabase
      .from("google_connections")
      .upsert(
        {
          persona_id: person.id,
          google_email: googleEmail,
          access_token_encrypted: encryptGoogleToken(
            tokenResponse.access_token!
          ),
          refresh_token_encrypted: refreshTokenEncrypted,
          scope: tokenResponse.scope ?? "",
          expires_at: expiresAt,
          fecha_actualizacion: new Date().toISOString(),
        },
        {
          onConflict: "persona_id",
        }
      );

    if (error) {
      console.error("No se pudo guardar la conexión Google.", error);

      return redirectToMiMartes("error");
    }
  } catch (error) {
    console.error("No se pudo conectar Google.", error);

    return redirectToMiMartes("error");
  }

  const response = redirectToMiMartes("connected");
  response.cookies.delete("google_oauth_state");

  return response;
}
