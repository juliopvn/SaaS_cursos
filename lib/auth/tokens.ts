import { createHash, randomBytes } from "node:crypto";

/** 32 bytes aleatorios en base64url (43 caracteres). Solo se envía por email; en BD va hasheado. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
