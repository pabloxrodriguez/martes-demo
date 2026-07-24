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

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user?.email_confirmed_at) {
        const { data: linkStatus, error: linkError } =
          await supabase.rpc("link_current_auth_user");

        if (!linkError && linkStatus === "linked") {
          return NextResponse.redirect(redirectUrl);
        }

        console.error("No se pudo vincular el usuario autenticado.", {
          userId: user.id,
          status: linkStatus,
          error: linkError,
        });
      }

      return NextResponse.redirect(
        new URL("/acceso-denegado", origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/login", origin));
}
