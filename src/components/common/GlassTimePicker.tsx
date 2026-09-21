import React, { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";

export interface GlassTimePickerProps {
  value: string; // "HH:mm"
  onChange: (val: string) => void;
  label?: string;
  minHour?: number; // default 6
  maxHour?: number; // default 21
  minuteStep?: number; // default 15
  className?: string;
  variant?: "cyan" | "amber" | "teal";
  disabled?: boolean;
  quickPresets?: string[];
}

export const GlassTimePicker: React.FC<GlassTimePickerProps> = ({
  value = "08:00",
  onChange,
  label,
  minHour = 6,
  maxHour = 21,
  minuteStep = 15,
  className = "",
  variant = "cyan",
  disabled = false,
  quickPresets,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentHStr, currentMStr] = (value || "08:00").split(":");
  const currentHour = parseInt(currentHStr || "8", 10);
  const currentMinute = parseInt(currentMStr || "0", 10);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Generate hours list
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  // Generate minutes list
  const minutes = Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) => i * minuteStep);

  const handleSelectHour = (h: number) => {
    const newH = String(h).padStart(2, "0");
    const newM = String(isNaN(currentMinute) ? 0 : currentMinute).padStart(2, "0");
    onChange(`${newH}:${newM}`);
  };

  const handleSelectMinute = (m: number) => {
    const newH = String(isNaN(currentHour) ? 8 : currentHour).padStart(2, "0");
    const newM = String(m).padStart(2, "0");
    onChange(`${newH}:${newM}`);
  };

  const handleSelectPreset = (preset: string) => {
    onChange(preset);
    setIsOpen(false);
  };

  // Theme styling based on variant
  const variantStyles = {
    cyan: {
      btnHover: "hover:border-cyan-500/60 focus:border-cyan-500",
      activeItem: "bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20",
      badge: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
      iconColor: "text-cyan-500",
      borderActive: "border-cyan-500/50",
    },
    amber: {
      btnHover: "hover:border-amber-500/60 focus:border-amber-500",
      activeItem: "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20",
      badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
      iconColor: "text-amber-500",
      borderActive: "border-amber-500/50",
    },
    teal: {
      btnHover: "hover:border-teal-500/60 focus:border-teal-500",
      activeItem: "bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black shadow-md shadow-teal-500/20",
      badge: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
      iconColor: "text-teal-500",
      borderActive: "border-teal-500/50",
    },
  }[variant];

  const displayTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${isOpen ? "z-[80]" : "z-10"}`}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/15 ${variantStyles.btnHover} rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 shadow-xs backdrop-blur-xl transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? `ring-2 ring-cyan-500/30 dark:ring-cyan-400/30 ${variantStyles.borderActive}` : ""
        } ${className}`}
        title={`Seleccionar hora (actual: ${displayTime})`}
      >
        <div className="flex items-center gap-1.5">
          <Clock size={13} className={`shrink-0 ${variantStyles.iconColor} transition-transform group-hover:scale-110`} />
          <span>{displayTime}</span>
        </div>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-500" : "group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
        />
      </button>

      {/* POPUP DROPDOWN PICKER */}
      {isOpen && (
        <div
          className="absolute left-0 sm:left-auto mt-2 min-w-[220px] w-max p-3 rounded-2xl bg-white/95 dark:bg-slate-900/98 border border-slate-200/90 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl z-[9999] animate-scaleIn space-y-2.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Clock size={12} className={variantStyles.iconColor} />
              {label || "Seleccionar Hora"}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-extrabold ${variantStyles.badge}`}>
              {displayTime}
            </span>
          </div>

          {/* Quick Presets Chips */}
          {quickPresets && quickPresets.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pb-1">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    preset === displayTime
                      ? variantStyles.activeItem
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-300"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {/* Dual Columns: Horas & Minutos */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Hours column */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Hora
              </span>
              <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                {hours.map((h) => {
                  const isSelected = h === currentHour;
                  const hFormatted = String(h).padStart(2, "0");
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`w-full py-1 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center flex items-center justify-between ${
                        isSelected
                          ? variantStyles.activeItem
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      <span className="mx-auto">{hFormatted}</span>
                      {isSelected && <Check size={11} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes column */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Minuto
              </span>
              <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                {minutes.map((m) => {
                  const isSelected = m === currentMinute;
                  const mFormatted = String(m).padStart(2, "0");
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`w-full py-1 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center flex items-center justify-between ${
                        isSelected
                          ? variantStyles.activeItem
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                      }`}
                    >
                      <span className="mx-auto">{mFormatted}</span>
                      {isSelected && <Check size={11} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick confirmation / Done button */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Formato 24 Horas
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold transition-all cursor-pointer"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};