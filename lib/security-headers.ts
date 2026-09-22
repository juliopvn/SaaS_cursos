/** Cabeceras de seguridad. Sin alias `@/`: las importa `next.config.ts`. */

export interface HeaderEnv {
  s3Endpoint?: string;
  appUrl?: string;
  isDev: boolean;
}

function originOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

/** Orígenes del storage: el endpoint y, para R2 con estilo virtual-hosted, `bucket.<endpoint>`. */
export function storageSources(s3Endpoint: string | undefined): string[] {
  const origin = originOf(s3Endpoint);
  if (!origin) return [];
  const { protocol, host } = new URL(origin);
  return [origin, `${protocol}//*.${host}`];
}

export function buildCsp({ s3Endpoint, isDev }: HeaderEnv): string {
  const storage = storageSources(s3Endpoint).join(" ");
  const directives: Record<string, string> = {
    "default-src": "'self'",
    // Next inyecta scripts en línea para la hidratación; en dev además necesita eval (HMR).
    "script-src": `'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src": "'self' 'unsafe-inline'",
    "img-src": `'self' data: blob: ${storage}`.trim(),
    "font-src": "'self' data:",
    "connect-src": `'self' ${storage}${isDev ? " ws: wss:" : ""}`.trim(),
    "frame-src": "https://www.youtube.com https://www.youtube-nocookie.com",
    "media-src": `'self' ${storage}`.trim(),
    "object-src": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "frame-ancestors": "'none'",
  };
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join("; ");
}

export function securityHeaders(env: HeaderEnv): Array<{ key: string; value: string }> {
  const headers = [
    { key: "Content-Security-Policy", value: buildCsp(env) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ];
  if (env.appUrl?.startsWith("https://")) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  }
  return headers;
}
