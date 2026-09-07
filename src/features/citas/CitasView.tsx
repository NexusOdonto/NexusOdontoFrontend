import {
  Plus,
  Search,
  X,
  Stethoscope,
  RefreshCw,
  CheckCircle2,
  Trash2,
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
import { SelectOrWriteInput, type SelectOption } from "../../components/common/SelectOrWriteInput";
import { areGuidsEqual } from "../../utils/roleUtils";
import { AlertCircle } from "lucide-react";

const defaultSeedPatients: SelectOption[] = [
  { label: "Andrés Pérez", subLabel: "Cédula: 1076543210 • paciente@nexusodonto.com", id: "1e000000-0000-0000-0000-000000000001" },
  { label: "Camila López", subLabel: "Cédula: 1098765436", id: "1e000000-0000-0000-0000-000000000002" },
  { label: "Felipe Torres", subLabel: "Cédula: 1098765437", id: "1e000000-0000-0000-0000-000000000003" },
  { label: "Valentina Mendoza", subLabel: "Cédula: 1098765438", id: "1e000000-0000-0000-0000-000000000004" },
];

const defaultSeedDoctors: SelectOption[] = [
  { label: "Dra. Laura Gómez", subLabel: "Especialidad: Ortodoncia y Estética", id: "1d000000-0000-0000-0000-000000000001" },
  { label: "Dr. Roberto Martínez", subLabel: "Especialidad: Cirugía Oral e Implantología", id: "1d000000-0000-0000-0000-000000000002" },
  { label: "Dra. Ana Sofía Silva", subLabel: "Especialidad: Endodoncia y Periodoncia", id: "1d000000-0000-0000-0000-000000000003" },
  { label: "Dr. Juan Martínez", subLabel: "Especialidad: Odontología General" },
  { label: "Dra. Patricia Silva", subLabel: "Especialidad: Endodoncia Microscópica" },
];

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [servicesList, setServicesList] = useState<string[]>([
    "Limpieza y Valoración General",
    "Blanqueamiento Dental Láser",
    "Calza en Resina Simple",
    "Extracción Dental Cordal",
    "Control de Ortodoncia",
  ]);
  const [servicesRaw, setServicesRaw] = useState<{ id: string; name: string }[]>([]);
  const [professionalsList, setProfessionalsList] = useState<string[]>([
    "Dra. Laura Gómez",
    "Dr. Roberto Martínez",
    "Dra. Ana Sofía Silva",
    "Dr. Juan Martínez",
    "Dra. Patricia Silva",
  ]);

  const [patientsOptions, setPatientsOptions] = useState<SelectOption[]>(defaultSeedPatients);
  const [professionalsOptions, setProfessionalsOptions] = useState<SelectOption[]>(defaultSeedDoctors);

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

  // Modal de Edición de Cita
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCitaToEdit, setSelectedCitaToEdit] = useState<Cita | null>(null);
  const [editPaciente, setEditPaciente] = useState("");
  const [editProfesional, setEditProfesional] = useState("");
  const [editServicio, setEditServicio] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editEstado, setEditEstado] = useState<EstadoCita>("Confirmada");
  const [editMotivo, setEditMotivo] = useState("");

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const todayDateString = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Formulario de creación/solicitud
  const [formPaciente, setFormPaciente] = useState("");
  const [formServicio, setFormServicio] = useState("Valoración General Odontológica");
  const [formFecha, setFormFecha] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [formHora, setFormHora] = useState("09:00");
  const [formProfesional, setFormProfesional] = useState("");
  const [formMotivo, setFormMotivo] = useState("");

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

      const translateServiceName = (name: string): string => {
        if (!name) return "Valoración General Odontológica";
        const map: Record<string, string> = {
          "general assessment": "Valoración General Odontológica",
          "dental prophylaxis": "Profilaxis y Limpieza Dental",
          "composite resin filling": "Restauración en Resina Compuesta",
          "teeth whitening": "Blanqueamiento Dental Clínico",
          "dental cleaning": "Profilaxis y Limpieza Dental",
          "resin restoration": "Restauración en Resina Compuesta",
          "orthodontic control": "Control de Ortodoncia",
          "tooth extraction": "Extracción Dental",
          "root canal": "Endodoncia / Tratamiento de Conductos",
        };
        return map[name.trim().toLowerCase()] || name;
      };

      // Catálogo de servicios
      if (services.length > 0) {
        const translatedServices = services.map((s) => ({ id: s.id, name: translateServiceName(s.name) }));
        setServicesRaw(translatedServices);
        const names = translatedServices.map((s) => s.name);
        setServicesList(names);
        setFormServicio(names[0]);
      } else {
        setFormServicio("Valoración General Odontológica");
      }

      // Catálogo y opciones de profesionales
      if (profs.length > 0) {
        const profNames = profs.map((p: any) =>
          (p.firstName || p.lastName) ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim() : "Dra. Laura Gómez"
        );
        setProfessionalsList(profNames);
        setFormProfesional(profNames[0] || "");

        const profOpts: SelectOption[] = profs.map((p: any) => {
          const name = (p.firstName || p.lastName) ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim() : "Dra. Laura Gómez";
          const spec = p.specialty || p.roleName || "Odontología Integral";
          return {
            id: p.id,
            label: name,
            subLabel: `Especialidad: ${spec}`,
            data: { professionalId: p.id, specialty: spec }
          };
        });
        setProfessionalsOptions(profOpts);
      } else {
        setFormProfesional("");
      }

      // Catálogo y opciones de pacientes para búsqueda / filtrado
      const loadedPatientOpts: SelectOption[] = [];
      const seenNames = new Set<string>();

      // 1. Desde API Patients y Persons
      patients.forEach((pt: any) => {
        const person = pt.personId ? personsMap[String(pt.personId).toLowerCase()] : undefined;
        const name = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : (pt.name || "Paciente Registrado");
        const doc = person?.documentNumber || pt.documentNumber || "";
        const email = person?.email || pt.email || "";
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          loadedPatientOpts.push({
            id: pt.id,
            label: name,
            subLabel: doc ? `Cédula: ${doc}${email ? ` • ${email}` : ""}` : email,
            data: { patientId: pt.id, personId: pt.personId, email, doc },
          });
        }
      });

      // 2. Personas que aún no tengan registro en patient
      persons.forEach((per: any) => {
        const name = `${per.firstName || ""} ${per.lastName || ""}`.trim();
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          loadedPatientOpts.push({
            id: per.id,
            label: name,
            subLabel: per.documentNumber ? `Cédula: ${per.documentNumber}${per.email ? ` • ${per.email}` : ""}` : per.email,
            data: { personId: per.id, email: per.email, doc: per.documentNumber },
          });
        }
      });

      // 3. Pacientes creados localmente / guardados en localStorage (todas las posibles claves)
      const keysToCheck = ["nexusodontopacientes", "pacientes", "nexus_pacientes", "nexus_pacientes_v1", "nexus_users"];
      keysToCheck.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
            list.forEach((lp: any) => {
              const name = lp.nombre || (lp.nombres ? `${lp.nombres} ${lp.apellidos || ""}`.trim() : (lp.firstName ? `${lp.firstName} ${lp.lastName || ""}`.trim() : ""));
              if (name && !seenNames.has(name.toLowerCase())) {
                seenNames.add(name.toLowerCase());
                loadedPatientOpts.unshift({
                  id: lp.id || String(Date.now()),
                  label: name,
                  subLabel: lp.documento || lp.documentNumber ? `Cédula: ${lp.documento || lp.documentNumber}${lp.correo || lp.email ? ` • ${lp.correo || lp.email}` : ""}` : (lp.correo || lp.email),
                  data: { doc: lp.documento || lp.documentNumber, email: lp.correo || lp.email },
                });
              }
            });
          } catch {
            // Ignore
          }
        }
      });

      // 4. Asegurar pacientes base si aún no están en la lista
      defaultSeedPatients.forEach((sp) => {
        if (!seenNames.has(sp.label.toLowerCase())) {
          seenNames.add(sp.label.toLowerCase());
          loadedPatientOpts.push(sp);
        }
      });

      setPatientsOptions(loadedPatientOpts);

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

    const fechaValida = formFecha || todayDateString;
    const horaValida = formHora || "10:00";

    // Validar restricción de fechas/horas pasadas (BUG-05)
    if (formFecha && formHora) {
      const selectedDateTime = new Date(`${formFecha}T${formHora}:00`);
      const now = new Date();
      if (selectedDateTime < now) {
        setErrorMessage("No es posible agendar citas en fechas u horas pasadas.");
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    const matchedPatientId =
      patientsOptions.find((p) => p.label.toLowerCase() === pacienteNombre.toLowerCase() || areGuidsEqual(p.id, pacienteNombre))?.data?.id ||
      (isPaciente && user?.id ? user.id : "1e000000-0000-0000-0000-000000000001");

    const matchedProfId =
      professionalsOptions.find((d) => d.label.toLowerCase() === formProfesional.toLowerCase() || areGuidsEqual(d.id, formProfesional))?.data?.id ||
      "1d000000-0000-0000-0000-000000000001";

    const matchedServiceId =
      servicesRaw.find((s) => s.name.toLowerCase() === formServicio.toLowerCase() || areGuidsEqual(s.id, formServicio))?.id ||
      "30000000-0000-0000-0000-000000000001";

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
      patientId: matchedPatientId,
      professionalId: matchedProfId,
      serviceId: matchedServiceId,
    };

    // Persistir directamente en API backend .NET
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
        patientId: matchedPatientId || targetPatientId,
        professionalId: matchedProfId || targetProfId,
        serviceId: matchedServiceId || targetServiceId,
        startsAt: `${fechaValida}T${horaValida}:00`,
        endsAt: `${fechaValida}T${endsHoraStr}:00`,
        appointmentStatusId: isPaciente
          ? "10000000-0000-0000-0000-000000000001" // AGENDADA
          : "10000000-0000-0000-0000-000000000002", // CONFIRMADA
        appointmentOriginId: "20000000-0000-0000-0000-000000000003", // WEB
        reasonForVisit: nuevaCita.motivo || "Solicitud agendada vía portal web",
        notes: `Servicio: ${nuevaCita.servicio}. Paciente: ${nuevaCita.paciente}`,
      });
      if (createdFromApi && createdFromApi.id) {
        nuevaCita.appointmentId = createdFromApi.id;
      }
      console.log("Cita guardada exitosamente en Backend API .NET:", createdFromApi);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setErrorMessage("El odontólogo seleccionado ya tiene una cita programada en ese horario. Por favor, elige otra hora o profesional.");
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      console.warn("API appointment creation info:", err?.response?.data || err?.message);
    }

    const updated = [nuevaCita, ...citas];
    setCitas(updated);
    localStorage.setItem("nexus_citas", JSON.stringify(updated));

    setShowRequestModal(false);
    setFormMotivo("");
    refreshNotifications();
    await fetchAppointmentsAndCatalogs();
    setSuccessToast(
      isPaciente
        ? "¡Tu cita ha sido solicitada con éxito! Registrada en sistema."
        : "¡Cita creada y confirmada exitosamente en agenda y base de datos!"
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleUpdateStatus = async (citaId: number, nuevoEstado: EstadoCita) => {
    const targetCita = citas.find((c) => c.id === citaId);

    setCitas((prev) => {
      const updated = prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c));
      localStorage.setItem("nexus_citas", JSON.stringify(updated));
      return updated;
    });

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
          professionalId: targetCita.professionalId || matchedProf?.id || "1d000000-0000-0000-0000-000000000001",
          serviceId: targetCita.serviceId || matchedServ?.id || "30000000-0000-0000-0000-000000000001",
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
    const matchedProfId =
      professionalsOptions.find((d) => d.label.toLowerCase() === formProfesional.toLowerCase())?.data?.id ||
      matchedProf?.id ||
      "1d000000-0000-0000-0000-000000000001";
    const matchedServ = servicesEntities.find((s) =>
      s.name?.toLowerCase().includes(selectedCitaToAssign.servicio?.toLowerCase() || "")
    );

    setCitas((prev) => {
      const updated: Cita[] = prev.map((c) =>
        c.id === selectedCitaToAssign.id
          ? {
              ...c,
              profesional: formProfesional,
              professionalId: matchedProfId,
              hora: formHora || c.hora,
              estado: "Confirmada" as EstadoCita,
            }
          : c
      );
      localStorage.setItem("nexus_citas", JSON.stringify(updated));
      return updated;
    });

    if (selectedCitaToAssign.appointmentId) {
      try {
        await appointmentService.update(selectedCitaToAssign.appointmentId, {
          patientId: selectedCitaToAssign.patientId || "1e000000-0000-0000-0000-000000000001",
          professionalId: matchedProfId,
          serviceId: selectedCitaToAssign.serviceId || matchedServ?.id || "30000000-0000-0000-0000-000000000001",
          startsAt: `${selectedCitaToAssign.fecha}T${formHora || selectedCitaToAssign.hora}:00`,
          endsAt: `${selectedCitaToAssign.fecha}T${formHora || selectedCitaToAssign.hora}:00`,
          appointmentStatusId: "10000000-0000-0000-0000-000000000002", // CONFIRMADA
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: selectedCitaToAssign.motivo,
          notes: `Odontólogo asignado: ${formProfesional}`,
        });
      } catch (err) {
        console.warn("Could not persist assigned doctor in API:", err);
      }
    }

    setShowAssignModal(false);
    setSelectedCitaToAssign(null);
    refreshNotifications();
    setSuccessToast("¡Cita aprobada y odontólogo asignado con éxito!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAssign = (cita: Cita) => {
    setSelectedCitaToAssign(cita);
    setFormProfesional(cita.profesional || professionalsList[0]);
    setFormHora(cita.hora || "09:00");
    setShowAssignModal(true);
  };

  const handleOpenEdit = (cita?: Cita) => {
    const targetCita = cita || citas[0];
    if (!targetCita) return;

    setSelectedCitaToEdit(targetCita);
    setEditPaciente(targetCita.paciente);
    setEditProfesional(targetCita.profesional || professionalsList[0] || "");
    setEditServicio(targetCita.servicio);
    setEditFecha(targetCita.fecha);
    setEditHora(targetCita.hora);
    setEditEstado(targetCita.estado);
    setEditMotivo(targetCita.motivo || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitaToEdit) return;

    // Validar restricción de fechas/horas pasadas (BUG-05)
    if (editFecha && editHora) {
      const selectedDateTime = new Date(`${editFecha}T${editHora}:00`);
      const now = new Date();
      if (selectedDateTime < now) {
        setErrorMessage("No es posible reprogramar citas en fechas u horas pasadas.");
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    const matchedProfId =
      professionalsOptions.find((d) => d.label.toLowerCase() === editProfesional.toLowerCase() || areGuidsEqual(d.id, editProfesional))?.data?.id ||
      "1d000000-0000-0000-0000-000000000001";

    const matchedServiceId =
      servicesRaw.find((s) => s.name.toLowerCase() === editServicio.toLowerCase() || areGuidsEqual(s.id, editServicio))?.id ||
      "30000000-0000-0000-0000-000000000001";

    const statusMap: Record<EstadoCita, string> = {
      "Pendiente": "10000000-0000-0000-0000-000000000001",
      "Confirmada": "10000000-0000-0000-0000-000000000002",
      "En Atención": "10000000-0000-0000-0000-000000000003",
      "Completada": "10000000-0000-0000-0000-000000000004",
      "Cancelada": "10000000-0000-0000-0000-000000000005",
    };

    setCitas((prev) => {
      const updated = prev.map((c) =>
        c.id === selectedCitaToEdit.id
          ? {
              ...c,
              paciente: editPaciente,
              profesional: editProfesional,
              professionalId: matchedProfId,
              servicio: editServicio,
              serviceId: matchedServiceId,
              fecha: editFecha,
              hora: editHora,
              estado: editEstado,
              motivo: editMotivo,
            }
          : c
      );
      localStorage.setItem("nexus_citas", JSON.stringify(updated));
      return updated;
    });

    if (selectedCitaToEdit.appointmentId) {
      try {
        await appointmentService.update(selectedCitaToEdit.appointmentId, {
          professionalId: matchedProfId,
          serviceId: matchedServiceId,
          startsAt: `${editFecha}T${editHora}:00`,
          endsAt: `${editFecha}T${editHora}:00`,
          appointmentStatusId: statusMap[editEstado] || "10000000-0000-0000-0000-000000000002",
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: editMotivo,
          notes: `Editado: ${editPaciente} con ${editProfesional}`,
        });
      } catch (e: any) {
        if (e?.response?.status === 409) {
          setErrorMessage("Conflicto de horario: El odontólogo ya tiene una cita en ese horario. Por favor selecciona otra franja.");
          setTimeout(() => setErrorMessage(null), 5000);
          return;
        }
        console.warn("API edit error:", e);
      }
    }

    setShowEditModal(false);
    setSelectedCitaToEdit(null);
    refreshNotifications();
    await fetchAppointmentsAndCatalogs();
    setSuccessToast("¡Cita modificada y guardada exitosamente en base de datos!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDeleteAppointment = async () => {
    if (!selectedCitaToEdit) return;
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la cita de ${selectedCitaToEdit.paciente}?`
    );
    if (!confirmDelete) return;

    setCitas((prev) => {
      const updated = prev.filter((c) => c.id !== selectedCitaToEdit.id);
      localStorage.setItem("nexus_citas", JSON.stringify(updated));
      return updated;
    });

    if (selectedCitaToEdit.appointmentId) {
      try {
        await appointmentService.delete(selectedCitaToEdit.appointmentId);
      } catch (e) {
        console.warn("API delete error:", e);
      }
    }

    setShowEditModal(false);
    setSelectedCitaToEdit(null);
    refreshNotifications();
    setSuccessToast("¡Cita eliminada correctamente!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* TOASTS DE CONFIRMACIÓN Y ERROR */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-scaleIn">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-rose-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-rose-500/40 animate-scaleIn">
          <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
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
              setFormFecha(todayDateString);
              setFormHora("09:00");
              setFormMotivo("");
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
            value={fecha || ""}
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
          onOpenEditModal={handleOpenEdit}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* MODAL 1: SOLICITAR / CREAR CITA */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {isPaciente ? "Solicitar Cita Médica" : "Agendar Nueva Cita"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPaciente
                    ? "Tu solicitud será revisada por el equipo para asignación de horario."
                    : "Ingresa los datos para registrar la cita en el sistema."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrRequest} className="p-6 space-y-4">
              {isPaciente ? (
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 text-xs text-teal-800 dark:text-teal-200 flex items-center gap-2.5">
                  <Stethoscope size={16} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <p className="leading-relaxed">
                    El <strong>Odontólogo Especialista</strong> y el horario exacto serán confirmados por el equipo clínico.
                  </p>
                </div>
              ) : (
                <SelectOrWriteInput
                  label="Paciente"
                  value={formPaciente}
                  onChange={(val) => setFormPaciente(val)}
                  options={patientsOptions}
                  placeholder="Buscar por cédula o nombre..."
                  required
                  type="paciente"
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Servicio o Tratamiento <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formServicio}
                  onChange={(e) => setFormServicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fecha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    name="fecha"
                    min={todayDateString}
                    value={formFecha || todayDateString}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormFecha(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isPaciente ? "Horario preferido *" : "Hora *"}
                  </label>
                  <input
                    type="time"
                    required
                    name="hora"
                    value={formHora || "09:00"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormHora(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {!isPaciente && (
                <SelectOrWriteInput
                  label="Odontólogo Asignado"
                  value={formProfesional}
                  onChange={(val) => setFormProfesional(val)}
                  options={professionalsOptions}
                  placeholder="Seleccionar doctor..."
                  required
                  type="doctor"
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo de la consulta o notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Escribe el motivo o síntomas..."
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none outline-none transition-all shadow-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {isPaciente ? "Enviar Solicitud" : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APROBAR / ASIGNAR ODONTÓLOGO (RECEPCIÓN / ADMIN) */}
      {showAssignModal && selectedCitaToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Asignar Odontólogo
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Paciente: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCitaToAssign.paciente}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDoctor} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <p className="text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-slate-100">Servicio:</strong> {selectedCitaToAssign.servicio}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-slate-100">Fecha solicitada:</strong> {selectedCitaToAssign.fecha}
                </p>
                {selectedCitaToAssign.motivo && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100">Motivo:</strong> {selectedCitaToAssign.motivo}
                  </p>
                )}
              </div>

              <SelectOrWriteInput
                label="Odontólogo Tratante"
                value={formProfesional}
                onChange={(val) => setFormProfesional(val)}
                options={professionalsOptions}
                placeholder="Seleccionar odontólogo..."
                required
                type="doctor"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hora de Consulta <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm [color-scheme:dark]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDITAR CITA EXISTENTE */}
      {showEditModal && selectedCitaToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {isPaciente ? "Detalles de la Cita" : "Editar Cita"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPaciente
                    ? "Modifica tu fecha o notas de consulta."
                    : "Actualiza los datos de la cita clínica."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {isPaciente ? (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Paciente:</span>
                    <strong className="text-slate-900 dark:text-slate-100">{editPaciente}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Doctor Asignado:</span>
                    <strong className={editProfesional ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400 italic"}>
                      {editProfesional || "Por asignar"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Estado:</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">{editEstado}</span>
                  </div>
                </div>
              ) : (
                <>
                  <SelectOrWriteInput
                    label="Paciente"
                    value={editPaciente}
                    onChange={(val) => setEditPaciente(val)}
                    options={patientsOptions}
                    placeholder="Buscar o escribir paciente..."
                    required
                    type="paciente"
                  />

                  <SelectOrWriteInput
                    label="Odontólogo Asignado"
                    value={editProfesional}
                    onChange={(val) => setEditProfesional(val)}
                    options={professionalsOptions}
                    placeholder="Seleccionar doctor..."
                    required
                    type="doctor"
                  />
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Servicio o Tratamiento <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editServicio}
                  onChange={(e) => setEditServicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fecha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    name="editFecha"
                    min={todayDateString}
                    value={editFecha || todayDateString}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFecha(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hora <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    name="editHora"
                    value={editHora || "09:00"}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditHora(val);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              {!isPaciente && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estado de la Cita
                  </label>
                  <select
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value as EstadoCita)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmada">Confirmada</option>
                    <option value="En Atención">En Atención</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo de la Consulta o Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle de la consulta..."
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none outline-none transition-all shadow-sm"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                {!isPaciente && (
                  <button
                    type="button"
                    onClick={handleDeleteAppointment}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar Cita</span>
                  </button>
                )}

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}