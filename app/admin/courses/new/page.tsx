import type { Metadata } from "next";
import Link from "next/link";
import { CourseForm } from "@/components/admin/course-form";

export const metadata: Metadata = { title: "Nuevo curso" };

export default function NewCoursePage() {
  return (
    <div className="max-w-2xl">
      <Link href="/admin" className="text-sm font-bold">
        ← Cursos
      </Link>
      <h1 className="heading mt-3 text-4xl">Nuevo curso</h1>
      <p className="mt-2 text-ink-soft">Después podrás añadir secciones y recursos.</p>
      <div className="panel mt-8 p-6">
        <CourseForm />
      </div>
    </div>
  );
}
