import React from 'react';
import { trackEvent } from '@/lib/services/analytics';
import { CourseLibraryItem } from '@/lib/models/courses';
import { CoursesLibraryClient } from './courses-library-client';

// Mock function for products adapting to new CourseLibraryItem
async function getProducts(): Promise<CourseLibraryItem[]> {
  return [
    {
      id: '1111', slug: 'casos-da-semana', title: 'Casos da Semana', 
      description: 'Novos casos 2x por semana', productType: 'subscription',
      specialty: 'Clínica', coverUrl: '/assets/amf-home/novidades-perda-de-peso.webp',
      accessState: 'active_subscription', destinationUrl: '/app/cursos/casos-da-semana',
      isPublished: true
    },
    {
      id: '2222', slug: 'imersao-parte-1', title: 'Imersão Clínica P1', 
      description: 'Aprenda a base essencial para atender gatos com segurança no seu plantão.',
      productType: 'course', level: 'Básico', moduleCount: 8,
      coverUrl: '/assets/amf-casos/hero/hero-obstrucao-uretral.webp',
      accessState: 'unlocked', destinationUrl: '/app/cursos/imersao-parte-1',
      isPublished: true
    },
    {
      id: '3333', slug: 'imersao-parte-2', title: 'Imersão Clínica P2', 
      description: 'Domine as doenças renais, hepáticas e endócrinas dos felinos.',
      productType: 'course', level: 'Intermediário', moduleCount: 10,
      coverUrl: '/assets/amf-home/hero-da-queixa-a-conduta.webp',
      accessState: 'in_progress', progressPercent: 28, destinationUrl: '/app/cursos/imersao-parte-2',
      isPublished: true
    },
    {
      id: '4444', slug: 'academia-completa', title: 'Academia Completa', 
      description: 'Formação definitiva em Medicina Felina.',
      productType: 'bundle', moduleCount: 42,
      coverUrl: '/assets/amf-casos/stories/story-felv.webp',
      accessState: 'locked', destinationUrl: '/app/cursos/academia-completa',
      isPublished: true
    },
    {
      id: '5555', slug: 'nefrologia-felina', title: 'Nefrologia Felina', 
      description: 'O essencial da nefrologia em gatos.',
      productType: 'course', level: 'Intermediário', moduleCount: 6,
      coverUrl: '/assets/amf-home/novidades-perda-de-peso.webp',
      accessState: 'locked', destinationUrl: '/app/cursos/nefrologia-felina',
      isPublished: true
    }
  ];
}

export default async function Catalog() {
  const userId = 'fake-user-id';
  trackEvent('catalog_viewed', { userId });

  // For this mock step we load the products in the server component
  const products = await getProducts();

  return <CoursesLibraryClient products={products} />;
}
