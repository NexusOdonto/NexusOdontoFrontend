import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  icon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "glass" | "form";
  className?: string;
  dropdownClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  icon,
  fullWidth = false,
  variant = "glass",
  className = "",
  dropdownClassName = "",
  containerClassName = "",
  disabled = false,
  ariaLabel,
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 190,
  });

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownEstimatedHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownEstimatedHeight && rect.top > dropdownEstimatedHeight;

    const top = openUpward ? Math.max(8, rect.top - dropdownEstimatedHeight - 6) : rect.bottom + 6;
    const minWidth = Math.max(190, rect.width);
    let left = rect.left;

    if (left + minWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - minWidth - 12);
    }

    setCoords({
      top,
      left: Math.max(12, left),
      minWidth,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

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

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const baseStyle =
    variant === "form"
      ? "w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500/50 dark:hover:border-teal-400/50 rounded-xl text-sm text-slate-900 dark:text-white transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
      : "group flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white/90 dark:bg-slate-950/65 hover:bg-white dark:hover:bg-slate-950/90 border border-slate-200/90 dark:border-white/20 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white backdrop-blur-xl shadow-md transition-all cursor-pointer select-none active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed";

  const isOpenActiveStyle =
    variant === "form"
      ? isOpen
        ? "border-teal-500 ring-2 ring-teal-500/20 bg-white dark:bg-slate-800"
        : ""
      : "";

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? "w-full block" : "inline-block"} text-left ${containerClassName}`}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayText}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) {
            updateCoords();
          }
          setIsOpen((prev) => !prev);
        }}
        className={`${baseStyle} ${isOpenActiveStyle} ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <span
              className={`shrink-0 transition-colors ${
                isOpen
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-slate-400 dark:text-slate-400"
              }`}
            >
              {icon}
            </span>
          )}
          <span
            className={`truncate ${
              !selectedOption && variant === "form"
                ? "text-slate-400 dark:text-slate-500"
                : ""
            }`}
          >
            {displayText}
          </span>
        </div>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-200 ${
            variant === "form"
              ? isOpen
                ? "rotate-180 text-teal-600 dark:text-teal-400"
                : "text-slate-400"
              : isOpen
              ? "rotate-180 text-cyan-500"
              : "text-slate-400 group-hover:text-cyan-500"
          }`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              minWidth: `${coords.minWidth}px`,
            }}
            className={`w-max max-w-xs sm:max-w-md p-1.5 rounded-xl bg-white/95 dark:bg-slate-900/98 border border-slate-200 dark:border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl z-[999999] animate-scaleIn space-y-1 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 ${dropdownClassName}`}
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
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer text-left select-none ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                    {option.badge && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={15} className="text-teal-600 dark:text-teal-400 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
