"use client";

import React, { useState, useEffect } from "react";
import { WeekSelector } from "@/components/dashboard/WeekSelector";
import { ActivityCard, getSmartEmoji } from "@/components/dashboard/ActivityCard";
import { StatsChart, WeeklyChart } from "@/components/dashboard/StatsChart";
import { FilterBar, type FilterState } from "@/components/dashboard/FilterBar";
import {
  CalendarDays, Loader2, RefreshCw, Clock, AlignLeft,
  CheckSquare, Search, Bell, Zap, TrendingUp, Users, Activity,
} from "lucide-react";
import type { Activity as ActivityType } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import {
  format, startOfWeek, endOfWeek, addDays, isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: null, status: null, priority: null, course: null,
  });
  const [activeTab, setActiveTab] = useState<"pendientes" | "en_proceso" | "completadas">("pendientes");

  const [userName, setUserName] = useState<string>("Usuario");
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal and Sync State
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();

          if (profile?.display_name) {
            setUserName(profile.display_name.split(" ")[0]);
          } else {
            setUserName(user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Usuario");
          }

          const { data: acts } = await supabase
            .from("activities")
            .select("*, subtasks(*)")
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .order("due_date", { ascending: true });

          if (acts) setActivities(acts as ActivityType[]);
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Stats
  const completed = activities.filter((a) => a.status === "cumplida").length;
  const inProgress = activities.filter((a) => a.status === "en_proceso").length;
  const overdue = activities.filter((a) => a.status === "vencida").length;
  const total = activities.length;
  const productivityRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Tab filtering
  const tabFiltered = activities.filter((a) => {
    if (activeTab === "pendientes") return a.status === "en_proceso" && new Date(a.due_date) >= new Date();
    if (activeTab === "en_proceso") return a.status === "en_proceso";
    if (activeTab === "completadas") return a.status === "cumplida";
    return true;
  });

  // Mini calendar — current month week strip
  const today = new Date();
  const currentMonth = format(today, "MMMM yyyy", { locale: es });
  const weekStart = startOfWeek(today, { weekStartsOn: 6 }); // SAB
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="relative flex flex-col min-h-screen pb-24 md:pb-8 overflow-hidden bg-[#07070F]">

      {/* ─── TOP BAR (Desktop) ─── */}
      <div className="relative z-10 w-full px-4 md:px-8 pt-6 md:pt-8">
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-[#6060A0] font-medium">Bienvenido de vuelta,</p>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-3xl font-bold text-white tracking-tight capitalize">{isLoading ? "..." : userName}</h1>
              {!isLoading && (
                <div className="flex items-center gap-[3px] mt-1">
                  <div className="w-[3px] h-2.5 bg-[#34D399] rounded-full animate-pulse shadow-[0_0_6px_#34D399]" />
                  <div className="w-[3px] h-4 bg-[#34D399] rounded-full animate-pulse shadow-[0_0_6px_#34D399]" style={{ animationDelay: "0.15s" }} />
                  <div className="w-[3px] h-3 bg-[#34D399] rounded-full animate-pulse shadow-[0_0_6px_#34D399]" style={{ animationDelay: "0.3s" }} />
                  <div className="w-[3px] h-4.5 bg-[#34D399] rounded-full animate-pulse shadow-[0_0_6px_#34D399]" style={{ animationDelay: "0.1s" }} />
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#5C5C8A] mt-1">Aquí está el rendimiento de tu agenda en tiempo real.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#0A0A15] border border-[#2B2B4A] rounded-full px-5 py-2.5 min-w-[240px] focus-within:border-[#6C3AED] focus-within:shadow-[0_0_10px_rgba(108,58,237,0.3)] transition-all">
              <Search className="w-4 h-4 text-[#5C5C8A]" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-transparent border-none outline-none text-sm text-white placeholder-[#5C5C8A] w-full"
              />
            </div>
            {/* Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 rounded-full bg-[#0A0A15] border border-[#2B2B4A] text-[#7878A0] hover:text-white transition-colors hover:border-[#6C3AED] hover:shadow-[0_0_10px_rgba(108,58,237,0.2)]"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-[-2px] right-[-2px] w-[22px] h-[22px] bg-[#7C3AED] rounded-full flex items-center justify-center text-[11px] text-white font-bold border-[2.5px] border-[#07070F] shadow-[0_0_8px_rgba(124,58,237,0.8)]">3</span>
              </button>

              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-[#0A0A15]/95 backdrop-blur-xl border border-[#2B2B4A] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50">
                  <div className="p-4 border-b border-[#2B2B4A] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Notificaciones</h3>
                    <span className="text-[10px] text-[#6C3AED] font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => setShowNotifications(false)}>Marcar leídas</span>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto">
                    <div className="p-3 bg-[#12122A] rounded-xl mb-1 flex gap-3 border border-[#1E1E42]/50 hover:border-[#6C3AED]/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 flex items-center justify-center text-lg shrink-0">⏳</div>
                      <div>
                        <p className="text-[11px] text-white font-medium mb-1">Tarea urgente a vencer</p>
                        <p className="text-[9px] text-[#5C5C8A]">El sistema de IA ha detectado eventos próximos.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-[#12122A] rounded-xl flex gap-3 border border-[#1E1E42]/50 hover:border-[#6C3AED]/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-[#34D399]/20 flex items-center justify-center text-lg shrink-0">✨</div>
                      <div>
                        <p className="text-[11px] text-white font-medium mb-1">Extracción 100% exitosa</p>
                        <p className="text-[9px] text-[#5C5C8A]">Tus tareas fueron procesadas correctamente.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile header */}
        <div className="md:hidden mb-6">
          <h1 className="text-lg font-black text-white">Assisten<span className="text-[#5C5C8A]">.</span></h1>
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-sm font-semibold text-white">Hola, {isLoading ? "..." : userName} 👋</p>
              <p className="text-[11px] text-[#5C5C8A] mt-0.5">Aquí está el resumen de hoy</p>
            </div>
            <button className="relative p-2 rounded-xl bg-[#0E0E22] border border-[#1E1E42]/50 text-[#7878A0]">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#6C3AED] rounded-full border border-[#07070F]" />
            </button>
          </div>
        </div>

        {/* ─── STAT CARDS ROW ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Tareas activas */}
          <div className="bg-[#0D0D1A]/80 backdrop-blur-sm border border-[#1E1E42]/50 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#34D399] rounded-full animate-ping" />
                <span className="text-[10px] text-[#5C5C8A] font-medium hidden md:inline">En tiempo real</span>
              </div>
            </div>
            <p className="text-[10px] text-[#7878A0] mb-1">Tareas activas</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : inProgress + overdue}
              </span>
              {!isLoading && (
                <span className="text-[10px] text-[#34D399] font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +2.5%
                </span>
              )}
            </div>
            {/* Mini sparkline bars */}
            <div className="flex items-end gap-[3px] mt-3 h-5">
              {[4, 6, 3, 8, 5, 9, 7].map((h, i) => (
                <div key={i} className="flex-1 bg-[#34D399]/70 rounded-t-sm transition-all" style={{ height: `${h * 10}%` }} />
              ))}
            </div>
          </div>

          {/* Tareas cumplidas */}
          <div className="bg-[#0D0D1A]/80 backdrop-blur-sm border border-[#1E1E42]/50 rounded-2xl p-4 relative overflow-hidden">
            <p className="text-[10px] text-[#7878A0] mb-1">Tareas cumplidas</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-white">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : completed}
              </span>
              <span className="text-[10px] text-[#22D3EE] font-semibold">+8.2%</span>
            </div>
            {/* Mini line sparkle */}
            <svg viewBox="0 0 100 24" className="w-full h-5 overflow-visible">
              <path d="M0 18 Q 15 8, 30 16 T 60 10 T 100 4" fill="none" stroke="#22D3EE" strokeWidth="2" opacity="0.6" />
              <circle cx="100" cy="4" r="3" fill="#22D3EE" opacity="0.8" />
            </svg>
          </div>

          {/* Usuarios activos / Total */}
          <div className="bg-[#0D0D1A]/80 backdrop-blur-sm border border-[#1E1E42]/50 rounded-2xl p-4 hidden md:block">
            <p className="text-[10px] text-[#7878A0] mb-1">Total actividades</p>
            <span className="text-2xl font-bold text-white block mb-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : total}
            </span>
            <div className="w-full h-1 bg-[#1E1E42] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-700"
                   style={{ width: `${Math.min(productivityRate, 100)}%` }} />
            </div>
          </div>

          {/* Productividad */}
          <div className="bg-[#0D0D1A]/80 backdrop-blur-sm border border-[#1E1E42]/50 rounded-2xl p-4 hidden md:block">
            <p className="text-[10px] text-[#7878A0] mb-1">Productividad</p>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-white">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${productivityRate}%`}
              </span>
              {/* Mini bars */}
              <div className="flex items-end gap-[2px] h-6">
                {[3, 5, 4, 7, 6, 8, 5, 9].map((h, i) => (
                  <div key={i} className="w-[3px] bg-[#818CF8]/60 rounded-t-sm" style={{ height: `${h * 10}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID ─── */}
      <div className="relative z-10 w-full px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* LEFT SECTION */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Top Row: Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <WeeklyChart />
              <StatsChart completed={completed} inProgress={inProgress} overdue={overdue} />
            </div>

            {/* Bottom Row: Actividades y tareas */}
            <div className="bg-[#0D0D1A]/70 border border-[#1E1E42]/50 rounded-2xl p-4 backdrop-blur-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Actividades y tareas</h3>
                <button className="text-[10px] text-[#818CF8] hover:text-white transition-colors font-medium">Ver todas</button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-[#07070F] rounded-xl p-1 max-w-sm">
                {[
                  { key: "pendientes" as const, label: "Pendientes" },
                  { key: "en_proceso" as const, label: "En proceso" },
                  { key: "completadas" as const, label: "Completadas" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 text-[10px] font-semibold py-2 rounded-lg transition-all ${
                      activeTab === tab.key
                        ? "bg-[#12122A] text-white"
                        : "text-[#5C5C8A] hover:text-[#9898C8]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Activity List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-5 h-5 text-[#818CF8] animate-spin" />
                  </div>
                ) : tabFiltered.length > 0 ? (
                  tabFiltered.slice(0, 6).map((activity, index) => (
                    <CompactActivityRow
                      key={activity.id}
                      activity={activity}
                      index={index}
                      onClick={() => {
                        setSelectedActivity(activity);
                        setSyncMessage(null);
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-[#5C5C8A]">No hay tareas en esta categoría</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Top: Agenda */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#0D0D1A]/60 border border-[#1E1E42]/50 rounded-2xl p-5 backdrop-blur-md"
            >
              <h3 className="text-[15px] font-semibold text-white mb-4">Agenda</h3>
              
              <div className="bg-[#12122A]/40 border border-[#1E1E42]/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-5">
                  <button className="text-[#5C5C8A] hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-[13px] text-white font-medium capitalize">{currentMonth}</span>
                  <button className="text-[#5C5C8A] hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                {/* Day headers */}
                <div className="flex items-center justify-between mb-3 px-1">
                  {["SÁB", "DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE"].map((d) => (
                    <div key={d} className="w-7 text-center text-[9px] font-medium text-[#5C5C8A]">{d}</div>
                  ))}
                </div>

                {/* Day numbers */}
                <div className="flex items-center justify-between px-1">
                  {weekDays.map((d, i) => {
                    const isToday = isSameDay(d, today);
                    return (
                      <button
                        key={i}
                        className={`
                          w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-medium transition-all
                          ${isToday 
                            ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.8)] ring-1 ring-blue-400" 
                            : "text-[#9898C8] hover:text-white hover:bg-[#1E1E42]/50"}
                        `}
                      >
                        {format(d, "d")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* ─── ACTIVITY DETAILS MODAL ─── */}
      <Modal
        isOpen={!!selectedActivity}
        onClose={() => { setSelectedActivity(null); setSyncMessage(null); }}
        title="Detalles de la Actividad"
        size="md"
      >
        {selectedActivity && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{selectedActivity.title}</h3>
              {selectedActivity.course_name && (
                <span className="inline-block px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full border border-accent/30">
                  📚 {selectedActivity.course_name}
                </span>
              )}
            </div>

            {selectedActivity.description && (
              <div className="flex gap-3 text-sm text-text-secondary bg-bg-elevated p-4 rounded-xl border border-border">
                <AlignLeft className="w-5 h-5 text-accent shrink-0" />
                <p className="leading-relaxed">{selectedActivity.description}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-text-secondary bg-bg-elevated p-4 rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-accent" />
                <span>{new Date(selectedActivity.due_date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                <span>{new Date(selectedActivity.start_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            {selectedActivity.subtasks && selectedActivity.subtasks.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-accent2" /> Subtareas
                </h4>
                <div className="space-y-2">
                  {selectedActivity.subtasks.map((sub, i) => (
                    <div key={i} className="flex items-start gap-3 bg-bg-elevated/50 p-3 rounded-lg border border-border/50">
                      <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 ${sub.is_completed ? "bg-accent text-bg-card" : "border border-border/70"}`}>
                        {sub.is_completed && <CheckSquare className="w-3 h-3" />}
                      </div>
                      <span className={`text-sm ${sub.is_completed ? "text-text-muted line-through" : "text-text-secondary"}`}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {syncMessage && (
              <div className={`p-3 rounded-xl text-sm font-medium border ${syncMessage.type === "success" ? "bg-status-active/10 text-status-active border-status-active/20" : "bg-status-danger/10 text-status-danger border-status-danger/20"}`}>
                {syncMessage.text}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border/50">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedActivity(null)}>Cerrar</Button>
              <Button
                variant="primary" className="flex-1 btn-gradient"
                disabled={isSyncing || !!selectedActivity.google_event_id}
                onClick={async () => {
                  setIsSyncing(true); setSyncMessage(null);
                  try {
                    const response = await fetch("/api/calendar/sync", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ activityId: selectedActivity.id }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Error al sincronizar");
                    setSyncMessage({ type: "success", text: "¡Sincronizado con éxito!" });
                    setActivities(prev => prev.map(a => a.id === selectedActivity.id ? { ...a, google_event_id: data.eventId } : a));
                    setSelectedActivity(prev => prev ? { ...prev, google_event_id: data.eventId } : null);
                  } catch (err: any) {
                    setSyncMessage({ type: "error", text: err.message });
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                icon={isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              >
                {isSyncing ? "Sincronizando..." : selectedActivity.google_event_id ? "Ya sincronizado" : "Sincronizar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─── COMPACT ACTIVITY ROW ─── */
function CompactActivityRow({ activity, index, onClick }: { activity: ActivityType; index: number; onClick: () => void }) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    vencida: { bg: "bg-red-500/15", text: "text-red-400", label: "Vencida" },
    en_proceso: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "En proceso" },
    cumplida: { bg: "bg-green-500/15", text: "text-green-400", label: "Cumplida" },
  };

  const status = statusColors[activity.status] || statusColors.en_proceso;
  const completedSubs = activity.subtasks?.filter(s => s.is_completed).length || 0;
  const totalSubs = activity.subtasks?.length || 0;

  const msRemaining = new Date(activity.due_date).getTime() - new Date().getTime();
  const isUrgent = activity.status !== "cumplida" && msRemaining > 0 && msRemaining < 48 * 60 * 60 * 1000;
  const isRelaxed = activity.status !== "cumplida" && msRemaining > 72 * 60 * 60 * 1000;

  let finalEmoji = getSmartEmoji(activity);
  if (activity.status === "vencida") finalEmoji = "💀";
  else if (isUrgent) finalEmoji = "⏳";
  else if (isRelaxed) finalEmoji = "😌";

  return (
    <div className={`relative mb-2 group rounded-xl overflow-hidden ${isUrgent ? "p-[1.5px]" : "border border-[#1A1A35]/40 hover:border-[#2A2A55]"}`}>
      {/* Animated red border for urgent tasks */}
      {isUrgent && (
        <div className="absolute inset-[-150%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(transparent_60%,#EF4444_100%)] opacity-90 pointer-events-none" />
      )}
      
      <button
        onClick={onClick}
        className="w-full relative z-10 flex items-start gap-3 p-3 rounded-[10px] bg-[#0A0A1A] hover:bg-[#0E0E22] transition-colors text-left animate-fade-in"
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        {/* Left icon */}
        <div className="w-8 h-8 rounded-xl bg-[#12122A] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#1A1A3E] transition-colors text-[14px] shadow-inner border border-white/5">
          {finalEmoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-white truncate leading-tight">{activity.title}</p>
          {activity.course_name && (
            <p className="text-[10px] text-[#5C5C8A] mt-0.5 truncate">{activity.course_name}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] text-[#5C5C8A] flex items-center gap-1">
              <CalendarDays className="w-2.5 h-2.5" />
              {new Date(activity.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-[9px] text-[#5C5C8A]">•</span>
            <span className="text-[9px] text-[#5C5C8A] flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {new Date(activity.start_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="text-right shrink-0">
          <span className="text-[10px] text-[#5C5C8A] font-medium">{completedSubs}/{totalSubs}</span>
        </div>
      </button>
    </div>
  );
}
