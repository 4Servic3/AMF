/** Esqueleto imediato para qualquer tela do aluno enquanto o servidor responde. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-32 pt-6 sm:px-6" role="status" aria-label="Carregando">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-[#EDE5D8]" />
      <div className="h-40 w-full animate-pulse rounded-[24px] bg-[#EDE5D8]/70 sm:h-52" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-[20px] bg-white" />)}
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
