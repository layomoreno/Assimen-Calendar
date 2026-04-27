"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  hoverable = false,
  onClick,
  padding = "md",
}: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-bg-card rounded-2xl border border-border card-shadow
        ${hoverable ? "cursor-pointer hover:bg-bg-card-hover hover:border-border-light hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1" : ""}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
