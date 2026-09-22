import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { json, notFound, readJson, route, type RouteParams } from "@/lib/http";
import { deleteSection, updateSection } from "@/lib/repositories/sections";
import { sectionUpdateInput } from "@/lib/validators";

export const runtime = "nodejs";

export const PATCH = route(async (request: NextRequest, { params }: RouteParams<"id">) => {
  await requireRole("admin");
  const { id } = await params;
  const section = await updateSection(id, sectionUpdateInput.parse(await readJson(request)));
  if (!section) notFound("Sección");
  return json({ section });
});

/** Borrado en cascada: sección → recursos → feedback. */
export const DELETE = route(async (_request: NextRequest, { params }: RouteParams<"id">) => {
  await requireRole("admin");
  const { id } = await params;
  if (!(await deleteSection(id))) notFound("Sección");
  return json({ ok: true });
});
