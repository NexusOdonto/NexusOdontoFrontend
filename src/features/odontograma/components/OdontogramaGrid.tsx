import { useState } from "react";
import type { ToothState, Surface, Quadrants } from "../types";
import { Tooth } from "./Tooth";
import { Smile, AlignHorizontalDistributeCenter } from "lucide-react";

interface OdontogramaGridProps {
  teeth: Record<number, ToothState>;
  quadrants: Quadrants;
  onSurfaceClick: (toothNumber: number, surface: Surface) => void;
  onToothClick?: (toothNumber: number) => void;
  selectedTooth: number | null;
  isDarkMode: boolean;
}

/**
 * Curvatura anatómica suave para la arcada (arco dental)
 */
function getArchStyle(
  isUpper: boolean,
  isLeftHemi: boolean,
  index: number,
  total: number,
  isBocaMode: boolean
): React.CSSProperties {
  if (!isBocaMode || total <= 1) {
    return { transform: "none" };
  }

  const distFromCenter = !isLeftHemi ? total - 1 - index : index;
  const normalized = distFromCenter / (total - 1); // 0 a 1

  const yMax = total <= 5 ? 14 : 18;
  const yOffset = Math.pow(normalized, 1.6) * yMax;
  const rotMax = total <= 5 ? 6 : 9;
  const rotDeg = Math.pow(normalized, 1.2) * rotMax;

  const y = isUpper ? yOffset : -yOffset;
  const rot = !isLeftHemi
    ? isUpper
      ? -rotDeg
      : rotDeg
    : isUpper
    ? rotDeg
    : -rotDeg;

  return {
    transform: `translateY(${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`,
    transformOrigin: "center center",
  };
}

export function OdontogramaGrid({
  teeth,
  quadrants,
  onSurfaceClick,
  onToothClick,
  selectedTooth,
  isDarkMode,
}: OdontogramaGridProps) {
  const [isBocaMode, setIsBocaMode] = useState(true);

  // Defensive fallbacks
  const safeTeeth = teeth || {};
  const safeQuadrants = quadrants || {
    topRight: [],
    topLeft: [],
    bottomRight: [],
    bottomLeft: [],
  };

  const visibleTopRight = safeQuadrants.topRight.filter((id) => safeTeeth[id]?.isVisible);
  const visibleTopLeft = safeQuadrants.topLeft.filter((id) => safeTeeth[id]?.isVisible);
  const visibleBottomRight = safeQuadrants.bottomRight.filter((id) => safeTeeth[id]?.isVisible);
  const visibleBottomLeft = safeQuadrants.bottomLeft.filter((id) => safeTeeth[id]?.isVisible);

  return (
    <div className="space-y-6">
      {/* Selector de Disposición */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Arcadas Dentales Clínicas FDI
        </span>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setIsBocaMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isBocaMode
                ? "bg-rose-600 text-white dark:bg-rose-500/30 dark:border-rose-400 dark:text-rose-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Smile size={13} />
            <span>Curvatura Anatómica</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBocaMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isBocaMode
                ? "bg-rose-600 text-white dark:bg-rose-500/30 dark:border-rose-400 dark:text-rose-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <AlignHorizontalDistributeCenter size={13} />
            <span>Alineación Recta</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RECUADRO SUPERIOR: ARCADA MAXILAR (COLORES DE BOCA / ENCÍA / PALADAR)  */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl border border-rose-200/80 dark:border-rose-500/20 bg-gradient-to-br from-rose-50/70 via-white/85 to-rose-100/40 dark:from-[#1b0a13]/80 dark:via-slate-900/85 dark:to-[#160910]/80 backdrop-blur-2xl p-5 sm:p-6 shadow-xl shadow-rose-950/5 dark:shadow-[0_12px_36px_rgba(20,2,10,0.5)]">
        {/* Fondo sutil de encía y paladar */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent" />

        {/* Guía curva de encía superior */}
        {isBocaMode && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-35 dark:opacity-25 stroke-rose-400 dark:stroke-rose-400"
            preserveAspectRatio="none"
            viewBox="0 0 800 200"
          >
            <path
              d="M 80,170 Q 400,45 720,170"
              fill="none"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
        )}

        {/* Cabecera del Recuadro Superior con Colores de Encía/Paladar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rose-200/70 dark:border-rose-500/20 text-xs relative z-10">
          <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            Arcada Superior (Maxilar) · Cuadrantes 1 & 2
          </span>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold">
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              Encía Maxilar · Paladar
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Vestibular (Labios) / Palatino
            </span>
          </div>
        </div>

        {/* Hilera de Dientes Superiores (18 -> 11 | 21 -> 28) */}
        <div className={`overflow-x-auto scrollbar-thin scrollbar-thumb-rose-200 dark:scrollbar-thumb-rose-950/60 relative z-10 ${
          isBocaMode ? "pt-5 pb-8 sm:pt-6 sm:pb-9" : "py-4 pb-1"
        }`}>
          <div className="flex items-center justify-center w-full min-w-[560px] gap-1 sm:gap-3">
            {/* Cuadrante 1 (Superior Derecho del Paciente: 18 -> 11) */}
            <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-1">
              {visibleTopRight.map((id: number, idx: number) => (
                <Tooth
                  key={id}
                  id={id}
                  tooth={safeTeeth[id]}
                  onSurfaceClick={onSurfaceClick}
                  onToothClick={onToothClick}
                  isSelected={selectedTooth === id}
                  isDarkMode={isDarkMode}
                  style={getArchStyle(true, false, idx, visibleTopRight.length, isBocaMode)}
                />
              ))}
            </div>

            {/* Línea Media Anatómica */}
            <div className="flex flex-col items-center justify-center h-14 sm:h-18 px-1 select-none flex-shrink-0">
              <span className="text-[9px] font-black uppercase text-rose-500 dark:text-rose-400 tracking-tighter">
                L.M.
              </span>
              <div className="w-0.5 flex-1 bg-gradient-to-b from-rose-500/20 via-rose-500 to-rose-500/20 rounded-full my-0.5 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            </div>

            {/* Cuadrante 2 (Superior Izquierdo del Paciente: 21 -> 28) */}
            <div className="flex items-center justify-start gap-1 sm:gap-1.5 flex-1">
              {visibleTopLeft.map((id: number, idx: number) => (
                <Tooth
                  key={id}
                  id={id}
                  tooth={safeTeeth[id]}
                  onSurfaceClick={onSurfaceClick}
                  onToothClick={onToothClick}
                  isSelected={selectedTooth === id}
                  isDarkMode={isDarkMode}
                  style={getArchStyle(true, true, idx, visibleTopLeft.length, isBocaMode)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RECUADRO INFERIOR: ARCADA MANDIBULAR (COLORES DE BOCA / ENCÍA / LENGUA)*/}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl border border-rose-200/80 dark:border-rose-500/20 bg-gradient-to-br from-rose-50/70 via-white/85 to-rose-100/40 dark:from-[#1b0a13]/80 dark:via-slate-900/85 dark:to-[#160910]/80 backdrop-blur-2xl p-5 sm:p-6 shadow-xl shadow-rose-950/5 dark:shadow-[0_12px_36px_rgba(20,2,10,0.5)]">
        {/* Fondo sutil de encía inferior y piso de boca */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-25 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent" />

        {/* Guía curva de encía inferior */}
        {isBocaMode && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-35 dark:opacity-25 stroke-rose-400 dark:stroke-rose-400"
            preserveAspectRatio="none"
            viewBox="0 0 800 200"
          >
            <path
              d="M 80,30 Q 400,155 720,30"
              fill="none"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
        )}

        {/* Cabecera del Recuadro Inferior con Colores de Encía/Lengua */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-rose-200/70 dark:border-rose-500/20 text-xs relative z-10">
          <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            Arcada Inferior (Mandíbula) · Cuadrantes 4 & 3
          </span>
          <div className="flex items-center gap-2 text-[11px] font-mono font-semibold">
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              Encía Mandibular · Piso de Boca
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Vestibular (Labios) / Lingual
            </span>
          </div>
        </div>

        {/* Hilera de Dientes Inferiores (48 -> 41 | 31 -> 38) */}
        <div className={`overflow-x-auto scrollbar-thin scrollbar-thumb-rose-200 dark:scrollbar-thumb-rose-950/60 relative z-10 ${
          isBocaMode ? "pt-8 pb-5 sm:pt-9 sm:pb-6" : "py-4 pb-1"
        }`}>
          <div className="flex items-center justify-center w-full min-w-[560px] gap-1 sm:gap-3">
            {/* Cuadrante 4 (Inferior Derecho del Paciente: 48 -> 41) */}
            <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-1">
              {visibleBottomRight.map((id: number, idx: number) => (
                <Tooth
                  key={id}
                  id={id}
                  tooth={safeTeeth[id]}
                  onSurfaceClick={onSurfaceClick}
                  onToothClick={onToothClick}
                  isSelected={selectedTooth === id}
                  isDarkMode={isDarkMode}
                  style={getArchStyle(false, false, idx, visibleBottomRight.length, isBocaMode)}
                />
              ))}
            </div>

            {/* Línea Media Anatómica */}
            <div className="flex flex-col items-center justify-center h-14 sm:h-18 px-1 select-none flex-shrink-0">
              <span className="text-[9px] font-black uppercase text-rose-500 dark:text-rose-400 tracking-tighter">
                L.M.
              </span>
              <div className="w-0.5 flex-1 bg-gradient-to-b from-rose-500/20 via-rose-500 to-rose-500/20 rounded-full my-0.5 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            </div>

            {/* Cuadrante 3 (Inferior Izquierdo del Paciente: 31 -> 38) */}
            <div className="flex items-center justify-start gap-1 sm:gap-1.5 flex-1">
              {visibleBottomLeft.map((id: number, idx: number) => (
                <Tooth
                  key={id}
                  id={id}
                  tooth={safeTeeth[id]}
                  onSurfaceClick={onSurfaceClick}
                  onToothClick={onToothClick}
                  isSelected={selectedTooth === id}
                  isDarkMode={isDarkMode}
                  style={getArchStyle(false, true, idx, visibleBottomLeft.length, isBocaMode)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
