import { loadLiveHomeBanners, type PublishedHomeBanner } from "@/lib/home-banners";
import { bannerHref } from "@/lib/admin-values";
import React, { Suspense } from "react";
import HomeCaseStories from "@/components/home/home-case-stories";
import { redirect } from "next/navigation";
import { loadMemberCourses } from "@/lib/member-courses";
import { createClient } from "@/lib/supabase/server";
import { PremiumHomeHeader } from "@/components/home/premium-home-header";
import { HomeBannerCarousel, type HomeBannerSlide } from "@/components/home/home-banner-carousel";
import {
  SuaAcademia,
  type UserCourseProgress,
} from "@/components/home/sua-academia";

export default async function AppHome() {
  // Banners publicados são públicos: a consulta começa junto com os cursos do aluno.
  const [{ userId, summaries: courses }, banners] = await Promise.all([loadMemberCourses(), loadLiveHomeBanners()]);
  if (!userId) redirect('/entrar');

  const homeBanners: HomeBannerSlide[] = banners?.length
    ? banners.map((banner: PublishedHomeBanner) => ({
        id: banner.id,
        imageUrl: banner.media_asset_id
          ? `/api/media/${banner.media_asset_id}`
          : "/assets/amf-home/banner-imersao-felinos.png",
        href: bannerHref(banner.cta_target_type, banner.cta_target_id),
        alt: banner.title || "Boas-vindas à área de membros",
      }))
    : [{
        id: "welcome",
        imageUrl: "/assets/amf-home/banner-imersao-felinos.png",
        alt: "Boas-vindas à área de membros",
      }];
  homeBanners.push({
    id: "planilha-doses-seguras-felinos",
    imageUrl: "/assets/amf-home/banner-planilha-felinos.jpeg",
    href: "/app/produtos/planilha-doses-seguras-felinos",
    alt: "Planilha de doses seguras para felinos — Dra. Polyana",
    contain: true,
  });
  return (
    <div className="premium-home flex flex-col w-full min-h-[100dvh] bg-[#FAF7F1] min-w-0 max-w-full">
      <PremiumHomeHeader>
        <div />
      </PremiumHomeHeader>

      <div className="home-content-container max-w-[1240px] mx-auto w-full flex-1 flex flex-col pt-0">
        <Suspense fallback={null}>
          <HomeCaseStories />
        </Suspense>
        <div className="flex flex-col relative z-10 w-full min-w-0 max-w-full mt-3 sm:mt-4">
          <HomeBannerCarousel slides={homeBanners} />
        </div>

        <div className="amf-home-academy mt-8 w-full min-w-0 max-w-full lg:max-w-[768px] mx-auto pb-8">
          <SuaAcademia courses={courses} />
        </div>
      </div>
    </div>
  );
}
