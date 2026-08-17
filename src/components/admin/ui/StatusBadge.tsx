import React from "react";
import { twMerge } from "tailwind-merge";

export type StatusVariant = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-[#2E7D62]/10 text-[#2E7D62] border-[#2E7D62]/20",
  warning: "bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/20",
  error: "bg-[#B44545]/10 text-[#B44545] border-[#B44545]/20",
  info: "bg-amf-teal-400/10 text-amf-petrol-900 border-amf-teal-400/20",
  neutral: "bg-amf-ivory-100 text-amf-ink-700 border-amf-border",
};

export default function StatusBadge({ children, variant = "neutral", className }: StatusBadgeProps) {
  return (
    <span className={twMerge(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
