/** Esqueleto imediato ao trocar de tela no admin, enquanto o servidor responde. */
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-[10px] bg-[var(--admin-separator)]" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[var(--admin-fill)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
