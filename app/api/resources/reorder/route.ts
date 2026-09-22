import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { ApiError, json, readJson, route } from "@/lib/http";
import { reorderResources } from "@/lib/repositories/resources";
import { reorderInput } from "@/lib/validators";

export const runtime = "nodejs";

/** Recibe la lista completa y ordenada de ids de recursos de una sección (`parentId`) y reescribe `order`. */
export const POST = route(async (request: NextRequest) => {
  await requireRole("admin");
  const { parentId, ids } = reorderInput.parse(await readJson(request));
  try {
    return json({ resources: (await reorderResources(parentId, ids)).map(({ content: _c, ...r }) => r) });
  } catch (error) {
    throw new ApiError(400, "invalid_order", error instanceof Error ? error.message : "Orden no válido");
  }
});
