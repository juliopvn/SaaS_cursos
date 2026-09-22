import Link from "next/link";

/** Marca: el nombre y una mini-línea de dos paradas, el motivo que recorre toda la interfaz. */
export function Wordmark({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 no-underline text-ink ${className}`} aria-label="Cursos, inicio">
      <svg width="34" height="18" viewBox="0 0 34 18" aria-hidden="true" focusable="false">
        <rect x="6" y="7" width="22" height="4" rx="2" fill="var(--color-line)" />
        <circle cx="6" cy="9" r="5" fill="#fff" stroke="var(--color-line)" strokeWidth="3" />
        <circle cx="28" cy="9" r="5" fill="var(--color-signal)" stroke="var(--color-ink)" strokeWidth="3" />
      </svg>
      <span className="wide text-[1.35rem] font-extrabold tracking-[-0.03em] leading-none">cursos</span>
    </Link>
  );
}
