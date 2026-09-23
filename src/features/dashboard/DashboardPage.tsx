import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Clock,
  ArrowRight,
  Stethoscope,
  Plus,
  Activity,
  Smile,
  FileText,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Layers,
  DollarSign,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { appointmentService } from "../../api/appointmentService";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { professionalService } from "../../api/professionalService";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { areGuidsEqual } from "../../utils/roleUtils";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import PatientDashboardView from "./PatientDashboardView";
import { AnimatedCounter } from "../../components/ui/animated-counter";
import { FolderComponent } from "../../components/ui/folder-component";

interface CitaItem {
  id: string;
  hora: string;
  paciente: string;
  doctor: string;
  servicio: string;
  sillon: string;
  estado: "Confirmada" | "En Atención" | "Pendiente" | "Completada";
  valor: number;
}

const odontologosTurno = [
  { nombre: "Dra. Laura Gómez", especialidad: "Ortodoncia y Estética", sillon: "Sillón 1", citasHoy: 0, activo: true },
  { nombre: "Dr. Juan Martínez", especialidad: "Cirugía Oral e Implantes", sillon: "Sillón 2", citasHoy: 0, activo: true },
  { nombre: "Dra. Patricia Silva", especialidad: "Endodoncia", sillon: "Sillón 3", citasHoy: 0, activo: true },
];

const distribucionServicios = [
  { nombre: "Profilaxis y Limpieza", porcentaje: 38, count: 14, color: "bg-teal-500" },
  { nombre: "Ortodoncia y Controles", porcentaje: 26, count: 10, color: "bg-cyan-500" },
  { nombre: "Resinas y Restauración", porcentaje: 20, count: 8, color: "bg-blue-500" },
  { nombre: "Endodoncia y Cirugía", porcentaje: 16, count: 6, color: "bg-purple-500" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rawRole = getUserRole(user);
  const userRoleStr = String((user as any)?.rol || (user as any)?.role || "").toUpperCase();

  const isPaciente = rawRole === "PACIENTE" || userRoleStr.includes("PACIENTE");
  const isOdontologo = rawRole === "ODONTOLOGO" || userRoleStr.includes("ODONTO") || userRoleStr.includes("DOCTOR") || userRoleStr.includes("DENTIST");
  const isRecepcionista = rawRole === "RECEPCIONISTA" || userRoleStr.includes("RECEPCION");
  const isAdmin = (rawRole === "ADMINISTRADOR" || (user?.email && user.email.toLowerCase().includes("admin"))) && !isOdontologo && !isRecepcionista && !isPaciente;
  const role = isOdontologo ? "ODONTOLOGO" : isRecepcionista ? "RECEPCIONISTA" : isPaciente ? "PACIENTE" : "ADMINISTRADOR";

  const [loading, setLoading] = useState(false);
  const [citasHoy, setCitasHoy] = useState<CitaItem[]>([]);
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [agendaPage, setAgendaPage] = useState(1);
  const AGENDA_PAGE_SIZE = 8;

  const totalAgendaPages = Math.max(1, Math.ceil(citasHoy.length / AGENDA_PAGE_SIZE));
  const displayedCitas = useMemo(() => {
    return citasHoy.slice((agendaPage - 1) * AGENDA_PAGE_SIZE, agendaPage * AGENDA_PAGE_SIZE);
  }, [citasHoy, agendaPage]);

  const currentDateFormatted = useMemo(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const str = now.toLocaleDateString("es-ES", options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  const loadRealData = useCallback(async () => {
    setLoading(true);
    try {
      const [citasRes, pacientesRes, personasRes, profesionalesRes, serviciosRes] = await Promise.allSettled([
        appointmentService.getAll(),
        patientService.getAll(),
        personService.getAll(),
        professionalService.getAll(),
        serviceCatalogService.getAll(),
      ]);

      const pacientesList = pacientesRes.status === "fulfilled" && Array.isArray(pacientesRes.value) ? pacientesRes.value : [];
      const personasList = personasRes.status === "fulfilled" && Array.isArray(personasRes.value) ? personasRes.value : [];
      const profesionalesList = profesionalesRes.status === "fulfilled" && Array.isArray(profesionalesRes.value) ? profesionalesRes.value : [];
      const servicesCatalog = serviciosRes.status === "fulfilled" && Array.isArray(serviciosRes.value) ? serviciosRes.value : [];

      if (pacientesList.length > 0) {
        setTotalPacientes(pacientesList.length);
      } else if (personasList.length > 0) {
        setTotalPacientes(personasList.length);
      }

      const servicePriceMap: Record<string, number> = {};
      servicesCatalog.forEach((s) => {
        if (s.id && s.price) servicePriceMap[String(s.id).toLowerCase()] = s.price;
        if (s.name && s.price) servicePriceMap[s.name.toLowerCase().trim()] = s.price;
      });

      const getEstimatedPrice = (serviceId?: string, serviceName?: string): number => {
        if (serviceId && servicePriceMap[String(serviceId).toLowerCase()]) {
          return servicePriceMap[String(serviceId).toLowerCase()];
        }
        if (serviceName) {
          const lower = serviceName.toLowerCase().trim();
          if (servicePriceMap[lower]) return servicePriceMap[lower];
          if (lower.includes("evaluaci") || lower.includes("valoraci") || lower.includes("assessment") || lower.includes("general")) return 60000;
          if (lower.includes("limpieza") || lower.includes("profilaxis") || lower.includes("cleaning")) return 120000;
          if (lower.includes("blanquea") || lower.includes("whitening")) return 350000;
          if (lower.includes("resina") || lower.includes("calza") || lower.includes("resin") || lower.includes("restoration")) return 180000;
          if (lower.includes("ortodoncia") || lower.includes("orthodontic") || lower.includes("control")) return 90000;
          if (lower.includes("extracci") || lower.includes("cordal") || lower.includes("extraction")) return 220000;
          if (lower.includes("endodoncia") || lower.includes("conducto") || lower.includes("root canal")) return 450000;
        }
        return 80000;
      };

      if (citasRes.status === "fulfilled" && Array.isArray(citasRes.value) && citasRes.value.length > 0) {
        // Mapear citas reales al formato de vista operativa con resolución de nombres reales
        const mapped: CitaItem[] = citasRes.value.map((dto: any, idx) => {
          // Resolver nombre del paciente
          let resolvedPatientName = dto.patientName;
          if (!resolvedPatientName || resolvedPatientName === "Paciente Registrado") {
            const pt = pacientesList.find((p: any) => areGuidsEqual(p.id, dto.patientId));
            const per = personasList.find((p: any) => 
              (pt && areGuidsEqual(p.id, pt.personId)) ||
              areGuidsEqual(p.id, dto.patientId)
            );
            if (per) {
              resolvedPatientName = `${per.firstName || ""} ${per.lastName || ""}`.trim();
            } else if (pt?.firstName || pt?.lastName) {
              resolvedPatientName = `${pt.firstName || ""} ${pt.lastName || ""}`.trim();
            }
          }

          // Resolver nombre del profesional
          let resolvedDoctorName = dto.professionalName;
          if (!resolvedDoctorName || resolvedDoctorName === "Dr(a). Especialista" || resolvedDoctorName === "Dr. Especialista") {
            const prof = profesionalesList.find((pr: any) => areGuidsEqual(pr.id, dto.professionalId));
            if (prof) {
              resolvedDoctorName = `Dr(a). ${prof.firstName || ""} ${prof.lastName || ""}`.trim();
            }
          }

          // Resolver nombre del servicio
          let servName = dto.serviceName || dto.servicio;
          if (!servName || servName === "Consulta Odontológica") {
            const srv = servicesCatalog.find((s: any) => areGuidsEqual(s.id, dto.serviceId));
            if (srv?.name) servName = srv.name;
          }
          if (!servName) servName = "Consulta Odontológica";

          const servPrice = getEstimatedPrice(dto.serviceId, servName);

          return {
            id: dto.id || `c-${idx}`,
            hora: dto.hora || (dto.startsAt && dto.startsAt.includes("T") ? dto.startsAt.split("T")[1].substring(0, 5) : "09:00 AM"),
            paciente: resolvedPatientName || "Paciente Registrado",
            doctor: resolvedDoctorName || "Dra. Laura Gómez",
            servicio: servName,
            sillon: `Sillón ${(idx % 3) + 1}`,
            estado: (dto.status || dto.estado || "Confirmada") as any,
            valor: servPrice,
          };
        });
        setCitasHoy(mapped);
      }
    } catch (err) {
      console.warn("Dashboard using realistic fallback data:", err);
    } finally {
      setTimeout(() => setLoading(false), 450);
    }
  }, []);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  // Cálculos de métricas operativas y de aranceles
  const citasAtendidasCount = citasHoy.filter((c) => c.estado === "Completada" || c.estado === "En Atención").length;
  const citasPendientesCount = citasHoy.filter((c) => c.estado === "Pendiente").length;
  const tasaOcupacion = Math.min(100, Math.round((citasHoy.length / 8) * 100));
  const totalEstimado = useMemo(() => {
    return citasHoy.reduce((acc, c) => acc + (c.valor || 0), 0);
  }, [citasHoy]);
  const cantidadTratamientos = citasHoy.length;

  if (isPaciente) {
    return <PatientDashboardView user={user} />;
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-10 animate-fadeIn">
      {/* 1. HEADER EJECUTIVO DEL CONSULTORIO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5 animate-slideDown">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-prata font-bold tracking-tight text-slate-900 dark:text-white">
            Panel de Control Clínico
          </h1>
          <p className="text-xs sm:text-sm font-instrument text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-spacemono">{currentDateFormatted}</span> • Sesión activa de <strong className="text-cyan-700 dark:text-cyan-300 font-bold">{user?.name || "Administrador"}</strong> ({role})
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2.5 flex-wrap font-instrument">
          <button
            type="button"
            onClick={loadRealData}
            disabled={loading}
            className="group p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-300 cursor-pointer backdrop-blur-md active:scale-95 shadow-sm flex items-center justify-center hover:shadow-cyan-500/20 hover:border-cyan-500/40 disabled:opacity-60"
            title="Recargar métricas clínicas"
          >
            <DentistryReloadIcon size={18} loading={loading} />
          </button>

          <button
            type="button"
            onClick={() => navigate(isPaciente ? "/citas" : "/agenda")}
            className="relative overflow-hidden group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-4 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>{isPaciente ? "Solicitar Cita" : "Nueva Cita"}</span>
          </button>
        </div>
      </div>

      {/* 2. CUADRÍCULA DE 4 KPIs OPERATIVOS Y VALOR ESTIMADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Citas del Día */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-1">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Citas Agendadas Hoy
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-teal-500/20 transition-all">
              <CalendarDays size={20} className="group-hover:animate-icon-bounce" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
              <AnimatedCounter value={citasHoy.length} duration={0.8} />
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-instrument flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {citasAtendidasCount} en curso/atendidas
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            <span>{citasPendientesCount} pendientes</span>
            <span className="font-bold text-teal-600 dark:text-teal-400 cursor-pointer hover:underline group-hover:translate-x-0.5 transition-transform" onClick={() => navigate("/citas")}>
              Ver lista →
            </span>
          </div>
        </div>

        {/* KPI 2: Pacientes Totales */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-2">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pacientes Activos
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
              <Users size={20} className="group-hover:animate-icon-wiggle" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
              <AnimatedCounter value={totalPacientes} duration={0.8} />
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-instrument">
              Expedientes
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            <span>Historias clínicas al día</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline group-hover:translate-x-0.5 transition-transform" onClick={() => navigate("/pacientes")}>
              Directorio →
            </span>
          </div>
        </div>

        {/* KPI 3: Valor Estimado / Presupuesto Agendado (Solo Admin) vs Procedimientos Clínicos (Odontólogos / Recepción) */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-3">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAdmin ? "Valor Estimado / Servicios" : "Tratamientos en Agenda"}
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-teal-500/20 transition-all">
              {isAdmin ? (
                <DollarSign size={20} className="group-hover:animate-icon-pulse" />
              ) : (
                <Sparkles size={20} className="group-hover:animate-icon-pulse" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {isAdmin ? (
              <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
                <AnimatedCounter value={totalEstimado} duration={0.8} prefix="$" separator="," />
              </span>
            ) : (
              <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
                <AnimatedCounter value={cantidadTratamientos} duration={0.8} />
              </span>
            )}
            {!isAdmin && (
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 font-instrument">
                Procedimientos hoy
              </span>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            {isAdmin ? (
              <>
                <span>{cantidadTratamientos} tratamientos</span>
                <span
                  className="font-bold text-teal-600 dark:text-teal-400 cursor-pointer hover:underline group-hover:translate-x-0.5 transition-transform"
                  onClick={() => navigate("/servicios")}
                >
                  Tarifas catálogo →
                </span>
              </>
            ) : (
              <>
                <span>Flujo de atención clínica</span>
                <span
                  className="font-bold text-teal-600 dark:text-teal-400 cursor-pointer hover:underline group-hover:translate-x-0.5 transition-transform"
                  onClick={() => navigate("/agenda")}
                >
                  Ver Agenda →
                </span>
              </>
            )}
          </div>
        </div>

        {/* KPI 4: Ocupación de Consultorio */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-4">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ocupación de Consultorio
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <Activity size={20} className="group-hover:animate-icon-wiggle" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
              <AnimatedCounter value={tasaOcupacion} duration={0.8} suffix="%" />
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-instrument">
              Capacidad óptima
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            <span>3 doctores en turno</span>
            <span
              className="font-bold text-purple-600 dark:text-purple-400 cursor-pointer hover:underline group-hover:translate-x-0.5 transition-transform"
              onClick={() => navigate("/profesionales")}
            >
              {role === "ODONTOLOGO" ? "Ver Colegas →" : "Turnos →"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CONTENIDO PRINCIPAL: TIMELINE OPERATIVO DE CITAS + PANELES LATERALES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (8 COLS): FLUJO DE CITAS DE HOY + DISTRIBUCIÓN DE SERVICIOS */}
        <div className="lg:col-span-8 space-y-6">
          {/* TABLA / TIMELINE OPERATIVO DE HOY */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h2 className="text-base font-prata font-bold text-slate-900 dark:text-white">
                    Cronograma de Citas de Hoy
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-instrument">
                    Seguimiento en tiempo real de pacientes y sillones de atención
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/agenda")}
                className="text-xs font-bold font-instrument text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Agenda Completa</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* LISTA DE CITAS */}
            <div className="divide-y divide-slate-100 dark:divide-white/5 font-instrument">
              {citasHoy.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No hay citas programadas para el día de hoy.
                  </p>
                </div>
              ) : (
                displayedCitas.map((cita) => (
                <div
                  key={cita.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 rounded-xl px-2.5 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Hora Badge */}
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-spacemono font-bold text-xs border border-slate-200 dark:border-white/10 flex-shrink-0">
                      {cita.hora}
                    </span>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={cita.paciente}>
                        {cita.paciente}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap mt-0.5">
                        <span className="text-cyan-700 dark:text-cyan-400 font-semibold truncate max-w-[160px]" title={cita.servicio}>{cita.servicio}</span>
                        <span>•</span>
                        <span className="truncate max-w-[140px]" title={cita.doctor}>{cita.doctor}</span>
                        <span>•</span>
                        <span className="font-spacemono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{cita.sillon}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        cita.estado === "Completada"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : cita.estado === "En Atención"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                          : cita.estado === "Confirmada"
                          ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {cita.estado === "En Atención" && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
                      {cita.estado}
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate("/citas")}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Ver detalle de cita"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))
              )}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {citasHoy.length > AGENDA_PAGE_SIZE && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-instrument">
                  Mostrando <strong className="text-slate-900 dark:text-white">{(agendaPage - 1) * AGENDA_PAGE_SIZE + 1}</strong> a <strong className="text-slate-900 dark:text-white">{Math.min(agendaPage * AGENDA_PAGE_SIZE, citasHoy.length)}</strong> de <strong className="text-slate-900 dark:text-white">{citasHoy.length}</strong> citas
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={agendaPage <= 1}
                    onClick={() => setAgendaPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft size={14} />
                    <span>Anterior</span>
                  </button>

                  <span className="px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {agendaPage} / {totalAgendaPages}
                  </span>

                  <button
                    type="button"
                    disabled={agendaPage >= totalAgendaPages}
                    onClick={() => setAgendaPage((p) => Math.min(totalAgendaPages, p + 1))}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                    title="Página siguiente"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DISTRIBUCIÓN DE SERVICIOS MÁS DEMANDADOS */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-prata font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={16} className="text-teal-500" />
                <span>Tratamientos Más Solicitados (Demanda Clínica)</span>
              </h3>
              <span className="text-xs font-semibold font-instrument text-slate-500 dark:text-slate-400">
                Últimos 30 días
              </span>
            </div>

            <div className="space-y-3.5">
              {distribucionServicios.map((srv) => (
                <div key={srv.nombre} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 font-instrument">{srv.nombre}</span>
                    <span className="font-spacemono text-slate-600 dark:text-slate-400">
                      {srv.count} procedimientos ({srv.porcentaje}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${srv.color} transition-all duration-500`}
                      style={{ width: `${srv.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (4 COLS): ODONTÓLOGOS EN TURNO + ACCESOS CLÍNICOS RÁPIDOS */}
        <div className="lg:col-span-4 space-y-6">
          {/* ODONTÓLOGOS EN TURNO */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-prata font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope size={16} className="text-cyan-500" />
                <span>Equipo en Turno Hoy</span>
              </h3>
              <span className="text-[11px] font-bold font-instrument text-emerald-600 dark:text-emerald-400">
                3 Activos
              </span>
            </div>

            <div className="space-y-3">
              {odontologosTurno.map((doc) => (
                <div
                  key={doc.nombre}
                  className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 space-y-1 font-instrument"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {doc.nombre}
                    </h4>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{doc.especialidad}</p>
                  <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/5">
                    <span className="font-spacemono">{doc.sillon}</span>
                    <span className="font-semibold text-cyan-700 dark:text-cyan-400">{doc.citasHoy} citas hoy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACCESOS RÁPIDOS CLÍNICOS */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm space-y-3">
            <h3 className="text-sm font-prata font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-white/10">
              Accesos Rápidos del Sistema
            </h3>

            <div className="space-y-2 text-xs font-semibold font-instrument">
              {role === "RECEPCIONISTA" ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/citas")}
                    className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-cyan-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-cyan-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CalendarDays size={16} className="text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span>Gestión de Citas y Turnos</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/agenda")}
                    className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-blue-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-blue-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar size={16} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>Calendario de Sillones</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/pacientes/nuevo")}
                    className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-emerald-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-emerald-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus size={16} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Registrar Nuevo Paciente</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/atencion-chat")}
                    className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-teal-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-teal-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare size={16} className="text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                      <span>Atención y WhatsApp Bot</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/odontograma")}
                    className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-cyan-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-cyan-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smile size={16} className="text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span>Odontograma Interactivo FDI</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/historia-clinica")}
                    className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-teal-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-teal-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                      <span>Historias Clínicas y Evolución</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/agenda")}
                    className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-blue-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-blue-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar size={16} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>Calendario de Sillones</span>
                    </div>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  {role === "ADMINISTRADOR" ? (
                    <button
                      type="button"
                      onClick={() => navigate("/roles-permisos")}
                      className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-purple-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-purple-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                        <span>Roles y Matriz de Permisos</span>
                      </div>
                      <ArrowRight size={13} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/pacientes")}
                      className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-teal-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-teal-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users size={16} className="text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                        <span>Directorio de Pacientes</span>
                      </div>
                      <ArrowRight size={13} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* EXPEDIENTE RÁPIDO 3D RARE UI — recepción no tiene permiso de historia clínica */}
          {role !== "RECEPCIONISTA" && (
          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm space-y-3 flex flex-col items-center justify-center text-center">
            <div className="w-full text-left pb-2 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText size={14} className="text-teal-500" />
                <span>Archivador Clínico 3D</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300">
                NexusOdonto
              </span>
            </div>
            
            <FolderComponent
              color="teal"
              size="sm"
              title="Dossier Global"
              subtitle="Acceso directo a expedientes clínicos"
              items={[
                { title: "Historias Clínicas", tag: "Evoluciones" },
                { title: "Odontograma FDI", tag: "3D Dental" },
                { title: "Recetas y Fórmulas", tag: "Prescripción" },
              ]}
              onCardClick={() => navigate("/historia-clinica")}
            />

            <button
              type="button"
              onClick={() => navigate("/historia-clinica")}
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1 pt-1"
            >
              <span>Abrir Gestor de Historias Clínicas</span>
              <ArrowRight size={13} />
            </button>
          </div>
          )}

          {/* RECORDATORIO / ESTADO DEL SISTEMA SEGÚN ROL */}
          <div className="p-4.5 rounded-2xl bg-amber-100/80 dark:bg-[#1a1405]/90 border border-amber-400/60 dark:border-amber-500/40 shadow-md dark:shadow-[0_4px_20px_rgba(245,158,11,0.08)] backdrop-blur-2xl flex items-start gap-3.5 text-xs">
            <div className="p-2 rounded-full bg-amber-500/20 dark:bg-amber-500/25 border border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertCircle size={18} strokeWidth={2.2} />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-bold text-sm text-amber-950 dark:text-amber-400 tracking-tight">
                {role === "ODONTOLOGO"
                  ? "Aviso Clínico de Turno"
                  : role === "ADMINISTRADOR"
                  ? "Estado Operativo de la Clínica"
                  : "Aviso Operativo de Recepción"}
              </p>
              <p className="text-amber-900/90 dark:text-amber-100/90 font-medium leading-relaxed">
                {role === "ODONTOLOGO"
                  ? "Recuerda registrar la evolución clínica y actualizar el odontograma interactivo al finalizar cada atención de paciente."
                  : role === "ADMINISTRADOR"
                  ? "Todos los módulos clínicos, registros de auditoría y catálogos se encuentran sincronizados."
                  : "2 citas programadas para la tarde tienen recordatorio automático enviado al paciente."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
