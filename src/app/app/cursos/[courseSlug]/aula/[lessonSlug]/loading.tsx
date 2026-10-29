/** Esqueleto da aula: barra do título e palco do vídeo/PDF. */
export default function Loading() {
  return (
    <div className="amf-lesson-shell mx-auto flex flex-col gap-6 bg-[#FAF7F1] xl:flex-row" role="status" aria-label="Carregando aula">
      <div className="amf-lesson-main relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[#EDE5D8]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-[#EDE5D8]" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-[#EDE5D8]" />
          </div>
        </div>
        <div className="aspect-video w-full animate-pulse bg-[#1C0D29]" />
      </div>
      <span className="sr-only">Carregando aula…</span>
    </div>
  );
}
