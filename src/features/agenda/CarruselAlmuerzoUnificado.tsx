import React, { useState, useEffect } from "react";
import { Utensils, Coffee, Sparkles, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface CarruselAlmuerzoUnificadoProps {
  topPx: number;
  heightPx: number;
  leftPx?: string;
  width?: string;
  horaInicioDescanso?: string;
  horaFinDescanso?: string;
  onIntentarAgendar?: () => void;
}

const MENSAJES_LED = [
  {
    titulo: "HORA DE DESCANSO CLÍNICO",
    subtitulo: "Receso del equipo médico y pausa de atención",
    icono: "coffee",
  },
  {
    titulo: "RECESO DE ALMUERZO",
    subtitulo: "Retomamos atención y citas a partir de las 14:00",
    icono: "utensils",
  },
  {
    titulo: "PAUSA MÉDICA Y DESINFECCIÓN",
    subtitulo: "Esterilización de sillones y preparación de instrumental",
    icono: "sparkles",
  },
  {
    titulo: "ESPACIO DE DESCANSO",
    subtitulo: "Jornada de la tarde disponible de 14:00 a 17:00",
    icono: "clock",
  },
];

export const CarruselAlmuerzoUnificado: React.FC<CarruselAlmuerzoUnificadoProps> = ({
  topPx,
  heightPx,
  leftPx = "50px",
  width = "calc((100% - 50px) * (5 / 7))",
  horaInicioDescanso = "12:00",
  horaFinDescanso = "14:00",
  onIntentarAgendar,
}) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % MENSAJES_LED.length);
        setAnimating(false);
      }, 350);
    }, 4200);

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentMsg = MENSAJES_LED[index];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + MENSAJES_LED.length) % MENSAJES_LED.length);
      setAnimating(false);
    }, 200);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % MENSAJES_LED.length);
      setAnimating(false);
    }, 200);
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onIntentarAgendar?.();
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: leftPx,
        width: width,
      }}
      title={`Horario de descanso clínico (${horaInicioDescanso} a ${horaFinDescanso}) • Lunes a Sábado`}
      className="group absolute z-20 rounded-2xl border-2 border-amber-500/40 dark:border-amber-400/50 bg-amber-500/[0.08] dark:bg-[#160e02]/90 backdrop-blur-md shadow-sm dark:shadow-[0_0_20px_rgba(245,158,11,0.18)] hover:shadow-md dark:hover:shadow-[0_0_28px_rgba(245,158,11,0.32)] hover:border-amber-500/70 dark:hover:border-amber-400/80 hover:bg-amber-500/[0.12] dark:hover:bg-[#160e02]/95 transition-all duration-300 cursor-pointer overflow-hidden select-none flex items-center justify-between px-3 sm:px-6 gap-3"
    >
      {/* Fondo LED Matrix Dot Pattern adaptado al modo claro/oscuro */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15 dark:opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #f59e0b 1.2px, transparent 1.2px)",
          backgroundSize: "8px 8px",
        }}
      />

      {/* Degradado resplandor LED horizontal */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-500/15 to-amber-500/5 dark:from-amber-500/10 dark:via-amber-500/20 dark:to-amber-500/10" />

      {/* Franja animada de brillo láser LED superior e inferior */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/60 dark:via-amber-400 to-transparent opacity-80 animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/60 dark:via-amber-400 to-transparent opacity-80 animate-pulse" />

      {/* Lateral Izquierdo: Insignia LED Digital con Horario */}
      <div className="relative z-10 flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/35 dark:border-amber-400/60 shadow-xs dark:shadow-[0_0_10px_rgba(245,158,11,0.25)] text-amber-900 dark:text-amber-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <Utensils size={13} className="text-amber-600 dark:text-amber-400 animate-pulse" />
          <span className="text-xs font-black font-mono tracking-wider text-amber-900 dark:text-amber-200">
            {horaInicioDescanso} - {horaFinDescanso}
          </span>
        </div>
      </div>

      {/* Centro: Pantalla LED con animación de texto tipo Ticker Matrix */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center overflow-hidden min-w-0 px-2">
        <div
          className={`flex flex-col items-center justify-center transition-all duration-300 transform ${
            animating ? "opacity-0 scale-95 -translate-y-2" : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          {/* TÍTULO PRINCIPAL ESTILO TEXTO LED NEON */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {currentMsg.icono === "coffee" && <Coffee size={14} className="text-amber-600 dark:text-amber-400 animate-bounce" />}
            {currentMsg.icono === "utensils" && <Utensils size={14} className="text-amber-600 dark:text-amber-400 animate-bounce" />}
            {currentMsg.icono === "sparkles" && <Sparkles size={14} className="text-amber-600 dark:text-amber-400 animate-bounce" />}
            {currentMsg.icono === "clock" && <Clock size={14} className="text-amber-600 dark:text-amber-400 animate-bounce" />}

            <span className="text-xs sm:text-sm md:text-base font-black font-mono tracking-[0.18em] uppercase text-amber-950 dark:text-amber-300 drop-shadow-xs dark:drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]">
              {currentMsg.titulo}
            </span>
          </div>

          {/* SUBTÍTULO DESCRIPTIVO DIGITAL */}
          <p className="text-[10px] sm:text-[11px] font-medium font-mono tracking-wide text-amber-800 dark:text-amber-200/80 mt-0.5 truncate max-w-full">
            {currentMsg.subtitulo}
          </p>
        </div>
      </div>

      {/* Lateral Derecho: Controles interactivos y estado */}
      <div className="relative z-10 flex items-center gap-1.5 shrink-0">
        <div className="hidden lg:flex items-center gap-1 bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300">
          <span>PAUSA CLÍNICA</span>
        </div>

        <button
          type="button"
          onClick={handlePrev}
          className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-500/15 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40 transition cursor-pointer"
          title="Mensaje anterior"
        >
          <ChevronLeft size={13} />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 dark:bg-amber-500/15 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40 transition cursor-pointer"
          title="Siguiente mensaje"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
