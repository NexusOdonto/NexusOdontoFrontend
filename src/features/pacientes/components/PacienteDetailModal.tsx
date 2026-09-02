import type { Paciente } from "../../../types/pacientes";
import { X, Calendar, Phone, Mail, FileText, Activity, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PacienteDetailModalProps {
  paciente: Paciente | null;
  onClose: () => void;
}

export function PacienteDetailModal({ paciente, onClose }: PacienteDetailModalProps) {
  const navigate = useNavigate();

  if (!paciente) return null;

  const getInitials = (nombre: string) => {
    const parts = nombre.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xl animate-fadeIn">
      {/* Contenedor Integrado y Semitransparente */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-slate-100 space-y-6">
        {/* Botón cerrar discreto en esquina superior derecha */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X size={18} strokeWidth={1.25} />
        </button>

        {/* Cabecera: Avatar (Foto o Iniciales Elegantes) + Nombre Elegante + Datos */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {paciente.fotoUrl ? (
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border border-white/20 shadow-md ring-1 ring-white/10 shrink-0">
              <img
                src={paciente.fotoUrl}
                alt={paciente.nombre}
                className="h-full w-full object-cover grayscale contrast-125 brightness-95"
              />
            </div>
          ) : (
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border border-cyan-400/40 bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 text-cyan-200 font-sans text-2xl sm:text-3xl font-bold shadow-md ring-1 ring-white/10 shrink-0">
              {getInitials(paciente.nombre)}
            </div>
          )}

          <div className="space-y-2 flex-1">
            {/* Nombre prominente + Estado cian sutil */}
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-sans text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight leading-tight">
                {paciente.nombre}
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-sans font-normal tracking-wide text-cyan-300/80">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                {paciente.estado || "Activo"}
              </span>
            </div>

            {/* Datos Personales: Sans Serif muy pequeña con iconos monocromáticos finos */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400 font-sans font-light tracking-wide pt-1">
              <span>Doc: {paciente.documento}</span>
              <span className="flex items-center gap-1.5">
                <Phone size={13} strokeWidth={1.25} className="text-slate-400" />
                {paciente.telefono}
              </span>
              {paciente.correo && (
                <span className="flex items-center gap-1.5">
                  <Mail size={13} strokeWidth={1.25} className="text-slate-400" />
                  {paciente.correo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secciones Principales: Próxima Cita & Alertas Médicas (Separadas por línea vertical fina) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/10 py-6 border-y border-white/10 my-6">
          {/* Próxima Cita */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-slate-400 font-sans">
              <Clock size={14} strokeWidth={1.25} className="text-slate-400" />
              <span>Próxima Cita</span>
            </div>
            <p className="text-lg sm:text-xl font-sans font-bold text-slate-100 leading-snug">
              {paciente.proximaCita || "Mañana a las 10:30 AM"}
            </p>
            <p className="text-xs font-sans text-slate-400 font-light">
              Dr. Roberto Silva — Limpieza Dental
            </p>
          </div>

          {/* Alertas Médicas */}
          <div className="space-y-1.5 pt-6 sm:pt-0 sm:pl-8">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-slate-400 font-sans">
              <AlertTriangle size={14} strokeWidth={1.25} className="text-slate-400" />
              <span>Alertas Médicas</span>
            </div>
            <p className="text-lg sm:text-xl font-sans font-bold text-slate-100 leading-snug">
              {paciente.alergias || "Sin alergias declaradas"}
            </p>
            <p className="text-xs font-sans text-slate-400 font-light">
              Estado de salud verificado
            </p>
          </div>
        </div>

        {/* Acciones: Enlaces de texto cobre suave en una sola fila */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/citas");
            }}
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-[#d4a373] hover:text-[#e6b88a] hover:underline underline-offset-4 decoration-[#d4a373]/40 transition-all cursor-pointer"
          >
            <Calendar size={14} strokeWidth={1.25} />
            <span>Agendar Cita</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/odontograma");
            }}
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-[#d4a373] hover:text-[#e6b88a] hover:underline underline-offset-4 decoration-[#d4a373]/40 transition-all cursor-pointer"
          >
            <Activity size={14} strokeWidth={1.25} />
            <span>Odontograma</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/historia-clinica");
            }}
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-[#d4a373] hover:text-[#e6b88a] hover:underline underline-offset-4 decoration-[#d4a373]/40 transition-all cursor-pointer"
          >
            <FileText size={14} strokeWidth={1.25} />
            <span>Historia Clínica</span>
          </button>
        </div>

        {/* Pie de Página: Copyright / Protección + Botón Fantasma de Cierre */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-sans tracking-wide uppercase font-light">
            <ShieldCheck size={13} strokeWidth={1.25} className="text-slate-500" />
            Expediente protegido por NexusOdonto Clinical Platform
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-full border border-white/20 hover:border-white/40 bg-transparent text-slate-300 hover:text-white text-xs font-sans font-light tracking-wide transition-all active:scale-95 cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
