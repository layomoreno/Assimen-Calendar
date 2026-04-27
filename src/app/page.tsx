import Link from "next/link";
import Image from "next/image";
import { Sparkles, Calendar, Brain, Shield, ArrowRight, Zap, Clock, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Orbs */}
      <div className="orb w-[500px] h-[500px] bg-indigo-500/15 top-[-100px] left-[-100px] animate-orbit" />
      <div className="orb w-[400px] h-[400px] bg-cyan-500/10 bottom-[-50px] right-[-80px]" style={{ animationDelay: "-10s" }} />
      <div className="orb w-[300px] h-[300px] bg-emerald-500/8 top-[40%] left-[60%]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Assisten Calendar" width={44} height={44} className="rounded-xl shadow-lg shadow-indigo-500/20" />
          <span className="text-lg font-black text-gradient">Assisten Calendar</span>
        </div>
        <Link
          href="/auth/login"
          className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25"
        >
          <span>Comenzar</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-16 pb-20 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-accent/20 mb-8 animate-scale-in">
          <Sparkles className="w-4 h-4 text-accent2" />
          <span className="text-xs font-semibold text-accent">Potenciado con Gemini AI</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] mb-6 animate-slide-up">
          <span className="text-gradient-hero">Organiza tu vida</span>
          <br />
          <span className="text-text-primary">con inteligencia</span>
          <br />
          <span className="text-gradient-hero">artificial</span>
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Sube tus archivos académicos y deja que la IA extraiga tus tareas,
          las programe en tu calendario y te avise cuando se acercan las entregas.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Link
            href="/auth/login"
            className="btn-gradient px-8 py-3.5 rounded-2xl text-base font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/30"
          >
            <span>Empezar Gratis</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#features"
            className="px-6 py-3.5 rounded-2xl text-sm font-semibold text-text-secondary border border-border hover:border-accent/30 hover:text-accent transition-all duration-300"
          >
            Ver funcionalidades
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-14 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          {[
            { value: "IA", label: "Gemini 2.5", icon: Brain },
            { value: "24/7", label: "Recordatorios", icon: Clock },
            { value: "100%", label: "Sincronizado", icon: CheckCircle },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <stat.icon className="w-4 h-4 text-accent2" />
                <span className="text-xl font-black text-gradient">{stat.value}</span>
              </div>
              <span className="text-xs text-text-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl font-black text-center text-text-primary mb-12">
          Todo lo que necesitas, <span className="text-gradient">en un solo lugar</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Brain,
              title: "IA que entiende tus archivos",
              desc: "Sube PDFs, imágenes o textos y Gemini extrae automáticamente tareas, fechas y subtareas.",
              gradient: "from-indigo-500/20 to-purple-500/5",
              iconColor: "text-indigo-400",
            },
            {
              icon: Calendar,
              title: "Google Calendar integrado",
              desc: "Sincroniza automáticamente tus actividades con Google Calendar con detección anti-colisiones.",
              gradient: "from-cyan-500/20 to-blue-500/5",
              iconColor: "text-cyan-400",
            },
            {
              icon: Clock,
              title: "Sistema de recordatorios 4x",
              desc: "Alertas automáticas a los 7, 5, 3 y 0 días antes de cada entrega. Nunca más olvides una tarea.",
              gradient: "from-emerald-500/20 to-green-500/5",
              iconColor: "text-emerald-400",
            },
            {
              icon: Zap,
              title: "Reacciones en tiempo real",
              desc: "Cada tarea reacciona según cuánto falta para entregarla: emojis, colores y animaciones inteligentes.",
              gradient: "from-amber-500/20 to-yellow-500/5",
              iconColor: "text-amber-400",
            },
            {
              icon: Shield,
              title: "Bloques anti-colisión",
              desc: "Programa bloques de estudio de 2-3 horas que no se cruzan con tus eventos existentes.",
              gradient: "from-rose-500/20 to-pink-500/5",
              iconColor: "text-rose-400",
            },
            {
              icon: Sparkles,
              title: "Diseño Premium",
              desc: "Interfaz oscura con gradientes, glassmorphism y micro-animaciones para una experiencia premium.",
              gradient: "from-violet-500/20 to-fuchsia-500/5",
              iconColor: "text-violet-400",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`feature-card rounded-2xl p-6 bg-gradient-to-br ${feature.gradient}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-bg-elevated border border-border ${feature.iconColor}`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 px-6 pb-16 max-w-3xl mx-auto text-center">
        <div className="glass rounded-3xl p-10 gradient-border">
          <h2 className="text-2xl font-black text-text-primary mb-3">
            ¿Listo para organizarte?
          </h2>
          <p className="text-sm text-text-muted mb-6">
            Conecta tu cuenta de Google y empieza a automatizar tu agenda académica.
          </p>
          <Link
            href="/auth/login"
            className="btn-gradient inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold shadow-xl shadow-indigo-500/30"
          >
            <span>Comenzar Ahora</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-lg" />
            <span className="text-xs text-text-muted font-medium">Assisten Calendar © {new Date().getFullYear()}</span>
          </div>
          <span className="text-xs text-text-muted">Potenciado por Gemini AI</span>
        </div>
      </footer>
    </div>
  );
}
