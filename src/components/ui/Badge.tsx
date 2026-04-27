"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "academic" | "personal" | "status" | "priority" | "custom";
  color?: string;
  size?: "sm" | "md";
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = "custom",
  size = "sm",
  icon,
  className = "",
}: BadgeProps) {
  const variants = {
    academic: "bg-cat-academic/15 text-cat-academic border-cat-academic/25",
    personal: "bg-cat-personal/15 text-cat-personal border-cat-personal/25",
    status: "bg-accent/15 text-accent border-accent/25",
    priority: "bg-status-warning/15 text-status-warning border-status-warning/25",
    custom: "bg-bg-elevated text-text-secondary border-border",
  };

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-xl border
        transition-all duration-200 hover:scale-105
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

/** Pre-configured status badges */
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; emoji: string; className: string }> = {
    en_proceso: {
      label: "En Proceso",
      emoji: "⚡",
      className: "bg-status-info/12 text-status-info border-status-info/25",
    },
    cumplida: {
      label: "Cumplida",
      emoji: "✅",
      className: "bg-status-active/12 text-status-active border-status-active/25",
    },
    vencida: {
      label: "Vencida",
      emoji: "❌",
      className: "bg-status-danger/12 text-status-danger border-status-danger/25",
    },
    eliminada: {
      label: "Eliminada",
      emoji: "🗑️",
      className: "bg-text-muted/12 text-text-muted border-text-muted/25",
    },
  };

  const { label, emoji, className } = config[status] || config.en_proceso;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-xl border transition-all duration-200 hover:scale-105 ${className}`}
    >
      <span>{emoji}</span>
      {label}
    </span>
  );
}
