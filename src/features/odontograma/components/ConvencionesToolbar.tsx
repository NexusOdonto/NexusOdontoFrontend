import { useState, useRef, useEffect } from "react";
import type { Diagnosis } from "../types";
import { DIAGNOSIS_LEGEND } from "../types";
import {
  Sparkles,
  Activity,
  Download,
  Upload,
  RotateCcw,
  Flame,
  ShieldCheck,
  Shield,
  Zap,
  Crown,
  Link,
  Hexagon,
  XCircle,
  AlertTriangle,
  Move,
  Eraser,
  FileJson,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface ConvencionesToolbarProps {
  selectedDiagnosis: Diagnosis;
  onDiagnosisChange: (diagnosis: Diagnosis) => void;
  dentitionType: 'permanent' | 'temporary';
  onDentitionTypeChange: (type: 'permanent' | 'temporary') => void;
  onClear: () => void;
  onExport?: () => void;
  onExportJson?: () => void;
  onExportPdf?: () => void;
  onImport: () => void;
  isDarkMode: boolean;
  readOnly?: boolean;
  isExportingPdf?: boolean;
}

/**
 * Obtiene el ícono médico clínico para cada diagnóstico
 */
function getDiagnosisIcon(diagnosis: Diagnosis, size = 15) {
  switch (diagnosis) {
    case "caries":
      return <Flame size={size} className="text-red-500" />;
    case "restoration":
      return <ShieldCheck size={size} className="text-blue-500" />;
    case "sealant":
      return <Shield size={size} className="text-amber-500" />;
    case "endodontic":
      return <Zap size={size} className="text-purple-500" />;
    case "crown":
      return <Crown size={size} className="text-emerald-500" />;
    case "bridge":
      return <Link size={size} className="text-cyan-500" />;
    case "implant":
      return <Hexagon size={size} className="text-teal-500" />;
    case "extraction":
      return <XCircle size={size} className="text-rose-500" />;
    case "fracture":
      return <AlertTriangle size={size} className="text-orange-500" />;
    case "mobility":
      return <Move size={size} className="text-yellow-500" />;
    case "none":
    default:
      return <Eraser size={size} className="text-slate-400" />;
  }
}

export function ConvencionesToolbar({
  selectedDiagnosis = 'caries',
  onDiagnosisChange = () => {},
  dentitionType = 'permanent',
  onDentitionTypeChange = () => {},
  onClear = () => {},
  onExport,
  onExportJson,
  onExportPdf,
  onImport = () => {},
  isDarkMode: _isDarkMode,
  readOnly = false,
  isExportingPdf = false,
}: ConvencionesToolbarProps) {
  const safeLegend = DIAGNOSIS_LEGEND || [];
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExportJsonClick = () => {
    setShowExportMenu(false);
    if (onExportJson) {
      onExportJson();
    } else if (onExport) {
      onExport();
    }
  };

  const handleExportPdfClick = () => {
    setShowExportMenu(false);
    if (onExportPdf) {
      onExportPdf();
    }
  };

  const handleConfirmClear = () => {
    if (readOnly) return;
    if (
      window.confirm(
        "¿Estás seguro de que deseas limpiar todas las piezas del odontograma? Esta acción restablecerá el estado clínico dental."
      )
    ) {
      onClear();
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl p-4 sm:p-5 space-y-4 shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
      {/* 1. Selector de Tipo de Dentición Compacto y Elegante */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-600 dark:text-cyan-400" />
            Dentición
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
            {dentitionType === "permanent" ? "FDI Adulto (32)" : "FDI Infantil (20)"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => onDentitionTypeChange("permanent")}
            className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
              dentitionType === "permanent"
                ? "bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 text-white dark:text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.01]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Permanente
          </button>
          <button
            type="button"
            onClick={() => onDentitionTypeChange("temporary")}
            className={`py-1.5 px-2 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
              dentitionType === "temporary"
                ? "bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 text-white dark:text-slate-950 shadow-md shadow-cyan-500/25 scale-[1.01]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Temporal
          </button>
        </div>
      </div>

      {/* 2. Paleta de Diagnósticos con Iconografía Médica Ilustrada */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity size={13} className="text-teal-600 dark:text-teal-400" />
            {readOnly ? "Convenciones y Simbología" : "Diagnósticos"}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {readOnly ? "Guía de colores FDI" : "Toca una cara dental"}
          </span>
        </div>

        {/* Botón rápido de Borrador / Sano — solo si es editable */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => onDiagnosisChange("none")}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
              selectedDiagnosis === "none"
                ? "bg-slate-200 dark:bg-white/20 text-slate-900 dark:text-white ring-2 ring-slate-400 dark:ring-white border-transparent shadow-sm"
                : "bg-slate-100/60 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-900"
            }`}
            title="Seleccionar para limpiar o marcar pieza como sana"
          >
            <span className="flex items-center gap-2">
              <Eraser size={14} className="text-slate-500 dark:text-slate-300" />
              <span>Sano / Restaurar cara</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              Limpiar cara
            </span>
          </button>
        )}

        {/* Grilla de diagnósticos con micro-íconos médicos */}
        <div className="grid grid-cols-2 gap-2">
          {safeLegend.map(({ diagnosis, label, hex, glow, ring }) => {
            const isSelected = !readOnly && selectedDiagnosis === diagnosis;
            return (
              <div
                key={diagnosis}
                onClick={!readOnly ? () => onDiagnosisChange(diagnosis) : undefined}
                className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  readOnly
                    ? "bg-slate-50/70 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 cursor-default"
                    : isSelected
                    ? `bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-transparent ring-2 ${ring} ${glow} scale-[1.03] z-10 cursor-pointer`
                    : `bg-slate-50/70 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-slate-950/70 cursor-pointer`
                }`}
                title={readOnly ? label : `Seleccionar ${label} para aplicar en el odontograma`}
              >
                {/* Micro-Ícono Médico Ilustrado */}
                <div
                  className={`h-6 w-6 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                    isSelected
                      ? "scale-110 shadow-sm"
                      : "group-hover:scale-105"
                  }`}
                  style={{ backgroundColor: `${hex}20` }}
                >
                  {getDiagnosisIcon(diagnosis, 13)}
                </div>

                <span className="truncate text-[11px] sm:text-xs">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Acciones Inferiores */}
      <div className="pt-2 space-y-3 border-t border-slate-200/80 dark:border-white/10">
        {!readOnly ? (
          <>
            {/* Botón de advertencia: Limpiar Odontograma (Protegido) */}
            <button
              type="button"
              onClick={handleConfirmClear}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black transition-all cursor-pointer active:scale-95 group shadow-sm"
              title="Restablecer todas las piezas al estado sano"
            >
              <RotateCcw size={14} className="group-hover:-rotate-90 transition-transform duration-300" />
              <span>Limpiar Odontograma</span>
            </button>

            {/* Bloque de Gestión de Datos: Exportar e Importar */}
            <div className="grid grid-cols-2 gap-2">
              {/* Exportar con Dropdown (JSON y PDF) */}
              <div className="relative" ref={exportDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  disabled={isExportingPdf}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.04] hover:bg-cyan-50 dark:hover:bg-cyan-500/15 text-slate-700 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm disabled:opacity-50"
                  title="Exportar reporte del odontograma (JSON o PDF)"
                >
                  {isExportingPdf ? (
                    <Loader2 size={14} className="animate-spin text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>Exportar</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown flotante con opciones */}
                {showExportMenu && (
                  <div className="absolute left-0 bottom-full mb-2 w-52 p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 animate-scaleIn backdrop-blur-2xl">
                    <button
                      type="button"
                      onClick={handleExportJsonClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <FileJson size={13} />
                      </div>
                      <div>
                        <div className="leading-tight">Exportar JSON (.json)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Para importar nuevamente</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPdfClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-300 transition-all cursor-pointer mt-1"
                    >
                      <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <FileText size={13} />
                      </div>
                      <div>
                        <div className="leading-tight">Exportar PDF (.pdf)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Informe clínico oficial</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onImport}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.04] hover:bg-teal-50 dark:hover:bg-teal-500/15 text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 border border-slate-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Importar archivo JSON del odontograma"
              >
                <Upload size={14} />
                <span>Importar</span>
              </button>
            </div>
          </>
        ) : (
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={isExportingPdf}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.04] hover:bg-cyan-50 dark:hover:bg-cyan-500/15 text-slate-700 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm disabled:opacity-50"
              title="Descargar copia de mi odontograma"
            >
              {isExportingPdf ? (
                <Loader2 size={14} className="animate-spin text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Download size={14} />
              )}
              <span>Descargar Copia de Mi Odontograma</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown flotante con opciones en modo Paciente */}
            {showExportMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-full p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 animate-scaleIn backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={handleExportJsonClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-500/15 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileJson size={13} />
                  </div>
                  <div>
                    <div className="leading-tight">Exportar JSON (.json)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Copia de respaldo</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdfClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-300 transition-all cursor-pointer mt-1"
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <FileText size={13} />
                  </div>
                  <div>
                    <div className="leading-tight">Exportar PDF (.pdf)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Informe clínico con esquema gráfico</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
