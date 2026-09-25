import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, CheckCircle2, Search, Sparkles, X, UserCheck } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { type SelectOption } from "./SelectOrWriteInput";
import { filterDoctorsByService } from "../../utils/dentalSpecialtyMatching";
import { getSpecialtyDisplayLabel } from "../../utils/specialtyLabels";

interface ModernDoctorSelectProps {
  value: string; // Nombre o ID del odontólogo seleccionado
  onChange: (doctorName: string, doctorOption?: SelectOption) => void;
  doctors: SelectOption[];
  selectedServiceName?: string;
  allowNoPreference?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  optionalLabel?: string;
}

export function ModernDoctorSelect({
  value,
  onChange,
  doctors,
  selectedServiceName = "",
  allowNoPreference = false,
  label = "Odontólogo",
  placeholder = "Seleccionar odontólogo...",
  required = false,
  disabled = false,
  className = "",
  id,
  optionalLabel,
}: ModernDoctorSelectProps) {
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

  // Filtrado inteligente según el servicio seleccionado
  const matchResult = useMemo(() => {
    return filterDoctorsByService(doctors, selectedServiceName);
  }, [doctors, selectedServiceName]);

  const activeDoctorsPool = matchResult.filteredDoctors;

  // Opción actualmente seleccionada
  const selectedDoctor = useMemo(() => {
    if (!value || value.trim() === "") return null;
    const term = value.trim().toLowerCase();
    return (
      doctors.find(
        (d) =>
          d.label.trim().toLowerCase() === term ||
          (d.id && String(d.id).toLowerCase() === term)
      ) || null
    );
  }, [doctors, value]);

  const isNoPreference = !value || value.trim() === "";

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const top = openUpward ? Math.max(10, rect.top - dropdownHeight - 8) : rect.bottom + 6;
    const width = Math.max(rect.width, 300);
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

  // Búsqueda dentro de la lista filtrada
  const displayedDoctors = useMemo(() => {
    if (!search.trim()) return activeDoctorsPool;
    const term = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return activeDoctorsPool.filter((d) => {
      const labelNorm = d.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const subNorm = (d.subLabel || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return labelNorm.includes(term) || subNorm.includes(term);
    });
  }, [activeDoctorsPool, search]);

  const handleSelectDoctor = (doc: SelectOption) => {
    onChange(doc.label, doc);
    setIsOpen(false);
  };

  const handleSelectNoPreference = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {optionalLabel && (
            <span className="text-[11px] font-normal text-teal-600 dark:text-teal-400">
              {optionalLabel}
            </span>
          )}
        </div>
      )}

      {/* Botón Gatillo Moderno con Avatar y Área */}
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
          {isNoPreference && allowNoPreference ? (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-teal-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
            </div>
          ) : selectedDoctor ? (
            <div className="h-9 w-9 rounded-xl overflow-hidden border border-teal-500/30 flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-900 shadow-xs">
              <UserAvatar
                avatar={(selectedDoctor.data as any)?.avatar || selectedDoctor.avatar}
                name={selectedDoctor.label}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-slate-400" />
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
              {isNoPreference && allowNoPreference
                ? "✨ Sin preferencia (Cualquier odontólogo disponible)"
                : selectedDoctor
                ? selectedDoctor.label
                : placeholder}
            </span>
            {selectedDoctor && selectedDoctor.subLabel ? (
              <span className="text-[10.5px] text-teal-600 dark:text-teal-400 font-medium truncate mt-0.5">
                {selectedDoctor.subLabel.replace("Especialidad: ", "")}
              </span>
            ) : isNoPreference && allowNoPreference ? (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                El equipo clínico te asignará el especialista disponible
              </span>
            ) : null}
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
            {/* Cabecera Estilo Odontograma: SELECCIONAR ODONTÓLOGO */}
            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span>
                {matchResult.isFiltered
                  ? `SELECCIONAR ODONTÓLOGO • ${matchResult.specialtyName.toUpperCase()}`
                  : "SELECCIONAR ODONTÓLOGO"}
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-[9.5px]">
                {activeDoctorsPool.length}
              </span>
            </div>

            {/* Buscador Integrado */}
            {activeDoctorsPool.length > 3 && (
              <div className="relative px-1">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar odontólogo o especialidad..."
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
              {/* Opción Sin Preferencia (para pacientes) */}
              {allowNoPreference && (
                <button
                  type="button"
                  role="option"
                  aria-selected={isNoPreference}
                  onClick={handleSelectNoPreference}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left select-none ${
                    isNoPreference
                      ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        ✨ Sin preferencia
                      </span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">
                        Cualquier odontólogo especialista disponible
                      </span>
                    </div>
                  </div>
                  {isNoPreference && (
                    <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0 ml-1.5" />
                  )}
                </button>
              )}

              {/* Lista de Odontólogos */}
              {displayedDoctors.length > 0 ? (
                displayedDoctors.map((doc) => {
                  const isSelected = Boolean(
                    !isNoPreference &&
                    selectedDoctor &&
                    (doc.label.trim().toLowerCase() === selectedDoctor.label.trim().toLowerCase() ||
                      (doc.id && selectedDoctor.id && doc.id === selectedDoctor.id))
                  );

                  const specClean = getSpecialtyDisplayLabel(
                    (doc.subLabel || (doc.data as any)?.specialty || "Odontología General")
                      .replace("Especialidad: ", "")
                  );

                  return (
                    <button
                      key={doc.id || doc.label}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectDoctor(doc)}
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left select-none ${
                        isSelected
                          ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Avatar con UserAvatar en contenedor estilizado */}
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl overflow-hidden border border-teal-500/30 flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-900 shadow-xs">
                          <UserAvatar
                            avatar={(doc.data as any)?.avatar || doc.avatar}
                            name={doc.label}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                            {doc.label}
                          </span>
                          <span className="text-[10px] sm:text-[10.5px] text-teal-600 dark:text-teal-400 font-medium truncate mt-0.5">
                            {specClean}
                          </span>
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
                  No hay odontólogos disponibles con "{search}"
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
