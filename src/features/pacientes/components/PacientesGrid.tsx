import type { Paciente } from "../../../types/pacientes";
import { CalendarPlus, FileText, Phone, IdCard, Activity, MoreVertical, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getUserRole } from "../../../utils/routePermissions";
import { UserAvatar } from "../../../components/common/UserAvatar";

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
  const { user } = useAuth();
  const role = getUserRole(user);
  const isClinicianOrAdmin = role === "ADMINISTRADOR" || role === "ODONTOLOGO";

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-card-${i}`}
            className="h-[225px] w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900/40 p-5 flex flex-col justify-between animate-pulse backdrop-blur-md select-none"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-white/10 shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-white/10 rounded" />
                </div>
              </div>
              <div className="h-12 w-full bg-slate-200/50 dark:bg-white/5 rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="h-12 bg-slate-200 dark:bg-white/10 rounded-xl" />
              <div className="h-12 bg-slate-200 dark:bg-white/10 rounded-xl" />
              <div className="h-12 bg-slate-200 dark:bg-white/10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (pacientes.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/30 dark:bg-slate-900/30 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-cyan-600 dark:text-cyan-400 text-2xl mb-3">
          ⌕
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron pacientes</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          Intenta ajustar tu búsqueda por nombre, número de documento o teléfono.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pacientes.map((paciente, idx) => {
          const isActivo =
            paciente.estado?.toLowerCase() === "activo" ||
            ((paciente as any).isActive !== false && paciente.estado?.toLowerCase() !== "inactivo");

          return (
            <div
              key={paciente.id}
              className={`group relative h-[225px] w-full flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 hover:bg-white dark:hover:bg-slate-950/85 p-5 transition-all duration-300 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 shadow-md hover:shadow-xl dark:shadow-2xl backdrop-blur-xl cursor-pointer select-none animate-fadeIn animate-stagger-${(idx % 6) + 1}`}
              onClick={() => onSelectPaciente?.(paciente)}
            >
              {/* Header de la tarjeta */}
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/40 dark:border-cyan-400/50 shadow-sm overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <UserAvatar
                          name={paciente.nombre}
                          avatar={paciente.fotoUrl}
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full flex items-center justify-center"
                        />
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-950 shadow-sm transition-colors ${
                          isActivo
                            ? "bg-emerald-500 dark:bg-emerald-400"
                            : "bg-rose-500 dark:bg-rose-400"
                        }`}
                        title={isActivo ? "Paciente Activo" : "Paciente Inactivo"}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors truncate"
                        title={paciente.nombre}
                      >
                        {paciente.nombre}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          isActivo
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            isActivo
                              ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse"
                              : "bg-rose-500 dark:bg-rose-400"
                          }`}
                        />
                        <span className="truncate">{isActivo ? "Activo" : "Inactivo"}</span>
                      </span>
                    </div>
                  </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPaciente?.(paciente);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title="Ver Expediente Completo"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Datos Clave */}
              <div className="space-y-1.5 py-2.5 border-y border-slate-200/80 dark:border-white/15 text-xs text-slate-700 dark:text-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300 shrink-0">
                    <IdCard size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>Documento:</span>
                  </span>
                  <span
                    className="font-mono font-semibold text-slate-900 dark:text-white truncate max-w-[55%] text-right"
                    title={paciente.documento}
                  >
                    {paciente.documento}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-300 shrink-0">
                    <Phone size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>Teléfono:</span>
                  </span>
                  <span
                    className="font-semibold text-slate-900 dark:text-white truncate max-w-[55%] text-right"
                    title={paciente.telefono || "No registrado"}
                  >
                    {paciente.telefono || "No registrado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas adaptadas según rol */}
            <div className="mt-auto pt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/citas?action=agendar&paciente=${encodeURIComponent(paciente.nombre)}&cedula=${encodeURIComponent(paciente.documento)}&pacienteId=${encodeURIComponent(paciente.patientId || String(paciente.id))}`, {
                    state: {
                      openAgendar: true,
                      paciente: paciente.nombre,
                      pacienteCedula: paciente.documento,
                      pacienteId: paciente.patientId || String(paciente.id),
                    },
                  });
                }}
                className="flex flex-col items-center justify-center gap-1 h-12 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-cyan-50 dark:hover:bg-cyan-500/30 border border-slate-200/80 dark:border-white/20 hover:border-cyan-400/50 text-slate-700 dark:text-slate-200 hover:text-cyan-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm overflow-hidden"
                title="Agendar Cita"
              >
                <CalendarPlus size={15} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                <span className="truncate w-full text-center">Agendar</span>
              </button>

              {isClinicianOrAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/odontograma?pacienteId=${encodeURIComponent(paciente.patientId || String(paciente.id))}&documento=${encodeURIComponent(paciente.documento)}&paciente=${encodeURIComponent(paciente.nombre)}`, {
                        state: {
                          patientId: paciente.patientId || String(paciente.id),
                          patientName: paciente.nombre,
                          patientDocument: paciente.documento,
                        },
                      });
                    }}
                    className="flex flex-col items-center justify-center gap-1 h-12 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-teal-50 dark:hover:bg-teal-500/30 border border-slate-200/80 dark:border-white/20 hover:border-teal-400/50 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm overflow-hidden"
                    title="Ver Odontograma"
                  >
                    <Activity size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="truncate w-full text-center">Dientes</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/historia-clinica?pacienteId=${encodeURIComponent(paciente.patientId || String(paciente.id))}&documento=${encodeURIComponent(paciente.documento)}&paciente=${encodeURIComponent(paciente.nombre)}`, {
                        state: {
                          patientId: paciente.patientId || String(paciente.id),
                          patientName: paciente.nombre,
                          patientDocument: paciente.documento,
                        },
                      });
                    }}
                    className="flex flex-col items-center justify-center gap-1 h-12 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-blue-50 dark:hover:bg-blue-500/30 border border-slate-200/80 dark:border-white/20 hover:border-blue-400/50 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm overflow-hidden"
                    title="Ver Historia Clínica"
                  >
                    <FileText size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate w-full text-center">Historia</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPaciente?.(paciente);
                    }}
                    className="flex flex-col items-center justify-center gap-1 h-12 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-teal-50 dark:hover:bg-teal-500/30 border border-slate-200/80 dark:border-white/20 hover:border-teal-400/50 text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm overflow-hidden"
                    title="Ver Ficha del Paciente"
                  >
                    <Eye size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="truncate w-full text-center">Ver Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (paciente.telefono) {
                        window.open(`tel:${paciente.telefono}`);
                      } else {
                        onSelectPaciente?.(paciente);
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-1 h-12 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 hover:bg-emerald-50 dark:hover:bg-emerald-500/30 border border-slate-200/80 dark:border-white/20 hover:border-emerald-400/50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-white transition-all text-[11px] font-semibold cursor-pointer active:scale-95 shadow-sm overflow-hidden"
                    title={paciente.telefono ? `Llamar a ${paciente.telefono}` : "Sin teléfono registrado"}
                  >
                    <Phone size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate w-full text-center">Contactar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
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
