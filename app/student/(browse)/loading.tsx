export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4" data-testid="loading">
      <span className="sr-only">Cargando…</span>
      <div className="h-4 w-24 animate-pulse rounded bg-rule" />
      <div className="h-10 w-2/3 animate-pulse rounded bg-rule" />
      <div className="h-40 animate-pulse rounded bg-rule/60" />
    </div>
  );
}
