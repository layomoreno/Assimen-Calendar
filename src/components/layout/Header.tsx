"use client";

import React from "react";
import Image from "next/image";
import { Bell, SlidersHorizontal } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  onFilterClick?: () => void;
  notificationCount?: number;
}

export function Header({
  title = "Assisten Calendar",
  subtitle,
  showFilters = false,
  onFilterClick,
  notificationCount = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass-heavy border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 -m-1 rounded-xl bg-indigo-500/20 blur-md" />
            <Image
              src="/logo.png"
              alt="Assisten Calendar"
              width={36}
              height={36}
              className="relative rounded-xl shadow-lg shadow-indigo-500/20"
            />
          </div>
          <div>
            <h1 className="text-base font-black text-gradient leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showFilters && (
            <button
              onClick={onFilterClick}
              id="header-filters-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-bg-card/50 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              FILTROS
            </button>
          )}

          <button
            id="header-notifications-btn"
            className="relative p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-card/50 transition-all duration-300"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full gradient-danger text-white text-[9px] font-bold flex items-center justify-center animate-breathe shadow-lg shadow-status-danger/30">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
