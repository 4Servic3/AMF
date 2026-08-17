export type ClinicalCaseStage = 'complaint' | 'exams' | 'conduct' | 'outcome';

export type ClinicalCaseViewModel = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  specialty: 'FeLV' | 'Nefrologia' | 'Oncologia' | 'Emergência' | 'Diagnóstico' | string;
  durationMinutes: number;
  chaptersCount: number;
  currentStage?: ClinicalCaseStage;
  completedStages: number;
  progressPercent: number;
  thumbnailUrl: string;
  storyImageUrl: string;
  isNew: boolean;
  isSaved: boolean;
  isLocked: boolean;
  requiredProductId?: string | null;
  publishedAt: string;
};

export type StoryMediaType = 'image' | 'video';

export type StorySlide = {
  id: string;
  title: string;
  category?: string;
  mediaType: StoryMediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  durationMs?: number;
  alt: string;
  isNew?: boolean;
  seen?: boolean;
  locked?: boolean;
  requiredProductId?: string | null;
};

export type StoryCollection = {
  id: string;
  title: string;
  slides: StorySlide[];
};
