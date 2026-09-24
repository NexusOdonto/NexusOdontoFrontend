import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  CheckCircle2,
  Search,
  Sparkles,
  Stethoscope,
  Smile,
  ShieldCheck,
  Activity,
  Clock,
  Scissors,
  Baby,
  X,
} from "lucide-react";
import { areGuidsEqual } from "../../utils/roleUtils";

export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes?: number;
  price?: number;
  category?: string;
  description?: string;
}

interface ModernServiceSelectProps {
  value: string; // Puede ser id o name
  onChange: (serviceId: string, serviceName: string, service?: ServiceItem) => void;
  services: ServiceItem[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function getServiceIcon(name: string) {
  const norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("ortodoncia") || norm.includes("bracket") || norm.includes("alineador")) {
    return <Smile className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
  }
  if (norm.includes("blanqueamiento") || norm.includes("estetica") || norm.includes("estética")) {
    return <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
  }
  if (norm.includes("cirugia") || norm.includes("extraccion") || norm.includes("cordal") || norm.includes("implante")) {
    return <Scissors className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
  }
  if (norm.includes("endodoncia") || norm.includes("conducto") || norm.includes("apicectomia")) {
    return <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
  }
  if (norm.includes("periodoncia") || norm.includes("limpieza profunda") || norm.includes("injerto")) {
    return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  }
  if (norm.includes("pediatria") || norm.includes("infantil") || norm.includes("nino")) {
    return <Baby className="w-4 h-4 text-pink-500 dark:text-pink-400" />;
  }
  return <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
}

export function ModernServiceSelect({
  value,
  onChange,
  services,
  label = "Servicio o Tratamiento",
  placeholder = "Selecciona un servicio...",
  required = false,
  disabled = false,
  className = "",
  id,
}: ModernServiceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  const selectedService = useMemo(() => {
    if (!value) return null;
    return (
      services.find(
        (s) =>
          areGuidsEqual(s.id, value) ||
          s.name.toLowerCase().trim() === value.toLowerCase().trim()
      ) || null
    );
  }, [services, value]);

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 320;
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

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      return;
    }

    updateCoords();

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

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

  const filteredServices = useMemo(() => {
    if (!search.trim()) return services;
    const term = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return services.filter((s) => {
      const sNorm = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const descNorm = (s.description || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return sNorm.includes(term) || descNorm.includes(term);
    });
  }, [services, search]);

  const handleSelect = (service: ServiceItem) => {
    onChange(service.id, service.name, service);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Botón Gatillo Moderno */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) updateCoords();
          setIsOpen((prev) => !prev);
        }}
        className={`w-full group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border ${
          isOpen
            ? "border-teal-500 ring-2 ring-teal-500/20 bg-white dark:bg-slate-900"
            : "border-slate-300 dark:border-slate-700 hover:border-teal-500/50 dark:hover:border-teal-400/50"
        } text-left transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl bg-teal-500/10 dark:bg-teal-400/15 flex items-center justify-center shrink-0 border border-teal-500/30">
            {selectedService ? getServiceIcon(selectedService.name) : <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span
              className={`font-bold truncate text-xs sm:text-sm ${
                selectedService
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {selectedService ? selectedService.name : placeholder}
            </span>
            {selectedService && selectedService.durationMinutes && (
              <span className="text-[10.5px] text-teal-600 dark:text-teal-400 font-medium truncate mt-0.5 flex items-center gap-1">
                <Clock size={11} /> {selectedService.durationMinutes} min
                {selectedService.price ? ` • $${selectedService.price.toLocaleString("es-CO")}` : ""}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`text-slate-400 group-hover:text-teal-500 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? "rotate-180 text-teal-600 dark:text-teal-400" : ""
          }`}
        />
      </button>

      {/* Menú Desplegable Portal */}
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
            className="p-2 rounded-2xl bg-white/95 dark:bg-slate-900/98 border border-slate-200/90 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl z-[999999] animate-scaleIn space-y-1.5 max-h-88 flex flex-col"
          >
            {/* Cabecera Estilo Odontograma: SELECCIONAR SERVICIO O TRATAMIENTO */}
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span>SELECCIONAR SERVICIO O TRATAMIENTO</span>
              <span className="px-1.5 py-0.2 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-[9.5px]">
                {filteredServices.length}
              </span>
            </div>

            {/* Buscador Integrado */}
            {services.length > 4 && (
              <div className="relative px-1">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tratamiento o servicio..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Lista de Opciones */}
            <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 flex-1">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => {
                  const isSelected = Boolean(
                    selectedService &&
                    (areGuidsEqual(service.id, selectedService.id) ||
                      service.name.toLowerCase().trim() === selectedService.name.toLowerCase().trim())
                  );

                  return (
                    <button
                      key={service.id || service.name}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(service)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left select-none ${
                        isSelected
                          ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                            isSelected
                              ? "bg-teal-500 text-white border-teal-500"
                              : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-teal-500/20"
                          }`}
                        >
                          {getServiceIcon(service.name)}
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                            {service.name}
                          </span>
                          {service.durationMinutes && (
                            <span className="text-[10px] sm:text-[10.5px] text-teal-600 dark:text-teal-400 font-medium truncate mt-0.5">
                              ⏱️ {service.durationMinutes} min
                              {service.price ? ` • $${service.price.toLocaleString("es-CO")}` : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No se encontraron servicios con "{search}"
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
