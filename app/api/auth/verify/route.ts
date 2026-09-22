import { NextResponse, type NextRequest } from "next/server";
import { resolveNext } from "@/lib/auth/next-path";
import { SESSION_COOKIE, createSessionCookieValue, sessionCookieOptions } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { getEnv } from "@/lib/env";
import { route } from "@/lib/http";
import { consumeMagicToken } from "@/lib/repositories/magic-tokens";
import { upsertUser } from "@/lib/repositories/users";
import { authVerifyInput } from "@/lib/validators";

export const runtime = "nodejs";

/**
 * Consume el token (un solo uso, con caducidad) y abre sesión.
 * Es un POST desde el botón "Continuar": un GET del enlace no gasta el token, así que
 * los escáneres de correo y las previsualizaciones no lo invalidan.
 * El rol admin solo sale de ADMIN_EMAIL, nunca del cliente.
 */
export const POST = route(async (request: NextRequest) => {
  const form = await request.formData();
  const parsed = authVerifyInput.safeParse({ token: form.get("token") });
  const fail = () => NextResponse.redirect(new URL("/login?error=invalid_link", request.url), 303);
  if (!parsed.success) return fail();

  const consumed = await consumeMagicToken(hashToken(parsed.data.token));
  if (!consumed) return fail();

  const env = getEnv();
  const user = await upsertUser({
    email: consumed.email,
    ...(consumed.email === env.ADMIN_EMAIL ? { role: "admin" as const, name: env.ADMIN_NAME } : {}),
  });

  const response = NextResponse.redirect(new URL(resolveNext(consumed.next, user.role), request.url), 303);
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionCookieValue({ userId: user.id, email: user.email, name: user.name, role: user.role }),
    sessionCookieOptions(),
  );
  return response;
});
