import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Assisten Calendar | Gestión Académica Inteligente",
  description:
    "Organiza tus tareas académicas y personales con inteligencia artificial. Sincronización con Google Calendar y recordatorios automáticos.",
  keywords: ["calendario", "académico", "tareas", "IA", "productividad"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
