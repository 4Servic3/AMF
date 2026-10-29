import { bannerHref } from "@/lib/admin-values";
import type { HomeBannerSlide } from "@/components/home/home-banner-carousel";

export const DEFAULT_BANNER_IMAGE = "/assets/amf-home/banner-imersao-felinos.png";
const DEFAULT_ALT = "Boas-vindas à área de membros";

/** Banner da Planilha: sempre o último do carrossel. */
export const PLANILHA_SLIDE: HomeBannerSlide = {
  id: "planilha-doses-seguras-felinos",
  imageUrl: "/assets/amf-home/banner-planilha-felinos.jpeg",
  href: "/app/produtos/planilha-doses-seguras-felinos",
  alt: "Planilha de doses seguras para felinos — Dra. Polyana",
  contain: true,
};

export type BannerForSlide = {
  id: string;
  media_asset_id: string | null;
  cta_target_type: string | null;
  cta_target_id: string | null;
  title: string | null;
};

/** Monta o carrossel da home: banners no ar (ou a imagem padrão) e a Planilha no fim. */
export function buildHomeSlides(banners: BannerForSlide[]): HomeBannerSlide[] {
  const slides: HomeBannerSlide[] = banners.length
    ? banners.map((banner) => ({
        id: banner.id,
        imageUrl: banner.media_asset_id ? `/api/media/${banner.media_asset_id}` : DEFAULT_BANNER_IMAGE,
        href: bannerHref(banner.cta_target_type, banner.cta_target_id),
        alt: banner.title || DEFAULT_ALT,
      }))
    : [{ id: "welcome", imageUrl: DEFAULT_BANNER_IMAGE, alt: DEFAULT_ALT }];
  return [...slides, PLANILHA_SLIDE];
}

/** Datas do formulário (AAAA-MM-DD, horário de Brasília) contra o momento atual. */
export function bannerInPeriod(startsAt: string, endsAt: string, now: number) {
  if (startsAt && Date.parse(`${startsAt}T00:00:00-03:00`) > now) return false;
  if (endsAt && Date.parse(`${endsAt}T23:59:59-03:00`) <= now) return false;
  return true;
}

/** Mensagem que o admin manda para a home dentro da prévia. */
export const PREVIEW_MESSAGE = "amf-preview-slides";

/** Só aceita endereços do próprio app: imagem local ou blob, link para dentro de /app. */
export function sanitizePreviewSlides(value: unknown, origin: string): HomeBannerSlide[] | null {
  if (!Array.isArray(value)) return null;
  const slides: HomeBannerSlide[] = [];
  for (const item of value.slice(0, 25)) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const imageUrl = typeof s.imageUrl === "string" ? s.imageUrl : "";
    const okImage = (imageUrl.startsWith("/") && !imageUrl.startsWith("//")) || imageUrl.startsWith(`blob:${origin}/`);
    if (typeof s.id !== "string" || !okImage) continue;
    const href = typeof s.href === "string" && s.href.startsWith("/app/") ? s.href : undefined;
    slides.push({ id: s.id, imageUrl, href, alt: typeof s.alt === "string" ? s.alt.slice(0, 160) : "", contain: s.contain === true });
  }
  return slides.length ? slides : null;
}
