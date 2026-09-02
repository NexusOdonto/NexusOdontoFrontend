import { formatCurrency } from "../../../utils/currency";
import type { Servicio } from "../../../types/servicios";
import { Clock, Sparkles, Tag, XCircle } from "lucide-react";

interface ServiciosGridProps {
  servicios: Servicio[];
}

export function ServiciosGrid({ servicios }: ServiciosGridProps) {
  if (servicios.length === 0) {
    return (
      <div className="flex min-h-60 w-full flex-col items-center justify-center py-16 text-center rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-2xl">
          <Tag size={24} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          No se encontraron servicios
        </h3>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Intenta ajustar tu búsqueda o los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {servicios.map((servicio, idx) => (
        <div
          key={servicio.id}
          className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 hover:bg-white dark:hover:bg-slate-950/85 p-5 transition-all duration-300 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 shadow-md hover:shadow-xl dark:shadow-2xl backdrop-blur-xl animate-fadeIn animate-stagger-${(idx % 6) + 1} ${
            !servicio.activo ? "opacity-60" : ""
          }`}
        >
          <div>
            {/* Header de la tarjeta */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 dark:from-teal-400/30 dark:via-cyan-400/30 dark:to-blue-500/30 border border-cyan-500/40 dark:border-cyan-400/50 text-cyan-800 dark:text-cyan-200 font-extrabold shadow-sm group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <Sparkles size={20} className="text-teal-600 dark:text-teal-400" />
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  servicio.activo
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30"
                }`}
              >
                {servicio.activo ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle size={12} />
                    Inactivo
                  </>
                )}
              </span>
            </div>

            {/* Contenido */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">
                {servicio.nombre}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
                {servicio.descripcion}
              </p>
            </div>
          </div>

          {/* Metadatos y Precio */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Clock size={14} className="text-cyan-600 dark:text-cyan-400" />
              <span>{servicio.duracion} min</span>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(servicio.precio)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}