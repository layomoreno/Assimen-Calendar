"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import type { Activity } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  useEffect(() => {
    async function loadCalendar() {
      const supabase = createClient();
      setIsLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsLoading(false);
        return;
      }

      // Fetch all non-deleted activities for this user
      // We could filter by date range to optimize, but let's fetch all active ones for now
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userData.user.id)
        .neq("status", "eliminada")
        .order("due_date", { ascending: true });

      if (data && !error) {
        setActivities(data as Activity[]);
      }
      
      setIsLoading(false);
    }

    loadCalendar();
  }, [currentMonth]); // Reload if we implemented date-range fetching, but safe to leave

  // Build calendar grid
  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const dayEvents = activities.filter((e) => isSameDay(new Date(e.due_date), selectedDate));

  return (
    <div className="flex flex-col w-full h-full pb-24">
      <Header title="Calendario" subtitle={format(currentMonth, "MMMM yyyy", { locale: es })} />

      <div className="px-4 py-4 space-y-4 max-w-md mx-auto w-full">
        {/* Month Navigator */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl bg-bg-card border border-border text-text-muted hover:text-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-text-primary capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl bg-bg-card border border-border text-text-muted hover:text-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <Card padding="sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-text-muted uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          {rows.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((dayCell, di) => {
                const isCurrentMonth = isSameMonth(dayCell, monthStart);
                const isSelected = isSameDay(dayCell, selectedDate);
                const isTodayDate = isToday(dayCell);
                
                const dayActivities = activities.filter((e) => isSameDay(new Date(e.due_date), dayCell));
                const hasEvent = dayActivities.length > 0;
                // Optional: show different colors based on category
                const hasAcademic = dayActivities.some(a => a.category === 'academica');
                const hasPersonal = dayActivities.some(a => a.category === 'personal');

                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDate(dayCell)}
                    className={`
                      relative flex flex-col items-center justify-center py-2 rounded-xl
                      text-xs font-medium transition-all duration-200
                      ${!isCurrentMonth ? "text-text-muted/30" : ""}
                      ${isSelected ? "accent-gradient text-text-on-accent shadow-lg shadow-accent/20" : ""}
                      ${isTodayDate && !isSelected ? "border border-accent/40 text-accent" : ""}
                      ${isCurrentMonth && !isSelected && !isTodayDate ? "text-text-secondary hover:bg-bg-elevated" : ""}
                    `}
                  >
                    {format(dayCell, "d")}
                    {hasEvent && !isSelected && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {hasAcademic && <span className="w-1 h-1 rounded-full bg-cat-academic" />}
                        {hasPersonal && !hasAcademic && <span className="w-1 h-1 rounded-full bg-cat-personal" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </Card>

        {/* Selected Day Events */}
        <div>
          <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-accent" />
              <p className="text-xs">Cargando...</p>
            </div>
          ) : dayEvents.length > 0 ? (
            <div className="space-y-3">
              {dayEvents.map((activity, i) => (
                <ActivityCard key={activity.id} activity={activity} index={i} />
              ))}
            </div>
          ) : (
            <Card padding="md" className="text-center border-dashed">
              <p className="text-xs text-text-muted">Sin actividades para este día</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
