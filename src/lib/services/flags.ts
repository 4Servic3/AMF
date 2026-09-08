import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

type FeatureFlags = {
  member_courses_enabled: boolean;
  member_cases_enabled: boolean;
  member_stories_enabled: boolean;
  member_close_friends_enabled: boolean;
  member_home_news_enabled: boolean;
  member_academy_enabled: boolean;
};

const defaultFlags: FeatureFlags = {
  member_courses_enabled: true,
  member_cases_enabled: false,
  member_stories_enabled: false,
  member_close_friends_enabled: false,
  member_home_news_enabled: false,
  member_academy_enabled: false,
};

export const getFeatureFlags = cache(
  async (): Promise<FeatureFlags> => {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('key, enabled');

      if (error || !data) {
        console.error('Erro ao buscar feature flags, usando fallback', error);
        return defaultFlags;
      }

      const flags = { ...defaultFlags };
      data.forEach((flag) => {
        if (flag.key in flags) {
          flags[flag.key as keyof FeatureFlags] = flag.enabled;
        }
      });

      return flags;
    } catch (err) {
      console.error('Exception ao buscar feature flags', err);
      return defaultFlags;
    }
  }
);
