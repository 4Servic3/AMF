import { adminDb, queryError } from "@/lib/admin-data";
import PageHeader from "@/components/admin/ui/PageHeader";
import BannerEditor from "@/components/admin/home/BannerEditor";

export default async function Home() {
  const db = await adminDb("content.manage");
  const [banners, media, courses] = await Promise.all([
    db.from("home_banners").select("*").order("position").order("id"),
    db
      .from("media_assets")
      .select("id,file_name")
      .not("bucket", "is", null)
      .like("content_type", "image/%")
      .order("created_at", { ascending: false }),
    db.from("courses").select("slug,title").eq("status", "published"),
  ]);
  [banners, media, courses].forEach((r) => queryError(r.error));
  const images = (media.data || []).map((m: { id: string; file_name: string | null }) => ({ id: m.id, label: m.file_name || "Imagem" }));
  const list = (banners.data || []) as { id: string; version: number; title: string; status: string; media_asset_id: string | null; cta_target_id: string | null; starts_at?: string | null; ends_at?: string | null }[];
  const live = list.filter((b) => b.status === "published").length;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Banners da home"
        description={`Os banners no ar giram no topo da home do aluno, na ordem desta lista. ${live ? `${live} no ar agora.` : "Nenhum no ar: o aluno vê a imagem padrão da AMF."}`}
      />
      {list.map((banner) => (
        <BannerEditor key={banner.id} banner={banner} images={images} courses={courses.data || []} />
      ))}
      <BannerEditor isNew banner={{ version: 1, title: "", status: "draft" }} images={images} courses={courses.data || []} />
    </div>
  );
}
