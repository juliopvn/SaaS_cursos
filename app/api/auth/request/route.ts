import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { getEnv } from "@/lib/env";
import { ApiError, json, readJson, route } from "@/lib/http";
import { getMailer } from "@/lib/mail";
import { magicLinkEmail } from "@/lib/mail/templates";
import { insertMagicToken } from "@/lib/repositories/magic-tokens";
import { hitRateLimit } from "@/lib/repositories/rate-limits";
import { authRequestInput } from "@/lib/validators";

export const runtime = "nodejs";

const EMAIL_LIMIT = { limit: 5, windowSeconds: 60 * 60 };
const IP_LIMIT = { limit: 30, windowSeconds: 60 * 60 };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Solicita un magic link. La respuesta es idéntica exista o no el email:
 * el usuario se crea al verificar, nunca aquí.
 */
export const POST = route(async (request: NextRequest) => {
  const { email, next } = authRequestInput.parse(await readJson(request));
  const env = getEnv();

  const [emailOk, ipOk] = await Promise.all([
    hitRateLimit(`auth:email:${email}`, EMAIL_LIMIT),
    hitRateLimit(`auth:ip:${await clientIp()}`, IP_LIMIT),
  ]);
  if (!emailOk || !ipOk) {
    throw new ApiError(429, "rate_limited", "Demasiados intentos. Espera un rato antes de pedir otro enlace.");
  }

  const token = generateToken();
  await insertMagicToken({
    tokenHash: hashToken(token),
    email,
    next,
    expiresAt: new Date(Date.now() + env.MAGIC_LINK_TTL_MINUTES * 60_000),
  });

  const url = new URL("/auth/verify", env.APP_URL);
  url.searchParams.set("token", token);
  await getMailer().send(magicLinkEmail({ to: email, url: url.toString(), ttlMinutes: env.MAGIC_LINK_TTL_MINUTES }));

  return json({ ok: true });
});
