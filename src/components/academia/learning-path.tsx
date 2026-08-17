import React from 'react';
import { LearningPathStep, type StepStatus } from './learning-path-step';

interface PathStepData {
  title: string;
  subtitle: string;
  status: StepStatus;
  progressPercent?: number;
}

interface LearningPathProps {
  steps: PathStepData[];
}

export function LearningPath({ steps }: LearningPathProps) {
  return (
    <div className="w-full mt-10 relative z-20 px-1 sm:px-2">
      <div className="mb-8">
        <h2 className="font-editorial text-[#10162F] text-[32px] sm:text-[36px] font-bold leading-tight">
          Trilha de formação
        </h2>
        <p className="font-sans text-[#667085] text-[15px] mt-1">
          Seu caminho recomendado
        </p>
        <div className="w-[32px] h-[2px] bg-[#006B68] mt-3" />
      </div>

      <div className="flex flex-col ml-1 sm:ml-4">
        {steps.map((step, index) => (
          <LearningPathStep
            key={index}
            number={index + 1}
            title={step.title}
            subtitle={step.subtitle}
            status={step.status}
            progressPercent={step.progressPercent}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
