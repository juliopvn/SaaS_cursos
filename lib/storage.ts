import { randomUUID } from "node:crypto";
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "@/lib/env";

const PUT_TTL_SECONDS = 300;
const GET_TTL_SECONDS = 60;

const g = globalThis as typeof globalThis & { __s3?: S3Client };

/** Cliente S3 cacheado. RustFS en local y Cloudflare R2 en producción (solo cambia la configuración). */
export function getS3(): S3Client {
  if (!g.__s3) {
    const env = getEnv();
    g.__s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
      // Sin checksums automáticos: R2 y RustFS no los esperan en URLs prefirmadas.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return g.__s3;
}

/** "Guía de estilo (v2).pdf" → "guia-de-estilo-v2.pdf". Conserva la extensión. */
export function sanitizeFilename(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const clean =
    base
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "fichero";
  return ext ? `${clean}.${ext}` : clean;
}

/** `uploads/<uuid>/<nombre-limpio>`: el UUID evita colisiones y adivinar claves. */
export function buildObjectKey(filename: string): string {
  return `uploads/${randomUUID()}/${sanitizeFilename(filename)}`;
}

/** Claves válidas: solo lo que generamos nosotros. Bloquea `..` y rutas ajenas. */
export function isValidObjectKey(key: string): boolean {
  return /^uploads\/[0-9a-f-]{36}\/[a-z0-9][a-z0-9.-]*$/.test(key) && !key.includes("..");
}

export async function presignPut(input: { key: string; contentType: string; size: number }): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getEnv().S3_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });
  return getSignedUrl(getS3(), command, { expiresIn: PUT_TTL_SECONDS });
}

export async function presignGet(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key });
  return getSignedUrl(getS3(), command, { expiresIn: GET_TTL_SECONDS });
}

/** Crea el bucket si no existe. Usado por `scripts/init-storage.ts`. */
export async function ensureBucket(): Promise<"created" | "exists"> {
  const s3 = getS3();
  const bucket = getEnv().S3_BUCKET;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return "exists";
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    return "created";
  }
}

export async function applyCors(origins: string[]): Promise<void> {
  await getS3().send(
    new PutBucketCorsCommand({
      Bucket: getEnv().S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}
