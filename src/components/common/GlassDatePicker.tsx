import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

export interface GlassDatePickerProps {
  value?: string; // "YYYY-MM-DD"
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  className?: string;
  variant?: "cyan" | "teal" | "blue" | "form";
  disabled?: boolean;
  required?: boolean;
  yearRange?: { start?: number; end?: number };
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export const GlassDatePicker: React.FC<GlassDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "dd/mm/aaaa",
  minDate,
  maxDate,
  className = "",
  variant = "form",
  disabled = false,
  required = false,
  yearRange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const currentYear = new Date().getFullYear();
  const startYear = yearRange?.start ?? 1920;
  const endYear = yearRange?.end ?? currentYear + 5;

  const yearsList = React.useMemo(() => {
    const list: number[] = [];
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [startYear, endYear]);

  const initialDate = value ? new Date(value + "T12:00:00") : new Date();
  const [viewYear, setViewYear] = useState(isNaN(initialDate.getFullYear()) ? currentYear : initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth());

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownEstimatedHeight = 350;
    const dropdownEstimatedWidth = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownEstimatedHeight && rect.top > dropdownEstimatedHeight;

    let left = rect.left;
    if (left + dropdownEstimatedWidth > window.innerWidth - 16) {
      left = window.innerWidth - dropdownEstimatedWidth - 16;
    }
    if (left < 16) left = 16;

    setCoords({
      top: openUpward ? Math.max(8, rect.top - dropdownEstimatedHeight - 8) : rect.bottom + 8,
      left,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updateCoords();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T12:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const mIdx = parseInt(m, 10) - 1;
      const mName = MONTH_NAMES[mIdx] || m;
      return `${parseInt(d, 10)} de ${mName}, ${y}`;
    }
    return dateStr;
  };

  const isDateDisabled = (year: number, month: number, day: number) => {
    const formatted = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (minDate && formatted < minDate) return true;
    if (maxDate && formatted > maxDate) return true;
    return false;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(todayStr);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const triggerBaseStyle =
    variant === "form"
      ? "w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500/50 dark:hover:border-teal-400/50 rounded-xl text-sm transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
      : "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left text-xs sm:text-sm transition-all backdrop-blur-xl shadow-xs cursor-pointer select-none";

  const triggerActiveStyle =
    isOpen
      ? "border-teal-500 ring-2 ring-teal-500/20 bg-white dark:bg-slate-800"
      : "";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updateCoords();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`${triggerBaseStyle} ${triggerActiveStyle} ${
          value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Calendar
            size={16}
            className={`shrink-0 transition-colors ${
              isOpen
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-400 dark:text-slate-400"
            }`}
          />
          <span className="truncate font-normal text-sm">
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Borrar fecha"
            >
              <X size={14} />
            </span>
          )}
        </div>
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: "300px",
              zIndex: 999999,
            }}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/98 dark:bg-slate-900/98 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl p-4 text-slate-900 dark:text-white animate-scaleIn select-none"
          >
            {/* Header with Month and Year Selectors */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none border border-transparent focus:border-teal-500 cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none border border-transparent focus:border-teal-500 cursor-pointer"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Days of the week */}
            <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 pt-1 text-xs">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-7" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const isSelected = value === formatted;
                const isToday = todayStr === formatted;
                const disabledDate = isDateDisabled(viewYear, viewMonth, dayNum);

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    disabled={disabledDate}
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center font-medium text-xs transition-all ${
                      disabledDate
                        ? "opacity-25 cursor-not-allowed text-slate-400 line-through"
                        : isSelected
                        ? "bg-teal-600 text-white shadow-md font-bold scale-105"
                        : isToday
                        ? "border border-teal-500/70 text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-500/10"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Hoy
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="font-medium text-rose-500 hover:underline cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
