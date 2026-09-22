import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { getEnv } from "@/lib/env";
import { ApiError, json, readJson, route } from "@/lib/http";
import { buildObjectKey, presignPut } from "@/lib/storage";
import { uploadInput } from "@/lib/validators";

export const runtime = "nodejs";

/**
 * Admin: pide una URL prefirmada PUT para subir directo al bucket.
 * Valida tipo y tamaño antes de firmar; la clave lleva un UUID.
 */
export const POST = route(async (request: NextRequest) => {
  await requireRole("admin");
  const input = uploadInput.parse(await readJson(request));
  const maxBytes = getEnv().MAX_UPLOAD_MB * 1024 * 1024;
  if (input.size > maxBytes) {
    throw new ApiError(413, "too_large", `El fichero supera el máximo de ${getEnv().MAX_UPLOAD_MB} MB`);
  }

  const key = buildObjectKey(input.filename);
  const uploadUrl = await presignPut({ key, contentType: input.contentType, size: input.size });
  const path = `/api/files/${key}`;
  const name = key.split("/").pop() ?? input.filename;
  const snippet = input.contentType.startsWith("image/") ? `![Describe la imagen](${path})` : `[${name}](${path})`;

  return json({ key, uploadUrl, path, snippet });
});
