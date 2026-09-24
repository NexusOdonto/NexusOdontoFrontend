import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X, User, Stethoscope } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

export interface SelectOption {
  id?: string;
  label: string;
  subLabel?: string;
  avatar?: string | null;
  specialty?: string;
  data?: any;
}

interface SelectOrWriteInputProps {
  label: string;
  value: string;
  onChange: (value: string, selectedOption?: SelectOption) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  type?: "paciente" | "doctor" | "generic";
  disabled?: boolean;
  className?: string;
}

export function SelectOrWriteInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Escribe o selecciona...",
  required = false,
  type = "generic",
  disabled = false,
  className = "",
}: SelectOrWriteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const top = openUpward ? Math.max(10, rect.top - dropdownHeight - 8) : rect.bottom + 6;
    const width = Math.max(rect.width, 280);
    let left = rect.left;

    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }

    setCoords({
      top,
      left: Math.max(12, left),
      width,
    });
  };

  // Cerrar lista al hacer click fuera y manejar resize/scroll
  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleScrollOrResize = () => {
      updateCoords();
    };

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filtrado automático en tiempo real según lo que escribe el usuario
  const filteredOptions = useMemo(() => {
    if (!value || !value.trim()) return options;
    const term = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return options.filter((opt) => {
      const labelNorm = opt.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const subNorm = (opt.subLabel || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return labelNorm.includes(term) || subNorm.includes(term);
    });
  }, [options, value]);

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.label, opt);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(true);
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Input de selección o escritura libre */}
      <div className="relative">
        <input
          type="text"
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) updateCoords();
            setIsOpen(true);
          }}
          onFocus={() => {
            updateCoords();
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-16 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm disabled:opacity-50"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {Boolean(value && value.length > 0) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
              title="Limpiar campo"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isOpen) updateCoords();
              setIsOpen((prev) => !prev);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
            title="Ver opciones"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Menú Portal de Opciones Sugeridas */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl z-[999999] animate-scaleIn space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected =
                  Boolean(value && value.trim()) &&
                  opt.label.trim().toLowerCase() === value.trim().toLowerCase();

                return (
                  <button
                    key={opt.id || idx}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between gap-3 p-2 rounded-xl text-xs transition-colors cursor-pointer text-left select-none ${
                      isSelected
                        ? "bg-teal-500/15 text-teal-900 dark:text-teal-200 font-semibold border border-teal-500/30"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {type === "doctor" ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-white/10 shadow-xs">
                          <UserAvatar
                            avatar={(opt.data as any)?.avatar || opt.avatar}
                            name={opt.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : type === "paciente" ? (
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-400/15 border border-teal-500/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {opt.label}
                        </p>
                        {opt.subLabel && (
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {opt.subLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-teal-600 dark:text-teal-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                <span>Opción personalizada: </span>
                <strong className="text-slate-800 dark:text-slate-200">"{value}"</strong>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
