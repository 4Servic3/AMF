import React from 'react';
import { getFeatureFlags } from '@/lib/services/flags';
import PublishedCaseStories, { type PublishedCase } from '@/components/casos/PublishedCaseStories';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

export default async function CasosPage() {
  const client = await createClient();
  const { data:{user} } = await client.auth.getUser();
  if (!user) redirect('/entrar');
  const flags = await getFeatureFlags();

  if (!flags.member_cases_enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#FAF7F1] px-6 text-center">
        <div className="w-16 h-16 bg-[#160B24]/5 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-[#D4AD62]" />
        </div>
        <h1 className="font-editorial text-3xl font-bold text-[#160B24] mb-3">
          Casos Clínicos
        </h1>
        <p className="font-sans text-[#78664E] max-w-[280px]">
          Esta área estará disponível em breve. Estamos preparando novos casos para você.
        </p>
      </div>
    );
  }

  const {data,error} = await createServiceRoleClient().from('cases')
    .select('id,title,case_story_videos!inner(id,caption,created_at,status)')
    .eq('status','published').in('visibility',['free','authenticated'])
    .eq('case_story_videos.status','published').order('published_at',{ascending:false});
  if (error) throw new Error('Não foi possível carregar os casos.');
  const cases:PublishedCase[] = (data || []).map((item:any) => ({id:item.id,title:item.title,items:item.case_story_videos.sort((a:any,b:any)=>a.created_at.localeCompare(b.created_at)).map((story:any)=>({id:story.id,caption:story.caption}))}));
  return <PublishedCaseStories cases={cases} />;
}
