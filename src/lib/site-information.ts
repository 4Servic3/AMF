import 'server-only';
import { cache } from 'react';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { parseSiteInformation } from './site-information-schema';
export const SITE_INFORMATION_KEY = 'public_site_information';
// Only deliberately published content is returned to public pages. No settings dump.
export const getPublicSiteInformation = cache(async () => {
  const { data, error } = await createServiceRoleClient().from('app_settings').select('value').eq('key',SITE_INFORMATION_KEY).maybeSingle();
  if (error) throw new Error('Não foi possível carregar as informações institucionais.');
  return parseSiteInformation(data?.value?.published);
});
