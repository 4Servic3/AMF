import { adminDb, queryError } from "@/lib/admin-data";
import PageHeader from "@/components/admin/ui/PageHeader";
import MediaUploader from "@/components/admin/media/MediaUploader";
export default async function Media() {
  const db = await adminDb("media.manage");
  const { data, error } = await db
    .from("media_assets")
    .select("id,file_name,content_type,size_bytes,bucket")
    .order("created_at", { ascending: false })
    .limit(100);
  queryError(error);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de mídias"
        description="Imagens e documentos. Envie vídeos pelas áreas de cursos ou stories."
      />
      <section className="amf-panel">
        <MediaUploader />
      </section>
      <p className="text-sm">
        100 arquivos mais recentes. Arquivos antigos sem localização compatível
        aparecem apenas como registro.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((m: any) => (
          <article className="amf-panel min-w-0" key={m.id}>
            {m.bucket && m.content_type.startsWith("image/") && (
              <img
                src={"/api/media/" + m.id}
                alt=""
                className="mb-4 aspect-video w-full rounded-xl object-cover"
              />
            )}
            <h2 className="break-words text-sm">{m.file_name}</h2>
            <p className="my-2 text-xs">
              {(m.size_bytes / 1024 / 1024).toFixed(1)} MB
            </p>
            {m.bucket && (
              <a
                className="amf-secondary text-sm"
                href={"/api/media/" + m.id}
                target="_blank"
                rel="noreferrer"
              >
                Abrir arquivo
              </a>
            )}
          </article>
        ))}
      </div>
      {!data.length && <p className="amf-panel">Nenhum arquivo enviado.</p>}
    </div>
  );
}
