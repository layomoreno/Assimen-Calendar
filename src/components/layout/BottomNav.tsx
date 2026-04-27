"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  ListTodo,
  Clock,
  User,
  Plus,
} from "lucide-react";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "__voice__", label: "", icon: Plus }, // center placeholder for voice button
  { href: "/upload", label: "Tareas", icon: ListTodo },
  { href: "/profile", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B1A]/95 backdrop-blur-xl border-t border-[#1A1A35]/60 safe-area-bottom md:hidden">
        <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-2">
          {navItems.map((item) => {
            const isVoiceSlot = item.href === "__voice__";
            if (isVoiceSlot) {
              return <div key="voice-slot" className="w-14" />; // empty space for the floating button
            }

            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl
                  transition-all duration-200 min-w-[52px]
                  ${
                    isActive
                      ? "text-white"
                      : "text-[#5C5C8A] hover:text-[#9898C8]"
                  }
                `}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : ""}`}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? "text-white" : ""
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Global Voice Assistant Button */}
      <VoiceAssistant />
    </>
  );
}
