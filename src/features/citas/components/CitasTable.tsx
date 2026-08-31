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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pendiente
        </span>
      );
    case "Confirmada":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          Confirmada
        </span>
      );
    case "En Atención":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          En Atención
        </span>
      );
    case "Completada":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <CheckCircle size={13} />
          Completada
        </span>
      );
    case "Cancelada":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
          <XCircle size={13} />
          Cancelada
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-300">
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
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="space-y-1.5">
                <div className="w-32 h-4 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="w-24 h-6 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    );
  }

  if (citas.length === 0) {
    return (
      <div className="flex min-h-60 w-full flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
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
      {/* TABLA ESCRITORIO */}
      <div className="hidden min-w-[950px] md:block">
        {/* CABECERA */}
        <div className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1.1fr_120px_160px] border-y border-slate-200/80 bg-slate-50/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
          <div>Paciente</div>
          <div>Fecha y Hora</div>
          <div>Profesional</div>
          <div>Servicio / Motivo</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        {/* FILAS */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1.1fr_120px_160px] items-center px-5 py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
            >
              {/* PACIENTE */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
                  <UserRound size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cita.paciente}
                  </p>
                  {cita.pacienteCedula && (
                    <p className="text-[11px] text-slate-400">CC: {cita.pacienteCedula}</p>
                  )}
                </div>
              </div>

              {/* FECHA Y HORA */}
              <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                  <CalendarDays size={14} className="text-teal-500" />
                  <span>{formatearFecha(cita.fecha)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock3 size={13} />
                  <span>{formatearHora(cita.hora)}</span>
                </div>
              </div>

              {/* PROFESIONAL */}
              <div className="text-xs text-slate-700 dark:text-slate-300 pr-2">
                {cita.profesional ? (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Stethoscope size={14} className="text-cyan-500" />
                    {cita.profesional}
                  </span>
                ) : (
                  <span className="italic text-amber-500/90 text-xs">Por asignar</span>
                )}
              </div>

              {/* SERVICIO / MOTIVO */}
              <div className="text-xs text-slate-700 dark:text-slate-300 pr-2 min-w-0">
                <p className="font-medium truncate text-slate-900 dark:text-slate-100">{cita.servicio}</p>
                {cita.motivo && <p className="truncate text-[11px] text-slate-400">{cita.motivo}</p>}
              </div>

              {/* ESTADO */}
              <div>{estadoBadge(cita.estado)}</div>

              {/* ACCIONES SEGÚN ROL */}
              <div className="flex items-center justify-end gap-1.5 text-xs">
                {/* 1. PACIENTE */}
                {isPaciente && (
                  <>
                    {(cita.estado === "Pendiente" || cita.estado === "Confirmada") && onUpdateStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(cita.id, "Cancelada")}
                        className="px-2.5 py-1 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
                        title="Cancelar mi cita"
                      >
                        Cancelar
                      </button>
                    )}
                    {cita.estado === "Completada" && (
                      <span className="text-[11px] text-teal-400 font-medium">Finalizada</span>
                    )}
                  </>
                )}

                {/* 2. RECEPCIONISTA / ADMIN */}
                {(isRecepcionista || isAdmin) && (
                  <>
                    {cita.estado === "Pendiente" && onOpenAssignModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal(cita)}
                        className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition-colors cursor-pointer shadow-sm"
                      >
                        Asignar / Aprobar
                      </button>
                    )}
                    {cita.estado === "Confirmada" && onUpdateStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(cita.id, "Cancelada")}
                        className="px-2.5 py-1 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </>
                )}

                {/* 3. ODONTÓLOGO */}
                {isOdontologo && onUpdateStatus && (
                  <>
                    {cita.estado === "Confirmada" && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(cita.id, "En Atención")}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer shadow-sm"
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
                          className="p-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 transition-colors cursor-pointer"
                          title="Abrir Odontograma"
                        >
                          <Smile size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/historia-clinica")}
                          className="p-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 transition-colors cursor-pointer"
                          title="Abrir Historia Clínica"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(cita.id, "Completada")}
                          className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors cursor-pointer"
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

      {/* VISTA MÓVIL (TARJETAS) */}
      <div className="space-y-3 p-3 md:hidden">
        {citas.map((cita) => (
          <div
            key={cita.id}
            className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{cita.paciente}</p>
                <p className="text-xs text-slate-500">{cita.servicio}</p>
              </div>
              {estadoBadge(cita.estado)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block">Fecha:</span>
                <span className="font-medium">{formatearFecha(cita.fecha)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Hora:</span>
                <span className="font-medium">{formatearHora(cita.hora)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">Profesional:</span>
                <span className="font-medium text-cyan-500">{cita.profesional || "Por asignar"}</span>
              </div>
            </div>

            {/* Acciones Móvil */}
            {(isRecepcionista || isAdmin) && cita.estado === "Pendiente" && onOpenAssignModal && (
              <button
                type="button"
                onClick={() => onOpenAssignModal(cita)}
                className="w-full py-2 rounded-xl bg-teal-500 text-slate-950 font-semibold text-xs text-center"
              >
                Aprobar y Asignar Doctor
              </button>
            )}

            {isOdontologo && cita.estado === "Confirmada" && onUpdateStatus && (
              <button
                type="button"
                onClick={() => onUpdateStatus(cita.id, "En Atención")}
                className="w-full py-2 rounded-xl bg-blue-500 text-white font-semibold text-xs text-center"
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