import { redirect } from 'next/navigation';
import { CoursesLibraryClient } from './courses-library-client';
import { loadMemberCourses } from '@/lib/member-courses';
import type { CourseLibraryItem } from '@/lib/models/courses';
import { getPlanilhaAccess, PLANILHA_PRODUCT_ID } from '@/lib/products/planilha-access';

export default async function Catalog() {
  const [{ userId, catalog, summaries }, planilhaAccess] = await Promise.all([
    loadMemberCourses(),
    getPlanilhaAccess(),
  ]);

  if (!userId) redirect('/entrar');

  const progress = new Map(summaries.map(c => [c.courseId, c]));

  const products: CourseLibraryItem[] = catalog.map(course => {
    const summary = progress.get(course.id);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.short_description || '',
      productType: 'course',
      coverUrl: course.thumbnail_url || '/assets/amf-casos/hero/hero-obstrucao-uretral.webp',
      accessState: !summary ? 'locked' : summary.status === 'in_progress' ? 'in_progress' : 'unlocked',
      progressPercent: summary?.progressPercent || 0,
      destinationUrl: '/app/cursos/' + encodeURIComponent(course.slug),
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
    destinationUrl: isPlanilhaUnlocked
      ? '/app/produtos/planilha-doses-seguras-felinos/calculadora'
      : '/app/produtos/planilha-doses-seguras-felinos',
    isPublished: true,
  };

  products.push(planilhaItem);

  return <CoursesLibraryClient products={products} />;
}
