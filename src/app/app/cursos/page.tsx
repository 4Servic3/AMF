import React from 'react';
import { trackEvent } from '@/lib/services/analytics';
import type { CourseLibraryItem } from '@/lib/models/courses';
import { CoursesLibraryClient } from './courses-library-client';
import { createClient } from '@/lib/supabase/server';
import { getPlanilhaAccess, PLANILHA_PRODUCT_ID } from '@/lib/products/planilha-access';
import { loadMemberCourses } from '@/lib/member-courses';

export default async function Catalog() {
  const supabase = await createClient();
  const [memberCatalog, planilhaAccess] = await Promise.all([
    loadMemberCourses(),
    getPlanilhaAccess(),
  ]);
  const userId = memberCatalog.userId || 'anonymous';

  trackEvent('catalog_viewed', { userId });
  const courses = memberCatalog.catalog;
  const courseProductIds = [...new Set(courses.map(course => course.product_id).filter((id): id is string => Boolean(id)))];
  const [productResult, priceResult, subscriptionResult] = await Promise.all([
    courseProductIds.length ? supabase.from('products').select('id,type').in('id', courseProductIds) : Promise.resolve({ data: [] }),
    courseProductIds.length ? supabase.from('product_prices').select('product_id,interval').eq('active', true).in('product_id', courseProductIds) : Promise.resolve({ data: [] }),
    memberCatalog.userId ? supabase.from('subscriptions').select('product_id,status,current_period_end').eq('profile_id', memberCatalog.userId).in('status', ['active', 'trialing']) : Promise.resolve({ data: [] }),
  ]);
  const productById = new Map((productResult.data || []).map(product => [product.id, product]));
  const intervalByProduct = new Map<string, string | null>();
  for (const price of priceResult.data || []) {
    const prior = intervalByProduct.get(price.product_id);
    if (!intervalByProduct.has(price.product_id) || (price.interval === 'month' && prior !== 'month')) intervalByProduct.set(price.product_id, price.interval);
  }
  // The catalog is request-time authenticated data; expiration must use the current server clock.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const activeSubscriptionProductIds = new Set((subscriptionResult.data || [])
    .filter(subscription => ['active', 'trialing'].includes(subscription.status) && Date.parse(subscription.current_period_end) > now)
    .filter(subscription => intervalByProduct.get(subscription.product_id) != null)
    .map(subscription => subscription.product_id));
  const summariesByCourse = new Map(memberCatalog.summaries.map(summary => [summary.courseId, summary]));
  const products: CourseLibraryItem[] = courses.map(course => {
    const summary = summariesByCourse.get(course.id);
    const activeSubscription = Boolean(course.product_id && activeSubscriptionProductIds.has(course.product_id));
    const product = course.product_id ? productById.get(course.product_id) : undefined;
    const billingInterval = course.product_id ? intervalByProduct.get(course.product_id) : undefined;
    const productType = product?.type === 'subscription' ? 'subscription' : 'course';
    const hasAccess = Boolean(memberCatalog.userId && (course.all_students || summary));
    const progressPercent = summary?.progressPercent || 0;
    const accessState: CourseLibraryItem['accessState'] = !hasAccess ? 'locked'
      : summary?.status === 'in_progress' && progressPercent > 0 && progressPercent < 100 ? 'in_progress'
        : activeSubscription ? 'active_subscription' : 'unlocked';
    const coverAsset = Array.isArray(course.media_assets) ? course.media_assets[0] : course.media_assets;
    const coverPath = course.thumbnail_url || coverAsset?.file_path || '/assets/amf-casos/hero/hero-obstrucao-uretral.webp';
    const coverUrl = coverPath && !coverPath.startsWith('/') && !coverPath.startsWith('https://')
      ? supabase.storage.from('public_media').getPublicUrl(coverPath).data.publicUrl
      : coverPath;
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.short_description || '',
      productType,
      level: 'Todos',
      moduleCount: 0,
      coverUrl,
      accessState,
      progressPercent,
      isActiveSubscription: activeSubscription && productType === 'subscription',
      billingInterval: billingInterval || null,
      destinationUrl: `/app/cursos/${encodeURIComponent(course.slug)}`,
      isPublished: true,
    };
  });

  const isPlanilhaUnlocked = planilhaAccess.state === 'available';

  const planilhaItem: CourseLibraryItem = {
    id: PLANILHA_PRODUCT_ID,
    slug: 'planilha-doses-seguras-felinos',
    title: 'Calculadora de Doses Seguras para Felinos',
    description: 'Calculadora clínica interativa e planilha Excel — Dra. Polyana',
    productType: 'bundle',
    specialty: 'Terapêutica',
    coverUrl: '/assets/amf-home/banner-planilha-felinos.jpeg',
    accessState: isPlanilhaUnlocked ? 'unlocked' : 'locked',
    isActiveSubscription: false,
    billingInterval: null,
    destinationUrl: isPlanilhaUnlocked
      ? '/app/produtos/planilha-doses-seguras-felinos/calculadora'
      : '/app/produtos/planilha-doses-seguras-felinos',
    isPublished: true,
  };

  products.push(planilhaItem);

  return <CoursesLibraryClient products={products} />;
}
