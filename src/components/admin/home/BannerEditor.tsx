"use client";
import { useEffect, useRef, useState } from "react";
import ActionForm from "@/components/admin/ui/ActionForm";
import { saveHomeBanner } from "@/app/admin/actions/content";
import { bannerHref } from "@/lib/admin-values";
import { DRAFT_EVENT, DRAFT_REMOVE_EVENT, type BannerDraft } from "./HomePreview";

type Banner = { id?: string; version: number; title: string; status: string; media_asset_id?: string | null; cta_target_id?: string | null; starts_at?: string | null; ends_at?: string | null };

/** "2026-11-01T03:00:00Z" -> "2026-11-01" no horário de Brasília, para o campo de data. */
const toDay = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - 3 * 3600_000).toISOString().slice(0, 10) : "");
type Option = { id: string; label: string };

const DEFAULT_IMAGE = "/assets/amf-home/banner-imersao-felinos.png";
const STATUS: Record<string, string> = { draft: "Rascunho", published: "No ar", archived: "Arquivado" };

/** Envia a imagem nova para a biblioteca e devolve o id para o banner apontar para ela. */
async function uploadImage(file: File) {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/admin/media/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) throw new Error(data.error || "Não foi possível enviar a imagem.");
  return data.id as string;
}

export default function BannerEditor({ banner, images, courses, isNew = false }: { banner: Banner; images: Option[]; courses: { slug: string; title: string }[]; isNew?: boolean }) {
  const [preview, setPreview] = useState(banner.media_asset_id ? `/api/media/${banner.media_asset_id}` : DEFAULT_IMAGE);
  const [assetId, setAssetId] = useState(banner.media_asset_id || "");
  const key = banner.id || "new";
  const [fields, setFields] = useState({ title: banner.title, status: banner.status, startsAt: toDay(banner.starts_at), endsAt: toDay(banner.ends_at), course: banner.cta_target_id || "" });
  const touched = useRef(false);

  // Avisa a prévia da home sempre que o formulário muda; o banner novo só entra depois de mexido.
  useEffect(() => {
    if (isNew && !touched.current) return;
    const detail: BannerDraft & { touched: boolean } = {
      key, title: fields.title, status: fields.status, startsAt: fields.startsAt, endsAt: fields.endsAt,
      imageUrl: preview, href: bannerHref("course", fields.course || null), touched: touched.current,
    };
    window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail }));
  }, [key, isNew, fields, preview]);

  function readForm(event: React.ChangeEvent<HTMLElement>) {
    const form = (event.target as HTMLElement).closest("form");
    if (!form) return;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) || "");
    touched.current = true;
    setFields({ title: text("title"), status: text("status"), startsAt: text("starts_at"), endsAt: text("ends_at"), course: text("cta_target_id") });
  }

  return (
    <section className="amf-panel" onChange={readForm}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px]">{isNew ? "Novo banner" : banner.title || "Banner"}</h2>
        {!isNew && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${banner.status === "published" ? "bg-[#e8f6ee] text-[#1f7a4d]" : "bg-[var(--admin-fill)] text-[var(--admin-secondary)]"}`}>{STATUS[banner.status] || banner.status}</span>}
      </div>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="aspect-[16/7] w-full rounded-xl bg-[var(--admin-fill)] object-cover" />
          <p className="mt-2 text-xs text-[var(--admin-secondary)]">Prévia. Use uma imagem larga, por exemplo 1600 × 700.</p>
        </div>
        <ActionForm
          label={isNew ? "Criar banner" : "Salvar banner"}
          action={async (form) => {
            const file = form.get("file");
            form.delete("file");
            if (file instanceof File && file.size > 0) {
              const id = await uploadImage(file);
              form.set("media_asset_id", id);
              setAssetId(id);
            }
            await saveHomeBanner(form);
            if (isNew) window.dispatchEvent(new CustomEvent(DRAFT_REMOVE_EVENT, { detail: key }));
          }}
        >
          {banner.id && <input type="hidden" name="id" value={banner.id} />}
          <input type="hidden" name="version" value={banner.version} />
          <label className="block">Título (texto alternativo)<input className="mt-2 w-full" required maxLength={160} name="title" defaultValue={banner.title} /></label>
          <label className="block">Enviar nova imagem
            <input
              className="mt-2 block w-full text-sm"
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }}
            />
          </label>
          <label className="block">Ou escolha da biblioteca
            <select
              className="mt-2 w-full"
              name="media_asset_id"
              value={assetId}
              onChange={(e) => { setAssetId(e.target.value); setPreview(e.target.value ? `/api/media/${e.target.value}` : DEFAULT_IMAGE); }}
            >
              <option value="">Imagem padrão AMF</option>
              {images.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <label className="block">Curso ao tocar no banner
            <select className="mt-2 w-full" name="cta_target_id" defaultValue={banner.cta_target_id || ""}>
              <option value="">Sem link</option>
              {courses.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </label>
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-2 text-sm text-[var(--admin-secondary)]">Período no ar. Sem datas, o banner é permanente.</legend>
            <label className="block">Começa em<input className="mt-2 block w-full" type="date" name="starts_at" defaultValue={toDay(banner.starts_at)} /></label>
            <label className="block">Termina em<input className="mt-2 block w-full" type="date" name="ends_at" defaultValue={toDay(banner.ends_at)} /></label>
          </fieldset>
          <label className="block">Situação
            <select className="mt-2 w-full" name="status" defaultValue={banner.status}>
              <option value="draft">Rascunho</option>
              <option value="published">No ar</option>
              <option value="archived">Arquivado</option>
            </select>
          </label>
        </ActionForm>
      </div>
    </section>
  );
}
