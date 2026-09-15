import { formatCurrency } from "../../../utils/currency";
import type { Servicio } from "../../../types/servicios";
import {
  Clock,
  Edit2,
  Trash2,
  XCircle,
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
        badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        Icon: Sparkles,
        iconColor: "text-purple-400",
        iconBg: "bg-purple-500/20 border-purple-500/30",
      };
    }
    if (cat.includes("operatoria") || cat.includes("resina")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        Icon: ShieldCheck,
        iconColor: "text-sky-400",
        iconBg: "bg-sky-500/20 border-sky-500/30",
      };
    }
    if (cat.includes("cirugía")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        Icon: Scissors,
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/20 border-amber-500/30",
      };
    }
    if (cat.includes("higiene") || cat.includes("prevención")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-teal-500/15 text-teal-300 border-teal-500/30",
        Icon: Smile,
        iconColor: "text-teal-400",
        iconBg: "bg-teal-500/20 border-teal-500/30",
      };
    }
    if (cat.includes("endodoncia")) {
      return {
        code,
        esFrecuente,
        categoria: servicio.categoria,
        badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        Icon: Activity,
        iconColor: "text-rose-400",
        iconBg: "bg-rose-500/20 border-rose-500/30",
      };
    }
  }

  // Fallback por nombre
  if (n.includes("blanqueamiento")) {
    return {
      code,
      esFrecuente,
      categoria: "Estética Dental",
      badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      Icon: Sparkles,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/20 border-purple-500/30",
    };
  }
  if (n.includes("resina") || n.includes("calza") || n.includes("restauracion")) {
    return {
      code,
      esFrecuente,
      categoria: "Operatoria Dental",
      badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
      Icon: ShieldCheck,
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/20 border-sky-500/30",
    };
  }
  if (n.includes("extracción") || n.includes("extraccion") || n.includes("cirugía") || n.includes("cirugia")) {
    return {
      code,
      esFrecuente,
      categoria: "Cirugía Oral",
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
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black border shadow-sm ${
                          servicio.activo
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30"
                            : "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {servicio.activo ? (
                          <>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} className="text-slate-400" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </span>
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
