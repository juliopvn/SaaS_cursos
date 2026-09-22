import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "cursos_session";

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

function secretKey(secret = getEnv().AUTH_SECRET) {
  return new TextEncoder().encode(secret);
}

export async function signSession(session: Session, opts: { secret: string; ttlDays: number }): Promise<string> {
  return new SignJWT({ email: session.email, name: session.name, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${opts.ttlDays}d`)
    .sign(secretKey(opts.secret));
}

/** Verifica firma y caducidad. Devuelve `null` ante cualquier token inválido. */
export async function verifySessionToken(token: string | undefined, secret: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: ["HS256"] });
    const role = payload.role;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    if (role !== "admin" && role !== "student") return null;
    return {
      userId: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : payload.email,
      role,
    };
  } catch {
    return null;
  }
}

/** Sesión de la petición actual (Server Components y Route Handlers). */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value, getEnv().AUTH_SECRET);
}

export function sessionCookieOptions() {
  const env = getEnv();
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isSecureCookies,
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

export async function createSessionCookieValue(session: Session): Promise<string> {
  const env = getEnv();
  return signSession(session, { secret: env.AUTH_SECRET, ttlDays: env.SESSION_TTL_DAYS });
}
