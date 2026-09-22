import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { requirePageRole } from "@/lib/auth/guards";

export const metadata: Metadata = { title: { default: "Administración", template: "%s · Administración" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("admin", "/admin");
  return (
    <>
      <AppHeader
        session={session}
        area="Administración"
        nav={[
          { href: "/admin", label: "Cursos", exact: true },
          { href: "/admin/feedback", label: "Feedback" },
        ]}
        crossLink={{ href: "/student", label: "Ver como alumno" }}
      />
      <main id="contenido" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
