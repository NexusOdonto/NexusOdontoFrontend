import type { ToothState, Surface } from "../types";
import { DIAGNOSIS_COLORS } from "../types";

interface DienteProps {
  id: number;
  tooth: ToothState;
  onSurfaceClick: (toothNumber: number, surface: Surface) => void;
  onToothClick?: (toothNumber: number) => void;
  isSelected?: boolean;
  isDarkMode: boolean;
  style?: React.CSSProperties;
}

export function Tooth({
  id,
  tooth,
  onSurfaceClick,
  onToothClick,
  isSelected = false,
  isDarkMode,
  style,
}: DienteProps) {
  const {
    isAbsent = false,
    isExtracted = false,
    isUnerupted = false,
    isVisible = true,
    faces,
    condition = "healthy",
  } = tooth || {};

  const safeFaces = faces || {
    vestibular: { diagnosis: "none" },
    palatino: { diagnosis: "none" },
    mesial: { diagnosis: "none" },
    distal: { diagnosis: "none" },
    oclusal: { diagnosis: "none" },
  };

  if (!isVisible) return null;

  const getSurfaceColor = (surface: Surface): string => {
    const diagnosis = safeFaces[surface]?.diagnosis ?? "none";
    return DIAGNOSIS_COLORS[diagnosis] ?? DIAGNOSIS_COLORS.none;
  };

  const getSurfaceOpacity = (): number => {
    if (isAbsent || isExtracted) return 0.25;
    if (isUnerupted) return 0.45;
    return 1;
  };

  const handleSurfaceClick = (surface: Surface) => {
    if (!isAbsent && !isExtracted) {
      onSurfaceClick(id, surface);
    }
  };

  const handleToothClick = () => {
    if (onToothClick) {
      onToothClick(id);
    }
  };

  // Corona o prótesis dental clínica
  const getCrownIndicator = () => {
    if (
      condition === "implanted" ||
      safeFaces.vestibular?.diagnosis === "crown" ||
      safeFaces.vestibular?.diagnosis === "bridge"
    ) {
      return (
        <rect
          x="3"
          y="3"
          width="94"
          height="94"
          rx="18"
          className="fill-none stroke-emerald-400 dark:stroke-emerald-300 stroke-[2.5] stroke-dasharray-4 filter drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
        />
      );
    }
    return null;
  };

  // Conducto radicular / Endodoncia
  const getEndodonticIndicator = () => {
    if (
      safeFaces.vestibular?.diagnosis === "endodontic" ||
      safeFaces.palatino?.diagnosis === "endodontic" ||
      safeFaces.mesial?.diagnosis === "endodontic" ||
      safeFaces.distal?.diagnosis === "endodontic" ||
      safeFaces.oclusal?.diagnosis === "endodontic"
    ) {
      return (
        <g className="filter drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]">
          <line
            x1="50"
            y1="4"
            x2="50"
            y2="96"
            className="stroke-purple-500 dark:stroke-purple-400 stroke-[3] stroke-linecap-round"
          />
          <circle cx="50" cy="50" r="4" className="fill-purple-300 stroke-purple-600 stroke-1" />
        </g>
      );
    }
    return null;
  };

  // Implante oseointegrado
  const getImplantIndicator = () => {
    if (
      condition === "implanted" ||
      safeFaces.vestibular?.diagnosis === "implant" ||
      safeFaces.oclusal?.diagnosis === "implant"
    ) {
      return (
        <g className="filter drop-shadow-[0_0_6px_rgba(20,184,166,0.7)]">
          <circle
            cx="50"
            cy="50"
            r="12"
            className="fill-teal-500/20 stroke-teal-400 stroke-[2] stroke-dasharray-2"
          />
          <polygon
            points="50,42 57,46 57,54 50,58 43,54 43,46"
            className="fill-teal-400 stroke-teal-200 stroke-1"
          />
        </g>
      );
    }
    return null;
  };

  // Trazo de borde anatómico
  const strokeColor = isDarkMode ? "stroke-slate-500/90" : "stroke-slate-400";

  return (
    <div
      style={style}
      className={`group flex flex-col items-center gap-1 select-none transition-all duration-300 flex-shrink-0 cursor-pointer w-8 sm:w-10 ${
        isSelected
          ? "scale-110 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]"
          : "hover:scale-105 hover:filter hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
      } ${isAbsent || isExtracted ? "opacity-40" : ""}`}
      onClick={handleToothClick}
      title={`Pieza FDI #${id}`}
    >
      {/* 1. Número FDI Nítido */}
      <span
        className={`font-mono text-[11px] sm:text-xs font-black transition-colors select-none ${
          isAbsent || isExtracted
            ? "text-rose-500/80 dark:text-rose-400 line-through"
            : isDarkMode
            ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
            : "text-slate-900"
        }`}
      >
        {id}
      </span>

      {/* 2. Diente Anatómico Realista de Boca (Esmalte Dental con Surcos y Relieve Clínico) */}
      <div className="relative w-full aspect-square flex items-center justify-center">
        <svg
          className={`w-full h-full ${strokeColor} stroke-[1.5] transition-all duration-200 filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]`}
          viewBox="0 0 100 100"
          style={{ opacity: getSurfaceOpacity() }}
        >
          <defs>
            {/* Gradiente de brillo de esmalte dental sano */}
            <linearGradient id={`enamelGlow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.08" />
            </linearGradient>

            {/* Sombra de fosa oclusal */}
            <radialGradient id={`fossaShadow-${id}`} cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
            </radialGradient>
          </defs>

          {/* Vestibular (Cara Externa hacia los Labios/Mejillas) */}
          <path
            d="M 18,10 C 32,2 68,2 82,10 L 67,33 C 57,28 43,28 33,33 Z"
            className={`cursor-pointer transition-all duration-150 ${getSurfaceColor(
              "vestibular"
            )} hover:brightness-110 hover:stroke-cyan-400 hover:stroke-[2.2]`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick("vestibular");
            }}
          >
            <title>Pieza #{id} · Cara Vestibular (Hacia el labio)</title>
          </path>

          {/* Distal (Cara Interproximal Posterior) */}
          <path
            d="M 82,10 C 97,32 97,68 82,90 L 67,67 C 72,57 72,43 67,33 Z"
            className={`cursor-pointer transition-all duration-150 ${getSurfaceColor(
              "distal"
            )} hover:brightness-110 hover:stroke-cyan-400 hover:stroke-[2.2]`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick("distal");
            }}
          >
            <title>Pieza #{id} · Cara Distal (Hacia atrás)</title>
          </path>

          {/* Palatino / Lingual (Cara Interna hacia Paladar o Lengua) */}
          <path
            d="M 33,67 C 43,72 57,72 67,67 L 82,90 C 68,98 32,98 18,90 Z"
            className={`cursor-pointer transition-all duration-150 ${getSurfaceColor(
              "palatino"
            )} hover:brightness-110 hover:stroke-cyan-400 hover:stroke-[2.2]`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick("palatino");
            }}
          >
            <title>Pieza #{id} · Cara Palatina/Lingual (Hacia adentro)</title>
          </path>

          {/* Mesial (Cara Interproximal Anterior) */}
          <path
            d="M 18,10 L 33,33 C 28,43 28,57 33,67 L 18,90 C 3,68 3,32 18,10 Z"
            className={`cursor-pointer transition-all duration-150 ${getSurfaceColor(
              "mesial"
            )} hover:brightness-110 hover:stroke-cyan-400 hover:stroke-[2.2]`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick("mesial");
            }}
          >
            <title>Pieza #{id} · Cara Mesial (Hacia la línea media)</title>
          </path>

          {/* Oclusal / Incisal (Fosa y Cúspides Centrales Masticatorias) */}
          <path
            d="M 33,33 C 43,28 57,28 67,33 C 72,43 72,57 67,67 C 57,72 43,72 33,67 C 28,57 28,43 33,33 Z"
            className={`cursor-pointer transition-all duration-150 ${getSurfaceColor(
              "oclusal"
            )} hover:brightness-110 hover:stroke-cyan-400 hover:stroke-[2.2]`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick("oclusal");
            }}
          >
            <title>Pieza #{id} · Cara Oclusal/Incisal (Masticatoria)</title>
          </path>

          {/* Capa de brillo orgánico de esmalte dental (Reflejo de luz de sillón odontológico) */}
          <path
            d="M 24,14 C 36,7 64,7 76,14 C 70,22 60,18 50,18 C 40,18 30,22 24,14 Z"
            fill={`url(#enamelGlow-${id})`}
            className="pointer-events-none"
          />

          {/* Surcos anatómicos centrales del esmalte */}
          <path
            d="M 40,50 L 60,50 M 50,40 L 50,60"
            className="pointer-events-none stroke-slate-400/40 dark:stroke-slate-500/50 stroke-[1.2] stroke-linecap-round"
          />

          {/* Corona / Prótesis Fija */}
          {getCrownIndicator()}

          {/* Tratamiento de Endodoncia */}
          {getEndodonticIndicator()}

          {/* Implante Oseointegrado */}
          {getImplantIndicator()}

          {/* Diente Ausente / Extraído (X Roja Contundente) */}
          {(isAbsent || isExtracted) && (
            <g className="filter drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              <line
                x1="12"
                y1="12"
                x2="88"
                y2="88"
                className="stroke-red-500 stroke-[3.5] stroke-linecap-round"
              />
              <line
                x1="88"
                y1="12"
                x2="12"
                y2="88"
                className="stroke-red-500 stroke-[3.5] stroke-linecap-round"
              />
            </g>
          )}

          {/* Diente No Erupccionado */}
          {isUnerupted && (
            <circle
              cx="50"
              cy="50"
              r="14"
              className="fill-amber-400/20 stroke-amber-400 stroke-[2] stroke-dasharray-3 filter drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
