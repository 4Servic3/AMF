import { adminDb, queryError } from "@/lib/admin-data";
import PageHeader from "@/components/admin/ui/PageHeader";
import ActionForm from "@/components/admin/ui/ActionForm";
import { saveHomeBanner } from "@/app/admin/actions/content";
import Link from "next/link";
export default async function Home() {
  const db = await adminDb("content.manage");
  const [banners, media, courses] = await Promise.all([
    db.from("home_banners").select("*").order("position").order("id"),
    db
      .from("media_assets")
      .select("id,file_name")
      .not("bucket", "is", null)
      .like("content_type", "image/%"),
    db.from("courses").select("slug,title").eq("status", "published"),
  ]);
  [banners, media, courses].forEach((r) => queryError(r.error));
  const items = banners.data?.length
    ? banners.data
    : [{ version: 1, title: "", status: "draft" }];
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Home e banners"
        description="O primeiro banner publicado aparece na home. Stories e cursos continuam nas suas seções atuais."
      />
      <Link className="amf-secondary" href="/admin/media">
        Enviar imagens para a biblioteca
      </Link>
      {items.map((banner: any, i: number) => (
        <section className="amf-panel" key={banner.id || i}>
          <ActionForm action={saveHomeBanner} label="Salvar banner">
            {banner.id && <input type="hidden" name="id" value={banner.id} />}
            <input type="hidden" name="version" value={banner.version} />
            <label className="block">
              Título
              <input
                className="mt-2 w-full"
                required
                name="title"
                defaultValue={banner.title}
              />
            </label>
            <label className="block">
              Imagem
              <select
                className="mt-2 w-full"
                name="media_asset_id"
                defaultValue={banner.media_asset_id || ""}
              >
                <option value="">Imagem padrão AMF</option>
                {media.data.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.file_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Curso ao tocar no banner
              <select
                className="mt-2 w-full"
                name="cta_target_id"
                defaultValue={banner.cta_target_id || ""}
              >
                <option value="">Sem link</option>
                {courses.data.map((c: any) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Publicação
              <select
                className="mt-2 w-full"
                name="status"
                defaultValue={banner.status}
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </label>
          </ActionForm>
        </section>
      ))}
    </div>
  );
}
