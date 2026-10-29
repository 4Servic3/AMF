import { adminDb, queryError } from "@/lib/admin-data";
import PageHeader from "@/components/admin/ui/PageHeader";
import MediaUploader from "@/components/admin/media/MediaUploader";
import DeleteMediaButton from "@/components/admin/media/DeleteMediaButton";
import { loadMediaUsage } from "@/lib/admin/media-usage";

type Asset = { id: string; file_name: string | null; content_type: string | null; size_bytes: number | null; bucket: string | null; created_at: string | null };

function size(bytes: number | null) {
  if (!bytes) return "—";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function Media() {
  const db = await adminDb("media.manage");
  const { data, error } = await db
    .from("media_assets")
    .select("id,file_name,content_type,size_bytes,bucket,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  queryError(error);
  const assets = (data || []) as Asset[];
  const usage = await loadMediaUsage(db, assets.map((a) => a.id));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de mídias"
        description="Imagens e PDFs usados no app. Cada arquivo mostra onde aparece; só dá para excluir o que não está em uso. Vídeos são enviados pelos cursos e stories."
      />
      <section className="amf-panel">
        <h2 className="mb-3 text-[17px]">Enviar arquivo</h2>
        <MediaUploader />
      </section>
      <p className="text-sm text-[var(--admin-secondary)]">{assets.length === 100 ? "Os 100 arquivos mais recentes." : `${assets.length} ${assets.length === 1 ? "arquivo" : "arquivos"}.`}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {assets.map((m) => {
          const uses = usage.uses.get(m.id) || [];
          const isImage = Boolean(m.bucket && m.content_type?.startsWith("image/"));
          const name = m.file_name || "Arquivo sem nome";
          return (
            <article className="amf-panel flex min-w-0 flex-col overflow-hidden !p-0" key={m.id}>
              <div className="flex aspect-video items-center justify-center bg-[var(--admin-fill)]">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={"/api/media/" + m.id} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-[var(--admin-tertiary)]">{m.content_type === "application/pdf" ? "PDF" : "Arquivo"}</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="break-words text-sm font-semibold">{name}</h2>
                <p className="mt-1 text-xs text-[var(--admin-secondary)]">{size(m.size_bytes)}{m.created_at ? ` · ${new Date(m.created_at).toLocaleDateString("pt-BR")}` : ""}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[.06em] text-[var(--admin-tertiary)]">Onde aparece</p>
                {uses.length ? (
                  <ul className="mt-1 space-y-0.5 text-sm">{uses.map((u) => <li key={u}>{u}</li>)}</ul>
                ) : (
                  <p className="mt-1 text-sm text-[var(--admin-secondary)]">{usage.complete ? "Não usado em nenhum lugar" : "Não foi possível conferir"}</p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {m.bucket && <a className="amf-secondary text-sm" href={"/api/media/" + m.id} download={name} target="_blank" rel="noreferrer">Baixar</a>}
                  {usage.complete && !uses.length && <DeleteMediaButton id={m.id} name={name} />}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!assets.length && <p className="amf-panel">Nenhum arquivo enviado.</p>}
    </div>
  );
}
