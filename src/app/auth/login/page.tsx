"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Sparkles, Shield, Calendar, Brain } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          scopes: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) console.error("Google login error:", error);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo,
          scopes: "offline_access Calendars.ReadWrite",
        },
      });
      if (error) console.error("Microsoft login error:", error);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="orb w-[500px] h-[500px] bg-indigo-500/12 top-[-150px] right-[-100px] animate-orbit" />
      <div className="orb w-[400px] h-[400px] bg-cyan-500/8 bottom-[-100px] left-[-80px]" />
      <div className="orb w-[250px] h-[250px] bg-emerald-500/6 top-[50%] left-[20%]" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 -m-3 rounded-3xl bg-indigo-500/15 blur-xl animate-breathe" />
            <Image
              src="/logo.png"
              alt="Assisten Calendar"
              width={80}
              height={80}
              className="relative rounded-2xl shadow-2xl shadow-indigo-500/30"
            />
          </div>
          <h1 className="text-2xl font-black text-gradient-hero mb-1">
            Assisten Calendar
          </h1>
          <p className="text-sm text-text-muted">
            Tu asistente académico con IA
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass rounded-3xl p-6 gradient-border space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-lg font-bold text-text-primary mb-1">Iniciar Sesión</h2>
            <p className="text-[11px] text-text-muted px-2">
              Conecta tu cuenta para sincronizar tu calendario
            </p>
          </div>

          <div className="space-y-3">
            {/* Google Button */}
            <Button
              variant="primary"
              className="w-full py-3.5 rounded-xl btn-gradient text-sm shadow-indigo-500/20"
              onClick={handleGoogleLogin}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.8" />
                  <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity="0.6" />
                  <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.4" />
                </svg>
              }
            >
              Continuar con Google
            </Button>

            {/* Microsoft Button */}
            <Button
              variant="ghost"
              className="w-full py-3.5 rounded-xl text-sm border-border hover:bg-white/5 hover:text-white"
              onClick={handleMicrosoftLogin}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 21 21">
                  <path fill="#fff" d="M0 0h10v10H0zm11 0h10v10H11zM0 11h10v10H0zm11 0h10v10H11z" />
                </svg>
              }
            >
              Continuar con Microsoft
            </Button>

            {/* Apple Button */}
            <Button
              variant="ghost"
              className="w-full py-3.5 rounded-xl text-sm border-border hover:bg-white/5 hover:text-white"
              onClick={async () => {
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                const redirectTo = `${window.location.origin}/auth/callback`;
                await supabase.auth.signInWithOAuth({
                  provider: "apple",
                  options: { redirectTo },
                });
              }}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 384 512">
                  <path fill="#fff" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
              }
            >
              Continuar con Apple
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 pt-3 mt-4 border-t border-border/50">
            {[
              { icon: Brain, label: "IA Gemini", color: "text-indigo-400" },
              { icon: Calendar, label: "Calendar", color: "text-cyan-400" },
              { icon: Shield, label: "Seguro", color: "text-emerald-400" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 py-2 rounded-xl bg-bg-elevated/50 border border-border/50">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-[10px] text-text-muted font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Services Status */}
        <div className="mt-5 glass rounded-2xl p-4 gradient-border">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-status-active animate-breathe" />
            <span className="text-xs text-status-active font-semibold">Servicios activos</span>
          </div>
          <div className="flex items-center gap-4 mt-2.5">
            {["Supabase", "Google API", "Gemini AI"].map((service) => (
              <span key={service} className="text-[10px] text-text-muted flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-accent2" />
                {service}
              </span>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <p className="text-center text-[10px] text-text-muted mt-5 leading-relaxed max-w-xs mx-auto">
          Al continuar, autorizas a Assisten Calendar a acceder a tu Google Calendar para crear y gestionar eventos académicos.
        </p>
      </div>
    </div>
  );
}
