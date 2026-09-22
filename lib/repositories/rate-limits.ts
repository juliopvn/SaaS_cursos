import { col } from "./collections";

/**
 * Ventana fija con contador atómico en Mongo (el entorno es serverless: nada en memoria).
 * Devuelve `true` si la petición está permitida.
 */
export async function hitRateLimit(key: string, opts: { limit: number; windowSeconds: number }): Promise<boolean> {
  const now = Date.now();
  const windowStart = Math.floor(now / (opts.windowSeconds * 1000));
  const id = `${key}:${windowStart}`;
  const doc = await (await col("rate_limits")).findOneAndUpdate(
    { _id: id },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((windowStart + 1) * opts.windowSeconds * 1000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  return (doc?.count ?? 1) <= opts.limit;
}
