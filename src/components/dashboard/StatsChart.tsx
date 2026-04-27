"use client";

import React, { useRef, useEffect, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

interface StatsChartProps {
  completed: number;
  inProgress: number;
  overdue: number;
}

export function StatsChart({ completed, inProgress, overdue }: StatsChartProps) {
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<any>(null);

  const total = completed + inProgress + overdue;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.canvas.getContext("2d");
    if (!ctx) return;

    const gradientGreen = ctx.createLinearGradient(0, 0, 0, 200);
    gradientGreen.addColorStop(0, "#22D3EE");
    gradientGreen.addColorStop(1, "#3B82F6");

    const gradientBlue = ctx.createLinearGradient(0, 0, 0, 200);
    gradientBlue.addColorStop(0, "#818CF8");
    gradientBlue.addColorStop(1, "#C084FC");

    const gradientRed = ctx.createLinearGradient(0, 0, 0, 200);
    gradientRed.addColorStop(0, "#F472B6");
    gradientRed.addColorStop(1, "#E11D48");

    setChartData({
      labels: ["Cumplidas", "En Proceso", "Vencidas"],
      datasets: [{
        data: [completed, inProgress, overdue],
        backgroundColor: [gradientGreen, gradientBlue, gradientRed],
        borderColor: "transparent",
        borderWidth: 0,
        cutout: "78%",
        borderRadius: 16,
        spacing: 3,
        hoverOffset: 4,
      }],
    });
  }, [completed, inProgress, overdue]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(11, 11, 26, 0.95)",
        titleColor: "#FFFFFF",
        bodyColor: "#A0A0A0",
        borderColor: "rgba(130, 140, 248, 0.2)",
        borderWidth: 1,
        cornerRadius: 10,
        padding: 10,
      },
    },
  };

  return (
    <div className="bg-[#0D0D1A]/80 border border-[#1E1E42]/50 rounded-2xl p-5 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Canales de actividad</h3>
        <p className="text-[10px] text-[#5C5C8A]">Distribución</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative w-[110px] h-[110px] shrink-0" style={{ filter: "drop-shadow(0 0 12px rgba(130, 140, 248, 0.4))" }}>
          {chartData ? (
            <div className="w-full h-full animate-[spin_40s_linear_infinite]">
              <Doughnut ref={chartRef} data={chartData} options={doughnutOptions} />
            </div>
          ) : (
            <div className="w-full h-full rounded-full border-4 border-[#1E1E42] animate-pulse" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-[#5C5C8A] mb-0.5">Total</span>
            <span className="text-xl font-bold text-white leading-none">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          <LegendItem color="#22D3EE" label="Cumplidas" percentage={completionRate} />
          <LegendItem color="#A78BFA" label="En Proceso" percentage={total > 0 ? Math.round((inProgress / total) * 100) : 0} />
          <LegendItem color="#F472B6" label="Vencidas" percentage={total > 0 ? Math.round((overdue / total) * 100) : 0} />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, percentage }: { color: string; label: string; percentage: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
        <span className="text-[11px] text-[#9898C8]">{label}</span>
      </div>
      <span className="text-[11px] font-medium text-[#5C5C8A]">{percentage}%</span>
    </div>
  );
}

/* ─── LINE CHART: Rendimiento General ─── */
export function WeeklyChart() {
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("Últimos 7 días");

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.canvas.getContext("2d");
    if (!ctx) return;

    // Glowing Gradient for Line
    const gradientLine = ctx.createLinearGradient(0, 0, 400, 0);
    gradientLine.addColorStop(0, "#8B5CF6"); // Purple
    gradientLine.addColorStop(0.5, "#6366F1"); // Indigo
    gradientLine.addColorStop(1, "#3B82F6"); // Blue

    // Soft Gradient for Area
    const gradientArea = ctx.createLinearGradient(0, 0, 0, 200);
    gradientArea.addColorStop(0, "rgba(99, 102, 241, 0.4)");
    gradientArea.addColorStop(1, "rgba(17, 17, 37, 0)");

    // Simulate different data for different ranges
    const dataPoints = timeRange === "Últimos 30 días" ? [4, 6, 5, 8, 7, 10, 12] : 
                       timeRange === "Este año" ? [10, 15, 12, 18, 14, 20, 25] : 
                       [2, 4, 3, 5, 4, 7, 9];
    const lastValue = dataPoints[dataPoints.length - 1];

    setChartData({
      labels: ["SÁB", "DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE"],
      datasets: [{
        label: "Rendimiento",
        data: dataPoints, 
        fill: true,
        backgroundColor: gradientArea,
        borderColor: gradientLine,
        borderWidth: 2.5,
        tension: 0.4, // Smooth waves
        pointRadius: [0, 0, 0, 0, 0, 0, 5], // Only show last point
        pointBackgroundColor: "#34D399", // Emerald green point like in some variations, or pure blue
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        lastValue // Attach for the custom tooltip
      }],
    });
  }, [timeRange]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }, // We use custom HTML overlay for the tooltip
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#5C5C8A", font: { size: 9 }, padding: 10 },
        border: { display: false },
      },
      y: {
        grid: { color: "rgba(30, 30, 66, 0.3)" },
        ticks: { 
          color: "#9898C8", 
          font: { size: 10 }, 
          maxTicksLimit: 3,
          callback: function(value: any) {
            return value; 
          }
        },
        border: { display: false },
        min: 0,
        suggestedMax: timeRange === "Este año" ? 30 : 12,
      },
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-[#0D0D1A]/60 border border-[#1E1E42]/50 rounded-2xl p-5 backdrop-blur-md relative overflow-visible group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl" />
      
      <div className="flex items-center justify-between mb-2 relative z-20">
        <div className="relative">
          <h3 className="text-sm font-bold text-white">Rendimiento general</h3>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-[10px] text-[#5C5C8A] hover:text-[#9898C8] transition-colors flex items-center gap-1 mt-0.5 outline-none"
          >
            {timeRange}
            <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-32 bg-[#0E0E22] border border-[#2A2A4A] rounded-xl shadow-2xl py-1 z-50">
              {["Últimos 7 días", "Últimos 30 días", "Este año"].map(r => (
                <button 
                  key={r} 
                  onClick={() => { setTimeRange(r); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[10px] transition-colors ${timeRange === r ? "bg-[#1A1A3E] text-white font-bold" : "text-[#9898C8] hover:bg-[#1A1A3E] hover:text-white"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="h-[170px] w-full relative z-10" style={{ filter: "drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3))" }}>
        {chartData && <Line ref={chartRef} data={chartData} options={lineOptions} />}
        
        {/* Absolute positioned tooltip exactly on the top right */}
        <motion.div 
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
          className="absolute right-[5px] top-[15px] flex flex-col items-center pointer-events-none"
        >
          <div className="bg-white text-[#07070F] text-xs font-black px-2 py-1 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {chartData?.datasets[0].lastValue || 9}
          </div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white -mt-[1px]"></div>
        </motion.div>
      </div>
    </motion.div>
  );
}
