import { NextResponse } from "next/server";
import { pingDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Estado del servicio. No expone secretos ni detalles internos. */
export async function GET() {
  const dbOk = await pingDb();
  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "error",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    },
    { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
