import React from 'react';
import Link from 'next/link';
import { PlayCircle, BookOpen, ChevronRight, GraduationCap, Award } from 'lucide-react';

export type UserCourseProgress = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  coverUrl?: string | null;
  lastLessonTitle?: string;
  lastLessonSlug?: string;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'completed';
  isEligibleForCertificate?: boolean;
};

interface SuaAcademiaProps {
  courses: UserCourseProgress[];
  materialsCount: number;
}

export function SuaAcademia({ courses, materialsCount }: SuaAcademiaProps) {
  if (courses.length === 0) {
    return (
      <div className="flex flex-col mb-8">
        <h2 className="font-editorial text-2xl text-[#16051F] mb-1">Sua Academia</h2>
        <div className="w-10 h-[2px] bg-[#0E5B5C] mb-6 rounded-full" />
        
        <div className="bg-white rounded-[20px] p-6 border border-[#DED5C9] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F1] flex items-center justify-center mb-4">
            <GraduationCap className="w-6 h-6 text-[#78664E]" />
          </div>
          <h3 className="font-sans font-semibold text-[#16051F] text-lg mb-2">
            Bem-vindo(a) à Academia
          </h3>
          <p className="font-sans text-sm text-[#667085] mb-6 max-w-sm">
            Você ainda não possui nenhum curso em andamento. Descubra nossos cursos e comece sua jornada na medicina felina.
          </p>
          <Link
            href="/app/cursos"
            className="bg-[#0E5B5C] text-white font-sans font-semibold text-sm px-6 py-3 rounded-full hover:bg-[#004F4D] transition-colors"
          >
            Explorar cursos
          </Link>
        </div>
      </div>
    );
  }

  const primaryCourse = courses[0];

  return (
    <div className="flex flex-col mb-8">
      <h2 className="font-editorial text-2xl text-[#16051F] mb-1">Sua Academia</h2>
      <div className="w-10 h-[2px] bg-[#0E5B5C] mb-6 rounded-full" />
      
      <div className="flex flex-col gap-4">
        {/* Card Principal */}
        <div className="bg-white rounded-[20px] p-5 border border-[#DED5C9] shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col relative overflow-hidden">
          {primaryCourse.coverUrl && <img src={primaryCourse.coverUrl} alt={primaryCourse.courseTitle} className="w-[calc(100%+2.5rem)] max-w-none -mx-5 -mt-5 mb-5 aspect-video object-cover" />}
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F1] flex items-center justify-center flex-shrink-0">
                {primaryCourse.status === 'completed' ? (
                  <Award className="w-5 h-5 text-[#0E5B5C]" />
                ) : primaryCourse.status === 'in_progress' ? (
                  <BookOpen className="w-5 h-5 text-[#0E5B5C]" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-[#0E5B5C]" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-[11px] font-bold tracking-wider text-[#0E5B5C] uppercase">
                  {primaryCourse.status === 'completed' 
                    ? 'Curso Concluído' 
                    : primaryCourse.status === 'in_progress' 
                      ? 'Continuar curso' 
                      : 'Começar curso'}
                </span>
                <h3 className="font-sans font-semibold text-[#16051F] text-base leading-tight mt-0.5 line-clamp-1">
                  {primaryCourse.courseTitle}
                </h3>
              </div>
            </div>
            
            <Link 
              href={`/app/cursos/${primaryCourse.courseSlug}${primaryCourse.lastLessonSlug ? `/aula/${primaryCourse.lastLessonSlug}` : ''}`}
              className="bg-[#FAF7F1] text-[#0E5B5C] p-2.5 rounded-full hover:bg-[#E8E1D3] transition-colors"
              aria-label="Acessar curso"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>

          <div className="flex flex-col gap-1.5 relative z-10">
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs font-medium text-[#667085] truncate pr-4">
                {primaryCourse.lastLessonTitle || 'Pronto para iniciar'}
              </span>
              <span className="font-sans text-xs font-bold text-[#0E5B5C]">
                {Math.round(primaryCourse.progressPercent)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#FAF7F1] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0E5B5C] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${primaryCourse.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Materiais */}
        <Link 
          href="/app/perfil/materiais"
          className="bg-[#FAF7F1] rounded-[16px] p-4 flex items-center justify-between border border-[#DED5C9] hover:bg-[#F5F0E7] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-[#DED5C9]">
              <BookOpen className="w-4 h-4 text-[#D4AD62]" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-bold text-[#D4AD62] uppercase tracking-wider">
                Meus materiais
              </span>
              <span className="font-sans text-xs font-medium text-[#16051F]">
                {materialsCount} arquivo{materialsCount !== 1 && 's'} salvo{materialsCount !== 1 && 's'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#78664E]" />
        </Link>
        
        {/* Outros cursos */}
        {courses.length > 1 && (
          <Link 
            href="/app/cursos"
            className="flex items-center justify-center py-2 font-sans text-sm font-semibold text-[#0E5B5C] hover:text-[#004F4D] transition-colors w-max mx-auto mt-2 gap-1"
          >
            Ver meus {courses.length} cursos
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
