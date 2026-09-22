import Link from "next/link";
import { Fragment } from "react";
import type { CourseOutline } from "@/lib/types";

/** Índice del curso como una línea: tramos (secciones) y paradas (recursos) numeradas. */
export function CourseIndex({
  outline,
  currentResourceId,
  compact = false,
}: {
  outline: CourseOutline;
  currentResourceId?: string;
  compact?: boolean;
}) {
  const { course, sections } = outline;
  return (
    <ol className="route" aria-label="Índice del curso">
      {sections.map((section, si) => (
        <Fragment key={section.id}>
          <li className="route-item route-terminal mt-5 first:mt-0">
            <p className="label">Tramo {si + 1}</p>
            <p className={`heading ${compact ? "text-base" : "text-xl"}`}>{section.title}</p>
          </li>
          {section.resources.map((resource, ri) => {
            const current = resource.id === currentResourceId;
            return (
              <li key={resource.id} className="route-item" data-current={current || undefined}>
                <Link
                  href={`/student/courses/${course.slug}/${resource.id}`}
                  aria-current={current ? "page" : undefined}
                  className={`block py-0.5 no-underline ${current ? "font-bold text-ink" : "text-ink-soft hover:text-line"}`}
                >
                  <span className="stop-number mr-2">
                    {si + 1}.{ri + 1}
                  </span>
                  {resource.title}
                </Link>
              </li>
            );
          })}
        </Fragment>
      ))}
    </ol>
  );
}
