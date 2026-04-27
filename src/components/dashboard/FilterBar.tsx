"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { X } from "lucide-react";

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  category: string | null;
  status: string | null;
  priority: string | null;
  course: string | null;
}

const categories = [
  { value: "academica", label: "Académica" },
  { value: "personal", label: "Personal" },
];

const statuses = [
  { value: "en_proceso", label: "En Proceso" },
  { value: "cumplida", label: "Cumplida" },
  { value: "vencida", label: "Vencida" },
];

const priorities = [
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "normal", label: "Normal" },
  { value: "baja", label: "Baja" },
];

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    status: null,
    priority: null,
    course: null,
  });

  const updateFilter = (key: keyof FilterState, value: string | null) => {
    const newFilters = {
      ...filters,
      [key]: filters[key] === value ? null : value,
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  const clearFilters = () => {
    const cleared: FilterState = {
      category: null,
      status: null,
      priority: null,
      course: null,
    };
    setFilters(cleared);
    onFilterChange?.(cleared);
  };

  return (
    <div className="px-4 py-3 space-y-3 border-b border-border animate-fade-in">
      {/* Category */}
      <div>
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
          Categoría
        </span>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => updateFilter("category", cat.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                filters.category === cat.value
                  ? "bg-accent/15 text-accent border-accent/30"
                  : "bg-bg-card text-text-secondary border-border hover:border-border-light"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
          Estado
        </span>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => updateFilter("status", s.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                filters.status === s.value
                  ? "bg-accent/15 text-accent border-accent/30"
                  : "bg-bg-card text-text-secondary border-border hover:border-border-light"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
          Prioridad
        </span>
        <div className="flex gap-2">
          {priorities.map((p) => (
            <button
              key={p.value}
              onClick={() => updateFilter("priority", p.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
                filters.priority === p.value
                  ? "bg-accent/15 text-accent border-accent/30"
                  : "bg-bg-card text-text-secondary border-border hover:border-border-light"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
        >
          <X className="w-3 h-3" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
