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
      className="group absolute z-20 rounded-2xl border-2 border-sky-500/40 dark:border-sky-400/50 bg-sky-500/[0.08] dark:bg-[#031c2c]/90 backdrop-blur-md shadow-sm dark:shadow-[0_0_20px_rgba(14,165,233,0.18)] hover:shadow-md dark:hover:shadow-[0_0_28px_rgba(14,165,233,0.32)] hover:border-sky-500/70 dark:hover:border-sky-400/80 hover:bg-sky-500/[0.12] dark:hover:bg-[#031c2c]/95 transition-all duration-300 cursor-pointer overflow-hidden select-none flex items-center justify-between px-4 sm:px-6 gap-4"
    >
      {/* Fondo LED Matrix Dot Pattern sutil y espaciado */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10 dark:opacity-15"
        style={{
          backgroundImage: "radial-gradient(circle, #0ea5e9 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Degradado resplandor LED horizontal */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/5 via-cyan-500/10 to-sky-500/5 dark:from-sky-500/10 dark:via-cyan-500/15 dark:to-sky-500/10" />

      {/* Franja animada de brillo láser LED superior e inferior */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-500/50 dark:via-sky-400/80 to-transparent opacity-70 animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-sky-500/50 dark:via-sky-400/80 to-transparent opacity-70 animate-pulse" />

      {/* Lateral Izquierdo: Insignia Digital con Horario */}
      <div className="relative z-10 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/35 dark:border-sky-400/50 shadow-xs text-sky-950 dark:text-sky-200">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
          </span>
          <Utensils size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="text-xs font-bold font-sans tracking-wide text-sky-950 dark:text-sky-200 whitespace-nowrap">
            {horaInicioDescanso} - {horaFinDescanso}
          </span>
        </div>
      </div>

      {/* Centro: Pantalla LED con tipografía sans-serif moderna de alto contraste */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center overflow-hidden min-w-0 px-2">
        <div
          className={`flex flex-col items-center justify-center transition-all duration-300 transform ${
            animating ? "opacity-0 scale-95 -translate-y-1.5" : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          {/* TÍTULO PRINCIPAL SANS-SERIF MODERNO */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {currentMsg.icono === "coffee" && <Coffee size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />}
            {currentMsg.icono === "utensils" && <Utensils size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />}
            {currentMsg.icono === "sparkles" && <Sparkles size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />}
            {currentMsg.icono === "clock" && <Clock size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />}

            <span className="text-xs sm:text-sm md:text-base font-extrabold font-sans tracking-wide uppercase text-sky-950 dark:text-sky-100 drop-shadow-xs dark:drop-shadow-[0_0_12px_rgba(14,165,233,0.5)]">
              {currentMsg.titulo}
            </span>
          </div>

          {/* SUBTÍTULO DESCRIPTIVO EN GRIS AZULADO CLARO (#94A3B8 / text-slate-300) */}
          <p className="text-[11px] sm:text-xs font-medium font-sans tracking-normal text-slate-600 dark:text-slate-300 mt-0.5 truncate max-w-full">
            {currentMsg.subtitulo}
          </p>
        </div>
      </div>

      {/* Lateral Derecho: Controles interactivos y estado perfectamente centrados */}
      <div className="relative z-10 flex items-center gap-2 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 bg-sky-500/15 dark:bg-sky-500/15 border border-sky-500/30 rounded-xl px-3 py-1 text-[11px] font-sans font-bold text-sky-900 dark:text-sky-200">
          <span>PAUSA CLÍNICA</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 dark:bg-sky-500/15 dark:hover:bg-sky-500/30 text-sky-900 dark:text-sky-200 border border-sky-500/30 dark:border-sky-500/40 transition cursor-pointer"
            title="Mensaje anterior"
          >
            <ChevronLeft size={14} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 dark:bg-sky-500/15 dark:hover:bg-sky-500/30 text-sky-900 dark:text-sky-200 border border-sky-500/30 dark:border-sky-500/40 transition cursor-pointer"
            title="Siguiente mensaje"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
