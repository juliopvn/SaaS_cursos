import type { NextConfig } from "next";

// Las cabeceras de seguridad y la CSP se aplican en proxy.ts (por petición), no aquí:
// `headers()` de Next.js se hornea en el build y quedaría desactualizado si el entorno
// (p. ej. S3_ENDPOINT) cambia sin rebuild. Ver lib/security-headers.ts.
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["mongodb", "nodemailer"],
};

export default nextConfig;
