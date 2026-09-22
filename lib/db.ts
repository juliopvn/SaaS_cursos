import { MongoClient, type Db } from "mongodb";
import { getEnv } from "@/lib/env";
import { ensureIndexes } from "@/lib/repositories/indexes";

interface MongoGlobal {
  __mongo?: { client: Promise<MongoClient>; ready?: Promise<void> };
}

const g = globalThis as typeof globalThis & MongoGlobal;

/** Cliente cacheado en `globalThis`: sobrevive al HMR en dev y se reutiliza entre invocaciones serverless. */
function getClient(): Promise<MongoClient> {
  if (!g.__mongo) {
    const client = new MongoClient(getEnv().MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    const promise = client.connect();
    // Si la conexión falla, no dejamos la promesa rechazada en caché.
    promise.catch(() => {
      g.__mongo = undefined;
    });
    g.__mongo = { client: promise };
  }
  return g.__mongo.client;
}

/** Devuelve la BD de la app; los índices se aseguran una sola vez por proceso. */
export async function getDb(): Promise<Db> {
  const client = await getClient();
  const db = client.db(getEnv().MONGODB_DB);
  const state = g.__mongo;
  if (state) {
    state.ready ??= ensureIndexes(db).catch((error) => {
      state.ready = undefined;
      throw error;
    });
    await state.ready;
  }
  return db;
}

export async function pingDb(): Promise<boolean> {
  try {
    const client = await getClient();
    await client.db(getEnv().MONGODB_DB).command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

/** Solo para scripts y tests: cierra y olvida el cliente cacheado. */
export async function closeDb(): Promise<void> {
  const state = g.__mongo;
  g.__mongo = undefined;
  if (state) await (await state.client).close();
}
