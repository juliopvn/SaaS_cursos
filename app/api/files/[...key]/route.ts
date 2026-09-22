import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { notFound, route } from "@/lib/http";
import { isValidObjectKey, presignGet } from "@/lib/storage";

export const runtime = "nodejs";

/** Requiere sesión (401 si no) y responde 302 a una URL prefirmada de vida corta. */
export const GET = route<{ params: Promise<{ key: string[] }> }>(async (_request: NextRequest, { params }) => {
  await requireUser();
  const key = (await params).key.join("/");
  if (!isValidObjectKey(key)) notFound("Fichero");
  const response = NextResponse.redirect(await presignGet(key), 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});
