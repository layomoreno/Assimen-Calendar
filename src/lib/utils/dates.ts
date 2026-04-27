import {
  format,
  formatDistanceToNow,
  differenceInDays,
  addDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import type { ActivityPriority } from "@/types/database";

/** Format a date for display */
export function formatDate(date: string | Date, pattern: string = "d MMM yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: es });
}

/** Format a time for display */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a", { locale: es });
}

/** Get relative time string */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { locale: es, addSuffix: true });
}

/** Get days remaining until due date */
export function getDaysRemaining(dueDate: string | Date): number {
  const d = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  return differenceInDays(d, new Date());
}

/** Calculate priority based on days remaining */
export function calculatePriority(dueDate: string | Date): ActivityPriority {
  const days = getDaysRemaining(dueDate);
  if (days <= 0) return "urgente";
  if (days <= 3) return "alta";
  if (days <= 5) return "normal";
  return "baja";
}

/** Get human-readable due date status */
export function getDueDateLabel(dueDate: string | Date): string {
  const d = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  if (isPast(d)) return "Vencida";
  const days = getDaysRemaining(d);
  return `En ${days} día${days !== 1 ? "s" : ""}`;
}

/** Get priority color classes */
export function getPriorityColor(priority: ActivityPriority): string {
  switch (priority) {
    case "urgente":
      return "text-status-danger bg-status-danger/15";
    case "alta":
      return "text-status-warning bg-status-warning/15";
    case "normal":
      return "text-status-info bg-status-info/15";
    case "baja":
      return "text-status-active bg-status-active/15";
    default:
      return "text-text-secondary bg-bg-elevated";
  }
}

/** Get week days for the WeekSelector component */
export function getWeekDays(baseDate: Date = new Date()) {
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 6 }); // Start on Saturday
  const days = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    days.push({
      date: day,
      dayName: format(day, "EEE", { locale: es }).toUpperCase(),
      dayNumber: format(day, "d"),
      monthName: format(day, "MMM", { locale: es }).toUpperCase(),
      isToday: isToday(day),
    });
  }

  return days;
}

/** Get the week range label */
export function getWeekRangeLabel(baseDate: Date = new Date()): string {
  const start = startOfWeek(baseDate, { weekStartsOn: 6 });
  const end = endOfWeek(baseDate, { weekStartsOn: 6 });
  return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`;
}
