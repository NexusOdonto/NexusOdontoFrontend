import React, { useState, useEffect } from "react";
import { Utensils, Coffee } from "lucide-react";

interface CarruselAlmuerzoVerticalProps {
  horaAlturaPx: number;
  doctorNombre?: string;
  horaInicioDescanso?: string;
  horaFinDescanso?: string;
  horaInicioCalendario?: number;
  onIntentarAgendar?: () => void;
}

const PALABRAS_DESCANSO = [
  "DESCANSO",
  "HORA DE DESCANSO",
  "RECESO CLÍNICO",
  "PAUSA DE DESCANSO",
  "DESCANSO DEL EQUIPO",
  "RECESO DE ALMUERZO",
  "PAUSA MÉDICA",
];

export const CarruselAlmuerzoVertical: React.FC<CarruselAlmuerzoVerticalProps> = ({
  horaAlturaPx,
  doctorNombre,
  horaInicioDescanso = "12:00",
  horaFinDescanso = "14:00",
  horaInicioCalendario = 7,
  onIntentarAgendar,
}) => {
  const [indexPalabra, setIndexPalabra] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndexPalabra((prev) => (prev + 1) % PALABRAS_DESCANSO.length);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const totalPalabras = PALABRAS_DESCANSO.length;
  const palabraAnterior = PALABRAS_DESCANSO[(indexPalabra - 1 + totalPalabras) % totalPalabras];
  const palabraActual = PALABRAS_DESCANSO[indexPalabra];
  const palabraSiguiente = PALABRAS_DESCANSO[(indexPalabra + 1) % totalPalabras];

  const parseTimeToHours = (timeStr: string, defaultHour: number) => {
    if (!timeStr) return defaultHour;
    const [h, m] = timeStr.split(":").map(Number);
    return (isNaN(h) ? defaultHour : h) + (isNaN(m) ? 0 : m) / 60;
  };

  const startHour = parseTimeToHours(horaInicioDescanso, 12);
  const endHour = parseTimeToHours(horaFinDescanso, 14);
  const baseHour = horaInicioCalendario ?? 7;

  const topPx = (startHour - baseHour) * horaAlturaPx + 2;
  const heightPx = Math.max((endHour - startHour) * horaAlturaPx - 4, 34);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onIntentarAgendar?.();
      }}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: "3px",
        width: "calc(100% - 6px)",
      }}
      title={`Horario de descanso clínico (${horaInicioDescanso} a ${horaFinDescanso})${doctorNombre ? ` - ${doctorNombre}` : ""}`}
      className="group absolute z-15 rounded-2xl border-2 border-dashed border-amber-400/60 dark:border-amber-500/50 bg-gradient-to-b from-amber-500/15 via-amber-500/20 to-orange-500/15 dark:from-amber-950/50 dark:via-orange-950/40 dark:to-amber-950/50 backdrop-blur-xs shadow-xs hover:shadow-xl hover:border-amber-500/80 hover:bg-amber-500/25 dark:hover:bg-amber-900/40 transition-all duration-300 cursor-pointer p-2 flex flex-col justify-between overflow-hidden text-center select-none"
    >
      {/* Fondo con rayas diagonales sutiles de zona reservada */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 8px, transparent 8px, transparent 16px)",
        }}
      />

      {/* Encabezado Superior con Horario */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl bg-amber-500/20 dark:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-200 shadow-xs">
        <Utensils size={12} className="shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
        <span className="text-[10px] sm:text-[11px] font-bold font-mono tracking-tight whitespace-nowrap">
          {horaInicioDescanso} - {horaFinDescanso}
        </span>
      </div>

      {/* CARRUSEL VERTICAL DE PALABRAS (Efecto Rueda 3D / Vertical Slide) */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center h-28 overflow-hidden">
        {/* Indicador sutil de flecha superior */}
        <div className="text-[9px] text-amber-500/50 dark:text-amber-400/40 font-bold uppercase tracking-widest scale-75 animate-bounce">
          ▲
        </div>

        {/* Palabra Anterior (Desvaneciéndose hacia arriba) */}
        <div
          key={`prev-${indexPalabra}`}
          className="text-[9px] sm:text-[10px] font-bold text-amber-700/50 dark:text-amber-300/40 tracking-wider truncate max-w-full px-1 py-0.5 transition-all duration-500 transform -translate-y-1"
        >
          {palabraAnterior}
        </div>

        {/* Palabra Central Activa (Destacada con brillo cálido) */}
        <div
          key={`curr-${indexPalabra}`}
          className="my-1 px-2.5 py-1 rounded-xl bg-amber-500/25 dark:bg-amber-400/20 border border-amber-500/50 dark:border-amber-400/40 text-amber-950 dark:text-amber-100 font-black text-[11px] sm:text-xs tracking-wider uppercase shadow-sm transition-all duration-500 transform scale-105 animate-fadeIn max-w-full truncate"
        >
          {palabraActual}
        </div>

        {/* Palabra Siguiente (Apareciendo desde abajo) */}
        <div
          key={`next-${indexPalabra}`}
          className="text-[9px] sm:text-[10px] font-bold text-amber-700/50 dark:text-amber-300/40 tracking-wider truncate max-w-full px-1 py-0.5 transition-all duration-500 transform translate-y-1"
        >
          {palabraSiguiente}
        </div>

        {/* Indicador sutil de flecha inferior */}
        <div className="text-[9px] text-amber-500/50 dark:text-amber-400/40 font-bold uppercase tracking-widest scale-75 animate-bounce">
          ▼
        </div>
      </div>

      {/* Pie de tarjeta con insignia de descanso clínico */}
      <div className="relative z-10 flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-300">
        <Coffee size={11} className="shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="truncate">Descanso Clínico</span>
      </div>
    </div>
  );
};
