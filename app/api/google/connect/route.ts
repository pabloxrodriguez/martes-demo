import crypto from "crypto";
import { NextResponse } from "next/server";

import { requireActivePerson } from "@/lib/auth/requireActivePerson";
import { buildGoogleConsentUrl } from "@/lib/integrations/google/oauth";

export async function GET() {
  await requireActivePerson();

  const state = crypto.randomBytes(24).toString("base64url");
  const consentUrl = buildGoogleConsentUrl({ state });
  const response = NextResponse.redirect(consentUrl);

  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return response;
}
