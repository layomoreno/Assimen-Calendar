import type { ReminderType } from "@/types/database";

/**
 * Reminder System — Quadruple Notification
 * 
 * From assiten_calendar.md:
 * - 7 days before: Planning alert
 * - 5 days before: Progress reminder
 * - 3 days before: High priority alert
 * - Due date (0 days): Final delivery notification
 */

interface ReminderConfig {
  type: ReminderType;
  daysBefore: number;
  label: string;
  description: string;
  severity: "info" | "warning" | "high" | "critical";
  icon: string;
}

export const REMINDER_CONFIG: ReminderConfig[] = [
  {
    type: "7_dias",
    daysBefore: 7,
    label: "Planificación",
    description: "Comienza a planificar esta tarea",
    severity: "info",
    icon: "📋",
  },
  {
    type: "5_dias",
    daysBefore: 5,
    label: "Progreso",
    description: "Verifica tu avance en esta tarea",
    severity: "warning",
    icon: "📊",
  },
  {
    type: "3_dias",
    daysBefore: 3,
    label: "Prioridad Alta",
    description: "¡Quedan solo 3 días para la entrega!",
    severity: "high",
    icon: "⚠️",
  },
  {
    type: "dia_cierre",
    daysBefore: 0,
    label: "Entrega Final",
    description: "Hoy es el día de entrega",
    severity: "critical",
    icon: "🔴",
  },
];

/** Calculate all reminder dates for a due date */
export function calculateReminderDates(dueDate: Date): Array<{
  type: ReminderType;
  remindAt: Date;
  config: ReminderConfig;
}> {
  return REMINDER_CONFIG.map((config) => {
    const remindAt = new Date(dueDate);
    remindAt.setDate(remindAt.getDate() - config.daysBefore);
    return {
      type: config.type,
      remindAt,
      config,
    };
  });
}

/** Get the severity color for a reminder */
export function getReminderSeverityColor(severity: ReminderConfig["severity"]): string {
  switch (severity) {
    case "info":
      return "text-status-info bg-status-info/15 border-status-info/30";
    case "warning":
      return "text-status-warning bg-status-warning/15 border-status-warning/30";
    case "high":
      return "text-accent bg-accent/15 border-accent/30";
    case "critical":
      return "text-status-danger bg-status-danger/15 border-status-danger/30";
  }
}

/** Get the next pending reminder for an activity */
export function getNextReminder(
  dueDate: Date
): ReminderConfig | null {
  const now = new Date();
  const reminders = calculateReminderDates(dueDate);

  for (const reminder of reminders) {
    if (reminder.remindAt > now) {
      return reminder.config;
    }
  }

  return null;
}
