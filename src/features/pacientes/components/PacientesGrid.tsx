import type { Paciente } from "../../../types/pacientes";
import { CalendarPlus, FileText, Phone, IdCard, Activity, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PacientesGridProps {
  pacientes: Paciente[];
  loading: boolean;
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSelectPaciente?: (paciente: Paciente) => void;
}

export function PacientesGrid({
  pacientes,
  loading,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onSelectPaciente,
}: PacientesGridProps) {
  const navigate = useNavigate();

  const getInitials = (nombre: string) => {
    const parts = nombre.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-card-${i}`}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-4 animate-pulse backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/10 rounded" />
              </div>
            </div>
            <div className="h-10 w-full bg-white/5 rounded-xl" />
            <div className="h-8 w-full bg-white/10 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (pacientes.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-white/10 bg-slate-900/30 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-cyan-400 text-2xl mb-3">
          ⌕
        </div>
        <h3 className="text-lg font-bold text-white">No se encontraron pacientes</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
          Intenta ajustar tu búsqueda por nombre, número de documento o teléfono.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pacientes.map((paciente, idx) => (
          <div
            key={paciente.id}
            className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 hover:bg-white dark:hover:bg-slate-950/85 p-5 transition-all duration-300 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 shadow-md hover:shadow-xl dark:shadow-2xl backdrop-blur-xl cursor-pointer animate-fadeIn animate-stagger-${(idx % 6) + 1}`}
            onClick={() => onSelectPaciente?.(paciente)}
          >
            {/* Header de la tarjeta */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 dark:from-teal-400/30 dark:via-cyan-400/30 dark:to-blue-500/30 border border-cyan-500/40 dark:border-cyan-400/50 text-cyan-800 dark:text-cyan-200 font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {getInitials(paciente.nombre)}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 dark:bg-emerald-400 border-2 border-white dark:border-slate-950" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {paciente.nombre}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      {paciente.estado || "Activo"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPaciente?.(paciente);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Ver Expediente Completo"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Datos Clave */}
              <div className="space-y-2 py-3 border-y border-slate-200/80 dark:border-white/15 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                    <IdCard size={14} className="text-cyan-600 dark:text-cyan-400" />
                    Documento:
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{paciente.documento}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                    <Phone size={14} className="text-cyan-600 dark:text-cyan-400" />
                    Teléfono:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{paciente.telefono || "No registrado"}</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="mt-4 pt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-cyan-50 dark:hover:bg-cyan-500/30 border border-slate-200/80 dark:border-white/20 hover:border-cyan-400/50 text-slate-700 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                title="Agendar Cita"
              >
                <CalendarPlus size={15} className="text-cyan-600 dark:text-cyan-400" />
                <span>Agendar</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/odontograma")}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-teal-50 dark:hover:bg-teal-500/30 border border-slate-200/80 dark:border-white/20 hover:border-teal-400/50 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                title="Ver Odontograma"
              >
                <Activity size={15} className="text-teal-600 dark:text-teal-400" />
                <span>Dientes</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/historia-clinica")}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-blue-50 dark:hover:bg-blue-500/30 border border-slate-200/80 dark:border-white/20 hover:border-blue-400/50 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm"
                title="Ver Historia Clínica"
              >
                <FileText size={15} className="text-blue-600 dark:text-blue-400" />
                <span>Historia</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINACIÓN EN VISTA DE TARJETAS */}
      {!loading && pacientes.length > 0 && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 pt-4 px-1">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de{" "}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
