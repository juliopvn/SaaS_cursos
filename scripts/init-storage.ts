/**
 * Crea el bucket si no existe y aplica CORS para http://localhost:3000.
 * Reintenta mientras RustFS termina de arrancar (docker compose up -d).
 */
import { getEnv } from "../lib/env";
import { applyCors, ensureBucket } from "../lib/storage";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const env = getEnv();
  let result: "created" | "exists" | undefined;
  for (let attempt = 1; attempt <= 20 && !result; attempt++) {
    try {
      result = await ensureBucket();
    } catch (error) {
      if (attempt === 20) throw error;
      await sleep(1500);
    }
  }
  console.log(`[storage] bucket "${env.S3_BUCKET}": ${result}`);

  const origins = [...new Set(["http://localhost:3000", "http://127.0.0.1:3000", new URL(env.APP_URL).origin])];
  try {
    await applyCors(origins);
    console.log(`[storage] CORS aplicado para ${origins.join(", ")}`);
  } catch (error) {
    console.warn(
      `[storage] Este backend no aceptó CORS por API (${(error as Error).message}).\n` +
        `          Configúralo desde la consola (http://localhost:9001): PUT/GET desde ${origins.join(", ")}.`,
    );
  }
}

main().catch((error) => {
  console.error("[storage] no se pudo inicializar:", error instanceof Error ? error.message : error);
  process.exit(1);
});
