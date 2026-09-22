import { ObjectId } from "mongodb";
import { col } from "./collections";

export async function insertMagicToken(input: {
  tokenHash: string;
  email: string;
  next?: string;
  expiresAt: Date;
}): Promise<void> {
  await (await col("magic_tokens")).insertOne({
    _id: new ObjectId(),
    tokenHash: input.tokenHash,
    email: input.email,
    ...(input.next ? { next: input.next } : {}),
    createdAt: new Date(),
    expiresAt: input.expiresAt,
  });
}

/**
 * Consume el token de forma atómica: solo tiene éxito si existe, no ha caducado y no se usó.
 * Dos peticiones simultáneas con el mismo token: exactamente una gana.
 */
export async function consumeMagicToken(tokenHash: string): Promise<{ email: string; next?: string } | null> {
  const now = new Date();
  const doc = await (await col("magic_tokens")).findOneAndUpdate(
    { tokenHash, usedAt: { $exists: false }, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { returnDocument: "before" },
  );
  return doc ? { email: doc.email, ...(doc.next ? { next: doc.next } : {}) } : null;
}
