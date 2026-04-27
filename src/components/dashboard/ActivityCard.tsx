"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatTime, getDaysRemaining } from "@/lib/utils/dates";
import { Calendar, Clock, BookOpen, ChevronRight, Zap, Share2, Mail, DownloadCloud, CalendarPlus } from "lucide-react";
import type { Activity } from "@/types/database";
import { getGoogleCalendarUrl, getOutlookCalendarUrl, getAppleCalendarDataUri } from "@/lib/utils/calendarLinks";

interface ActivityCardProps {
  activity: Activity;
  onClick?: (activity: Activity) => void;
  index?: number;
}

/* ============================================
   Smart Emoji System
   Assigns contextual emojis based on:
   - Task type/keywords
   - Urgency level
   - Completion status
   ============================================ */
export function getSmartEmoji(activity: Activity): string {
  const title = (activity.title + " " + (activity.description || "")).toLowerCase();
  const course = (activity.course_name || "").toLowerCase();

  // Done
  if (activity.status === "cumplida") return "🎉";
  if (activity.status === "vencida") return "💀";

  // Academic keywords
  if (title.includes("parcial") || title.includes("examen") || title.includes("quiz")) return "📝";
  if (title.includes("laboratorio") || title.includes("lab")) return "🔬";
  if (title.includes("proyecto") || title.includes("project")) return "🚀";
  if (title.includes("taller") || title.includes("workshop")) return "🛠️";
  if (title.includes("presentación") || title.includes("exposición")) return "🎤";
  if (title.includes("informe") || title.includes("reporte")) return "📊";
  if (title.includes("lectura") || title.includes("leer") || title.includes("libro")) return "📖";
  if (title.includes("ejercicio") || title.includes("tarea")) return "✏️";
  if (title.includes("investigación") || title.includes("research")) return "🔍";
  if (title.includes("código") || title.includes("programación") || title.includes("code")) return "💻";

  // Course keywords
  if (course.includes("cálculo") || course.includes("matemática") || course.includes("math")) return "📐";
  if (course.includes("física") || course.includes("physics")) return "⚛️";
  if (course.includes("química") || course.includes("chemistry")) return "🧪";
  if (course.includes("programación") || course.includes("software") || course.includes("web")) return "💻";
  if (course.includes("inglés") || course.includes("english")) return "🌍";
  if (course.includes("historia") || course.includes("history")) return "📜";
  if (course.includes("arte") || course.includes("diseño")) return "🎨";

  // Personal keywords
  if (title.includes("médico") || title.includes("doctor") || title.includes("cita")) return "🏥";
  if (title.includes("reunión") || title.includes("meeting")) return "🤝";
  if (title.includes("gym") || title.includes("ejercicio") || title.includes("deporte")) return "💪";
  if (title.includes("compras") || title.includes("mercado")) return "🛒";
  if (title.includes("licencia") || title.includes("trámite")) return "📋";

  // Category defaults
  if (activity.category === "academica") return "📚";
  return "📌";
}

/* ============================================
   Urgency Level Calculation
   Real-time based on current date/time
   ============================================ */
type UrgencyLevel = "overdue" | "critical" | "urgent" | "warning" | "calm" | "relaxed" | "done";

function getUrgencyLevel(activity: Activity): UrgencyLevel {
  if (activity.status === "cumplida") return "done";
  if (activity.status === "vencida") return "overdue";

  const daysLeft = getDaysRemaining(activity.due_date);

  if (daysLeft < 0) return "overdue";
  if (daysLeft === 0) return "critical";
  if (daysLeft <= 1) return "urgent";
  if (daysLeft <= 3) return "warning";
  if (daysLeft <= 5) return "calm";
  return "relaxed";
}

function getUrgencyConfig(level: UrgencyLevel) {
  const configs = {
    overdue: {
      cardClass: "card-gradient-overdue animate-urgent",
      barClass: "urgency-bar-overdue",
      label: "⏰ ¡VENCIDA!",
      labelClass: "text-status-danger font-black",
      reaction: "😱",
      message: "Esta tarea ya venció",
      emojiClass: "bg-status-danger/20 animate-countdown",
      progressColor: "bg-gradient-to-r from-red-500 to-red-700",
    },
    critical: {
      cardClass: "card-gradient-urgent animate-urgent",
      barClass: "urgency-bar-urgent",
      label: "🔥 ¡HOY!",
      labelClass: "text-status-danger font-black",
      reaction: "😰",
      message: "¡Se entrega hoy!",
      emojiClass: "bg-status-danger/20 animate-countdown",
      progressColor: "bg-gradient-to-r from-red-500 to-orange-500",
    },
    urgent: {
      cardClass: "card-gradient-urgent animate-warning-shake",
      barClass: "urgency-bar-urgent",
      label: "⚡ Mañana",
      labelClass: "text-status-danger font-bold",
      reaction: "😬",
      message: "¡Queda muy poco tiempo!",
      emojiClass: "bg-status-warning/20 animate-breathe",
      progressColor: "bg-gradient-to-r from-orange-500 to-yellow-500",
    },
    warning: {
      cardClass: "card-gradient-warning",
      barClass: "urgency-bar-warning",
      label: "⏳ Pronto",
      labelClass: "text-status-warning font-semibold",
      reaction: "🤔",
      message: "Quedan pocos días",
      emojiClass: "bg-status-warning/15",
      progressColor: "bg-gradient-to-r from-yellow-500 to-green-500",
    },
    calm: {
      cardClass: "card-gradient-normal",
      barClass: "urgency-bar-calm",
      label: "✅ A tiempo",
      labelClass: "text-status-info font-medium",
      reaction: "😊",
      message: "Vas bien, sigue así",
      emojiClass: "bg-status-info/15",
      progressColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
    },
    relaxed: {
      cardClass: "card-gradient-calm",
      barClass: "urgency-bar-calm",
      label: "🌿 Tranquilo",
      labelClass: "text-status-active font-medium",
      reaction: "😎",
      message: "Tienes tiempo de sobra",
      emojiClass: "bg-status-active/15 animate-float",
      progressColor: "bg-gradient-to-r from-green-500 to-emerald-500",
    },
    done: {
      cardClass: "card-gradient-done",
      barClass: "urgency-bar-done",
      label: "🎉 ¡Listo!",
      labelClass: "text-status-active font-bold",
      reaction: "🥳",
      message: "¡Completada!",
      emojiClass: "bg-status-active/20",
      progressColor: "bg-gradient-to-r from-green-400 to-emerald-400",
    },
  };
  return configs[level];
}

/* ============================================
   Real-time countdown display
   ============================================ */
function useRealtimeCountdown(dueDate: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      const due = new Date(dueDate);
      const diff = due.getTime() - now.getTime();

      if (diff <= 0) {
        const overdue = Math.abs(diff);
        const hours = Math.floor(overdue / 3600000);
        const mins = Math.floor((overdue % 3600000) / 60000);
        setTimeLeft(`-${hours}h ${mins}m`);
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft(`${hours}h ${mins}m`);
      }
    }

    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [dueDate]);

  return timeLeft;
}

/* ============================================
   Activity Card Component
   ============================================ */
export function ActivityCard({ activity, onClick, index = 0 }: ActivityCardProps) {
  const emoji = getSmartEmoji(activity);
  const urgency = getUrgencyLevel(activity);
  const config = getUrgencyConfig(urgency);
  const timeLeft = useRealtimeCountdown(activity.due_date);
  const daysLeft = getDaysRemaining(activity.due_date);
  const completedSubtasks = activity.subtasks?.filter((s) => s.is_completed).length || 0;
  const totalSubtasks = activity.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <Card
      hoverable
      onClick={() => onClick?.(activity)}
      className={`group animate-fade-in stagger-${Math.min(index + 1, 5)} ${config.cardClass} relative overflow-hidden`}
      padding="none"
    >
      {/* Urgency Side Bar */}
      <div className={`urgency-bar ${config.barClass}`} />

      <div className="pl-5 pr-4 py-4">
        {/* Top Row: Emoji + Title + Reaction */}
        <div className="flex items-start gap-3 mb-3">
          {/* Smart Emoji */}
          <div className={`emoji-bubble ${config.emojiClass} shrink-0 mt-0.5`}>
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text-primary truncate">
              {activity.title}
            </h3>
            {activity.course_name && (
              <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-cat-academic" />
                <span className="text-cat-academic/80">{activity.course_name}</span>
              </p>
            )}
          </div>

          {/* Urgency Reaction */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-xl">{config.reaction}</span>
            <span className={`text-[10px] ${config.labelClass} whitespace-nowrap`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Time Info Row */}
        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            {formatDate(activity.due_date)}
          </span>
          <span className="flex items-center gap-1.5 text-text-secondary">
            <Clock className="w-3.5 h-3.5 text-accent" />
            {formatTime(activity.start_date)}
          </span>

          {/* Real-time Countdown */}
          {activity.status === "en_proceso" && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              daysLeft <= 1
                ? "bg-status-danger/15 text-status-danger"
                : daysLeft <= 3
                  ? "bg-status-warning/15 text-status-warning"
                  : "bg-status-info/15 text-status-info"
            }`}>
              <Zap className="w-3 h-3" />
              {timeLeft}
            </span>
          )}
        </div>

        {/* Urgency Message */}
        <div className={`text-xs mb-3 px-2.5 py-1.5 rounded-lg bg-bg-elevated/50 border border-border/50 ${
          urgency === "overdue" || urgency === "critical" ? "animate-breathe" : ""
        }`}>
          <span className="text-text-muted">{config.message}</span>
        </div>

        {/* Subtask Progress Bar */}
        {totalSubtasks > 0 && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-text-muted font-medium">
                Progreso: {completedSubtasks}/{totalSubtasks} subtareas
              </span>
              <span className="text-[10px] text-text-secondary font-bold">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${config.progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Badge variant={activity.category === "academica" ? "academic" : "personal"}>
              {activity.category === "academica" ? "📚 Académica" : "🏠 Personal"}
            </Badge>
            <StatusBadge status={activity.status} />
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Dropdown / Buttons */}
            <div className="flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <a
                href={getGoogleCalendarUrl(activity)}
                target="_blank"
                rel="noreferrer"
                title="Sincronizar con Google Calendar"
                className="p-1.5 rounded-lg bg-bg-elevated text-text-muted hover:text-[#4285F4] hover:bg-[#4285F4]/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <CalendarPlus className="w-4 h-4" />
              </a>
              <a
                href={getOutlookCalendarUrl(activity)}
                target="_blank"
                rel="noreferrer"
                title="Sincronizar con Outlook/Hotmail"
                className="p-1.5 rounded-lg bg-bg-elevated text-text-muted hover:text-[#0078D4] hover:bg-[#0078D4]/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href={getAppleCalendarDataUri(activity)}
                download={`${activity.title}.ics`}
                title="Descargar para Apple Calendar"
                className="p-1.5 rounded-lg bg-bg-elevated text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <DownloadCloud className="w-4 h-4" />
              </a>
            </div>

            <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 hover:scale-105 active:scale-95 transition-all duration-200">
              <ChevronRight className="w-3.5 h-3.5" />
              VER
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
