// components/ui/GlassDatePicker.tsx
"use client";

import { useState, useEffect, useRef } from "react";

export default function GlassDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseISO = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const [viewDate, setViewDate] = useState(() => {
    const base = value ? parseISO(value) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const monthLabel = viewDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const todayISO = toISO(new Date());

  const handleSelect = (day: number) => {
    onChange(toISO(new Date(year, month, day)));
    setOpen(false);
  };

  const displayLabel = value
    ? parseISO(value).toLocaleDateString("default", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "Select date";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none text-white hover:border-white/30 focus:border-white/40 transition"
      >
        <span>{displayLabel}</span>
        <span className="text-white/40">📅</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-2 left-0 w-64 bg-[#111111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              ←
            </button>
            <span className="text-xs font-bold text-white/90">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div
                key={i}
                className="text-center text-[9px] font-bold text-white/30 uppercase"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`}></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = toISO(new Date(year, month, day));
              const isSelected = value === iso;
              const isToday = todayISO === iso;
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleSelect(day)}
                  className={`aspect-square rounded-lg text-[10px] font-mono transition-all ${
                    isSelected
                      ? "bg-white text-black font-bold"
                      : isToday
                        ? "bg-white/20 text-white border border-white/30"
                        : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(todayISO);
              setOpen(false);
            }}
            className="w-full mt-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[10px] font-bold uppercase tracking-wider transition"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
