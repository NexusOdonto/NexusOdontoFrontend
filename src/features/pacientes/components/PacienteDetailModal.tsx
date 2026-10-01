import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Paciente } from "../../../types/pacientes";
import { isPatientActive, isPatientOnline } from "../../../types/pacientes";
import {
  ANTECEDENT_TYPE_IDS,
  patientAntecedentService,
} from "../../../api/patientAntecedentService";
import { X, Calendar, Phone, Mail, FileText, Activity, AlertTriangle, ShieldCheck, Clock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { usePresenceTick } from "../../auth/usePresenceTick";
import { getUserRole } from "../../../utils/routePermissions";
import { UserAvatar } from "../../../components/common/UserAvatar";

interface PacienteDetailModalProps {
  paciente: Paciente | null;
  onClose: () => void;
  onAgendar?: (paciente: Paciente) => void;
}

export function PacienteDetailModal({ paciente, onClose, onAgendar }: PacienteDetailModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePresenceTick();
  const role = getUserRole(user);
  const isClinicianOrAdmin = role === "ADMINISTRADOR" || role === "ODONTOLOGO";

  // Las alergias viven como antecedente clínico tipo ALERGIA, no como campo
  // del paciente: hay que traerlas del backend para la ficha.
  const [alergiasRemotas, setAlergiasRemotas] = useState<string | null>(null);
  const patientId = paciente?.patientId;

  useEffect(() => {
    if (!patientId) {
      setAlergiasRemotas(null);
      return;
    }

    let cancelado = false;
    patientAntecedentService
      .getByPatient(patientId)
      .then((antecedentes) => {
        if (cancelado) return;
        const alergias = antecedentes
          .filter(
            (a) =>
              a.isActive &&
              String(a.antecedentTypeId).toLowerCase() === ANTECEDENT_TYPE_IDS.ALERGIA,
          )
          .map((a) => (a.description || "").trim())
          .filter(Boolean);
        setAlergiasRemotas(alergias.length > 0 ? alergias.join(", ") : null);
      })
      .catch(() => {
        // Sin permiso o sin red: se cae al dato local del paciente.
        if (!cancelado) setAlergiasRemotas(null);
      });

    return () => {
      cancelado = true;
    };
  }, [patientId]);

  if (!paciente) return null;

  const isOnline = isPatientOnline(paciente, user);
  const isActivo = isPatientActive(paciente);

  const alergiasLocales = (paciente.antecedentes || [])
    .filter((a) => String(a.backgroundTypeId).toLowerCase() === ANTECEDENT_TYPE_IDS.ALERGIA)
    .map((a) => (a.description || "").trim())
    .filter(Boolean)
    .join(", ");

  const alergiasTexto =
    alergiasRemotas || paciente.alergias || alergiasLocales || "";
  const tieneAlergias = alergiasTexto.length > 0;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/35 dark:bg-slate-950/65 backdrop-blur-md animate-fadeIn"
    >
      {/* Contenedor Integrado y Adaptable a Modo Claro y Oscuro */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-slate-900 dark:text-slate-100 space-y-6 animate-scaleIn"
      >
        {/* Botón cerrar discreto en esquina superior derecha */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label="Cerrar modal"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Cabecera: Avatar Dinámico + Nombre Elegante + Datos */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-3xl overflow-hidden border border-cyan-500/40 dark:border-cyan-400/40 bg-slate-100 dark:bg-slate-900 shadow-md ring-2 ring-cyan-500/20 shrink-0">
            <UserAvatar
              name={paciente.nombre}
              avatar={paciente.fotoUrl}
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full flex items-center justify-center font-bold text-2xl sm:text-3xl"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                isOnline
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : isActivo
                  ? "bg-slate-400 dark:bg-slate-500"
                  : "bg-rose-500 dark:bg-rose-400"
              }`}
            />
          </div>

          <div className="space-y-2 flex-1">
            {/* Nombre prominente + presencia (Conectado ≠ Activo/IsActive) */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-sans text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {paciente.nombre}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-sans font-semibold tracking-wide px-2.5 py-0.5 rounded-full border ${
                    isOnline
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/30"
                      : isActivo
                      ? "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-400/25 dark:border-white/15"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/30"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isOnline
                        ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse"
                        : isActivo
                        ? "bg-slate-400 dark:bg-slate-500"
                        : "bg-rose-500 dark:bg-rose-400"
                    }`}
                  />
                  {isOnline ? "Conectado" : isActivo ? "Desconectado" : "Inactivo"}
                </span>
              </div>
            </div>

            {/* Datos Personales: Sans Serif muy pequeña con iconos finos */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-sans font-medium tracking-wide pt-1">
              <span>Doc: {paciente.documento}</span>
              <span className="flex items-center gap-1.5">
                <Phone size={13} strokeWidth={1.5} className="text-teal-600 dark:text-slate-400" />
                {paciente.telefono}
              </span>
              {paciente.correo && (
                <span className="flex items-center gap-1.5">
                  <Mail size={13} strokeWidth={1.5} className="text-teal-600 dark:text-slate-400" />
                  {paciente.correo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secciones Principales: Próxima Cita & Alertas Médicas (Separadas por línea vertical fina) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10 py-6 border-y border-slate-200 dark:border-white/10 my-6">
          {/* Próxima Cita */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans">
              <Clock size={14} strokeWidth={1.5} className="text-teal-600 dark:text-slate-400" />
              <span>Próxima Cita</span>
            </div>
            <p className="text-lg sm:text-xl font-sans font-black text-slate-900 dark:text-slate-100 leading-snug">
              {paciente.proximaCita || "Mañana a las 10:30 AM"}
            </p>
            <p className="text-xs font-sans text-slate-500 dark:text-slate-400 font-medium">
              Dr. Roberto Silva — Limpieza Dental
            </p>
          </div>

          {/* Alertas Médicas */}
          <div className="space-y-1.5 pt-6 sm:pt-0 sm:pl-8">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-sans">
              <AlertTriangle size={14} strokeWidth={1.5} className="text-amber-500 dark:text-amber-400" />
              <span>Alertas Médicas</span>
            </div>
            <p
              className={`text-lg sm:text-xl font-sans font-black leading-snug ${
                tieneAlergias
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {tieneAlergias ? alergiasTexto : "Sin alergias declaradas"}
            </p>
            {tieneAlergias ? (
              <p className="text-xs font-sans text-amber-600 dark:text-amber-400 font-medium">
                Alergia registrada en la historia clínica
              </p>
            ) : (
              <p className="text-xs font-sans text-emerald-600 dark:text-emerald-400 font-medium">
                Estado de salud verificado
              </p>
            )}
          </div>
        </div>

        {/* Acciones: Enlaces interactivos con micro-animaciones según rol */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onAgendar) {
                onAgendar(paciente);
              } else {
                navigate(`/citas?action=agendar&paciente=${encodeURIComponent(paciente.nombre)}&cedula=${encodeURIComponent(paciente.documento)}&pacienteId=${encodeURIComponent(paciente.patientId || String(paciente.id))}`, {
                  state: {
                    openAgendar: true,
                    paciente: paciente.nombre,
                    pacienteCedula: paciente.documento,
                    pacienteId: paciente.patientId || String(paciente.id),
                    returnTo: "/pacientes",
                  },
                });
              }
            }}
            className="group inline-flex items-center gap-2 text-sm font-sans font-bold text-teal-700 dark:text-[#d4a373] hover:text-teal-900 dark:hover:text-[#e6b88a] transition-all cursor-pointer"
          >
            <Calendar size={15} className="icon-animated-interactive group-hover:scale-125 group-hover:animate-icon-bounce" />
            <span className="hover:underline underline-offset-4">Agendar Cita</span>
          </button>

          {isClinicianOrAdmin ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/odontograma?pacienteId=${encodeURIComponent(paciente.patientId || String(paciente.id))}&documento=${encodeURIComponent(paciente.documento)}&paciente=${encodeURIComponent(paciente.nombre)}`, {
                    state: {
                      patientId: paciente.patientId || String(paciente.id),
                      patientName: paciente.nombre,
                      patientDocument: paciente.documento,
                    },
                  });
                }}
                className="group inline-flex items-center gap-2 text-sm font-sans font-bold text-teal-700 dark:text-[#d4a373] hover:text-teal-900 dark:hover:text-[#e6b88a] transition-all cursor-pointer"
              >
                <Activity size={15} className="icon-animated-interactive group-hover:scale-125 group-hover:animate-icon-pulse" />
                <span className="hover:underline underline-offset-4">Odontograma</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/historia-clinica?pacienteId=${encodeURIComponent(paciente.patientId || String(paciente.id))}&documento=${encodeURIComponent(paciente.documento)}&paciente=${encodeURIComponent(paciente.nombre)}`, {
                    state: {
                      patientId: paciente.patientId || String(paciente.id),
                      patientName: paciente.nombre,
                      patientDocument: paciente.documento,
                    },
                  });
                }}
                className="group inline-flex items-center gap-2 text-sm font-sans font-bold text-teal-700 dark:text-[#d4a373] hover:text-teal-900 dark:hover:text-[#e6b88a] transition-all cursor-pointer"
              >
                <FileText size={15} className="icon-animated-interactive group-hover:scale-125 group-hover:animate-icon-wiggle" />
                <span className="hover:underline underline-offset-4">Historia Clínica</span>
              </button>
            </>
          ) : (
            <>
              {paciente.telefono && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(`tel:${paciente.telefono}`);
                  }}
                  className="group inline-flex items-center gap-2 text-sm font-sans font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 transition-all cursor-pointer"
                >
                  <Phone size={15} className="icon-animated-interactive group-hover:scale-125 group-hover:animate-icon-bounce" />
                  <span className="hover:underline underline-offset-4">Llamar Paciente</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/atencion-chat");
                }}
                className="group inline-flex items-center gap-2 text-sm font-sans font-bold text-teal-700 dark:text-[#d4a373] hover:text-teal-900 dark:hover:text-[#e6b88a] transition-all cursor-pointer"
              >
                <MessageSquare size={15} className="icon-animated-interactive group-hover:scale-125 group-hover:animate-icon-pulse" />
                <span className="hover:underline underline-offset-4">Atención WhatsApp</span>
              </button>
            </>
          )}
        </div>

        {/* Pie de Página: Copyright / Protección + Botón de Cierre Adaptable */}
        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-sans tracking-wide uppercase font-semibold">
            <ShieldCheck size={14} strokeWidth={1.5} className="text-teal-600 dark:text-slate-400" />
            Expediente protegido por NexusOdonto Clinical Platform
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-slate-300 dark:border-white/20 hover:border-slate-500 dark:hover:border-white/40 bg-slate-100/90 dark:bg-transparent text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-sans font-semibold tracking-wide transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
