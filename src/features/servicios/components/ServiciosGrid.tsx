import { formatCurrency } from "../../../utils/currency";
import type { Servicio } from "../../../types/servicios";
import {
  Clock,
  Sparkles,
  Tag,
  XCircle,
  ShieldCheck,
  Scissors,
  Smile,
  Activity,
  Stethoscope,
  Edit2,
  Trash2,
  Flame,
} from "lucide-react";

interface ServiciosGridProps {
  servicios: Servicio[];
  onEditar?: (servicio: Servicio) => void;
  onEliminar?: (id: number | string) => void;
  onToggleActivo?: (servicio: Servicio) => void;
}

function getServiceDetails(servicio: Servicio) {
  const n = servicio.nombre.toLowerCase();
  const code = servicio.codigo || `SRV-${String(servicio.id).padStart(3, "0")}`;
  const esFrecuente = n.includes("blanqueamiento") || n.includes("profilaxis") || n.includes("limpieza");

  if (servicio.categoria) {
    const cat = servicio.categoria.toLowerCase();
    if (cat.includes("estética")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        Icon: Sparkles,
        iconColor: "text-purple-600 dark:text-purple-300",
        iconBg: "bg-purple-500/15 border-purple-500/30",
        hoverGlow: "hover:border-purple-500/50 hover:shadow-purple-500/10",
      };
    }
    if (cat.includes("operatoria") || cat.includes("resina")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
        Icon: ShieldCheck,
        iconColor: "text-sky-600 dark:text-sky-300",
        iconBg: "bg-sky-500/15 border-sky-500/30",
        hoverGlow: "hover:border-sky-500/50 hover:shadow-sky-500/10",
      };
    }
    if (cat.includes("cirugía")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        Icon: Scissors,
        iconColor: "text-amber-600 dark:text-amber-300",
        iconBg: "bg-amber-500/15 border-amber-500/30",
        hoverGlow: "hover:border-amber-500/50 hover:shadow-amber-500/10",
      };
    }
    if (cat.includes("higiene") || cat.includes("prevención")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
        Icon: Smile,
        iconColor: "text-teal-600 dark:text-teal-300",
        iconBg: "bg-teal-500/15 border-teal-500/30",
        hoverGlow: "hover:border-teal-500/50 hover:shadow-teal-500/10",
      };
    }
    if (cat.includes("endodoncia")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        Icon: Activity,
        iconColor: "text-rose-600 dark:text-rose-300",
        iconBg: "bg-rose-500/15 border-rose-500/30",
        hoverGlow: "hover:border-rose-500/50 hover:shadow-rose-500/10",
      };
    }
  }

  // Fallback por nombre
  if (n.includes("blanqueamiento")) {
    return {
      code,
      esFrecuente: true,
      categoria: "Estética Dental",
      badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
      Icon: Sparkles,
      iconColor: "text-purple-600 dark:text-purple-300",
      iconBg: "bg-purple-500/15 border-purple-500/30",
      hoverGlow: "hover:border-purple-500/50 hover:shadow-purple-500/10",
    };
  }
  if (n.includes("resina") || n.includes("calza") || n.includes("restauracion")) {
    return {
      code,
      esFrecuente,
      categoria: "Operatoria Dental",
      badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
      Icon: ShieldCheck,
      iconColor: "text-sky-600 dark:text-sky-300",
      iconBg: "bg-sky-500/15 border-sky-500/30",
      hoverGlow: "hover:border-sky-500/50 hover:shadow-sky-500/10",
    };
  }
  if (n.includes("extracción") || n.includes("extraccion") || n.includes("cirugía") || n.includes("cirugia")) {
    return {
      code,
      esFrecuente,
      categoria: "Cirugía Oral",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      Icon: Scissors,
      iconColor: "text-amber-600 dark:text-amber-300",
      iconBg: "bg-amber-500/15 border-amber-500/30",
      hoverGlow: "hover:border-amber-500/50 hover:shadow-amber-500/10",
    };
  }
  if (n.includes("profilaxis") || n.includes("limpieza") || n.includes("detartraje")) {
    return {
      code,
      esFrecuente: true,
      categoria: "Higiene y Prevención",
      badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
      Icon: Smile,
      iconColor: "text-teal-600 dark:text-teal-300",
      iconBg: "bg-teal-500/15 border-teal-500/30",
      hoverGlow: "hover:border-teal-500/50 hover:shadow-teal-500/10",
    };
  }
  if (n.includes("endodoncia") || n.includes("conducto")) {
    return {
      code,
      esFrecuente,
      categoria: "Endodoncia",
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      Icon: Activity,
      iconColor: "text-rose-600 dark:text-rose-300",
      iconBg: "bg-rose-500/15 border-rose-500/30",
      hoverGlow: "hover:border-rose-500/50 hover:shadow-rose-500/10",
    };
  }
  return {
    code,
    esFrecuente,
    categoria: "Odontología General",
    badgeClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    Icon: Stethoscope,
    iconColor: "text-cyan-600 dark:text-cyan-300",
    iconBg: "bg-cyan-500/15 border-cyan-500/30",
    hoverGlow: "hover:border-cyan-500/50 hover:shadow-cyan-500/10",
  };
}

export function ServiciosGrid({
  servicios,
  onEditar,
  onEliminar,
  onToggleActivo,
}: ServiciosGridProps) {
  if (servicios.length === 0) {
    return (
      <div className="flex min-h-64 w-full flex-col items-center justify-center py-16 text-center rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/85 dark:bg-slate-950/70 backdrop-blur-2xl shadow-lg dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-md">
          <Tag size={28} />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
          No se encontraron servicios
        </h3>
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          Intenta ajustar los criterios de búsqueda o restablecer los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {servicios.map((servicio, idx) => {
        const details = getServiceDetails(servicio);
        const { Icon } = details;

        return (
          <div
            key={servicio.id}
            className={`group relative flex flex-col justify-between rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-2xl p-6 ${
              // Modo Claro vs Modo Oscuro
              "bg-white/80 dark:bg-slate-900/70 border-slate-200/80 dark:border-white/10 shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
            } ${details.hoverGlow} animate-fadeIn animate-stagger-${
              (idx % 6) + 1
            } ${!servicio.activo ? "opacity-60" : ""}`}
          >
            <div>
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-115 group-hover:rotate-6 flex-shrink-0 icon-animated-interactive ${details.iconBg}`}
                  >
                    <Icon size={22} className={`${details.iconColor} group-hover:animate-icon-bounce transition-transform`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${details.badgeClass}`}
                      >
                        {details.categoria}
                      </span>
                      {details.esFrecuente && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Flame size={10} className="text-amber-500" />
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="block text-[11px] font-mono text-cyan-700 dark:text-cyan-300 font-bold mt-1 tracking-wider">
                      {details.code}
                    </span>
                  </div>
                </div>

                {/* Badge/Botón de Estado Interactivo con Radar Pulse */}
                {onToggleActivo ? (
                <button
                  type="button"
                  onClick={() => onToggleActivo(servicio)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black border transition-all cursor-pointer shadow-sm ${
                    servicio.activo
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25"
                      : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                  }`}
                  title={servicio.activo ? "Clic para desactivar" : "Clic para activar"}
                >
                  {servicio.activo ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>Activo</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={13} className="text-slate-400" />
                      <span>Inactivo</span>
                    </>
                  )}
                </button>
                ) : (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black border shadow-sm ${
                      servicio.activo
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30"
                        : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {servicio.activo ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} className="text-slate-400" />
                        <span>Inactivo</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Contenido principal */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {servicio.nombre}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 min-h-[34px] leading-relaxed font-medium">
                  {servicio.descripcion}
                </p>
              </div>
            </div>

            {/* Metadatos, Precio y Acciones */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              {/* Duración */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 font-mono font-bold">
                <Clock size={13} className="text-cyan-600 dark:text-cyan-400" />
                <span>{servicio.duracion} min</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Precio con excelente contraste en modo claro y oscuro */}
                <span className="text-xl sm:text-2xl font-black text-teal-700 dark:text-emerald-300 font-mono tracking-tight">
                  {formatCurrency(servicio.precio)}
                </span>

                {/* Acciones de edición / eliminación */}
                {(onEditar || onEliminar) && (
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-white/15">
                    {onEditar && (
                      <button
                        type="button"
                        onClick={() => onEditar(servicio)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-cyan-50 dark:bg-white/5 dark:hover:bg-cyan-500/20 text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-200 border border-slate-200 dark:border-white/10 transition-all cursor-pointer shadow-sm"
                        title="Editar servicio"
                        aria-label="Editar"
                      >
                        <Edit2 size={13} strokeWidth={2.2} />
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Seguro que deseas eliminar el procedimiento "${servicio.nombre}"?`
                            )
                          ) {
                            onEliminar(servicio.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/20 text-slate-600 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-200 border border-slate-200 dark:border-white/10 transition-all cursor-pointer shadow-sm"
                        title="Eliminar servicio"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}