import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface GlassSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
  dropdownClassName = "",
  disabled = false,
  ariaLabel,
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${isOpen ? "z-[60]" : "z-10"}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayText}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white/90 dark:bg-slate-950/65 hover:bg-white dark:hover:bg-slate-950/90 border border-slate-200/90 dark:border-white/20 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white backdrop-blur-xl shadow-md transition-all cursor-pointer select-none active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          size={15}
          className={`text-slate-400 group-hover:text-cyan-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-cyan-500" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 sm:right-auto mt-2 min-w-[190px] w-max max-w-xs p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/98 border border-slate-200/90 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl z-[9999] animate-scaleIn space-y-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 ${dropdownClassName}`}
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left select-none ${
                  isSelected
                    ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && (
                  <Check size={14} className="text-cyan-500 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
