import { NextResponse, type NextRequest } from "next/server";
import { defaultHome } from "@/lib/auth/next-path";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";

/**
 * Protege /admin/** y /student/** (Next 16: `proxy` sustituye a `middleware`).
 * Es una primera barrera; cada página y cada API vuelve a comprobar sesión y rol.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, getEnv().AUTH_SECRET);

  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminArea && session.role !== "admin") {
    return NextResponse.redirect(new URL(defaultHome(session.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*"],
};
