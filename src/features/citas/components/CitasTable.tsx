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
  onOpenEditModal?: (cita: Cita) => void;
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pendiente
        </span>
      );
    case "Confirmada":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          Confirmada
        </span>
      );
    case "En Atención":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          En Atención
        </span>
      );
    case "Completada":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
          <CheckCircle size={13} />
          Completada
        </span>
      );
    case "Cancelada":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
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
  onOpenEditModal,
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
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 animate-pulse backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-white/10" />
              <div className="space-y-1.5">
                <div className="w-32 h-4 rounded bg-slate-300 dark:bg-white/10" />
                <div className="w-24 h-3 rounded bg-slate-200 dark:bg-white/5" />
              </div>
            </div>
            <div className="w-24 h-6 rounded-full bg-slate-300 dark:bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (citas.length === 0) {
    return (
      <div className="flex min-h-60 w-full flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
          <CalendarDays size={24} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          No hay citas registradas
        </h3>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400">
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
      <div className="hidden min-w-237.5 md:block">
        {/* CABECERA */}
        <div className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1.1fr_120px_160px] border-b border-slate-200/80 dark:border-white/15 bg-slate-100/75 dark:bg-slate-900/60 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <div>Paciente</div>
          <div>Fecha y Hora</div>
          <div>Profesional</div>
          <div>Servicio / Motivo</div>
          <div>Estado</div>
          <div className="text-right">Acciones</div>
        </div>

        {/* FILAS */}
        <div className="divide-y divide-slate-200/60 dark:divide-white/10">
          {citas.map((cita) => (
            <div
              key={cita.id}
              onClick={() => onOpenEditModal && onOpenEditModal(cita)}
              title="Haz clic para ver o editar los detalles de esta cita"
              className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1.1fr_120px_160px] items-center px-5 py-4 transition-all duration-200 hover:bg-teal-500/10 dark:hover:bg-cyan-400/10 cursor-pointer group"
            >
              {/* PACIENTE */}
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 dark:from-teal-400/30 dark:via-cyan-400/30 dark:to-blue-500/30 border border-cyan-500/40 dark:border-cyan-400/50 text-cyan-800 dark:text-cyan-200 font-extrabold shadow-sm group-hover:scale-105 transition-transform">
                  <UserRound size={16} className="text-teal-600 dark:text-teal-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {cita.paciente}
                  </p>
                  {cita.pacienteCedula && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">CC: {cita.pacienteCedula}</p>
                  )}
                </div>
              </div>

              {/* FECHA Y HORA */}
              <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                  <CalendarDays size={14} className="text-teal-600 dark:text-teal-400" />
                  <span>{formatearFecha(cita.fecha)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock3 size={13} />
                  <span>{formatearHora(cita.hora)}</span>
                </div>
              </div>

              {/* PROFESIONAL */}
              <div className="text-xs text-slate-700 dark:text-slate-300 pr-2">
                {cita.profesional ? (
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                    <Stethoscope size={14} className="text-cyan-600 dark:text-cyan-400" />
                    {cita.profesional}
                  </span>
                ) : (
                  <span className="italic text-amber-600 dark:text-amber-400 text-xs">Por asignar</span>
                )}
              </div>

              {/* SERVICIO / MOTIVO */}
              <div className="text-xs text-slate-700 dark:text-slate-300 pr-2 min-w-0">
                <p className="font-semibold truncate text-slate-900 dark:text-white">{cita.servicio}</p>
                {cita.motivo && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{cita.motivo}</p>}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(cita.id, "Cancelada");
                        }}
                        className="px-2.5 py-1 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all cursor-pointer text-xs font-semibold active:scale-95"
                        title="Cancelar mi cita"
                      >
                        Cancelar
                      </button>
                    )}
                    {cita.estado === "Completada" && (
                      <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">Finalizada</span>
                    )}
                  </>
                )}

                {/* 2. RECEPCIONISTA / ADMIN */}
                {(isRecepcionista || isAdmin) && (
                  <>
                    {cita.estado === "Pendiente" && onOpenAssignModal && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAssignModal(cita);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white dark:text-slate-950 font-bold transition-all cursor-pointer shadow-sm active:scale-95 text-xs"
                      >
                        Asignar / Aprobar
                      </button>
                    )}
                    {cita.estado === "Confirmada" && onUpdateStatus && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(cita.id, "Cancelada");
                        }}
                        className="px-2.5 py-1 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all cursor-pointer text-xs font-semibold active:scale-95"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(cita.id, "En Atención");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold transition-all cursor-pointer shadow-sm active:scale-95 text-xs"
                      >
                        <PlayCircle size={14} />
                        <span>Atender</span>
                      </button>
                    )}
                    {cita.estado === "En Atención" && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate("/odontograma")}
                          className="p-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer active:scale-95"
                          title="Abrir Odontograma"
                        >
                          <Smile size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/historia-clinica")}
                          className="p-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 transition-all cursor-pointer active:scale-95"
                          title="Abrir Historia Clínica"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(cita.id, "Completada")}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-all cursor-pointer shadow-sm active:scale-95 text-xs"
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
            onClick={() => onOpenEditModal && onOpenEditModal(cita)}
            className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md space-y-3 cursor-pointer hover:border-teal-500/50 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{cita.paciente}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{cita.servicio}</p>
              </div>
              {estadoBadge(cita.estado)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/80 dark:border-white/15">
              <div>
                <span className="text-[10px] text-slate-400 block">Fecha:</span>
                <span className="font-semibold">{formatearFecha(cita.fecha)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Hora:</span>
                <span className="font-semibold">{formatearHora(cita.hora)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">Profesional:</span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400">{cita.profesional || "Por asignar"}</span>
              </div>
            </div>

            {/* Acciones Móvil */}
            {(isRecepcionista || isAdmin) && cita.estado === "Pendiente" && onOpenAssignModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAssignModal(cita);
                }}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 text-white dark:text-slate-950 font-bold text-xs text-center shadow-md active:scale-95"
              >
                Aprobar y Asignar Doctor
              </button>
            )}

            {isOdontologo && cita.estado === "Confirmada" && onUpdateStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(cita.id, "En Atención");
                }}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs text-center shadow-md active:scale-95"
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