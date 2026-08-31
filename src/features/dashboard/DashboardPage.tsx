import {
  CalendarDays,
  Users,
  CheckCircle,
  AlertCircle,
  Activity,
  Smile,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = getUserRole(user);

  const isPaciente = role === "PACIENTE";
  const isOdontologo = role === "ODONTOLOGO";
  const isRecepcionista = role === "RECEPCIONISTA";
  const isAdmin = role === "ADMINISTRADOR";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* BANNER DE BIENVENIDA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-teal-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Panel {role}
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            ¡Hola, {user?.nombre || user?.name || "Usuario"}! 👋
          </h1>
          <p className="text-sm md:text-base text-teal-100/90 leading-relaxed">
            {isPaciente && "Bienvenido a tu portal de salud dental. Consulta tus próximas citas y gestiona tus tratamientos."}
            {isOdontologo && "Bienvenido a tu estación clínica. Tienes pacientes programados para consulta y evolución odontológica."}
            {isRecepcionista && "Panel de recepción activo. Gestiona solicitudes de citas, asignaciones médicas y admisiones."}
            {isAdmin && "Centro de control general. Supervisión de métricas, seguridad y administración de personal."}
          </p>
        </div>

        {/* Decoración geométrica de fondo */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* TARJETAS DE MÉTRICAS SEGÚN ROL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. PACIENTE */}
        {isPaciente && (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Próxima Cita</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">15 Sep - 10:00 AM</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Tratamiento Actual</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">Limpieza & Prevención</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Citas Completadas</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">3 Atenciones</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <Smile size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Estado Dental</p>
                <p className="text-base font-bold text-emerald-500">Saludable</p>
              </div>
            </div>
          </>
        )}

        {/* 2. ODONTÓLOGO */}
        {isOdontologo && (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Pacientes Hoy</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">4 Citas</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">En Atención</p>
                <p className="text-2xl font-bold text-teal-500">1 Activo</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                <Smile size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Odontogramas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">18 Evoluciones</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Completadas este mes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">42 Citas</p>
              </div>
            </div>
          </>
        )}

        {/* 3. RECEPCIÓN / ADMIN */}
        {(isRecepcionista || isAdmin) && (
          <>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold text-amber-500">2 Nuevas</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Citas Confirmadas Hoy</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">12 Citas</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Pacientes Registrados</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">128 Activos</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Eficiencia Operativa</p>
                <p className="text-2xl font-bold text-emerald-500">98.5%</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap size={18} className="text-teal-500" />
          Accesos Rápidos Recomendados
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {isPaciente && (
            <>
              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="p-4 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-semibold text-sm flex items-center justify-between transition-colors border border-teal-500/20 cursor-pointer"
              >
                <span>📅 Solicitar Nueva Cita</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/perfil")}
                className="p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold text-sm flex items-center justify-between transition-colors border border-blue-500/20 cursor-pointer"
              >
                <span>👤 Ver Mi Perfil y Citas</span>
                <span>→</span>
              </button>
            </>
          )}

          {isOdontologo && (
            <>
              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold text-sm flex items-center justify-between transition-colors border border-blue-500/20 cursor-pointer"
              >
                <span>🦷 Agenda de Pacientes de Hoy</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/odontograma")}
                className="p-4 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-semibold text-sm flex items-center justify-between transition-colors border border-cyan-500/20 cursor-pointer"
              >
                <span>😁 Abrir Odontograma</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/pacientes")}
                className="p-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold text-sm flex items-center justify-between transition-colors border border-purple-500/20 cursor-pointer"
              >
                <span>📋 Historias Clínicas</span>
                <span>→</span>
              </button>
            </>
          )}

          {(isRecepcionista || isAdmin) && (
            <>
              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-sm flex items-center justify-between transition-colors border border-amber-500/20 cursor-pointer"
              >
                <span>⏳ Revisar Solicitudes Pendientes</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/pacientes/nuevo")}
                className="p-4 rounded-2xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-semibold text-sm flex items-center justify-between transition-colors border border-teal-500/20 cursor-pointer"
              >
                <span>➕ Admitir Paciente Nuevo</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/servicios")}
                className="p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold text-sm flex items-center justify-between transition-colors border border-blue-500/20 cursor-pointer"
              >
                <span>💰 Catálogo de Tarifas y Servicios</span>
                <span>→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
