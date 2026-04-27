"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/dates";
import { CheckCircle2, XCircle, BookOpen, Clock, Loader2 } from "lucide-react";
import type { Activity } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { ActivityCard } from "@/components/dashboard/ActivityCard";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"cumplida" | "vencida">("cumplida");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const supabase = createClient();
      setIsLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setIsLoading(false);
        return;
      }

      // Fetch completed and overdue activities
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userData.user.id)
        .in("status", ["cumplida", "vencida"])
        .order("due_date", { ascending: false });

      if (data && !error) {
        setActivities(data as Activity[]);
      }
      
      setIsLoading(false);
    }

    loadHistory();
  }, []);

  const filtered = activities.filter((a) => a.status === activeTab);

  return (
    <div className="flex flex-col">
      <Header title="Historial" subtitle="Tareas pasadas" />

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-border">
        <button
          onClick={() => setActiveTab("cumplida")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "cumplida"
              ? "accent-gradient text-text-on-accent"
              : "bg-bg-card text-text-muted border border-border hover:text-text-secondary"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Cumplidas
        </button>
        <button
          onClick={() => setActiveTab("vencida")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "vencida"
              ? "bg-status-danger text-white"
              : "bg-bg-card text-text-muted border border-border hover:text-text-secondary"
          }`}
        >
          <XCircle className="w-4 h-4" />
          Vencidas
        </button>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-accent" />
            <p className="text-sm font-medium">Cargando historial...</p>
          </div>
        ) : (
          <>
            {filtered.map((activity, index) => (
              <ActivityCard 
                key={activity.id} 
                activity={activity} 
                index={index} 
              />
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-text-muted">
                  No hay tareas {activeTab === "cumplida" ? "cumplidas" : "vencidas"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
