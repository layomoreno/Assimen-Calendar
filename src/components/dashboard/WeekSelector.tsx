"use client";

import React, { useState } from "react";
import { getWeekDays } from "@/lib/utils/dates";

interface WeekSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function WeekSelector({ selectedDate, onDateSelect }: WeekSelectorProps) {
  const [baseDate, setBaseDate] = useState(new Date());
  const weekDays = getWeekDays(baseDate);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setBaseDate(newDate);
  };

  return (
    <div className="px-4 py-3">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => navigateWeek(1)}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days Grid */}
      <div className="flex items-center justify-between gap-1">
        {weekDays.map((day) => {
          const isSelected =
            selectedDate.toDateString() === day.date.toDateString();

          return (
            <button
              key={day.date.toISOString()}
              onClick={() => onDateSelect(day.date)}
              className={`
                flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl
                transition-all duration-200 min-w-[42px]
                ${
                  isSelected
                    ? "accent-gradient text-text-on-accent shadow-lg shadow-accent/20"
                    : day.isToday
                    ? "bg-bg-card border border-accent/40 text-accent"
                    : "text-text-muted hover:bg-bg-card hover:text-text-secondary"
                }
              `}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {day.dayName}
              </span>
              <span className={`text-sm font-bold ${isSelected ? "" : ""}`}>
                {day.dayNumber}
              </span>
              <span className="text-[9px] font-medium uppercase">
                {day.monthName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
