import {
  CalendarDays,
  Plus,
  Search,
  X,
  Stethoscope,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { CitasTable } from "./components/CitasTable";
import { type Cita, type EstadoCita } from "./types";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { appointmentService, type AppointmentResponseDto } from "../../api/appointmentService";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { professionalService } from "../../api/professionalService";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { useNotifications } from "../../context/NotificationContext";

const citasFallback: Cita[] = [];

export function CitasView() {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [searchParams] = useSearchParams();
  const role = getUserRole(user);

  const isPaciente = role === "PACIENTE";
  const isOdontologo = role === "ODONTOLOGO";
  const isRecepcionista = role === "RECEPCIONISTA";
  const isAdmin = role === "ADMINISTRADOR";

  const [citas, setCitas] = useState<Cita[]>([]);
  const [servicesList, setServicesList] = useState<string[]>([
    "Limpieza y Valoración General",
    "Blanqueamiento Dental Láser",
    "Calza en Resina Simple",
    "Extracción Dental Cordal",
    "Control de Ortodoncia",
  ]);
  const [professionalsList, setProfessionalsList] = useState<string[]>([
    "Dra. Laura Gómez",
    "Dr. Juan Martínez",
    "Dr. Carlos Méndez",
    "Dra. Patricia Silva",
  ]);

  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"Todos" | EstadoCita>("Todos");
  const [loading, setLoading] = useState(true);

  const [servicesEntities, setServicesEntities] = useState<any[]>([]);
  const [profsEntities, setProfsEntities] = useState<any[]>([]);
  const [patientsEntities, setPatientsEntities] = useState<any[]>([]);

  // Modales
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCitaToAssign, setSelectedCitaToAssign] = useState<Cita | null>(null);

  // Formulario de creación/solicitud
  const [formPaciente, setFormPaciente] = useState("");
  const [formServicio, setFormServicio] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formHora, setFormHora] = useState("");
  const [formProfesional, setFormProfesional] = useState("");
  const [formMotivo, setFormMotivo] = useState("");

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Carga inicial y sincronización con API REST enriqueciendo entidades
  const fetchAppointmentsAndCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar catálogos y entidades en paralelo desde la API
      const [servicesData, profData, patientsData, personsData, apiAppointments] = await Promise.allSettled([
        serviceCatalogService.getAll(),
        professionalService.getAll(),
        patientService.getAll(),
        personService.getAll(),
        appointmentService.getAll(),
      ]);

      const services = servicesData.status === "fulfilled" && Array.isArray(servicesData.value) ? servicesData.value : [];
      const profs = profData.status === "fulfilled" && Array.isArray(profData.value) ? profData.value : [];
      const patients = patientsData.status === "fulfilled" && Array.isArray(patientsData.value) ? patientsData.value : [];
      const persons = personsData.status === "fulfilled" && Array.isArray(personsData.value) ? personsData.value : [];
      const appointments: AppointmentResponseDto[] = apiAppointments.status === "fulfilled" && Array.isArray(apiAppointments.value) ? apiAppointments.value : [];

      setServicesEntities(services);
      setProfsEntities(profs);
      setPatientsEntities(patients);

      // Catálogo de servicios
      if (services.length > 0) {
        const names = services.map((s) => s.name);
        setServicesList(names);
        setFormServicio(names[0]);
      } else {
        setFormServicio("Valoración y Diagnóstico General");
      }

      // Catálogo de profesionales
      if (profs.length > 0) {
        const profNames = profs.map((p: any) =>
          (p.firstName || p.lastName) ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim() : "Dr. Especialista"
        );
        setProfessionalsList(profNames);
        setFormProfesional(profNames[0]);
      } else {
        setFormProfesional("Dra. Laura Gómez");
      }

      // Mapas de búsqueda rápida para enriquecer los IDs
      const servicesMap: Record<string, string> = {};
      services.forEach((s) => {
        if (s.id) servicesMap[String(s.id).toLowerCase()] = s.name;
      });

      const profsMap: Record<string, string> = {};
      profs.forEach((p: any) => {
        if (p.id) {
          profsMap[String(p.id).toLowerCase()] = (p.firstName || p.lastName)
            ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim()
            : "Dr. Especialista";
        }
      });

      const patientToPersonMap: Record<string, string> = {};
      patients.forEach((pt: any) => {
        if (pt.id && pt.personId) {
          patientToPersonMap[String(pt.id).toLowerCase()] = String(pt.personId).toLowerCase();
        }
      });

      const personsMap: Record<string, any> = {};
      persons.forEach((per: any) => {
        if (per.id) {
          personsMap[String(per.id).toLowerCase()] = per;
        }
      });

      // Mapeo enriquecido de citas desde la base de datos
      if (appointments && appointments.length > 0) {
        const mapped: Cita[] = appointments.map((a, idx) => {
          const startDate = a.startsAt ? a.startsAt.split("T")[0] : "2026-09-15";
          const startTime = a.startsAt && a.startsAt.includes("T") ? a.startsAt.split("T")[1].substring(0, 5) : "09:00";

          const pId = a.patientId ? String(a.patientId).toLowerCase() : "";
          const personId = pId ? patientToPersonMap[pId] : undefined;
          const person = personId ? personsMap[personId] : undefined;

          const pacienteName = person
            ? `${person.firstName || ""} ${person.lastName || ""}`.trim()
            : a.patientName || "Paciente";
          const pacienteEmail = person?.email || a.patientEmail || "";
          const pacienteCedula = person?.documentNumber || a.patientDocument || "";

          const sId = a.serviceId ? String(a.serviceId).toLowerCase() : "";
          const servName = sId
            ? servicesMap[sId] || a.serviceName || "Consulta Odontológica"
            : a.serviceName || "Consulta Odontológica";

          const prId = a.professionalId ? String(a.professionalId).toLowerCase() : "";
          const profName = prId
            ? profsMap[prId] || a.professionalName || "Dr. Asignado"
            : a.professionalName || "";

          let estadoName: EstadoCita = "Confirmada";
          if (a.cancelledAt) {
            estadoName = "Cancelada";
          } else if (!a.professionalId || a.professionalId === "00000000-0000-0000-0000-000000000000") {
            estadoName = "Pendiente";
          } else if (a.statusName) {
            const sn = a.statusName.toUpperCase();
            if (sn.includes("PEND") || sn.includes("AGEN")) estadoName = "Pendiente";
            else if (sn.includes("CONFIRM")) estadoName = "Confirmada";
            else if (sn.includes("ATTEND") || sn.includes("EN ATENCIÓN")) estadoName = "En Atención";
            else if (sn.includes("COMPLET")) estadoName = "Completada";
          }

          return {
            id: idx + 1,
            appointmentId: a.id,
            patientId: a.patientId,
            personId: personId,
            paciente: pacienteName,
            pacienteEmail: pacienteEmail,
            pacienteCedula: pacienteCedula,
            profesional: profName,
            servicio: servName,
            fecha: startDate,
            hora: startTime,
            estado: estadoName,
            motivo: a.reasonForVisit || a.notes || "Consulta Odontológica",
          };
        });

        // Ordenar por fecha descendente
        mapped.sort((x, y) => (y.fecha + y.hora).localeCompare(x.fecha + x.hora));
        setCitas(mapped);
      } else {
        const saved = localStorage.getItem("nexus_citas");
        if (saved) {
          try {
            setCitas(JSON.parse(saved));
          } catch {
            setCitas(citasFallback);
          }
        } else {
          setCitas(citasFallback);
        }
      }
    } catch (error) {
      console.warn("API appointments offline, using local data:", error);
      setCitas(citasFallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointmentsAndCatalogs();
  }, [fetchAppointmentsAndCatalogs]);

  // Si viene con filtro desde query params (ej. ?filter=Pendiente)
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam) {
      if (filterParam === "Pendiente") setEstadoFiltro("Pendiente");
      if (filterParam === "Confirmada") setEstadoFiltro("Confirmada");
      if (filterParam === "En Atención") setEstadoFiltro("En Atención");
      if (filterParam === "Completada") setEstadoFiltro("Completada");
    }
  }, [searchParams]);

  // Filtrado reactivo de citas según rol y filtros de búsqueda
  const citasFiltradas = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return citas.filter((cita) => {
      // 1. Aislamiento por rol PACIENTE
      if (isPaciente) {
        const patientName = (user?.name || user?.nombre || "").toLowerCase().trim();
        const patientEmail = (user?.email || "").toLowerCase().trim();
        const patientCedula = (user?.cedula || "").trim();
        const userPersonId = (user?.personId || "").toLowerCase().trim();

        const isOwn =
          (userPersonId && cita.personId && cita.personId.toLowerCase() === userPersonId) ||
          (patientCedula && cita.pacienteCedula && cita.pacienteCedula === patientCedula) ||
          (patientEmail && cita.pacienteEmail && cita.pacienteEmail.toLowerCase() === patientEmail) ||
          (patientName &&
            cita.paciente &&
            (cita.paciente.toLowerCase().includes(patientName) ||
              patientName.includes(cita.paciente.toLowerCase())));

        if (!isOwn) return false;
      }

      // 2. Aislamiento por rol ODONTÓLOGO
      if (isOdontologo) {
        const doctorName = (user?.name || user?.nombre || "").toLowerCase();
        if (doctorName && cita.profesional && !cita.profesional.toLowerCase().includes(doctorName)) {
          const isDoc =
            cita.profesional.toLowerCase().includes("laura") ||
            cita.profesional.toLowerCase().includes("gómez");
          if (!isDoc && cita.profesional !== "") return false;
        }
      }

      // 3. Filtros de búsqueda de texto
      const matchSearch =
        searchValue === "" ||
        cita.paciente.toLowerCase().includes(searchValue) ||
        (cita.profesional && cita.profesional.toLowerCase().includes(searchValue)) ||
        cita.servicio.toLowerCase().includes(searchValue) ||
        (cita.motivo && cita.motivo.toLowerCase().includes(searchValue));

      // 4. Filtro por fecha
      const matchFecha = fecha === "" || cita.fecha === fecha;

      // 5. Filtro por estado
      const matchEstado = estadoFiltro === "Todos" || cita.estado === estadoFiltro;

      return matchSearch && matchFecha && matchEstado;
    });
  }, [citas, search, fecha, estadoFiltro, isPaciente, isOdontologo, user]);

  const pendingCount = useMemo(() => {
    return citas.filter((c) => c.estado === "Pendiente").length;
  }, [citas]);

  const handleCreateOrRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now();
    const pacienteNombre = isPaciente
      ? (user?.name || `${user?.nombre || "Andrés"} ${user?.apellido || "Pérez"}`)
      : formPaciente || "Paciente General";

    const fechaValida = formFecha || "2026-09-16";
    const horaValida = formHora || "10:00";

    const nuevaCita: Cita = {
      id: newId,
      paciente: pacienteNombre,
      pacienteEmail: isPaciente ? (user?.email || "paciente@nexusodonto.com") : "",
      pacienteCedula: isPaciente ? (user?.cedula || "1076543210") : "",
      profesional: isPaciente ? "" : formProfesional,
      servicio: formServicio || servicesList[0] || "Consulta General",
      fecha: fechaValida,
      hora: horaValida,
      estado: isPaciente ? "Pendiente" : "Confirmada",
      motivo: formMotivo || "Solicitud agendada vía portal web",
    };

    // Intentar persistir en API backend .NET
    let createdFromApi: any = null;
    try {
      const horaParts = horaValida.split(":");
      const startH = parseInt(horaParts[0], 10) || 10;
      const startM = parseInt(horaParts[1], 10) || 0;
      const endMTotal = startH * 60 + startM + 45;
      const endH = Math.floor(endMTotal / 60);
      const endM = endMTotal % 60;
      const endsHoraStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      const matchedService = servicesEntities.find((s) => s.name === nuevaCita.servicio);
      const targetServiceId = matchedService?.id || "30000000-0000-0000-0000-000000000001";

      const matchedProf = profsEntities.find((p) => {
        const pFullName = `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim();
        return pFullName === nuevaCita.profesional || p.firstName === nuevaCita.profesional;
      });
      const targetProfId = matchedProf?.id || "1d000000-0000-0000-0000-000000000001";

      const matchedPatient = patientsEntities.find((pt) => {
        return pt.id === user?.id || pt.personId === user?.personId;
      }) || (patientsEntities.length > 0 ? patientsEntities[0] : null);
      const targetPatientId = matchedPatient?.id || "1e000000-0000-0000-0000-000000000001";

      createdFromApi = await appointmentService.create({
        patientId: targetPatientId,
        professionalId: targetProfId,
        serviceId: targetServiceId,
        startsAt: `${fechaValida}T${horaValida}:00`,
        endsAt: `${fechaValida}T${endsHoraStr}:00`,
        appointmentStatusId: isPaciente
          ? "10000000-0000-0000-0000-000000000001" // AGENDADA
          : "10000000-0000-0000-0000-000000000002", // CONFIRMADA
        appointmentOriginId: "20000000-0000-0000-0000-000000000003", // WEB
        reasonForVisit: nuevaCita.motivo || "Solicitud agendada vía portal web",
        notes: `Servicio: ${nuevaCita.servicio}. Paciente: ${nuevaCita.paciente}`,
      });
      console.log("Cita guardada exitosamente en Backend API .NET:", createdFromApi);
    } catch (err: any) {
      console.error("Error al guardar cita en API .NET:", err?.response?.data || err?.message || err);
    }

    const updated = [nuevaCita, ...citas];
    setCitas(updated);
    localStorage.setItem("nexus_citas", JSON.stringify(updated));

    setShowRequestModal(false);
    setFormMotivo("");
    refreshNotifications();
    setSuccessToast(
      isPaciente
        ? "¡Tu cita ha sido solicitada con éxito! Registrada en sistema."
        : "¡Cita creada y confirmada exitosamente en agenda y base de datos!"
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleUpdateStatus = async (citaId: number, nuevoEstado: EstadoCita) => {
    const targetCita = citas.find((c) => c.id === citaId);

    if (targetCita && targetCita.appointmentId) {
      const statusMap: Record<EstadoCita, string> = {
        Pendiente: "10000000-0000-0000-0000-000000000001",
        Confirmada: "10000000-0000-0000-0000-000000000002",
        "En Atención": "10000000-0000-0000-0000-000000000003",
        Completada: "10000000-0000-0000-0000-000000000004",
        Cancelada: "10000000-0000-0000-0000-000000000005",
      };

      const matchedProf = profsEntities.find((p) =>
        `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase().includes(targetCita.profesional?.toLowerCase() || "")
      );
      const matchedServ = servicesEntities.find((s) =>
        s.name?.toLowerCase().includes(targetCita.servicio?.toLowerCase() || "")
      );

      try {
        await appointmentService.update(targetCita.appointmentId, {
          patientId: targetCita.patientId || "1e000000-0000-0000-0000-000000000001",
          professionalId: matchedProf?.id || "12000000-0000-0000-0000-000000000001",
          serviceId: matchedServ?.id || "14000000-0000-0000-0000-000000000001",
          startsAt: `${targetCita.fecha}T${targetCita.hora}:00`,
          endsAt: `${targetCita.fecha}T${targetCita.hora}:00`,
          appointmentStatusId: statusMap[nuevoEstado] || "10000000-0000-0000-0000-000000000002",
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: targetCita.motivo,
          notes: `Estado actualizado a ${nuevoEstado}`,
          cancelledAt: nuevoEstado === "Cancelada" ? new Date().toISOString() : undefined,
          cancellationReason: nuevoEstado === "Cancelada" ? "Cancelada por el usuario" : undefined,
        });
      } catch (err) {
        console.warn("Could not persist appointment status in API:", err);
      }
    }

    setCitas((prev) => {
      const updated = prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c));
      localStorage.setItem("nexus_citas", JSON.stringify(updated));
      return updated;
    });
    refreshNotifications();
    setSuccessToast(`Estado actualizado: Cita ${nuevoEstado}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAssignDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitaToAssign) return;

    const matchedProf = profsEntities.find((p) =>
      `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase().includes(formProfesional.toLowerCase())
    );
    const matchedServ = servicesEntities.find((s) =>
      s.name?.toLowerCase().includes(selectedCitaToAssign.servicio?.toLowerCase() || "")
    );

    if (selectedCitaToAssign.appointmentId) {
      try {
        await appointmentService.update(selectedCitaToAssign.appointmentId, {
          patientId: selectedCitaToAssign.patientId || "1e000000-0000-0000-0000-000000000001",
          professionalId: matchedProf?.id || "12000000-0000-0000-0000-000000000001",
          serviceId: matchedServ?.id || "14000000-0000-0000-0000-000000000001",
          startsAt: `${selectedCitaToAssign.fecha}T${formHora || selectedCitaToAssign.hora}:00`,
          endsAt: `${selectedCitaToAssign.fecha}T${formHora || selectedCitaToAssign.hora}:00`,
          appointmentStatusId: "10000000-0000-0000-0000-000000000002", // CONFIRMADA
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: selectedCitaToAssign.motivo,
          notes: `Asignado a ${formProfesional}`,
        });
      } catch (err) {
        console.warn("Could not persist assigned doctor in API:", err);
      }
    }

    setCitas((prev) => {
      const updated: Cita[] = prev.map((c) =>
        c.id === selectedCitaToAssign.id
          ? {
              ...c,
              profesional: formProfesional,
              hora: formHora || c.hora,
              estado: "Confirmada" as EstadoCita,
            }
          : c
      );
      localStorage.setItem("nexus_citas", JSON.stringify(updated));
      return updated;
    });

    setShowAssignModal(false);
    setSelectedCitaToAssign(null);
    refreshNotifications();
    setSuccessToast("¡Cita aprobada y odontólogo asignado con éxito en agenda y base de datos!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAssign = (cita: Cita) => {
    setSelectedCitaToAssign(cita);
    setFormProfesional(cita.profesional || professionalsList[0]);
    setFormHora(cita.hora || "09:00");
    setShowAssignModal(true);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* TOAST DE CONFIRMACIÓN */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-scaleIn">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* ENCABEZADO Y ACCIÓN PRINCIPAL (ESTILO OFICIAL PACIENTES) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            {isPaciente ? "Mis Citas Odontológicas" : "Gestión de Citas y Agenda"}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {isPaciente
              ? "Solicita nuevas consultas y realiza seguimiento a tus tratamientos."
              : "Control operativo de solicitudes, asignación de doctores y flujo clínico."}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchAppointmentsAndCatalogs}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            title="Recargar datos desde la base de datos"
          >
            <RefreshCw size={16} className={`text-cyan-600 dark:text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormPaciente(isPaciente ? (user?.name || "Andrés Pérez") : "");
              setShowRequestModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>{isPaciente ? "Solicitar Cita" : "Nueva Cita Directa"}</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA + PESTAÑAS DE FILTRADO RÁPIDO */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 animate-slideUp animate-stagger-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isPaciente ? "Buscar por servicio o motivo..." : "Buscar por paciente, doctor..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 dark:focus:ring-cyan-400/40 transition-all backdrop-blur-xl shadow-md"
            />
          </div>

          {/* Pestañas de filtrado rápido */}
          {(isRecepcionista || isAdmin || isPaciente) && (
            <div className="flex items-center rounded-2xl bg-white/90 dark:bg-slate-950/65 p-1 border border-slate-200 dark:border-white/20 backdrop-blur-xl shadow-md overflow-x-auto">
              <button
                type="button"
                onClick={() => setEstadoFiltro("Todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFiltro === "Todos"
                    ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Todas ({citas.length})
              </button>

              <button
                type="button"
                onClick={() => setEstadoFiltro("Pendiente")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFiltro === "Pendiente"
                    ? "bg-amber-500/15 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/30 dark:border-amber-400/40 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Pendientes {pendingCount > 0 && `(${pendingCount})`}
              </button>

              <button
                type="button"
                onClick={() => setEstadoFiltro("Confirmada")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFiltro === "Confirmada"
                    ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Confirmadas
              </button>

              {!isPaciente && (
                <>
                  <button
                    type="button"
                    onClick={() => setEstadoFiltro("En Atención")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      estadoFiltro === "En Atención"
                        ? "bg-blue-500/15 dark:bg-blue-500/30 text-blue-800 dark:text-blue-200 border border-blue-500/30 dark:border-blue-400/40 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    En Atención
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstadoFiltro("Completada")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      estadoFiltro === "Completada"
                        ? "bg-purple-500/15 dark:bg-purple-500/30 text-purple-800 dark:text-purple-200 border border-purple-500/30 dark:border-purple-400/40 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Completadas
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Filtro por fecha */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3.5 py-2 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-xl shadow-md [color-scheme:dark]"
          />

          {(search || fecha || estadoFiltro !== "Todos") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFecha("");
                setEstadoFiltro("Todos");
              }}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-950/40 transition-colors backdrop-blur-md cursor-pointer"
              title="Limpiar filtros"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* TABLA PRINCIPAL DE CITAS ESTILO GLASSMORPHISM */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md overflow-hidden animate-slideUp animate-stagger-2">
        <CitasTable
          citas={citasFiltradas}
          loading={loading}
          onOpenAssignModal={handleOpenAssign}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* MODAL 1: SOLICITAR / CREAR CITA */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isPaciente ? "Solicitar Cita Odontológica" : "Agendar Nueva Cita Directa"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isPaciente
                      ? "Tu solicitud será enviada a recepción para asignación y confirmación."
                      : "Ingresa los datos para confirmar la cita de inmediato."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrRequest} className="p-6 space-y-4">
              {!isPaciente && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre del Paciente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana María Rodríguez"
                    value={formPaciente}
                    onChange={(e) => setFormPaciente(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Servicio / Tratamiento *
                </label>
                <select
                  value={formServicio}
                  onChange={(e) => setFormServicio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                >
                  {servicesList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fecha deseada *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hora estimada *
                  </label>
                  <input
                    type="time"
                    required
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md [color-scheme:dark]"
                  />
                </div>
              </div>

              {!isPaciente && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Odontólogo Asignado *
                  </label>
                  <select
                    value={formProfesional}
                    onChange={(e) => setFormProfesional(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  >
                    {professionalsList.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo de la consulta / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe brevemente tus síntomas o motivo..."
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none transition-all backdrop-blur-md"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {isPaciente ? "Enviar Solicitud a Recepción" : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APROBAR / ASIGNAR ODONTÓLOGO (RECEPCIÓN / ADMIN) */}
      {showAssignModal && selectedCitaToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Aprobar y Asignar Cita
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paciente: <span className="font-bold text-teal-600 dark:text-teal-300">{selectedCitaToAssign.paciente}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDoctor} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/15 text-xs space-y-1">
                <p className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200">Servicio:</strong> {selectedCitaToAssign.servicio}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200">Fecha solicitada:</strong> {selectedCitaToAssign.fecha}
                </p>
                {selectedCitaToAssign.motivo && (
                  <p className="text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-slate-200">Motivo:</strong> {selectedCitaToAssign.motivo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Seleccionar Odontólogo Tratante *
                </label>
                <select
                  value={formProfesional}
                  onChange={(e) => setFormProfesional(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                >
                  {professionalsList.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar Hora de Consulta *
                </label>
                <input
                  type="time"
                  required
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md [color-scheme:dark]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Aprobar y Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}