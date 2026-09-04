import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Plus,
  Stethoscope,
  X,
  CheckCircle2,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { appointmentService } from "../../api/appointmentService";
import { professionalService } from "../../api/professionalService";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { SelectOrWriteInput, type SelectOption } from "../../components/common/SelectOrWriteInput";
import { areGuidsEqual } from "../../utils/roleUtils";
import { PACIENTES_STORAGE_KEY } from "../../types/pacientes";

const defaultSeedDoctors: SelectOption[] = [
  { label: "Dra. Laura Gómez", subLabel: "Especialidad: Ortodoncia y Estética", id: "14000000-0000-0000-0000-000000000001", data: { professionalId: "14000000-0000-0000-0000-000000000001" } },
  { label: "Dr. Roberto Martínez", subLabel: "Especialidad: Cirugía Oral e Implantología", id: "14000000-0000-0000-0000-000000000002", data: { professionalId: "14000000-0000-0000-0000-000000000002" } },
  { label: "Dra. Ana Sofía Silva", subLabel: "Especialidad: Endodoncia y Periodoncia", id: "14000000-0000-0000-0000-000000000003", data: { professionalId: "14000000-0000-0000-0000-000000000003" } },
  { label: "Dr. Juan Martínez", subLabel: "Especialidad: Odontología General", id: "14000000-0000-0000-0000-000000000004", data: { professionalId: "14000000-0000-0000-0000-000000000004" } },
  { label: "Dra. Patricia Silva", subLabel: "Especialidad: Endodoncia Microscópica", id: "14000000-0000-0000-0000-000000000005", data: { professionalId: "14000000-0000-0000-0000-000000000005" } },
];

const defaultSeedPatients: SelectOption[] = [
  { label: "Andrés Felipe Navas Alvear", subLabel: "Cédula: 1082917087 • chirialvear@gmail.com", id: "c9c45f44-cfa7-4202-b8af-92678aa80580", data: { patientId: "c9c45f44-cfa7-4202-b8af-92678aa80580", doc: "1082917087", email: "chirialvear@gmail.com" } },
  { label: "Andrés Pérez", subLabel: "Cédula: 1076543210 • paciente@nexusodonto.com", id: "1e000000-0000-0000-0000-000000000001", data: { patientId: "1e000000-0000-0000-0000-000000000001", doc: "1076543210", email: "paciente@nexusodonto.com" } },
  { label: "Camila López", subLabel: "Cédula: 1098765436", id: "1e000000-0000-0000-0000-000000000002", data: { patientId: "1e000000-0000-0000-0000-000000000002", doc: "1098765436" } },
  { label: "Felipe Torres", subLabel: "Cédula: 1098765437", id: "1e000000-0000-0000-0000-000000000003", data: { patientId: "1e000000-0000-0000-0000-000000000003", doc: "1098765437" } },
  { label: "Valentina Mendoza", subLabel: "Cédula: 1098765438", id: "1e000000-0000-0000-0000-000000000004", data: { patientId: "1e000000-0000-0000-0000-000000000004", doc: "1098765438" } },
];

interface AgendaSlot {
  id: string;
  appointmentId?: string;
  hora: string;
  paciente?: string;
  servicio?: string;
  doctor: string;
  estado?: "Libre" | "Confirmada" | "Pendiente" | "En Atención" | "Completada";
  motivo?: string;
}

const horasDia = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export function AgendaView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isPaciente = role === "PACIENTE";

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedDoctor, setSelectedDoctor] = useState<string>("Todos los Odontólogos");
  const [doctoresList, setDoctoresList] = useState<string[]>(["Todos los Odontólogos"]);
  const [slots, setSlots] = useState<AgendaSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ hora: string; doctor: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form agendamiento rápido
  const [formPaciente, setFormPaciente] = useState(isPaciente ? (user?.name || "Andrés Pérez") : "");
  const [formDoctor, setFormDoctor] = useState("");
  const [formServicio, setFormServicio] = useState("Limpieza y Valoración General");
  const [formMotivo, setFormMotivo] = useState("");

  const [patientsOptions, setPatientsOptions] = useState<SelectOption[]>([]);
  const [professionalsOptions, setProfessionalsOptions] = useState<SelectOption[]>([]);
  const [servicesList, setServicesList] = useState<string[]>([]);

  const fetchAgendaData = useCallback(async () => {
    setLoading(true);
    try {
      const [apiAppointments, profsData, patientsData, personsData, servicesData] = await Promise.allSettled([
        appointmentService.getAll(),
        professionalService.getAll(),
        patientService.getAll(),
        personService.getAll(),
        serviceCatalogService.getAll(),
      ]);

      const profs = profsData.status === "fulfilled" && Array.isArray(profsData.value) ? profsData.value : [];
      const patients = patientsData.status === "fulfilled" && Array.isArray(patientsData.value) ? patientsData.value : [];
      const persons = personsData.status === "fulfilled" && Array.isArray(personsData.value) ? personsData.value : [];
      const services = servicesData.status === "fulfilled" && Array.isArray(servicesData.value) ? servicesData.value : [];
      const appointments = apiAppointments.status === "fulfilled" && Array.isArray(apiAppointments.value) ? apiAppointments.value : [];

      // Mapas de resolución
      const profsMap: Record<string, string> = {};
      const docNames: string[] = ["Todos los Odontólogos"];
      const profOpts: SelectOption[] = [];
      const seenDoctorLabels = new Set<string>();

      profs.forEach((p: any) => {
        const name = (p.firstName || p.lastName)
          ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim()
          : (p.fullName || p.name || "Dr. Especialista");
        const spec = p.specialty || p.specialtyName || p.roleName || "Odontología Integral";
        if (p.id) {
          profsMap[String(p.id).toLowerCase()] = name;
        }
        if (!seenDoctorLabels.has(name.toLowerCase())) {
          seenDoctorLabels.add(name.toLowerCase());
          docNames.push(name);
          profOpts.push({
            id: p.id,
            label: name,
            subLabel: `Especialidad: ${spec}`,
            data: { professionalId: p.id, specialty: spec },
          });
        }
      });

      // Añadir seed doctors si no existen en la lista
      defaultSeedDoctors.forEach((seedDoc) => {
        if (!seenDoctorLabels.has(seedDoc.label.toLowerCase())) {
          seenDoctorLabels.add(seedDoc.label.toLowerCase());
          docNames.push(seedDoc.label);
          profOpts.push(seedDoc);
          if (seedDoc.id) {
            profsMap[seedDoc.id.toLowerCase()] = seedDoc.label;
          }
        }
      });

      console.log("Profesionales cargados en Agenda:", profOpts);
      setDoctoresList(docNames);
      setProfessionalsOptions(profOpts);

      // Pacientes (Unificación PATIENTS + PERSONS + LocalStorage)
      const patientToPersonMap: Record<string, string> = {};
      patients.forEach((pt: any) => {
        if (pt.id && pt.personId) {
          patientToPersonMap[String(pt.id).toLowerCase()] = String(pt.personId).toLowerCase();
        }
      });

      const personsMap: Record<string, any> = {};
      persons.forEach((per: any) => {
        if (per.id) personsMap[String(per.id).toLowerCase()] = per;
      });

      const patOpts: SelectOption[] = [];
      const seenPatientKeys = new Set<string>();

      // 1. Desde tabla PATIENTS
      patients.forEach((pt: any) => {
        const person = pt.personId ? personsMap[String(pt.personId).toLowerCase()] : undefined;
        const name = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : (pt.name || pt.firstName ? `${pt.firstName} ${pt.lastName}` : "Paciente Registrado");
        const doc = person?.documentNumber || pt.documentNumber || "";
        const email = person?.email || pt.email || "";
        const key = (doc || email || name).toLowerCase();

        if (name && !seenPatientKeys.has(key)) {
          seenPatientKeys.add(key);
          patOpts.push({
            id: pt.id,
            label: name,
            subLabel: doc ? `Cédula: ${doc}${email ? ` • ${email}` : ""}` : email || undefined,
            data: { patientId: pt.id, personId: pt.personId, doc, email },
          });
        }
      });

      // 2. Desde tabla PERSONS (Google OAuth y usuarios directos)
      persons.forEach((per: any) => {
        const name = `${per.firstName || ""} ${per.lastName || ""}`.trim();
        const doc = per.documentNumber || "";
        const email = per.email || "";
        const key = (doc || email || name).toLowerCase();

        if (name && !seenPatientKeys.has(key)) {
          seenPatientKeys.add(key);
          patOpts.push({
            id: per.id,
            label: name,
            subLabel: doc ? `Cédula: ${doc}${email ? ` • ${email}` : ""}` : email || undefined,
            data: { personId: per.id, patientId: per.id, doc, email },
          });
        }
      });

      // 3. Inspeccionar LocalStorage
      const storageKeys = [PACIENTES_STORAGE_KEY, "pacientes", "nexus_pacientes", "nexusodontopacientes", "auth_user"];
      storageKeys.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : [parsed];
            list.forEach((item: any) => {
              const name = item.nombre || item.name || (item.firstName ? `${item.firstName} ${item.lastName}` : "");
              const doc = item.documento || item.cedula || item.documentNumber || "";
              const email = item.correo || item.email || "";
              const key = (doc || email || name).toLowerCase();

              if (name && !seenPatientKeys.has(key)) {
                seenPatientKeys.add(key);
                patOpts.push({
                  id: item.patientId || item.id || `local-${seenPatientKeys.size}`,
                  label: name,
                  subLabel: doc ? `Cédula: ${doc}${email ? ` • ${email}` : ""}` : email || undefined,
                  data: { patientId: item.patientId || item.id, doc, email },
                });
              }
            });
          } catch {
            // ignore
          }
        }
      });

      // 4. Añadir seed patients de fallback si faltan
      defaultSeedPatients.forEach((seedPat) => {
        const key = seedPat.label.toLowerCase();
        if (!seenPatientKeys.has(key)) {
          seenPatientKeys.add(key);
          patOpts.push(seedPat);
        }
      });

      console.log("Pacientes cargados en Agenda:", patOpts);
      setPatientsOptions(patOpts);

      // Servicios
      const srvMap: Record<string, string> = {};
      const srvNames = services.map((s) => {
        if (s.id) srvMap[String(s.id).toLowerCase()] = s.name;
        return s.name;
      });
      setServicesList(srvNames.length > 0 ? srvNames : ["Consulta y Valoración General"]);

      // Filtrar citas reales por fecha seleccionada
      const realSlots: AgendaSlot[] = [];
      appointments.forEach((a, idx) => {
        const appDate = a.startsAt ? a.startsAt.split("T")[0] : "";
        if (appDate === selectedDate) {
          const appTime = a.startsAt && a.startsAt.includes("T") ? a.startsAt.split("T")[1].substring(0, 5) : "09:00";
          const pId = a.patientId ? String(a.patientId).toLowerCase() : "";
          const personId = pId ? patientToPersonMap[pId] : undefined;
          const person = personId ? personsMap[personId] : undefined;
          const pacName = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : (a.patientName || "Paciente");
          const docName = a.professionalId ? (profsMap[String(a.professionalId).toLowerCase()] || a.professionalName || "Dr. Asignado") : "Por asignar";
          const servName = a.serviceId ? (srvMap[String(a.serviceId).toLowerCase()] || a.serviceName || "Tratamiento") : "Tratamiento";

          let estadoName: "Confirmada" | "Pendiente" | "En Atención" | "Completada" = "Confirmada";
          if (!a.professionalId || a.professionalId === "00000000-0000-0000-0000-000000000000") {
            estadoName = "Pendiente";
          } else if (a.statusName) {
            const sn = a.statusName.toUpperCase();
            if (sn.includes("PEND") || sn.includes("AGEN")) estadoName = "Pendiente";
            else if (sn.includes("ATTEND") || sn.includes("EN ATENCIÓN")) estadoName = "En Atención";
            else if (sn.includes("COMPLET")) estadoName = "Completada";
          }

          realSlots.push({
            id: `api-slot-${a.id || idx}`,
            appointmentId: a.id,
            hora: appTime,
            paciente: pacName,
            doctor: docName,
            servicio: servName,
            estado: estadoName,
            motivo: a.reasonForVisit || a.notes,
          });
        }
      });

      setSlots(realSlots);
    } catch (err) {
      console.warn("Could not load live agenda appointments:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const filteredSlots = useMemo(() => {
    return horasDia.map((hora) => {
      const match = slots.find((s) => {
        const docMatch = selectedDoctor === "Todos los Odontólogos" || s.doctor === selectedDoctor;
        return s.hora === hora && docMatch;
      });

      if (match) return match;
      return {
        id: `free-${hora}`,
        hora,
        doctor: selectedDoctor === "Todos los Odontólogos" ? (doctoresList[1] || "Dr. Especialista") : selectedDoctor,
        estado: "Libre" as const,
      };
    });
  }, [slots, selectedDoctor, doctoresList]);

  const handleOpenBook = (hora: string, doctor: string) => {
    setSelectedSlotForBooking({ hora, doctor });
    const initialDoc = doctor && doctor !== "Todos los Odontólogos" ? doctor : (professionalsOptions[0]?.label || "Dra. Laura Gómez");
    setFormDoctor(initialDoc);
    setFormPaciente(isPaciente ? (user?.name || "Andrés Pérez") : "");
    setShowBookModal(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;

    const matchedProf =
      professionalsOptions.find((d) => d.label.toLowerCase() === formDoctor.toLowerCase() || areGuidsEqual(d.id, formDoctor)) ||
      professionalsOptions[0];
    const matchedProfId = matchedProf?.data?.professionalId || matchedProf?.id || "14000000-0000-0000-0000-000000000001";

    const matchedPat =
      patientsOptions.find((p) => p.label.toLowerCase() === formPaciente.toLowerCase() || areGuidsEqual(p.id, formPaciente)) ||
      patientsOptions[0];
    const matchedPatientId = matchedPat?.data?.patientId || matchedPat?.id || (isPaciente && user?.id ? user.id : "1e000000-0000-0000-0000-000000000001");

    const newSlot: AgendaSlot = {
      id: `slot-${Date.now()}`,
      hora: selectedSlotForBooking.hora,
      doctor: formDoctor || selectedSlotForBooking.doctor,
      paciente: formPaciente || "Paciente Registrado",
      servicio: formServicio,
      estado: isPaciente ? "Pendiente" : "Confirmada",
      motivo: formMotivo || "Consulta agendada desde calendario",
    };

    // Intentar persistir en API backend .NET
    try {
      const fechaBase = selectedDate || new Date().toISOString().split("T")[0];
      const horaParts = (newSlot.hora || "10:00").split(":");
      const startH = parseInt(horaParts[0], 10) || 10;
      const startM = parseInt(horaParts[1], 10) || 0;
      const endMTotal = startH * 60 + startM + 45;
      const endH = Math.floor(endMTotal / 60);
      const endM = endMTotal % 60;
      const endsHoraStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      await appointmentService.create({
        patientId: matchedPatientId,
        professionalId: matchedProfId,
        serviceId: "30000000-0000-0000-0000-000000000001",
        startsAt: `${fechaBase}T${newSlot.hora}:00`,
        endsAt: `${fechaBase}T${endsHoraStr}:00`,
        appointmentStatusId: isPaciente
          ? "10000000-0000-0000-0000-000000000001" // AGENDADA
          : "10000000-0000-0000-0000-000000000002", // CONFIRMADA
        appointmentOriginId: "20000000-0000-0000-0000-000000000003", // WEB
        reasonForVisit: newSlot.motivo || "Consulta agendada desde calendario",
        notes: `Servicio: ${newSlot.servicio}. Paciente: ${newSlot.paciente}`,
      });
    } catch (err) {
      console.warn("Could not save to API Appointments directly, fallback saved locally:", err);
    }

    setSlots((prev) => [newSlot, ...prev.filter((s) => !(s.hora === newSlot.hora && s.doctor === newSlot.doctor))]);
    setShowBookModal(false);
    setSelectedSlotForBooking(null);
    setFormMotivo("");
    setSuccessToast("¡Espacio de agenda reservado con éxito!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const getStatusBadge = (estado?: string) => {
    switch (estado) {
      case "Confirmada":
        return "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 border-cyan-500/30";
      case "En Atención":
        return "bg-blue-500/15 text-blue-800 dark:text-blue-200 border-blue-500/30";
      case "Pendiente":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30";
      case "Completada":
        return "bg-purple-500/15 text-purple-800 dark:text-purple-200 border-purple-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-scaleIn">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Encabezado Principal estilo Pacientes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Calendario y Agenda Clínica
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Visualización interactiva de disponibilidad horaria por profesional y día.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchAgendaData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            title="Recargar agenda desde base de datos"
          >
            <RefreshCw size={16} className={`text-cyan-600 dark:text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm text-xs font-semibold"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleOpenBook("09:00", selectedDoctor === "Todos los Odontólogos" ? (doctoresList[1] || "Dr. Especialista") : selectedDoctor)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Agendar Espacio</span>
          </button>
        </div>
      </div>

      {/* Barra de Navegación de Fecha + Selector de Doctor */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 animate-slideUp animate-stagger-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            aria-label="Día anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl backdrop-blur-xl shadow-md">
            <CalendarIcon size={16} className="text-cyan-600 dark:text-cyan-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            aria-label="Día siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Filtro por Odontólogo */}
        <div className="flex items-center gap-2">
          <Stethoscope size={18} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-cyan-500 backdrop-blur-xl shadow-md cursor-pointer"
          >
            {doctoresList.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Franjas Horarias (Timeline Diario) */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md overflow-hidden p-6 space-y-3 animate-slideUp animate-stagger-2">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/15">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={18} className="text-cyan-500" />
            <span>Franjas Horarias del Día ({selectedDate})</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {filteredSlots.filter((s) => s.estado === "Libre").length} espacios disponibles
          </span>
        </div>

        <div className="space-y-3">
          {filteredSlots.map((slot) => {
            const isLibre = slot.estado === "Libre";
            return (
              <div
                key={`${slot.hora}-${slot.doctor}`}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLibre
                    ? "bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-300/80 dark:border-white/15 hover:border-cyan-500/50 hover:bg-cyan-500/5"
                    : "bg-white/95 dark:bg-slate-900/70 border-slate-200/90 dark:border-white/20 shadow-sm"
                }`}
              >
                {/* Hora y Doctor */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs border border-slate-200 dark:border-white/10">
                    <Clock size={13} className="text-cyan-500" />
                    <span>{slot.hora}</span>
                  </div>

                  <div>
                    {isLibre ? (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Espacio Disponible para Atención
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User size={14} className="text-cyan-600 dark:text-cyan-400" />
                          <span>{slot.paciente}</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {slot.servicio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Doctor y Acción */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/10">
                  <div className="text-right text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">{slot.doctor}</span>
                    {slot.motivo && <span className="text-[11px] text-slate-500 dark:text-slate-400">{slot.motivo}</span>}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusBadge(
                      slot.estado
                    )}`}
                  >
                    {isLibre && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    {slot.estado}
                  </span>

                  {isLibre && (
                    <button
                      type="button"
                      onClick={() => handleOpenBook(slot.hora, slot.doctor)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white dark:text-slate-950 font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      Reservar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL RESERVAR ESPACIO */}
      {showBookModal && selectedSlotForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Reservar Cita en Agenda
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedDate} a las <strong className="text-teal-600 dark:text-teal-400">{selectedSlotForBooking.hora}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <SelectOrWriteInput
                label="Odontólogo Tratante"
                value={formDoctor}
                onChange={(val) => setFormDoctor(val)}
                options={professionalsOptions}
                placeholder="Seleccionar doctor..."
                required
                type="doctor"
              />

              {!isPaciente && (
                <SelectOrWriteInput
                  label="Paciente"
                  value={formPaciente}
                  onChange={(val) => setFormPaciente(val)}
                  options={patientsOptions}
                  placeholder="Buscar o escribir paciente..."
                  required
                  type="paciente"
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Procedimiento o Servicio <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formServicio}
                  onChange={(e) => setFormServicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm cursor-pointer"
                >
                  {servicesList.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo de la Cita o Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Escribe el motivo de la consulta..."
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none outline-none transition-all shadow-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AgendaView;
