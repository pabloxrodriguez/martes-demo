export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
] as const;

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_WORKSPACE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_WORKSPACE_REDIRECT_URI;

  if (!clientId) {
    throw new Error("Falta GOOGLE_WORKSPACE_CLIENT_ID.");
  }

  if (!clientSecret) {
    throw new Error("Falta GOOGLE_WORKSPACE_CLIENT_SECRET.");
  }

  if (!redirectUri) {
    throw new Error("Falta GOOGLE_WORKSPACE_REDIRECT_URI.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}
