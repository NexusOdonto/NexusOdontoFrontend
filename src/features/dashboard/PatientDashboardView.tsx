import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  Stethoscope,
  Plus,
  Smile,
  CheckCircle2,
  Calendar,
  DollarSign,
  HeartPulse,
  FileCheck2,
  Sparkles,
  UserCircle,
  FileText,
  X,
  Printer,
  Receipt,
} from "lucide-react";
import { appointmentService } from "../../api/appointmentService";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { areGuidsEqual } from "../../utils/roleUtils";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import { AnimatedCounter } from "../../components/ui/animated-counter";

interface PatientAppointmentItem {
  id: string;
  fecha: string;
  hora: string;
  doctor: string;
  servicio: string;
  estado: "Confirmada" | "En Atención" | "Pendiente" | "Completada" | "Cancelada";
  valor: number;
}

interface PatientDashboardViewProps {
  user: any;
}

export function PatientDashboardView({ user }: PatientDashboardViewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [myAppointments, setMyAppointments] = useState<PatientAppointmentItem[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);

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

  const loadPatientData = useCallback(async () => {
    setLoading(true);
    try {
      const [citasRes, serviciosRes] = await Promise.allSettled([
        appointmentService.getAll(),
        serviceCatalogService.getAll(),
      ]);

      const servicesList = serviciosRes.status === "fulfilled" && Array.isArray(serviciosRes.value) ? serviciosRes.value : [];
      const servicePriceMap: Record<string, number> = {};
      servicesList.forEach((s) => {
        if (s.id && s.price) servicePriceMap[String(s.id).toLowerCase()] = s.price;
        if (s.name && s.price) servicePriceMap[s.name.toLowerCase().trim()] = s.price;
      });

      if (citasRes.status === "fulfilled" && Array.isArray(citasRes.value)) {
        const allCitas = citasRes.value;
        const filtered = allCitas.filter((c: any) => {
          if (!user) return false;
          if (c.patientId && (areGuidsEqual(c.patientId, user.id) || areGuidsEqual(c.patientId, user.personId))) return true;
          if (c.patientName && user.name && c.patientName.toLowerCase().includes(user.name.toLowerCase())) return true;
          return false;
        });

        const mapped: PatientAppointmentItem[] = filtered.map((dto: any, idx: number) => {
          const servName = dto.serviceName || dto.servicio || "Consulta Odontológica";
          let servPrice = 80000;
          if (dto.serviceId && servicePriceMap[String(dto.serviceId).toLowerCase()]) {
            servPrice = servicePriceMap[String(dto.serviceId).toLowerCase()];
          }

          let formattedDate = "Hoy";
          if (dto.startsAt && dto.startsAt.includes("T")) {
            const datePart = dto.startsAt.split("T")[0];
            formattedDate = datePart;
          }

          return {
            id: dto.id || ("pac-c-" + idx),
            fecha: dto.fecha || formattedDate,
            hora: dto.hora || (dto.startsAt && dto.startsAt.includes("T") ? dto.startsAt.split("T")[1].substring(0, 5) : "10:00 AM"),
            doctor: dto.professionalName || "Dra. Laura Gómez",
            servicio: servName,
            estado: (dto.status || dto.estado || "Confirmada") as any,
            valor: servPrice,
          };
        });

        setMyAppointments(mapped);
      }
    } catch (err) {
      console.warn("Error cargando dashboard del paciente:", err);
    } finally {
      setTimeout(() => setLoading(false), 450);
    }
  }, [user]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  const proximaCita = myAppointments.find((c) => c.estado === "Confirmada" || c.estado === "Pendiente");
  const citasCompletadasCount = myAppointments.filter((c) => c.estado === "Completada").length;
  const tratamientosActivosCount = myAppointments.filter((c) => c.estado !== "Cancelada").length;
  const saldoPendiente = 0;

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-10 animate-fadeIn">
      {/* 1. HEADER EJECUTIVO DEL PACIENTE */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-5 animate-slideDown">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-prata font-bold tracking-tight text-slate-900 dark:text-white">
            Mi Portal Clínico
          </h1>
          <p className="text-xs sm:text-sm font-instrument text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-spacemono">{currentDateFormatted}</span> • Bienvenido/a, <strong className="text-cyan-700 dark:text-cyan-300 font-bold">{user?.name || "Paciente"}</strong>
          </p>
        </div>

        {/* Acciones del Paciente */}
        <div className="flex items-center gap-2.5 flex-wrap font-instrument">
          <button
            type="button"
            onClick={loadPatientData}
            disabled={loading}
            className="group p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all duration-300 cursor-pointer backdrop-blur-md active:scale-95 shadow-sm flex items-center justify-center hover:shadow-cyan-500/20 hover:border-cyan-500/40 disabled:opacity-60"
            title="Recargar mi información clínica"
          >
            <DentistryReloadIcon size={18} loading={loading} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/citas")}
            className="relative overflow-hidden group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-slate-950 shadow-md hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Solicitar Cita Médica</span>
          </button>
        </div>
      </div>

      {/* 2. CUADRÍCULA DE 4 KPIs PERSONALES DEL PACIENTE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Mi Próxima Cita */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-1">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mi Próxima Cita
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-teal-500/20 transition-all">
              <CalendarDays size={20} className="group-hover:animate-icon-bounce" />
            </div>
          </div>
          <div className="mt-3">
            {proximaCita ? (
              <div>
                <span className="text-xl font-bold text-slate-900 dark:text-white font-spacemono block">
                  {proximaCita.hora}
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-instrument truncate block mt-0.5">
                  {proximaCita.servicio}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-instrument">
                  Sin cita pendiente
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  ¡Agenda tu control ahora!
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            <span>{proximaCita ? proximaCita.doctor : "Consulta preventiva"}</span>
            <span className="font-bold text-teal-600 dark:text-teal-400 cursor-pointer hover:underline" onClick={() => navigate("/citas")}>
              Ver agenda →
            </span>
          </div>
        </div>

        {/* KPI 2: Mis Tratamientos Activos */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-2">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tratamientos Activos
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
              <Smile size={20} className="group-hover:animate-icon-wiggle" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
              <AnimatedCounter value={tratamientosActivosCount} duration={0.8} />
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-instrument">
              Procedimientos
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            <span>Seguimiento continuo</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline" onClick={() => navigate("/odontograma")}>
              Ver Odontograma →
            </span>
          </div>
        </div>

        {/* KPI 3: Historial de Visitas */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-3">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Visitas Completadas
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <FileCheck2 size={20} className="group-hover:animate-icon-bounce" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
              <AnimatedCounter value={citasCompletadasCount} duration={0.8} />
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-instrument">
              Asistidas
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            <span>Expediente clínico al día</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => navigate("/historia-clinica")}>
              Mi Historial →
            </span>
          </div>
        </div>

        {/* KPI 4: Estado de Cuenta */}
        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm card-hover-elevate transition-all flex flex-col justify-between animate-fadeIn animate-stagger-4">
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Estado de Cuenta
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <DollarSign size={20} className="group-hover:animate-icon-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-spacemono tracking-tight">
              <AnimatedCounter value={saldoPendiente} duration={0.8} prefix="$" />
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-instrument">
              Al día
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-instrument">
            <span>Sin pagos pendientes</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 cursor-pointer hover:underline" onClick={() => setShowAccountModal(true)}>
              Comprobantes →
            </span>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN PRINCIPAL: MIS CITAS + RECOMENDACIONES DE SALUD DENTAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (8 COLS): MIS CITAS Y CONSEJOS CLÍNICOS */}
        <div className="lg:col-span-8 space-y-6">
          {/* TABLA / TIMELINE DE MIS CITAS */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h2 className="text-base font-prata font-bold text-slate-900 dark:text-white">
                    Mis Citas Odontológicas
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-instrument">
                    Revisa tus consultas programadas, horarios y odontólogo asignado
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="text-xs font-bold font-instrument text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver todas mis citas</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* LISTA DE CITAS DEL PACIENTE */}
            <div className="divide-y divide-slate-100 dark:divide-white/5 font-instrument">
              {myAppointments.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Aún no tienes citas agendadas en NexusOdonto.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/citas")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    <Plus size={14} />
                    <span>Agendar mi primera cita</span>
                  </button>
                </div>
              ) : (
                myAppointments.map((cita) => {
                  let badgeClass = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
                  if (cita.estado === "Completada") {
                    badgeClass = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
                  } else if (cita.estado === "En Atención") {
                    badgeClass = "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
                  } else if (cita.estado === "Confirmada") {
                    badgeClass = "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
                  }

                  return (
                    <div
                      key={cita.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 rounded-xl px-2.5 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-spacemono font-bold text-xs border border-slate-200 dark:border-white/10 flex-shrink-0">
                          {cita.hora}
                        </span>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {cita.servicio}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap mt-0.5">
                            <span className="text-cyan-700 dark:text-cyan-400 font-semibold">{cita.doctor}</span>
                            <span>•</span>
                            <span className="font-spacemono">{cita.fecha}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className={"inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border " + badgeClass}>
                          {cita.estado === "En Atención" && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
                          {cita.estado}
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate("/citas")}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Ver detalle"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RECOMENDACIONES DE HIGIENE Y CUIDADO DENTAL */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-prata font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HeartPulse size={16} className="text-teal-500" />
                <span>Recomendaciones Clínicas de tu Especialista</span>
              </h3>
              <span className="text-xs font-semibold font-instrument text-teal-600 dark:text-teal-400">
                Guía de Salud Bucal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Cepillado 3 veces al día",
                  desc: "Usa un cepillo de cerdas suaves y pasta fluorada durante al menos 2 minutos.",
                  color: "border-teal-500/30 bg-teal-500/5",
                },
                {
                  title: "Uso de seda dental diario",
                  desc: "Limpia los espacios interdentales donde el cepillo tradicional no alcanza.",
                  color: "border-cyan-500/30 bg-cyan-500/5",
                },
                {
                  title: "Control periódico cada 6 meses",
                  desc: "La prevención temprana evita tratamientos invasivos y mantiene tu sonrisa sana.",
                  color: "border-blue-500/30 bg-blue-500/5",
                },
                {
                  title: "Cuidados post-procedimiento",
                  desc: "Evita alimentos duros o muy calientes las primeras 24h tras limpiezas o resinas.",
                  color: "border-purple-500/30 bg-purple-500/5",
                },
              ].map((rec) => (
                <div key={rec.title} className={"p-4 rounded-xl border " + rec.color + " space-y-1.5 font-instrument"}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-6">{rec.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (4 COLS): ESPECIALISTA ASIGNADO + ACCESOS RÁPIDOS */}
        <div className="lg:col-span-4 space-y-6">
          {/* MI ODONTÓLOGO ASIGNADO */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-prata font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope size={16} className="text-cyan-500" />
                <span>Mi Odontóloga de Cabecera</span>
              </h3>
              <span className="text-[11px] font-bold font-instrument text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Disponible
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-white/10 space-y-3 font-instrument">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dra. Laura Gómez</h4>
                <p className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold">Ortodoncia y Estética Dental</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Consultorio Principal • Sillón 1</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Atención personalizada</span>
                <button
                  type="button"
                  onClick={() => navigate("/citas")}
                  className="px-3 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-500/25 transition-colors cursor-pointer"
                >
                  Agendar consulta
                </button>
              </div>
            </div>
          </div>

          {/* ACCESOS RÁPIDOS DEL PACIENTE */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/65 backdrop-blur-xl shadow-sm space-y-3">
            <h3 className="text-sm font-prata font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-white/10">
              Accesos del Paciente
            </h3>

            <div className="space-y-2 text-xs font-semibold font-instrument">
              <button
                type="button"
                onClick={() => navigate("/citas")}
                className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-cyan-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-cyan-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Mis Citas Odontológicas</span>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/odontograma")}
                className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-blue-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-blue-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Smile size={16} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Mi Odontograma y Tratamientos</span>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/historia-clinica")}
                className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-teal-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-teal-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                  <span>Mi Historia Clínica Digital</span>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/servicios")}
                className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-cyan-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-cyan-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span>Catálogo de Servicios y Tarifas</span>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/profesionales")}
                className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-blue-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-blue-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope size={16} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Especialistas Odontológicos</span>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/perfil")}
                className="w-full p-3 rounded-xl border border-slate-200/70 dark:border-white/10 hover:border-purple-500/50 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-purple-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <UserCircle size={16} className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  <span>Mi Perfil y Datos Personales</span>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ESTADO DE CUENTA Y COMPROBANTES DEL PACIENTE */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Estado de Cuenta y Comprobantes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Resumen financiero de tratamientos odontológicos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Estado Financiero
                  </span>
                  <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                    Paz y Salvo — Al Día
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Sin obligaciones o copagos pendientes
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200 font-spacemono">
                    ${saldoPendiente}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Historial de Servicios Agendados
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-white/5">
                  {myAppointments.length > 0 ? (
                    myAppointments.map((app) => (
                      <div key={app.id} className="pt-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{app.servicio}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{app.doctor} • {app.fecha}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-slate-900 dark:text-white">${app.valor.toLocaleString("es-CO")}</p>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Cancelado</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-3 text-center">No hay registros de facturación anteriores.</p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Método de facturación:</span>
                  <strong className="text-slate-900 dark:text-white font-semibold">Particular / EPS Prepagada</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nit Clínica:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">901.458.729-1</strong>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Paz y Salvo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientDashboardView;
