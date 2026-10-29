import React from "react";
import { twMerge } from "tailwind-merge";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={twMerge(
        "flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6",
        className,
      )}
    >
      <div>
        <h1 className="text-[28px] lg:text-[34px] font-bold tracking-tight text-amf-ink-900">
          {title}
        </h1>
        {description && (
          <p className="text-amf-muted-600 mt-1 text-[15px]">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
