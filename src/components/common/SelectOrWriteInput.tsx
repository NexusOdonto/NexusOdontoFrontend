import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

export interface SelectOption {
  id?: string;
  label: string;
  subLabel?: string;
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
}

export function SelectOrWriteInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Escribe o selecciona...",
  required = false,
  type: _type = "generic",
}: SelectOrWriteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar lista al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrado automático en tiempo real según lo que escribe el usuario
  const filteredOptions = useMemo(() => {
    if (!value || !value.trim()) return options;
    const term = value.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(term))
    );
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
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Input de selección o escritura libre */}
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-16 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm"
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

      {/* Menú de opciones sugeridas */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden max-h-56 overflow-y-auto p-1 space-y-0.5 animate-fadeIn">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = Boolean(value && value.trim()) && opt.label.trim().toLowerCase() === value.trim().toLowerCase();
              return (
                <div
                  key={opt.id || idx}
                  onClick={() => handleSelect(opt)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="truncate">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{opt.label}</p>
                      {opt.subLabel && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {opt.subLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-teal-600 dark:text-teal-400 flex-shrink-0 ml-2" />}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>Opción personalizada: </span>
              <strong className="text-slate-800 dark:text-slate-200">"{value}"</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
