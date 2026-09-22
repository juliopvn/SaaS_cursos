import type { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { json, notFound, readJson, route } from "@/lib/http";
import { createResource, listResources } from "@/lib/repositories/resources";
import { getSectionById } from "@/lib/repositories/sections";
import { objectId, resourceCreateInput } from "@/lib/validators";

export const runtime = "nodejs";

export const GET = route(async (request: NextRequest) => {
  await requireRole("admin");
  const sectionId = objectId.parse(request.nextUrl.searchParams.get("sectionId"));
  return json({ resources: await listResources(sectionId) });
});

export const POST = route(async (request: NextRequest) => {
  await requireRole("admin");
  const input = resourceCreateInput.parse(await readJson(request));
  const section = await getSectionById(input.sectionId);
  if (!section) notFound("Sección");
  return json({ resource: await createResource({ ...input, courseId: section.courseId }) }, { status: 201 });
});
