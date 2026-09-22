import type { Metadata } from "next";
import Link from "next/link";
import { RouteTicket, SAMPLE_OUTLINE, outlineToSample } from "@/components/route-ticket";
import { SiteHeader } from "@/components/site-header";
import { Wordmark } from "@/components/wordmark";
import { listCourses } from "@/lib/repositories/courses";
import { getOutline } from "@/lib/repositories/outline";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const STEPS = [
  { title: "Pide tu enlace", body: "Escribe tu email. No hay contraseña que recordar ni que perder." },
  { title: "Abre el correo", body: "Pulsa el enlace y confirma. Funciona una sola vez y caduca en minutos." },
  { title: "Sigue la línea", body: "Cada curso tiene secciones y recursos numerados. Anterior y siguiente te llevan en orden." },
  { title: "Cuéntanos qué tal", body: "Deja un comentario en cualquier recurso. Le llega a quien mantiene el curso." },
];

const FOR_TEACHERS = [
  { title: "Ordena la secuencia", body: "Sube y baja secciones y recursos. El orden pedagógico que dejas es el que ven los alumnos." },
  { title: "Escribe en Markdown", body: "Texto, tablas, código, PDFs y vídeos de YouTube, con vista previa mientras escribes." },
  { title: "Lee el feedback donde ocurre", body: "Cada comentario queda ligado al recurso y al alumno que lo escribió." },
];

/** Datos públicos de la landing. Si la BD no responde, la página sigue funcionando con el ejemplo. */
async function loadCatalog() {
  try {
    const courses = await listCourses({ onlyPublished: true });
    const outlines = await Promise.all(courses.slice(0, 6).map(getOutline));
    return outlines;
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const outlines = await loadCatalog();
  const featured = outlines.find((o) => o.sections.some((s) => s.resources.length > 1));
  const sample = featured ? outlineToSample(featured) : SAMPLE_OUTLINE;

  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <section aria-labelledby="hero-title" className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
          <div>
            <p className="label rise" style={{ ["--i" as string]: 0 }}>
              Plataforma de cursos online
            </p>
            <h1 id="hero-title" className="display rise mt-4" style={{ ["--i" as string]: 1 }}>
              Aprende en el <span className="mark">orden</span> correcto.
            </h1>
            <p className="rise mt-6 max-w-xl text-lg text-ink-soft" style={{ ["--i" as string]: 2 }}>
              Cada curso es una línea: tramos, paradas y una secuencia pensada para que cada paso apoye al siguiente. Vídeo, apuntes y un
              espacio para decir qué funciona.
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ ["--i" as string]: 3 }}>
              <Link href="/login" className="btn btn-primary">
                Entrar con mi email
              </Link>
              <a href="#como-funciona" className="btn btn-quiet">
                Ver cómo funciona
              </a>
            </div>
          </div>
          <div className="rise" style={{ ["--i" as string]: 3 }}>
            <RouteTicket sample={sample} />
          </div>
        </section>

        <section id="como-funciona" aria-labelledby="como-title" className="border-y border-rule bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="label">Para el alumno</p>
              <h2 id="como-title" className="heading mt-2 text-4xl">
                De tu bandeja de entrada a la primera lección.
              </h2>
            </div>
            <ol className="route" aria-label="Pasos para empezar">
              {STEPS.map((step, i) => (
                <li key={step.title} className="route-item pb-6 last:pb-0">
                  <span className="stop-number">Paso {i + 1}</span>
                  <h3 className="heading text-xl">{step.title}</h3>
                  <p className="mt-1 max-w-prose text-ink-soft">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {outlines.length > 0 && (
          <section aria-labelledby="catalogo-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="label">Catálogo</p>
            <h2 id="catalogo-title" className="heading mt-2 text-4xl">
              Cursos publicados
            </h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3" data-testid="landing-courses">
              {outlines.map(({ course, sections }) => {
                const stops = sections.reduce((n, s) => n + s.resources.length, 0);
                return (
                  <li key={course.id} className="panel flex flex-col p-6">
                    <p className="label">
                      {sections.length} {sections.length === 1 ? "tramo" : "tramos"} · {stops} {stops === 1 ? "parada" : "paradas"}
                    </p>
                    <h3 className="heading mt-2 text-xl">
                      <Link href={`/student/courses/${course.slug}`} className="text-ink no-underline hover:text-line">
                        {course.title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 text-ink-soft">{course.description}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="docentes-title" className="border-t border-rule bg-ink text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="label !text-white/70">Para quien enseña</p>
            <h2 id="docentes-title" className="heading mt-2 max-w-2xl text-4xl">
              Tú decides el recorrido. Los alumnos te dicen cómo va.
            </h2>
            <dl className="mt-10 grid gap-8 md:grid-cols-3">
              {FOR_TEACHERS.map((item) => (
                <div key={item.title} className="border-t-2 border-signal pt-4">
                  <dt className="heading text-xl">{item.title}</dt>
                  <dd className="mt-2 text-white/80">{item.body}</dd>
                </div>
              ))}
            </dl>
            <Link href="/login" className="btn mt-12 bg-signal text-ink hover:bg-white">
              Entrar en Cursos
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <Wordmark />
          <p className="text-sm text-muted">© {new Date().getFullYear()} Cursos. Plataforma de cursos online.</p>
        </div>
      </footer>
    </>
  );
}
