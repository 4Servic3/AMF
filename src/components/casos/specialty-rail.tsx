import React from 'react';
import { SpecialtyTile } from './specialty-tile';
import { Stethoscope, Beaker, HeartPulse } from 'lucide-react';

type SpecialtyRailProps = {
  onOpenSpecialty: (id: string) => void;
};

export function SpecialtyRail({ onOpenSpecialty }: SpecialtyRailProps) {
  const specialties = [
    {
      id: 'felv',
      title: 'FeLV',
      count: 18,
      imageUrl: '/assets/amf-casos/stories/story-felv.webp',
      icon: <Stethoscope size={18} strokeWidth={2} />
    },
    {
      id: 'nefrologia',
      title: 'Nefrologia',
      count: 24,
      imageUrl: '/assets/amf-casos/stories/story-drc.webp',
      // Mocking Kidney icon since lucide might not have it exactly, using a generic medical one
      icon: <Stethoscope size={18} strokeWidth={2} /> 
    },
    {
      id: 'oncologia',
      title: 'Oncologia',
      count: 12,
      imageUrl: '/assets/amf-casos/stories/story-oncologia.webp',
      icon: <Beaker size={18} strokeWidth={2} />
    },
    {
      id: 'emergencia',
      title: 'Emergência',
      count: 15,
      imageUrl: '/assets/amf-casos/stories/story-emergencia.webp',
      icon: <HeartPulse size={18} strokeWidth={2} />
    }
  ];

  return (
    <div className="w-full flex flex-col pt-6 pb-2 min-w-0">
      <div className="casesSectionInner">
        <h2 className="font-editorial font-bold text-[22px] md:text-[25px] text-[#172638] leading-none mb-4">
          Explore por especialidade
        </h2>
      </div>
      
      {/* Container com scroll nativo e hide-scrollbar */}
      <div className="w-full overflow-x-auto hide-scrollbar snap-x snap-mandatory min-w-0">
        {/* Track com padding inicial e final simulando o gutter */}
        <div className="flex gap-4 pb-4 px-[18px] min-[390px]:px-[20px] w-max">
          {specialties.map(spec => (
            <div key={spec.id} className="snap-start shrink-0">
              <SpecialtyTile
                title={spec.title}
                count={spec.count}
                imageUrl={spec.imageUrl}
                icon={spec.icon}
                onOpenSpecialty={() => onOpenSpecialty(spec.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
