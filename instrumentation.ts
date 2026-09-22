/** Falla al arrancar el servidor si falta o es inválida alguna variable de entorno. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("@/lib/env");
    getEnv();
  }
}
