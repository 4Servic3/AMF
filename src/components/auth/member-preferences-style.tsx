import { createClient } from '@/lib/supabase/server';
import { readPreferences } from '@/lib/member-preferences';
export default async function MemberPreferencesStyle() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('profiles').select('communication_preferences').eq('id', user.id).maybeSingle();
  const { accessibility } = readPreferences(data?.communication_preferences);
  const css = [
    accessibility.reduce_motion ? '.amf-member-ui *,.amf-member-ui *::before,.amf-member-ui *::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;scroll-behavior:auto!important}' : '',
    accessibility.large_text ? '.amf-member-ui p,.amf-member-ui li,.amf-member-ui label{font-size:max(1.125rem,1em)!important;line-height:1.6!important}' : '',
  ].join('');
  return css ? <style>{css}</style> : null;
}

