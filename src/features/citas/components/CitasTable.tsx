import {
  CalendarDays,
  Clock3,
  UserRound,
  Stethoscope,
  CheckCircle,
  XCircle,
  PlayCircle,
  FileText,
  Smile,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type Cita, type EstadoCita } from "../types";
import { useAuth } from "../../auth/AuthContext";
import { getUserRole } from "../../../utils/routePermissions";

interface CitasTableProps {
  citas: Cita[];
  loading: boolean;
  onOpenAssignModal?: (cita: Cita) => void;
  onUpdateStatus?: (citaId: number, nuevoEstado: EstadoCita) => void;
}

function formatearFecha(fecha: string) {
  if (!fecha) return "Sin fecha";

  const parts = fecha.split("-").map(Number);

  if (parts.length < 3) return fecha;

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatearHora(hora: string) {
  if (!hora) return "Por asignar";

  const parts = hora.split(":").map(Number);

  if (parts.length < 2) return hora;

  const [hours, minutes] = parts;
  const date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);

  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function estadoBadge(estado: EstadoCita) {
  switch (estado) {
    case "Pendiente":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-500 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pendiente
        </span>
      );

    case "Confirmada":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/15 px-2.5 py-1 text-xs font-semibold text-teal-500 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          Confirmada
        </span>
      );

    case "En Atención":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-500 backdrop-blur-md animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          En Atención
        </span>
      );

    case "Completada":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-500 dark:text-purple-300 backdrop-blur-md">
          <CheckCircle size={13} />
          Completada
        </span>
      );

    case "Cancelada":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-500 backdrop-blur-md">
          <XCircle size={13} />
          Cancelada
        </span>
      );

    default:
      return (
        <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-300 backdrop-blur-md">
          {estado}
        </span>
      );
  }
}

export function CitasTable({
  citas,
  loading,
  onOpenAssignModal,
  onUpdateStatus,
}: CitasTableProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = getUserRole(user);

  const isPaciente = role === "PACIENTE";
  const isOdontologo = role === "ODONTOLOGO";
  const isRecepcionista = role === "RECEPCIONISTA";
  const isAdmin = role === "ADMINISTRADOR";

  if (loading) {
    return (
      <div className="w-full space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl animate-pulse dark:bg-slate-950/20"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-300/50 dark:bg-white/10" />

              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-slate-300/50 dark:bg-white/10" />
                <div className="h-3 w-24 rounded bg-slate-200/50 dark:bg-white/5" />
              </div>
            </div>

            <div className="h-6 w-24 rounded-full bg-slate-300/50 dark:bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (citas.length === 0) {
    return (
      <div className="flex min-h-60 w-full flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-500 backdrop-blur-xl">
          <CalendarDays size={24} />
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          No hay citas registradas
        </h3>

        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {isPaciente
            ? "Aún no has solicitado citas. Haz clic en 'Solicitar Cita' para agendar tu atención."
            : "No se encontraron citas con los filtros seleccionados."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="hidden min-w-[950px] md:block">
        <div className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1.1fr_120px_160px] border-b border-white/10 bg-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 backdrop-blur-xl dark:text-slate-300">
          <div>Paciente</div>
          <div>Fecha y Hora</div>
          <div>Profesional</div>
          <div>Servicio / Motivo</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        <div className="divide-y divide-white/10">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1.1fr_120px_160px] items-center bg-white/5 px-5 py-4 transition-all duration-300 hover:bg-white/15 dark:bg-slate-950/10 dark:hover:bg-white/10"
            >
              <div className="flex min-w-0 items-center gap-3 pr-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-teal-500 backdrop-blur-xl">
                  <UserRound size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cita.paciente}
                  </p>

                  {cita.pacienteCedula && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      CC: {cita.pacienteCedula}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                  <CalendarDays size={14} className="text-teal-500" />
                  <span>{formatearFecha(cita.fecha)}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock3 size={13} />
                  <span>{formatearHora(cita.hora)}</span>
                </div>
              </div>

              <div className="pr-2 text-xs text-slate-700 dark:text-slate-300">
                {cita.profesional ? (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Stethoscope size={14} className="text-cyan-500" />
                    {cita.profesional}
                  </span>
                ) : (
                  <span className="text-xs italic text-amber-500">
                    Por asignar
                  </span>
                )}
              </div>

              <div className="min-w-0 pr-2 text-xs text-slate-700 dark:text-slate-300">
                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                  {cita.servicio}
                </p>

                {cita.motivo && (
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {cita.motivo}
                  </p>
                )}
              </div>

              <div>{estadoBadge(cita.estado)}</div>

              <div className="flex items-center justify-end gap-1.5 text-xs">
                {isPaciente && (
                  <>
                    {(cita.estado === "Pendiente" ||
                      cita.estado === "Confirmada") &&
                      onUpdateStatus && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStatus(cita.id, "Cancelada")
                          }
                          className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-red-500 backdrop-blur-md transition-colors hover:bg-red-500/15 cursor-pointer"
                          title="Cancelar mi cita"
                        >
                          Cancelar
                        </button>
                      )}

                    {cita.estado === "Completada" && (
                      <span className="text-[11px] font-medium text-teal-500">
                        Finalizada
                      </span>
                    )}
                  </>
                )}

                {(isRecepcionista || isAdmin) && (
                  <>
                    {cita.estado === "Pendiente" &&
                      onOpenAssignModal && (
                        <button
                          type="button"
                          onClick={() => onOpenAssignModal(cita)}
                          className="rounded-lg border border-teal-400/30 bg-teal-500/80 px-3 py-1 font-semibold text-slate-950 shadow-sm backdrop-blur-md transition-all hover:bg-teal-400 cursor-pointer"
                        >
                          Asignar / Aprobar
                        </button>
                      )}

                    {cita.estado === "Confirmada" &&
                      onUpdateStatus && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStatus(cita.id, "Cancelada")
                          }
                          className="rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-red-500 backdrop-blur-md transition-colors hover:bg-red-500/15 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                  </>
                )}

                {isOdontologo && onUpdateStatus && (
                  <>
                    {cita.estado === "Confirmada" && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateStatus(cita.id, "En Atención")
                        }
                        className="flex items-center gap-1 rounded-lg bg-blue-500/80 px-2.5 py-1 font-medium text-white shadow-sm backdrop-blur-md transition-all hover:bg-blue-500 cursor-pointer"
                      >
                        <PlayCircle size={13} />
                        <span>Atender</span>
                      </button>
                    )}

                    {cita.estado === "En Atención" && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate("/odontograma")}
                          className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-1 text-cyan-500 backdrop-blur-md transition-colors hover:bg-cyan-500/20 cursor-pointer"
                          title="Abrir Odontograma"
                        >
                          <Smile size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate("/historia-clinica")}
                          className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1 text-blue-500 backdrop-blur-md transition-colors hover:bg-blue-500/20 cursor-pointer"
                          title="Abrir Historia Clínica"
                        >
                          <FileText size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onUpdateStatus(cita.id, "Completada")
                          }
                          className="rounded-lg bg-emerald-500/80 px-2 py-1 font-bold text-slate-950 shadow-sm backdrop-blur-md transition-all hover:bg-emerald-400 cursor-pointer"
                        >
                          Completar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {citas.map((cita) => (
          <div
            key={cita.id}
            className="space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-xl dark:bg-slate-950/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {cita.paciente}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cita.servicio}
                </p>
              </div>

              {estadoBadge(cita.estado)}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  Fecha:
                </span>

                <span className="font-medium">
                  {formatearFecha(cita.fecha)}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  Hora:
                </span>

                <span className="font-medium">
                  {formatearHora(cita.hora)}
                </span>
              </div>

              <div className="col-span-2">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  Profesional:
                </span>

                <span className="font-medium text-cyan-500">
                  {cita.profesional || "Por asignar"}
                </span>
              </div>
            </div>

            {(isRecepcionista || isAdmin) &&
              cita.estado === "Pendiente" &&
              onOpenAssignModal && (
                <button
                  type="button"
                  onClick={() => onOpenAssignModal(cita)}
                  className="w-full rounded-xl border border-teal-400/30 bg-teal-500/80 py-2 text-center text-xs font-semibold text-slate-950 backdrop-blur-md cursor-pointer"
                >
                  Aprobar y Asignar Doctor
                </button>
              )}

            {isOdontologo &&
              cita.estado === "Confirmada" &&
              onUpdateStatus && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStatus(cita.id, "En Atención")
                  }
                  className="w-full rounded-xl bg-blue-500/80 py-2 text-center text-xs font-semibold text-white backdrop-blur-md cursor-pointer"
                >
                  Iniciar Consulta
                </button>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}