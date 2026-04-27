"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogOut, User, Calendar, Bell, Shield, Moon, Apple } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ id: string; email: string; calendar_token?: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("calendar_token")
          .eq("id", user.id)
          .single();
          
        setProfile({
          id: user.id,
          email: user.email || "demo@correo.edu.co",
          calendar_token: data?.calendar_token,
        });
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl !== "https://your-project.supabase.co") {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/");
  };

  const handleAppleSync = () => {
    if (!profile?.calendar_token) return;
    
    // Construct webcal URL
    const baseUrl = window.location.host; // e.g. localhost:3000 or production domain
    const webcalUrl = `webcal://${baseUrl}/api/calendar/feed/${profile.id}?token=${profile.calendar_token}`;
    
    // Redirecting to webcal:// opens Apple Calendar automatically
    window.location.href = webcalUrl;
  };

  return (
    <div className="flex flex-col">
      <Header title="Perfil" subtitle="Configuración de cuenta" />

      <div className="px-4 py-6 space-y-4">
        {/* User Info */}
        <Card padding="lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center">
              <User className="w-6 h-6 text-text-on-accent" />
            </div>
            <div>
              <p className="text-base font-bold text-text-primary">
                {profile ? "Usuario" : "Usuario Demo"}
              </p>
              <p className="text-xs text-text-muted">
                {profile?.email || "Cargando..."}
              </p>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <div className="space-y-2">
          <SettingsItem
            icon={<Calendar className="w-5 h-5" />}
            label="Google Calendar"
            description="Configuración de cuenta principal"
            status="connected"
          />
          
          {/* Apple Calendar Sync Button */}
          <button
            onClick={handleAppleSync}
            disabled={!profile?.calendar_token}
            className="w-full text-left"
          >
            <SettingsItem
              icon={<Apple className="w-5 h-5" />}
              label="Sincronizar con Apple Calendar"
              description="Suscríbete en tu iPhone o Mac"
              className="hover:border-accent/40 transition-colors cursor-pointer"
            />
          </button>

          <SettingsItem
            icon={<Bell className="w-5 h-5" />}
            label="Notificaciones"
            description="7, 5, 3 y 0 días antes"
            status="active"
          />
          <SettingsItem
            icon={<Shield className="w-5 h-5" />}
            label="Privacidad"
            description="Datos encriptados con SSL"
          />
          <SettingsItem
            icon={<Moon className="w-5 h-5" />}
            label="Tema Oscuro"
            description="Activado por defecto"
            status="active"
          />
        </div>

        {/* Logout */}
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          onClick={handleLogout}
          icon={<LogOut className="w-4 h-4" />}
        >
          Cerrar Sesión
        </Button>

        {/* Version */}
        <p className="text-center text-[10px] text-text-muted pt-4 pb-24">
          Assisten Calendar v1.0.0 — Powered by Next.js + Supabase
        </p>
      </div>
    </div>
  );
}

function SettingsItem({
  icon,
  label,
  description,
  status,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  status?: "connected" | "active";
  className?: string;
}) {
  return (
    <Card hoverable padding="md" className={className}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center text-accent shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
        {status && (
          <span
            className={`w-2 h-2 rounded-full ${
              status === "connected" ? "bg-status-active" : "bg-accent"
            }`}
          />
        )}
      </div>
    </Card>
  );
}
