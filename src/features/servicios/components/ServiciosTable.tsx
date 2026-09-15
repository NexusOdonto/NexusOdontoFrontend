import { formatCurrency } from "../../../utils/currency";
import type { Servicio } from "../../../types/servicios";
import {
  Clock,
  Edit2,
  Trash2,
  Tag,
  Sparkles,
  ShieldCheck,
  Scissors,
  Smile,
  Activity,
  Stethoscope,
} from "lucide-react";

interface ServiciosTableProps {
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
        iconColor: "text-purple-600 dark:text-purple-400",
        iconBg: "bg-purple-500/15 border-purple-500/30",
      };
    }
    if (cat.includes("operatoria") || cat.includes("resina")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
        Icon: ShieldCheck,
        iconColor: "text-sky-600 dark:text-sky-400",
        iconBg: "bg-sky-500/15 border-sky-500/30",
      };
    }
    if (cat.includes("cirugía")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        Icon: Scissors,
        iconColor: "text-amber-600 dark:text-amber-400",
        iconBg: "bg-amber-500/15 border-amber-500/30",
      };
    }
    if (cat.includes("higiene") || cat.includes("prevención")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
        Icon: Smile,
        iconColor: "text-teal-600 dark:text-teal-400",
        iconBg: "bg-teal-500/15 border-teal-500/30",
      };
    }
    if (cat.includes("endodoncia")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        Icon: Activity,
        iconColor: "text-rose-600 dark:text-rose-400",
        iconBg: "bg-rose-500/15 border-rose-500/30",
      };
    }
  }

  // Fallback por nombre
  if (n.includes("blanqueamiento")) {
    return {
      code,
      esFrecuente,
      categoria: "Estética Dental",
      badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
      Icon: Sparkles,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/15 border-purple-500/30",
    };
  }
  if (n.includes("resina") || n.includes("calza") || n.includes("restauracion")) {
    return {
      code,
      esFrecuente,
      categoria: "Operatoria Dental",
      badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
      Icon: ShieldCheck,
      iconColor: "text-sky-600 dark:text-sky-400",
      iconBg: "bg-sky-500/15 border-sky-500/30",
    };
  }
  if (n.includes("extracción") || n.includes("extraccion") || n.includes("cirugía") || n.includes("cirugia")) {
    return {
      code,
      esFrecuente,
      categoria: "Cirugía Oral",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      Icon: Scissors,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/15 border-amber-500/30",
    };
  }
  if (n.includes("profilaxis") || n.includes("limpieza") || n.includes("detartraje")) {
    return {
      code,
      esFrecuente,
      categoria: "Higiene y Prevención",
      badgeClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
      Icon: Smile,
      iconColor: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-500/15 border-teal-500/30",
    };
  }
  if (n.includes("endodoncia") || n.includes("conducto")) {
    return {
      code,
      esFrecuente,
      categoria: "Endodoncia",
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      Icon: Activity,
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-500/15 border-rose-500/30",
    };
  }
  return {
    code,
    esFrecuente,
    categoria: "Odontología General",
    badgeClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    Icon: Stethoscope,
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBg: "bg-cyan-500/15 border-cyan-500/30",
  };
}

export function ServiciosTable({
  servicios,
  onEditar,
  onEliminar,
  onToggleActivo,
}: ServiciosTableProps) {
  if (servicios.length === 0) {
    return (
      <div className="flex min-h-60 w-full flex-col items-center justify-center py-16 text-center rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/85 dark:bg-slate-950/80 backdrop-blur-2xl shadow-lg">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
          <Tag size={24} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          No se encontraron servicios
        </h3>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Intenta ajustar los criterios de búsqueda o filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.04] text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <th className="py-4 px-5">Código</th>
              <th className="py-4 px-5">Procedimiento Odontológico</th>
              <th className="py-4 px-5">Especialidad</th>
              <th className="py-4 px-5">Duración</th>
              <th className="py-4 px-5">Tarifa Oficial</th>
              <th className="py-4 px-5">Estado</th>
              {(onEditar || onEliminar) && <th className="py-4 px-5 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 dark:divide-white/10 text-xs sm:text-sm">
            {servicios.map((servicio) => {
              const details = getServiceDetails(servicio);
              const { Icon } = details;

              return (
                <tr
                  key={servicio.id}
                  className={`hover:bg-slate-50/60 dark:hover:bg-white/[0.05] transition-colors ${
                    !servicio.activo ? "opacity-60" : ""
                  }`}
                >
                  {/* Código */}
                  <td className="py-4 px-5 font-mono text-xs text-cyan-700 dark:text-cyan-300 font-black whitespace-nowrap tracking-wider">
                    {details.code}
                  </td>

                  {/* Procedimiento */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`h-11 w-11 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${details.iconBg}`}
                      >
                        <Icon size={20} className={details.iconColor} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 dark:text-white leading-tight">
                            {servicio.nombre}
                          </span>
                          {details.esFrecuente && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/15 border border-amber-500/30 dark:text-amber-300 dark:bg-amber-500/20 px-2 py-0.5 rounded-md">
                              Frecuente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 max-w-md font-medium">
                          {servicio.descripcion || "Sin descripción clínica registrada."}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Especialidad / Categoría */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${details.badgeClass}`}
                    >
                      <Tag size={12} />
                      <span>{details.categoria}</span>
                    </span>
                  </td>

                  {/* Duración */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 font-mono font-bold">
                      <Clock size={13} className="text-cyan-600 dark:text-cyan-400" />
                      <span>{servicio.duracion} min</span>
                    </span>
                  </td>

                  {/* Tarifa Oficial */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="font-mono font-black text-base text-teal-700 dark:text-emerald-300">
                      {formatCurrency(servicio.precio)}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    {onToggleActivo ? (
                      <button
                        type="button"
                        onClick={() => onToggleActivo(servicio)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border transition-all cursor-pointer shadow-sm ${
                          servicio.activo
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25"
                            : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                        }`}
                        title={servicio.activo ? "Clic para desactivar" : "Clic para activar"}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            servicio.activo ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <span>{servicio.activo ? "Activo" : "Inactivo"}</span>
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
                          servicio.activo
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30"
                            : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            servicio.activo ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        <span>{servicio.activo ? "Activo" : "Inactivo"}</span>
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  {(onEditar || onEliminar) && (
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {onEditar && (
                          <button
                            type="button"
                            onClick={() => onEditar(servicio)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-cyan-50 dark:bg-white/5 dark:hover:bg-cyan-500/20 text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-200 transition-all border border-slate-200 dark:border-white/10 cursor-pointer shadow-sm"
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
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-500/20 text-slate-600 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-200 transition-all border border-slate-200 dark:border-white/10 cursor-pointer shadow-sm"
                            title="Eliminar servicio"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={13} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
