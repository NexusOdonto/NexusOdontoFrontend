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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-slate-900 dark:text-white space-y-6">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Cabecera del Paciente */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20">
            {getInitials(paciente.nombre)}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{paciente.nombre}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                {paciente.estado || "Activo"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
              <span><strong>Doc:</strong> {paciente.documento}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Phone size={12} className="text-cyan-600 dark:text-cyan-400" /> {paciente.telefono}</span>
              {paciente.correo && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Mail size={12} className="text-cyan-600 dark:text-cyan-400" /> {paciente.correo}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resumen Clínico & Próximas Atenciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Clock size={14} className="text-cyan-600 dark:text-cyan-400" />
                Próxima Cita
              </span>
              <span className="rounded-md bg-cyan-500/15 dark:bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-800 dark:text-cyan-300 font-bold">Agendada</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {paciente.proximaCita || "Mañana a las 10:30 AM"}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">Dr. Roberto Silva — Limpieza Dental</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" />
                Alertas Médicas
              </span>
            </div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {paciente.alergias || "Sin alergias declaradas"}
            </p>
            <span className="text-xs text-slate-500 dark:text-slate-400">Estado de salud verificado</span>
          </div>
        </div>

        {/* Accesos Directos de la Ficha Clínica */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Acciones de Gestión Clínica
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/citas");
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-cyan-500/15 dark:bg-cyan-500/20 hover:bg-cyan-500/25 border border-cyan-500/30 dark:border-cyan-400/40 text-cyan-800 dark:text-cyan-200 font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Calendar size={16} />
              <span>Agendar Cita</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/odontograma");
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-teal-500/15 dark:bg-teal-500/20 hover:bg-teal-500/25 border border-teal-500/30 dark:border-teal-400/40 text-teal-800 dark:text-teal-200 font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Activity size={16} />
              <span>Odontograma</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/historia-clinica");
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-blue-500/15 dark:bg-blue-500/20 hover:bg-blue-500/25 border border-blue-500/30 dark:border-blue-400/40 text-blue-800 dark:text-blue-200 font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <FileText size={16} />
              <span>Historia Clínica</span>
            </button>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500 dark:text-emerald-400" />
            Expediente protegido por NexusOdonto Clinical Platform
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-medium transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
