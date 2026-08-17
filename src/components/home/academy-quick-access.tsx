import React from 'react';
import Link from 'next/link';
import { BookOpen, Folder, ChevronRight } from 'lucide-react';

interface AcademyQuickAccessProps {
  courseTitle: string;
  courseProgress: number; // 0 to 100
  courseHref: string;
  savedMaterialsCount: number;
  materialsHref: string;
}

export function AcademyQuickAccess({ 
  courseTitle, 
  courseProgress, 
  courseHref, 
  savedMaterialsCount, 
  materialsHref 
}: AcademyQuickAccessProps) {
  return (
    <section className="mt-[24px] mb-8 w-full max-w-full min-w-0">
      <div className="flex flex-col mb-[16px]">
        <h2 
          className="font-editorial text-[#172638] tracking-wide leading-tight"
          style={{ fontSize: 'clamp(29px, 8vw, 31px)', fontWeight: 600 }}
        >
          Sua Academia
        </h2>
        {/* Sublinhado curto */}
        <div className="w-[30px] h-[2px] bg-[#0E5B5C] mt-[8px] rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-[10px] w-full max-w-full min-w-0">
        {/* Continuar Curso Card */}
        <Link 
          href={courseHref}
          className="flex flex-col justify-center gap-[6px] bg-[#FAF7F1] border border-[#D9D1C4] rounded-[16px] p-[12px] sm:p-[16px] min-h-[94px] max-h-[106px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all group focus:outline-none min-w-0 max-w-full"
          aria-label={`Continuar curso ${courseTitle}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-[#D9D1C4] flex items-center justify-center text-[#0E5B5C] shrink-0">
              <BookOpen size={18} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-[#0E5B5C] block mb-0.5 truncate">
                Continuar curso
              </span>
              <h3 className="text-[13px] sm:text-[14px] font-sans font-bold text-[#172638] truncate leading-tight">
                {courseTitle}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <div 
              className="flex-1 h-1.5 bg-[#D8DDD9] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={courseProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div 
                className="h-full bg-[#0E5B5C] rounded-full" 
                style={{ width: `${courseProgress}%` }}
              ></div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-sans font-bold text-[#0E5B5C] w-[35px] text-right shrink-0">
              {courseProgress}%
            </span>
          </div>
        </Link>

        {/* Meus Materiais Card */}
        <Link 
          href={materialsHref}
          className="flex items-center gap-2 bg-[#FAF7F1] border border-[#D9D1C4] rounded-[16px] p-[12px] sm:p-[16px] min-h-[94px] max-h-[106px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all group focus:outline-none min-w-0 max-w-full"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-[#D9D1C4] flex items-center justify-center text-[#D4AD62] shrink-0">
            <Folder size={18} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <span className="text-[10px] sm:text-[11px] font-sans font-semibold text-[#D4AD62] block mb-0.5 truncate">
              Meus materiais
            </span>
            <h3 
              className="text-[12px] sm:text-[14px] font-sans font-medium text-[#172638] overflow-hidden text-ellipsis line-clamp-2 leading-tight"
            >
              {savedMaterialsCount} arquivos salvos
            </h3>
          </div>
          <div className="text-[#68727E] group-hover:text-[#172638] transition-colors pr-1 shrink-0">
            <ChevronRight size={18} strokeWidth={1.5} />
          </div>
        </Link>
      </div>
    </section>
  );
}
