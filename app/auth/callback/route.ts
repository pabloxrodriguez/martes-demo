import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const requestedPath = searchParams.get("next");
  const fallbackUrl = new URL("/proyectos", origin);
  let redirectUrl = fallbackUrl;

  if (
    requestedPath?.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    !requestedPath.includes("\\")
  ) {
    const candidateUrl = new URL(requestedPath, origin);

    if (candidateUrl.origin === origin) {
      redirectUrl = candidateUrl;
    }
  }

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(new URL("/login", origin));
}
