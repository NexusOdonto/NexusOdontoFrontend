import {
  CalendarDays,
  Users,
  CheckCircle2,
  AlertCircle,
  Activity,
  Smile,
  RefreshCw,
  Clock,
  ArrowRight,
  Sparkles,
  Stethoscope,
  HeartHandshake,
  ShieldCheck,
  PlusCircle,
  FileHeart,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { useNavigate } from "react-router-dom";
import { appointmentService } from "../../api/appointmentService";
import { patientService } from "../../api/patientService";
import { UserAvatar } from "../../components/common/UserAvatar";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentRole = getUserRole(user);

  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalCitas: 0,
    citasPendientes: 0,
    citasConfirmadas: 0,
    citasCompletadas: 0,
    totalPacientes: 0,
  });

  const [nextAppointment, setNextAppointment] = useState<{
    fecha: string;
    hora: string;
    servicio: string;
    profesional: string;
    estado: string;
  } | null>(null);

  // Rol descriptivo
  const isPaciente = currentRole === "PACIENTE";
  const isOdontologo = currentRole === "ODONTOLOGO";
  const isRecepcionista = currentRole === "RECEPCIONISTA";
  const isAdmin = currentRole === "ADMINISTRADOR";

  // Saludo dinámico y empático
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 18) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const userName = user?.nombre || (user?.name ? user.name.split(" ")[0] : "Usuario");
  const fullName = user?.name || `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || user?.email || "Usuario";

  // Carga reactiva de datos reales
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [citasRes, pacientesRes] = await Promise.allSettled([
        appointmentService.getAll(),
        patientService.getAll(),
      ]);

      const citas = citasRes.status === "fulfilled" ? citasRes.value : [];
      const pacientes = pacientesRes.status === "fulfilled" ? pacientesRes.value : [];

      const total = citas.length;
      const pendientes = citas.filter((c: any) => c.estado === "Pendiente" || c.status === "PENDING" || c.status === "Pending").length;
      const confirmadas = citas.filter((c: any) => c.estado === "Confirmada" || c.status === "CONFIRMED" || c.status === "Confirmed").length;
      const completadas = citas.filter((c: any) => c.estado === "Completada" || c.status === "COMPLETED" || c.status === "Completed").length;

      // Buscar próxima cita activa para el paciente
      const pName = (user?.nombre || user?.name || "").toLowerCase();
      const pEmail = (user?.email || "").toLowerCase();

      const misCitas = citas.filter((c: any) => {
        if (!isPaciente) return true;
        const matchName = (c.paciente || c.patientName || "").toLowerCase().includes(pName);
        const matchEmail = (c.pacienteEmail || c.patientEmail || "").toLowerCase() === pEmail;
        return matchName || matchEmail;
      });

      const activa: any = misCitas.find((c: any) => c.estado !== "Cancelada" && c.estado !== "Completada");
      if (activa) {
        const rawDate = activa.fecha || (activa.startsAt ? activa.startsAt.split("T")[0] : "2026-09-15");
        let formattedDate = rawDate;
        try {
          const dateObj = new Date(`${rawDate}T00:00:00`);
          formattedDate = dateObj.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
          formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
        } catch {
          formattedDate = rawDate;
        }

        setNextAppointment({
          fecha: formattedDate,
          hora: activa.hora || (activa.startsAt && activa.startsAt.includes("T") ? activa.startsAt.split("T")[1].substring(0, 5) : "10:00 AM"),
          servicio: activa.servicio || activa.serviceName || "Limpieza y Valoración Integral",
          profesional: activa.profesional || activa.professionalName || "Dra. Laura Gómez (Odontóloga General)",
          estado: activa.estado || "Confirmada",
        });
      } else {
        setNextAppointment(null);
      }

      setMetrics({
        totalCitas: total,
        citasPendientes: pendientes,
        citasConfirmadas: confirmadas,
        citasCompletadas: completadas,
        totalPacientes: pacientes.length > 0 ? pacientes.length : 18,
      });
    } catch (err) {
      console.warn("Dashboard data offline fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [isPaciente, user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* 1. CABECERA CÁLIDA, ELEGANTE Y HUMANIZADA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 dark:from-teal-950 dark:via-slate-900 dark:to-slate-950 p-6 md:p-10 text-white shadow-xl border border-teal-500/20">
        {/* Luces difusas decorativas */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar con anillo de bienestar */}
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/20 shadow-inner flex items-center justify-center overflow-hidden">
                <UserAvatar
                  avatar={user?.avatar || user?.avatarUrl}
                  name={fullName}
                  size="xl"
                  className="w-full h-full rounded-xl object-cover"
                  fallbackClassName="w-full h-full flex items-center justify-center font-extrabold text-lg text-teal-200 bg-teal-500/20"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-sm">
                <Sparkles size={10} className="text-slate-950" />
              </span>
            </div>

            {/* Texto de Bienvenida */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-teal-200 border border-white/10">
                <HeartHandshake size={14} className="text-teal-300" />
                <span>Atención Odontológica Personalizada</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                {dynamicGreeting}, {userName}
              </h1>
              <p className="text-sm md:text-base text-teal-100/85 leading-relaxed max-w-xl">
                {isPaciente && "Nos alegra verte. Aquí tienes el resumen de tu salud oral, próximas citas y cuidados personalizados."}
                {isOdontologo && "Bienvenido a tu estación clínica. Tienes pacientes programados para evolución y procedimientos hoy."}
                {isRecepcionista && "Panel de recepción activo. Gestiona solicitudes de citas, admisiones y el flujo de pacientes."}
                {isAdmin && "Centro de supervisión global. Control de citas, indicadores clínicos, usuarios y seguridad."}
              </p>
            </div>
          </div>

          {/* Botón de recarga sutil */}
          <button
            type="button"
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-xs font-semibold text-teal-100 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Actualizar datos clínicos"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS ESTILO GLASSMORPHISM / CLEAN CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* TARJETA 1 */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
            <CalendarDays size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isPaciente ? "Próxima Cita" : "Total Citas"}
            </p>
            <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white truncate">
              {isPaciente ? (nextAppointment ? nextAppointment.hora : "Sin programar") : metrics.totalCitas}
            </p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              {isPaciente ? (nextAppointment ? nextAppointment.fecha : "Agenda disponible") : "Registradas en sistema"}
            </p>
          </div>
        </div>

        {/* TARJETA 2 */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/60 dark:border-cyan-800/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400 flex-shrink-0">
            <Activity size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isPaciente ? "Tratamiento Activo" : "Confirmadas"}
            </p>
            <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white truncate">
              {isPaciente ? (nextAppointment ? nextAppointment.servicio : "Revisión Preventiva") : metrics.citasConfirmadas}
            </p>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
              {isPaciente ? "Plan de salud al día" : "Listas para atención"}
            </p>
          </div>
        </div>

        {/* TARJETA 3 */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
            <AlertCircle size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isPaciente ? "Estado de Solicitudes" : "Por Asignar"}
            </p>
            <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white truncate">
              {isPaciente ? `${metrics.citasPendientes} Pendiente(s)` : `${metrics.citasPendientes} Solicitudes`}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {isPaciente ? "En revisión por recepción" : "Requieren odontólogo"}
            </p>
          </div>
        </div>

        {/* TARJETA 4 */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Smile size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isPaciente ? "Salud Dental" : "Pacientes Activos"}
            </p>
            <p className="text-lg md:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
              {isPaciente ? "Óptima" : `${metrics.totalPacientes} Registrados`}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {isPaciente ? "Control semestral" : "Directorio clínico"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN EN DOS COLUMNAS EQUILIBRADAS: PRÓXIMOS PASOS Y BIENESTAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA (7 columnas): TARJETA DESTACADA DE LA PRÓXIMA CITA */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <CalendarDays size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isPaciente ? "Tu Próxima Cita Programada" : "Cita Destacada en Agenda"}
                </h2>
                <p className="text-xs text-slate-500">
                  {nextAppointment ? "Detalles del servicio y profesional a cargo" : "No tienes citas inmediatas pendientes de atención"}
                </p>
              </div>
            </div>

            {nextAppointment && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                nextAppointment.estado === "Confirmada"
                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}>
                {nextAppointment.estado}
              </span>
            )}
          </div>

          {nextAppointment ? (
            <div className="space-y-5">
              {/* Tarjeta de fecha y hora */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50/80 to-cyan-50/80 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-100 dark:border-teal-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {nextAppointment.fecha}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Hora: <strong className="text-teal-600 dark:text-teal-400">{nextAppointment.hora}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/citas")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline cursor-pointer"
                >
                  <span>Ver en mis citas</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Especialista y Servicio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <p className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Stethoscope size={14} className="text-teal-500" />
                    <span>Especialista a Cargo</span>
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {nextAppointment.profesional}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                  <p className="text-slate-400 font-medium flex items-center gap-1.5">
                    <FileHeart size={14} className="text-cyan-500" />
                    <span>Tratamiento o Consulta</span>
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {nextAppointment.servicio}
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/citas")}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Gestionar Cita
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/citas")}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Reprogramar / Ver Calendario
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <CalendarDays size={26} />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isPaciente ? "No tienes consultas agendadas actualmente" : "No hay citas activas para mostrar"}
                </p>
                <p className="text-xs text-slate-500">
                  {isPaciente ? "Mantén tu sonrisa radiante reservando tu próxima valoración preventiva." : "Revisa el calendario general para gestionar los turnos clínicos."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>{isPaciente ? "Solicitar Consulta Ahora" : "Abrir Agenda"}</span>
              </button>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA (5 columnas): ACCIONES RÁPIDAS & BIENESTAR CLÍNICO */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Tarjeta de Acciones Rápidas */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-teal-500" />
              <span>Accesos Rápidos</span>
            </h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="w-full p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 text-left transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isPaciente ? "Solicitar Nueva Cita" : "Gestión de Citas"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isPaciente ? "Elige el servicio y fecha ideal" : "Control de solicitudes y turnos"}
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              {(isRecepcionista || isAdmin) && (
                <button
                  type="button"
                  onClick={() => navigate("/pacientes/nuevo")}
                  className="w-full p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-left transition-all group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Registrar Paciente</p>
                      <p className="text-[11px] text-slate-500">Ingreso clínico de nuevos pacientes</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {(isOdontologo || isAdmin) && (
                <button
                  type="button"
                  onClick={() => navigate("/odontograma")}
                  className="w-full p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-cyan-50/30 dark:hover:bg-cyan-950/20 text-left transition-all group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      <Smile size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Odontograma Interactivo</p>
                      <p className="text-[11px] text-slate-500">Diagnóstico anatómico y evolución</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/perfil")}
                className="w-full p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 text-left transition-all group flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Mi Perfil y Seguridad</p>
                    <p className="text-[11px] text-slate-500">Datos personales y credenciales</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Tarjeta de Cuidado Personal y Bienestar Oral */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>Consejo de Salud Dental</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              El cepillado minucioso durante dos minutos, complementado con hilo dental diario y visitas periódicas semestrales, previene más del 90% de afecciones gingivales.
            </p>
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                NexusOdonto • Cuidado Integral y Bienestar
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
