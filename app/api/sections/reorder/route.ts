import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { ApiError, json, readJson, route } from "@/lib/http";
import { reorderSections } from "@/lib/repositories/sections";
import { reorderInput } from "@/lib/validators";

export const runtime = "nodejs";

/** Recibe la lista completa y ordenada de ids de secciones de un curso (`parentId`) y reescribe `order`. */
export const POST = route(async (request: NextRequest) => {
  await requireRole("admin");
  const { parentId, ids } = reorderInput.parse(await readJson(request));
  try {
    return json({ sections: await reorderSections(parentId, ids) });
  } catch (error) {
    throw new ApiError(400, "invalid_order", error instanceof Error ? error.message : "Orden no válido");
  }
});
