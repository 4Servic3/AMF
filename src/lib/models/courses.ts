export type CourseProductType = 'course' | 'subscription' | 'bundle';

export type CourseAccessState =
  | 'unlocked'
  | 'in_progress'
  | 'active_subscription'
  | 'locked';

export interface CourseLibraryItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  productType: CourseProductType;
  specialty?: string;
  level?: string;
  moduleCount?: number;
  durationMinutes?: number;
  coverUrl?: string;
  accessState: CourseAccessState;
  progressPercent?: number;
  lastLessonId?: string;
  destinationUrl: string;
  isPublished: boolean;
  sortOrder?: number;
}
