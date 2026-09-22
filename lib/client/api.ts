export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Llamada JSON a nuestras API Routes. Lanza `ApiClientError` con el mensaje del servidor. */
export async function api<T = unknown>(method: "GET" | "POST" | "PATCH" | "DELETE", url: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError("Sin conexión con el servidor. Comprueba tu red e inténtalo de nuevo.", 0);
  }
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string; code?: string } })
    | null;
  if (!response.ok) {
    throw new ApiClientError(data?.error?.message ?? "Algo salió mal. Inténtalo de nuevo.", response.status, data?.error?.code);
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Algo salió mal. Inténtalo de nuevo.";
}
