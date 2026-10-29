/** Esqueleto da página do curso: hero escuro e lista de módulos. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-32 pt-5 sm:px-6 lg:pt-8" role="status" aria-label="Carregando curso">
      <div className="mb-6 grid overflow-hidden rounded-[28px] bg-[#1C0D29] md:grid-cols-[1.15fr_1fr] lg:mb-8">
        <div className="order-1 aspect-[16/10] animate-pulse bg-white/5 md:order-2 md:aspect-auto md:min-h-[360px]" />
        <div className="order-2 flex flex-col gap-4 p-5 sm:p-8 md:order-1 md:justify-center lg:p-10">
          <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-10 w-4/5 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-white/10" />
          <div className="flex gap-2">{[0, 1, 2].map(i => <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-white/10" />)}</div>
          <div className="h-11 w-44 animate-pulse rounded-2xl bg-[#D4AD62]/40" />
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:max-w-[calc(100%-352px)]">
        {[0, 1, 2].map(i => <div key={i} className="h-[76px] animate-pulse rounded-[22px] border border-[#EDE5D8] bg-white" />)}
      </div>
      <span className="sr-only">Carregando curso…</span>
    </div>
  );
}
