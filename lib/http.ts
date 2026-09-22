import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getEnv } from "@/lib/env";
import { DuplicateSlugError } from "@/lib/repositories/courses";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Peticiones mutantes: el `Origin` debe coincidir con el host de la app (defensa CSRF adicional a SameSite). */
export function assertSameOrigin(request: NextRequest): void {
  if (!MUTATING.has(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin) throw new ApiError(403, "bad_origin", "Falta la cabecera Origin");
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    throw new ApiError(403, "bad_origin", "Origin no válido");
  }
  const allowed = new Set(
    [request.headers.get("host"), request.headers.get("x-forwarded-host"), new URL(getEnv().APP_URL).host].filter(
      (h): h is string => Boolean(h),
    ),
  );
  if (!allowed.has(host)) throw new ApiError(403, "bad_origin", "Origen no permitido");
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "invalid_input",
          message: first?.message ?? "Datos no válidos",
          details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 400 },
    );
  }
  if (error instanceof DuplicateSlugError) {
    return NextResponse.json({ error: { code: "duplicate_slug", message: error.message } }, { status: 409 });
  }
  console.error("[api] error no controlado", error);
  return NextResponse.json({ error: { code: "internal", message: "Error interno del servidor" } }, { status: 500 });
}

type Handler<C> = (request: NextRequest, context: C) => Promise<Response>;

/** Envuelve un Route Handler: comprueba Origin y traduce errores a respuestas JSON coherentes. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      assertSameOrigin(request);
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "El cuerpo de la petición no es JSON válido");
  }
}

export function notFound(what = "Recurso"): never {
  throw new ApiError(404, "not_found", `${what} no encontrado`);
}

export type RouteParams<T extends string> = { params: Promise<Record<T, string>> };
