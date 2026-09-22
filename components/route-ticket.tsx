import type { CourseOutline } from "@/lib/types";

/** Curso de muestra para la landing cuando aún no hay cursos publicados (o la BD no responde). */
export const SAMPLE_OUTLINE = {
  title: "TypeScript desde cero",
  sections: [
    { title: "Primeros pasos", resources: ["Qué problema resuelve TypeScript", "Instalación y primer archivo"] },
    { title: "Tipos en profundidad", resources: ["Tipos básicos y uniones", "Interfaces y genéricos"] },
  ],
};

export function outlineToSample(outline: CourseOutline): typeof SAMPLE_OUTLINE {
  return {
    title: outline.course.title,
    sections: outline.sections
      .filter((s) => s.resources.length > 0)
      .slice(0, 2)
      .map((s) => ({ title: s.title, resources: s.resources.slice(0, 3).map((r) => r.title) })),
  };
}

/** Billete de la línea: un curso real (o de muestra) dibujado como recorrido, con la parada siguiente en ámbar. */
export function RouteTicket({ sample }: { sample: typeof SAMPLE_OUTLINE }) {
  return (
    <figure className="panel relative p-6 sm:p-8" aria-label={`Ejemplo de recorrido: ${sample.title}`}>
      <figcaption className="mb-6 border-b border-dashed border-rule pb-5">
        <p className="label">Así se ve un curso</p>
        <p className="heading mt-1 text-2xl">{sample.title}</p>
      </figcaption>
      <ol className="route route-draw" aria-hidden="true">
        {sample.sections.flatMap((section, si) => [
          <li key={`s${si}`} className="route-item route-terminal mt-5 first:mt-0">
            <p className="label">Tramo {si + 1}</p>
            <p className="font-bold">{section.title}</p>
          </li>,
          ...section.resources.map((title, ri) => {
            const current = si === 0 && ri === 1;
            return (
              <li key={`s${si}r${ri}`} className="route-item" data-current={current || undefined}>
                <span className="stop-number mr-2">
                  {si + 1}.{ri + 1}
                </span>
                <span className={current ? "font-bold" : "text-ink-soft"}>{title}</span>
                {current && (
                  <span className="ml-2 inline-block rounded-sm bg-signal px-1.5 py-0.5 font-mono text-[0.6875rem] font-bold uppercase tracking-wider text-ink">
                    Siguiente parada
                  </span>
                )}
              </li>
            );
          }),
        ])}
      </ol>
    </figure>
  );
}
