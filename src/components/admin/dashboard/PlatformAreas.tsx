import React from 'react';
import { LayoutGrid, FileText, Briefcase, PlaySquare, GraduationCap, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/dal';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

async function getCount(table: string) {
  const supabase = await createClient();
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`Error counting ${table}:`, error);
    return 0;
  }
  return count || 0;
}

export default async function PlatformAreas() {
  const canManageHome = await hasPermission('home.manage');
  const canManageStories = await hasPermission('stories.manage');
  const canManageCases = await hasPermission('cases.manage');
  const canManageCourses = await hasPermission('courses.manage');
  const canManageAcademy = await hasPermission('academy.manage');

  const [
    homeCount,
    storiesCount,
    casesCount,
    coursesCount,
    academyCount
  ] = await Promise.all([
    getCount('home_banners'),
    getCount('story_groups'),
    getCount('cases'),
    getCount('courses'),
    getCount('academy_paths')
  ]);

  const areas = [
    { title: 'Home', count: homeCount, icon: LayoutGrid, href: '/admin/home', canManage: canManageHome },
    { title: 'Stories', count: storiesCount, icon: PlaySquare, href: '/admin/stories', canManage: canManageStories },
    { title: 'Casos', count: casesCount, icon: Briefcase, href: '/admin/cases', canManage: canManageCases },
    { title: 'Cursos', count: coursesCount, icon: FileText, href: '/admin/courses', canManage: canManageCourses },
    { title: 'Academia', count: academyCount, icon: GraduationCap, href: '/admin/academy', canManage: canManageAcademy },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
      {areas.map((area) => {
        const CardContent = (
          <div className={twMerge(
            "flex items-center justify-between px-4 h-[68px] rounded-xl bg-white border border-[#EBE3D5] transition-all",
            area.canManage ? 'hover:border-[#0F766E]/50 hover:shadow-sm cursor-pointer' : 'opacity-60'
          )}>
            <div className="flex items-center gap-3">
              <area.icon size={22} strokeWidth={1.5} className="text-[#0F766E] shrink-0" />
              <div className="flex flex-col justify-center">
                <h4 className="text-[14px] font-semibold text-amf-ink-900 leading-tight">{area.title}</h4>
                <p className="text-[12px] text-amf-muted-600 leading-tight">{area.count} ativos</p>
              </div>
            </div>
            {area.canManage && (
              <div className="flex items-center gap-1 text-[12px] font-medium text-[#0F766E]">
                Gerenciar <ChevronRight size={14} />
              </div>
            )}
          </div>
        );

        return area.canManage ? (
          <Link key={area.title} href={area.href} className="w-full block outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-xl">
            {CardContent}
          </Link>
        ) : (
          <div key={area.title} className="w-full block">
            {CardContent}
          </div>
        );
      })}
    </div>
  );
}
