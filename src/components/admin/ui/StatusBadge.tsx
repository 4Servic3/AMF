import React from "react";
import { twMerge } from "tailwind-merge";

export type StatusVariant = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-[#34c759]/15 text-[#1f7a37]",
  warning: "bg-[#ff9500]/15 text-[#a35a00]",
  error: "bg-[#ff3b30]/12 text-[#c4221a]",
  info: "bg-[var(--admin-tint-soft)] text-[var(--admin-tint)]",
  neutral: "bg-[var(--admin-fill)] text-[var(--admin-secondary)]",
};

export default function StatusBadge({ children, variant = "neutral", className }: StatusBadgeProps) {
  return (
    <span className={twMerge(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  );
}
