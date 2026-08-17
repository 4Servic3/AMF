import React from "react";
import { twMerge } from "tailwind-merge";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
  variant?: "light" | "dark";
}

export default function StatCard({ title, value, icon: Icon, trend, className, variant = "light" }: StatCardProps) {
  const isDark = variant === "dark";

  return (
    <div className={twMerge(
      "p-5 rounded-2xl border shadow-sm flex flex-col justify-between h-[100px]",
      isDark 
        ? "bg-[#2A1B3D]/50 border-[#3A2B4D] backdrop-blur-sm" 
        : "bg-amf-surface border-amf-border",
      className
    )}>
      <div className="flex items-center gap-4 h-full">
        <div className={twMerge(
          "p-2.5 rounded-xl shrink-0",
          isDark ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "bg-amf-ivory-100 text-amf-plum-900"
        )}>
          <Icon size={24} />
        </div>
        <div className="flex flex-col justify-center overflow-hidden w-full">
          <p className={twMerge(
            "text-[13px] font-medium mb-1 truncate",
            isDark ? "text-cream-100/70" : "text-amf-muted-600"
          )}>{title}</p>
          <div className="flex items-end justify-between gap-2">
            <h3 className={twMerge(
              "text-2xl font-bold leading-none truncate",
              isDark ? "text-cream-50" : "text-amf-ink-900"
            )}>{value}</h3>
            
            {trend && (
              <div className="flex items-center gap-1 text-[11px] mb-0.5 shrink-0">
                <span className={twMerge(
                  "font-bold",
                  trend.isPositive ? "text-teal-400" : "text-[#D4AF37]"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
