"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmButton } from "@/components/confirm-button";
import { api, errorMessage } from "@/lib/client/api";

export function CourseDangerZone({ courseId, title }: { courseId: string; title: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        Eliminar el curso borra también sus secciones, recursos y el feedback asociado. No se puede deshacer.
      </p>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      <ConfirmButton
        label="Eliminar curso"
        title="Eliminar curso"
        description={`Se eliminará «${title}» con todo su contenido y el feedback de los alumnos.`}
        confirmLabel="Sí, eliminar"
        onConfirm={async () => {
          try {
            await api("DELETE", `/api/courses/${courseId}`);
            router.push("/admin");
            router.refresh();
          } catch (e) {
            setError(errorMessage(e));
          }
        }}
      />
    </div>
  );
}
