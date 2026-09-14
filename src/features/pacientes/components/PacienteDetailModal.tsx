import type { Paciente } from "../../../types/pacientes";
import { X, Calendar, Phone, Mail, FileText, Activity, AlertTriangle, ShieldCheck, Clock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getUserRole } from "../../../utils/routePermissions";

interface PacienteDetailModalProps {
  paciente: Paciente | null;
  onClose: () => void;
}

export function PacienteDetailModal({ paciente, onClose }: PacienteDetailModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = getUserRole(user);
  const isClinicianOrAdmin = role === "ADMINISTRADOR" || role === "ODONTOLOGO";

  if (!paciente) return null;

  const getInitials = (nombre: string) => {
    const parts = nombre.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Contenedor Integrado y Adaptable a Modo Claro y Oscuro */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-slate-900 dark:text-slate-100 space-y-6">
        {/* Botón cerrar discreto en esquina superior derecha */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label="Cerrar modal"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Cabecera: Avatar (Foto o Iniciales Elegantes) + Nombre Elegante + Datos */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {paciente.fotoUrl ? (
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border border-slate-200 dark:border-white/20 shadow-md ring-1 ring-slate-200 dark:ring-white/10 shrink-0">
              <img
                src={paciente.fotoUrl}
                alt={paciente.nombre}
                className="h-full w-full object-cover grayscale contrast-125 brightness-95"
              />
            </div>
          ) : (
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border border-teal-500/40 dark:border-cyan-400/40 bg-gradient-to-br from-teal-500/15 via-cyan-500/15 to-blue-500/15 text-teal-800 dark:text-cyan-200 font-sans text-2xl sm:text-3xl font-bold shadow-md ring-1 ring-slate-200 dark:ring-white/10 shrink-0">
              {getInitials(paciente.nombre)}
            </div>
          )}

          <div className="space-y-2 flex-1">
            {/* Nombre prominente + Estado cian sutil */}
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-sans text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {paciente.nombre}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold tracking-wide text-teal-700 dark:text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 dark:bg-cyan-400 animate-pulse" />
                {paciente.estado || "Activo"}
              </span>
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
            <p className="text-lg sm:text-xl font-sans font-black text-slate-900 dark:text-slate-100 leading-snug">
              {paciente.alergias || "Sin alergias declaradas"}
            </p>
            <p className="text-xs font-sans text-emerald-600 dark:text-emerald-400 font-medium">
              Estado de salud verificado
            </p>
          </div>
        </div>

        {/* Acciones: Enlaces interactivos con micro-animaciones según rol */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/citas");
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
                  navigate("/odontograma");
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
                  navigate("/historia-clinica");
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
    </div>
  );
}
