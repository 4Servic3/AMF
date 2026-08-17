export type StoryMediaType = 'video' | 'image';

export interface StoryItem {
  id: string;
  media_type: StoryMediaType;
  media_url: string;
  duration_seconds: number;
  caption?: string; // Optional description
  title?: string;
  category?: string;
  is_free: boolean;
  is_new?: boolean;
  fit?: 'cover' | 'contain'; // Force a specific fit, optional.
}

export interface StoryCollection {
  id: string;
  title: string;
  items: StoryItem[];
}
