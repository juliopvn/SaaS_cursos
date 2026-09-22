import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { requirePageUser } from "@/lib/auth/guards";

export const metadata: Metadata = { title: { default: "Mis cursos", template: "%s · Cursos" }, robots: { index: false } };

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageUser("/student");
  return (
    <>
      <AppHeader
        session={session}
        area="Alumno"
        nav={[{ href: "/student", label: "Cursos", exact: true }]}
        crossLink={session.role === "admin" ? { href: "/admin", label: "Volver a administración" } : undefined}
      />
      <main id="contenido" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
