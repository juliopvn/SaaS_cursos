import { NextResponse, type NextRequest } from "next/server";
import { defaultHome } from "@/lib/auth/next-path";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { securityHeaders } from "@/lib/security-headers";

/**
 * Cabeceras de seguridad y CSP en cada petición (no en `next.config.ts`): `headers()` de
 * Next.js se hornea en el build, así que si el `S3_ENDPOINT` cambia sin rebuild (o el build
 * no tenía las variables), la política quedaría mal grabada. Aquí siempre lee el entorno real.
 */
function withSecurityHeaders(response: NextResponse): NextResponse {
  const env = getEnv();
  for (const { key, value } of securityHeaders({
    s3Endpoint: env.S3_ENDPOINT,
    appUrl: env.APP_URL,
    isDev: process.env.NODE_ENV !== "production",
  })) {
    response.headers.set(key, value);
  }
  return response;
}

/** Protege /admin/** y /student/** (Next 16: `proxy` sustituye a `middleware`). */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStudentArea = pathname === "/student" || pathname.startsWith("/student/");

  if (!isAdminArea && !isStudentArea) return withSecurityHeaders(NextResponse.next());

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, getEnv().AUTH_SECRET);
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return withSecurityHeaders(NextResponse.redirect(login));
  }
  if (isAdminArea && session.role !== "admin") {
    return withSecurityHeaders(NextResponse.redirect(new URL(defaultHome(session.role), request.url)));
  }
  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Todo excepto assets estáticos: las cabeceras de seguridad deben llegar a cualquier página.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg).*)"],
};
