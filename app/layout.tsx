import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.APP_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "Cursos online con secciones y lecciones numeradas, vídeo y apuntes en Markdown. Entra con un enlace en tu email, sin contraseñas.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Cursos — aprende en el orden correcto", template: "%s · Cursos" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Cursos",
    title: "Cursos — aprende en el orden correcto",
    description: DESCRIPTION,
  },
  twitter: { card: "summary", title: "Cursos — aprende en el orden correcto", description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#f2f4f8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
