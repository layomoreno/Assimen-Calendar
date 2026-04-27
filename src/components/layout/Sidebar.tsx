"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  ListTodo,
  Clock,
  BarChart3,
  User,
  Settings,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/upload", label: "Tareas", icon: ListTodo },
  { href: "/history", label: "Historial", icon: Clock },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/profile", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Usuario");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
        setUserName(name);
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      }
    }
    loadUser();
  }, []);

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-40 hidden md:flex flex-col w-[220px] bg-[#0B0B1A] border-r border-[#1A1A35]/80">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6">
        <h2 className="text-lg font-black text-white tracking-tight">
          Assisten<span className="text-text-muted">.</span>
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-[13px]
                ${
                  isActive
                    ? "bg-gradient-to-r from-[#6C3AED]/90 to-[#7C3AED]/70 text-white font-semibold shadow-lg shadow-purple-500/20"
                    : "text-[#7878A0] hover:bg-[#12122A] hover:text-[#B0B0D0]"
                }
              `}
            >
              <Icon
                className={`w-[18px] h-[18px] ${isActive ? "text-white" : ""}`}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile at Bottom */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#0E0E22] border border-[#1A1A35]/60">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[10px] text-[#6060A0] truncate">Admin</p>
          </div>
        </div>

        {/* Issues / Notifications indicator */}
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#6060A0]">
          <div className="w-5 h-5 rounded bg-[#12122A] flex items-center justify-center text-[10px] font-bold text-white">N</div>
          <span>1 Issue</span>
          <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>
    </aside>
  );
}
