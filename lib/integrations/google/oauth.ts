import "server-only";

import { GOOGLE_SCOPES, getGoogleOAuthConfig } from "./config";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
};

export function buildGoogleConsentUrl({
  state,
}: {
  state: string;
}) {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");

  return url;
}

export async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenResponse = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || tokenResponse.error) {
    throw new Error(
      tokenResponse.error_description ??
        tokenResponse.error ??
        "Google no entregó autorización."
    );
  }

  if (!tokenResponse.access_token || !tokenResponse.expires_in) {
    throw new Error("Google no entregó un token válido.");
  }

  return tokenResponse;
}

export async function fetchGoogleUserEmail(accessToken: string) {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const userInfo = (await response.json()) as GoogleUserInfo;

  return userInfo.email ?? null;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const tokenResponse = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || tokenResponse.error) {
    throw new Error(
      tokenResponse.error_description ??
        tokenResponse.error ??
        "Google no renovó la conexión."
    );
  }

  if (!tokenResponse.access_token || !tokenResponse.expires_in) {
    throw new Error("Google no entregó un token renovado válido.");
  }

  return tokenResponse;
}
