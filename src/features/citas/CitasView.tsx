import {
  Plus,
  Search,
  X,
  Stethoscope,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

import { CitasTable } from "./components/CitasTable";
import { type Cita, type EstadoCita } from "./types";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { appointmentService, type AppointmentResponseDto } from "../../api/appointmentService";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { professionalService } from "../../api/professionalService";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { employeeService } from "../../api/employeeService";
import { specialtyService } from "../../api/specialtyService";
import { useNotifications } from "../../context/NotificationContext";
import { SelectOrWriteInput, type SelectOption } from "../../components/common/SelectOrWriteInput";
import { ModernServiceSelect, type ServiceItem } from "../../components/common/ModernServiceSelect";
import { ModernDoctorSelect } from "../../components/common/ModernDoctorSelect";
import { GlassSelect } from "../../components/common/GlassSelect";
import { areGuidsEqual } from "../../utils/roleUtils";
import { resolveOrCreatePatient } from "../../utils/patientResolution";
import { validateClinicAppointmentSchedule } from "../../utils/clinicSchedule";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import { GlassDatePicker } from "../../components/common/GlassDatePicker";
import { GlassTimePicker } from "../../components/common/GlassTimePicker";
import { AlertCircle } from "lucide-react";

const defaultSeedPatients: SelectOption[] = [
  { label: "Andrés Pérez", subLabel: "Cédula: 1076543210 • paciente@nexusodonto.com", id: "1e000000-0000-0000-0000-000000000001" },
  { label: "Camila López", subLabel: "Cédula: 1098765436", id: "1e000000-0000-0000-0000-000000000002" },
  { label: "Felipe Torres", subLabel: "Cédula: 1098765437", id: "1e000000-0000-0000-0000-000000000003" },
  { label: "Valentina Mendoza", subLabel: "Cédula: 1098765438", id: "1e000000-0000-0000-0000-000000000004" },
];

const defaultSeedDoctors: SelectOption[] = [
  { label: "Dra. Laura Gómez", subLabel: "Especialidad: Ortodoncia y Estética", specialty: "Ortodoncia y Estética", id: "1d000000-0000-0000-0000-000000000001" },
  { label: "Dr. Roberto Martínez", subLabel: "Especialidad: Cirugía Oral e Implantología", specialty: "Cirugía Oral e Implantología", id: "1d000000-0000-0000-0000-000000000002" },
  { label: "Dra. Ana Sofía Silva", subLabel: "Especialidad: Endodoncia y Periodoncia", specialty: "Endodoncia y Periodoncia", id: "1d000000-0000-0000-0000-000000000003" },
  { label: "Dr. Carlos Santana", subLabel: "Especialidad: Odontología Integral", specialty: "Odontología Integral", id: "8e7c7aa0-f574-41a8-8995-55faef58cdfb" },
  { label: "Dr. Juan Martínez", subLabel: "Especialidad: Odontología General", specialty: "Odontología General" },
  { label: "Dra. Patricia Silva", subLabel: "Especialidad: Endodoncia Microscópica", specialty: "Endodoncia Microscópica" },
];

const defaultSeedServices: ServiceItem[] = [
  { id: "14000000-0000-0000-0000-000000000001", name: "Valoración General Odontológica", durationMinutes: 30, price: 50000, category: "Higiene y Prevención", description: "Evaluación clínica integral y diagnóstico odontológico." },
  { id: "14000000-0000-0000-0000-000000000002", name: "Profilaxis y Limpieza Dental con Ultrasonido", durationMinutes: 45, price: 80000, category: "Higiene y Prevención", description: "Eliminación de cálculo supragingival con ultrasonido y pulido coronario." },
  { id: "14000000-0000-0000-0000-000000000003", name: "Restauración en Resina Fotocurable", durationMinutes: 45, price: 75000, category: "Operatoria / Resinas", description: "Reconstrucción estética y funcional con resina nanohíbrida." },
  { id: "14000000-0000-0000-0000-000000000004", name: "Blanqueamiento Dental Clínico LED", durationMinutes: 60, price: 280000, category: "Estética Dental", description: "Aclaramiento dental profesional en consultorio con fotoactivación." },
  { id: "14000000-0000-0000-0000-000000000005", name: "Extracción Dental Simple y Quirúrgica", durationMinutes: 45, price: 95000, category: "Cirugía Oral", description: "Extracción mínimamente invasiva con anestesia local controlada." },
  { id: "14000000-0000-0000-0000-000000000006", name: "Tratamiento de Conducto (Endodoncia)", durationMinutes: 60, price: 260000, category: "Endodoncia", description: "Desinfección biomecánica y obturación tridimensional de conductos." },
  { id: "14000000-0000-0000-0000-000000000007", name: "Control y Ajuste de Ortodoncia", durationMinutes: 45, price: 120000, category: "Ortodoncia", description: "Revisión mensual de aparatología fija o alineadores invisibles." },
];

const citasFallback: Cita[] = [];

export function CitasView() {
  const { user } = useAuth();
  const { refreshNotifications, addNotification } = useNotifications();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navState = location.state as {
    openAgendar?: boolean;
    paciente?: string;
    pacienteCedula?: string;
    pacienteId?: string;
    patientName?: string;
    patientDocument?: string;
    patientId?: string;
  } | null;
  const handledNavKeyRef = useRef<string>("");
  const role = getUserRole(user);

  const isPaciente = role === "PACIENTE";
  const isOdontologo = role === "ODONTOLOGO";
  const isRecepcionista = role === "RECEPCIONISTA";
  const isAdmin = role === "ADMINISTRADOR";

  const [citas, setCitas] = useState<Cita[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [servicesList, setServicesList] = useState<string[]>(defaultSeedServices.map((s) => s.name));
  const [servicesRaw, setServicesRaw] = useState<ServiceItem[]>(defaultSeedServices);
  const [professionalsList, setProfessionalsList] = useState<string[]>([
    "Dra. Laura Gómez",
    "Dr. Roberto Martínez",
    "Dra. Ana Sofía Silva",
    "Dr. Carlos Santana",
    "Dr. Juan Martínez",
    "Dra. Patricia Silva",
  ]);

  const [patientsOptions, setPatientsOptions] = useState<SelectOption[]>(defaultSeedPatients);
  const [professionalsOptions, setProfessionalsOptions] = useState<SelectOption[]>(defaultSeedDoctors);

  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"Todos" | EstadoCita>("Todos");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [servicesEntities, setServicesEntities] = useState<any[]>([]);
  const [profsEntities, setProfsEntities] = useState<any[]>([]);
  const [patientsEntities, setPatientsEntities] = useState<any[]>([]);
  const [personsEntities, setPersonsEntities] = useState<any[]>([]);

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

  // Estados de errores locales para modales (Sección 3.7)
  const [formError, setFormError] = useState<string | null>(null);
  const [assignFormError, setAssignFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  const getNextValidHour = useCallback((dateStr?: string) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    
    // Si la fecha es hoy o no se especificó
    if (!dateStr || dateStr === today) {
      const future = new Date(now.getTime() + 35 * 60 * 1000);
      let targetH = future.getHours();
      let targetM = future.getMinutes() > 30 ? "00" : "30";
      if (future.getMinutes() > 30) {
        targetH += 1;
      }
      if (targetH >= 8 && targetH <= 11) {
        return `${String(targetH).padStart(2, "0")}:${targetM}`;
      } else if (targetH >= 12 && targetH < 14) {
        return "14:00";
      } else if (targetH >= 14 && targetH <= 16) {
        return `${String(targetH).padStart(2, "0")}:${targetM}`;
      } else {
        return "09:00";
      }
    }
    return "09:00";
  }, []);

  const normalizeTimeTo24h = useCallback((timeInput: string): string => {
    if (!timeInput) return getNextValidHour();
    const trimmed = timeInput.trim().toLowerCase();
    
    // Manejo de formatos 12 horas con AM/PM (ej. "03:00 pm", "3:00 p.m.", "09:00 a.m.")
    const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?|am|pm)?$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const meridian = ampmMatch[3]?.toLowerCase();

      if (meridian && (meridian.includes("p") || meridian === "pm")) {
        if (hours < 12) hours += 12;
      } else if (meridian && (meridian.includes("a") || meridian === "am")) {
        if (hours === 12) hours = 0;
      }
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    
    // Formato estándar 24h "HH:mm"
    const standardMatch = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (standardMatch) {
      const hours = parseInt(standardMatch[1], 10);
      const minutes = parseInt(standardMatch[2], 10);
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    return "09:00";
  }, [getNextValidHour]);

  const calculateEndDateTime = useCallback((dateStr: string, timeStr: string, durationMinutes: number = 30) => {
    const cleanTime = normalizeTimeTo24h(timeStr);
    const parts = cleanTime.split(":");
    let startH = parseInt(parts[0], 10);
    let startM = parseInt(parts[1], 10);
    if (isNaN(startH)) startH = 9;
    if (isNaN(startM)) startM = 0;

    const startDate = new Date(`${dateStr}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`);
    
    // Duración estándar médica de 30 minutos (mínimo 15 min)
    const effectiveDuration = Math.max(15, durationMinutes || 30);
    const endDate = new Date(startDate.getTime() + effectiveDuration * 60000);

    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
    const endDay = String(endDate.getDate()).padStart(2, "0");
    const endH = String(endDate.getHours()).padStart(2, "0");
    const endM = String(endDate.getMinutes()).padStart(2, "0");

    return {
      startsAt: `${dateStr}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00`,
      endsAt: `${endYear}-${endMonth}-${endDay}T${endH}:${endM}:00`,
      endsHoraStr: `${endH}:${endM}`,
    };
  }, [normalizeTimeTo24h]);

  const todayDateString = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Formulario de creación/solicitud
  const [formPaciente, setFormPaciente] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [formServicio, setFormServicio] = useState("Valoración General Odontológica");
  const [formFecha, setFormFecha] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [formHora, setFormHora] = useState(() => {
    const now = new Date();
    const nextHour = now.getHours() + 1;
    if (nextHour >= 7 && nextHour <= 16) {
      return `${String(nextHour).padStart(2, "0")}:00`;
    }
    return "09:00";
  });
  const [formProfesional, setFormProfesional] = useState("");
  const [formMotivo, setFormMotivo] = useState("");

  // Carga inicial y sincronización con API REST enriqueciendo entidades
  const fetchAppointmentsAndCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar catálogos y entidades en paralelo desde la API
      const [servicesData, profData, patientsData, personsData, employeesData, specialtiesData, apiAppointments] = await Promise.allSettled([
        serviceCatalogService.getAll(),
        professionalService.getAll(),
        patientService.getAll(),
        personService.getAll(),
        employeeService.getAll(),
        specialtyService.getAll(),
        appointmentService.getAll(),
      ]);

      const services = servicesData.status === "fulfilled"
        ? (Array.isArray(servicesData.value) ? servicesData.value : (servicesData.value as any)?.data || [])
        : [];
      const profs = profData.status === "fulfilled"
        ? (Array.isArray(profData.value) ? profData.value : (profData.value as any)?.data || [])
        : [];
      const patients = patientsData.status === "fulfilled"
        ? (Array.isArray(patientsData.value) ? patientsData.value : (patientsData.value as any)?.data || [])
        : [];
      const persons = personsData.status === "fulfilled"
        ? (Array.isArray(personsData.value) ? personsData.value : (personsData.value as any)?.data || [])
        : [];
      const employees = employeesData.status === "fulfilled"
        ? (Array.isArray(employeesData.value) ? employeesData.value : (employeesData.value as any)?.data || [])
        : [];
      const specialties = specialtiesData.status === "fulfilled"
        ? (Array.isArray(specialtiesData.value) ? specialtiesData.value : (specialtiesData.value as any)?.data || [])
        : [];

      const rawApps = apiAppointments.status === "fulfilled" ? apiAppointments.value : [];
      const appointments: AppointmentResponseDto[] = Array.isArray(rawApps)
        ? rawApps
        : ((rawApps as any)?.data?.items || (rawApps as any)?.data || (rawApps as any)?.items || []);

      setServicesEntities(services);
      setProfsEntities(profs);
      setPatientsEntities(patients);
      setPersonsEntities(persons);

      // Mapas de personas y empleados para enriquecer nombres reales
      const personsMap: Record<string, any> = {};
      persons.forEach((per: any) => {
        if (per.id) {
          personsMap[String(per.id).toLowerCase()] = per;
        }
      });

      const empToPersonMap: Record<string, string> = {};
      employees.forEach((emp: any) => {
        if (emp.id && emp.personId) {
          empToPersonMap[String(emp.id).toLowerCase()] = String(emp.personId).toLowerCase();
        }
      });

      const specialtiesMap: Record<string, string> = {};
      specialties.forEach((sp: any) => {
        if (sp.id) {
          specialtiesMap[String(sp.id).toLowerCase()] = sp.name;
        }
      });

      // Mapas de búsqueda rápida para servicios
      const servicesMap: Record<string, string> = {};
      services.forEach((s: any) => {
        if (s.id) servicesMap[String(s.id).toLowerCase()] = s.name;
      });

      // Mapas de profesionales enriquecidos con su persona y especialidad
      const profsMap: Record<string, string> = {};
      const enrichedProfs: SelectOption[] = [];

      profs.forEach((p: any) => {
        const empPersonId = p.employeeId ? empToPersonMap[String(p.employeeId).toLowerCase()] : undefined;
        const person = (empPersonId && personsMap[empPersonId]) || (p.personId && personsMap[String(p.personId).toLowerCase()]);
        
        let profName = "";
        if (person) {
          profName = `Dr(a). ${person.firstName || ""} ${person.lastName || ""}`.trim();
        } else if (p.firstName || p.lastName) {
          profName = `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim();
        } else if (p.name) {
          profName = p.name;
        } else {
          profName = "Dra. Laura Gómez";
        }

        let specName = "Odontología Integral";
        if (Array.isArray(p.specialtyIds) && p.specialtyIds.length > 0) {
          const firstSpec = specialtiesMap[String(p.specialtyIds[0]).toLowerCase()];
          if (firstSpec) specName = firstSpec;
        } else if (p.specialty) {
          specName = p.specialty;
        }

        if (p.id) {
          profsMap[String(p.id).toLowerCase()] = profName;
          const profAvatar = person?.avatar || person?.avatarUrl || p.avatar || (person?.id ? localStorage.getItem(`user_avatar_${person.id}`) : null) || (p.id ? localStorage.getItem(`user_avatar_${p.id}`) : null) || null;
          enrichedProfs.push({
            id: p.id,
            label: profName,
            subLabel: `Especialidad: ${specName}`,
            specialty: specName,
            avatar: profAvatar,
            data: { professionalId: p.id, id: p.id, specialty: specName, personId: empPersonId, avatar: profAvatar }
          });
        }
      });

      // Asegurar doctores base si faltan
      defaultSeedDoctors.forEach((seedDoc) => {
        if (!enrichedProfs.some((ep) => ep.label.toLowerCase() === seedDoc.label.toLowerCase() || (seedDoc.id && areGuidsEqual(ep.id, seedDoc.id)))) {
          enrichedProfs.push(seedDoc);
        }
      });

      setProfessionalsOptions(enrichedProfs);
      const profNamesList = enrichedProfs.map((ep) => ep.label);
      setProfessionalsList(profNamesList);
      if (profNamesList.length > 0) {
        setFormProfesional((prev) => (prev && profNamesList.includes(prev) ? prev : profNamesList[0]));
      }

      const patientToPersonMap: Record<string, string> = {};
      patients.forEach((pt: any) => {
        if (pt.id && pt.personId) {
          patientToPersonMap[String(pt.id).toLowerCase()] = String(pt.personId).toLowerCase();
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

      // Catálogo de servicios sincronizado estrictamente con API y Catálogo de Servicios
      let mergedServices: ServiceItem[] = [];
      if (services.length > 0) {
        mergedServices = services
          .filter((s: any) => s.isActive !== false && s.activo !== false)
          .map((s: any) => ({
            id: s.id,
            name: translateServiceName(s.name),
            durationMinutes: s.durationMinutes || s.duracion || 45,
            price: s.price || s.precio || 0,
            category: s.category || s.categoria || "Odontología General",
            description: s.description || s.descripcion || "",
          }));
      } else {
        try {
          const localCatalogRaw = localStorage.getItem("nexus_servicios_catalog");
          if (localCatalogRaw) {
            const localList: any[] = JSON.parse(localCatalogRaw);
            if (Array.isArray(localList) && localList.length > 0) {
              mergedServices = localList
                .filter((ls) => ls.activo !== false)
                .map((ls) => ({
                  id: ls.id,
                  name: ls.nombre || ls.name,
                  durationMinutes: ls.duracion || ls.durationMinutes || 45,
                  price: ls.precio || ls.price || 0,
                  category: ls.categoria || ls.category || "Odontología General",
                  description: ls.descripcion || ls.description || "",
                }));
            }
          }
        } catch (err) {
          console.warn("Error reading nexus_servicios_catalog:", err);
        }

        if (mergedServices.length === 0) {
          mergedServices = defaultSeedServices;
        }
      }

      setServicesRaw(mergedServices);
      const names = mergedServices.map((s) => s.name);
      setServicesList(names);
      if (mergedServices.length > 0) {
        setSelectedServiceId((prev) => (prev && mergedServices.some((t) => areGuidsEqual(t.id, prev)) ? prev : mergedServices[0].id));
        setFormServicio((prev) => (prev && names.includes(prev) ? prev : names[0]));
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
          const person = (personId && personsMap[personId]) || (pId && personsMap[pId]) || undefined;

          const pacienteName = person
            ? `${person.firstName || ""} ${person.lastName || ""}`.trim()
            : a.patientName || "Paciente Registrado";
          const pacienteEmail = person?.email || a.patientEmail || "";
          const pacienteCedula = person?.documentNumber || a.patientDocument || "";

          const sId = a.serviceId ? String(a.serviceId).toLowerCase() : "";
          const servName = sId
            ? servicesMap[sId] || a.serviceName || "Consulta Odontológica"
            : a.serviceName || "Consulta Odontológica";

          const prId = a.professionalId ? String(a.professionalId).toLowerCase() : "";
          const profName = prId
            ? profsMap[prId] || a.professionalName || "Dra. Laura Gómez"
            : a.professionalName || "";

                    const stId = a.appointmentStatusId ? String(a.appointmentStatusId).toLowerCase() : "";
          let estadoName: EstadoCita = "Pendiente";

          if (a.cancelledAt || stId === "10000000-0000-0000-0000-000000000005") {
            estadoName = "Cancelada";
          } else if (stId === "10000000-0000-0000-0000-000000000006") {
            estadoName = "No Asistió";
          } else if (stId === "10000000-0000-0000-0000-000000000004") {
            estadoName = "Completada";
          } else if (stId === "10000000-0000-0000-0000-000000000003") {
            estadoName = "En Atención";
          } else if (stId === "10000000-0000-0000-0000-000000000002") {
            estadoName = "Confirmada";
          } else if (stId === "10000000-0000-0000-0000-000000000001") {
            estadoName = "Pendiente";
          } else if (a.statusName) {
            const sn = a.statusName.toUpperCase();
            if (sn.includes("NO_ASIST") || sn.includes("NO ASIST") || sn.includes("NO ATEND")) estadoName = "No Asistió";
            else if (sn.includes("COMPLET") || sn.includes("ATENDID")) estadoName = "Completada";
            else if (sn.includes("EN ATENCI") || sn.includes("ATTEND")) estadoName = "En Atención";
            else if (sn.includes("PEND") || sn.includes("AGEN") || sn.includes("SCHED")) estadoName = "Pendiente";
            else if (sn.includes("CONFIRM")) estadoName = "Confirmada";
          } else if (!a.professionalId || a.professionalId === "00000000-0000-0000-0000-000000000000") {
            estadoName = "Pendiente";
          }

          // Evaluación temporal: Si la cita no fue atendida (Completada / En Atención) y ya pasaron más de 45 minutos de su hora programada o es de un día anterior:
          if (estadoName !== "Completada" && estadoName !== "En Atención" && estadoName !== "Cancelada") {
            try {
              const [sYear, sMonth, sDay] = startDate.split("-").map(Number);
              const [sHour, sMin] = startTime.split(":").map(Number);
              const apptDateTime = new Date(sYear, sMonth - 1, sDay, sHour || 0, sMin || 0);
              const now = new Date();
              if (!isNaN(apptDateTime.getTime()) && now.getTime() > (apptDateTime.getTime() + 45 * 60 * 1000)) {
                estadoName = "No Asistió";
              }
            } catch {
              // Ignore
            }
          } else if (stId === "10000000-0000-0000-0000-000000000002") {
            estadoName = "Confirmada";
          } else if (stId === "10000000-0000-0000-0000-000000000003") {
            estadoName = "En Atención";
          } else if (stId === "10000000-0000-0000-0000-000000000004") {
            estadoName = "Completada";
          } else if (stId === "10000000-0000-0000-0000-000000000006") {
            estadoName = "No Asistió";
          } else if (a.statusName) {
            const sn = a.statusName.toUpperCase();
            if (sn.includes("NO_ASIST") || sn.includes("NO ASIST")) estadoName = "No Asistió";
            else if (sn.includes("PEND") || sn.includes("AGEN") || sn.includes("SCHED")) estadoName = "Pendiente";
            else if (sn.includes("CONFIRM")) estadoName = "Confirmada";
            else if (sn.includes("ATTEND") || sn.includes("EN ATENCI") || sn.includes("ATENCION")) estadoName = "En Atención";
            else if (sn.includes("COMPLET")) estadoName = "Completada";
          } else if (!a.professionalId || a.professionalId === "00000000-0000-0000-0000-000000000000") {
            estadoName = "Pendiente";
          }

          return {
            id: idx + 1,
            appointmentId: a.id,
            patientId: a.patientId,
            personId: personId,
            professionalId: a.professionalId,
            serviceId: a.serviceId,
            paciente: pacienteName,
            pacienteEmail: pacienteEmail,
            pacienteCedula: pacienteCedula,
            profesional: profName,
            servicio: servName,
            fecha: startDate,
            hora: startTime,
            estado: estadoName,
            motivo: a.reasonForVisit || a.notes || "Consulta Odontológica",
            canBeAttended: a.canBeAttended,
            attendanceMessage: a.attendanceMessage,
            startsAt: a.startsAt,
            endsAt: a.endsAt,
            rawDate: startDate,
          };
        });

        // Ordenar por fecha descendente
        mapped.sort((x, y) => (y.fecha + y.hora).localeCompare(x.fecha + x.hora));
        setCitas(mapped);
      } else {
        const saved = localStorage.getItem("nexus_citas");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setCitas(Array.isArray(parsed) ? parsed : citasFallback);
          } catch {
            setCitas(citasFallback);
          }
        } else {
          setCitas(citasFallback);
        }
      }
    } catch (error: any) {
      console.error("Fallo crítico al cargar citas en /citas:", error);
      setErrorMessage("No se pudieron cargar las citas. Intente sincronizar nuevamente.");
      setCitas(citasFallback);
    } finally {
      setTimeout(() => setLoading(false), 450);
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

  // Si se solicita agendar cita directamente para un paciente específico desde Pacientes o Historia Clínica
  useEffect(() => {
    const shouldOpen =
      navState?.openAgendar === true ||
      searchParams.get("action") === "agendar" ||
      searchParams.get("agendar") === "true";

    if (!shouldOpen) return;
    if (handledNavKeyRef.current === location.key) return;
    handledNavKeyRef.current = location.key;

    const targetPatientName =
      navState?.paciente ||
      navState?.patientName ||
      searchParams.get("paciente") ||
      searchParams.get("patientName") ||
      "";

    if (targetPatientName) {
      setFormPaciente(targetPatientName);
    } else if (isPaciente && user?.name) {
      setFormPaciente(user.name);
    }

    const defaultDate = todayDateString;
    const defaultHour = getNextValidHour(defaultDate);
    setFormFecha(defaultDate);
    setFormHora(defaultHour);
    setFormMotivo("");
    setFormError(null);

    if (servicesRaw.length > 0) {
      if (!selectedServiceId || !servicesRaw.some((s) => areGuidsEqual(s.id, selectedServiceId))) {
        setSelectedServiceId(servicesRaw[0].id);
        setFormServicio(servicesRaw[0].name);
      }
    }

    if (isOdontologo && user?.name) {
      const myProf = professionalsOptions.find((p) => p.label.toLowerCase().includes(user.name.toLowerCase()));
      if (myProf) {
        setFormProfesional(myProf.label);
      }
    }

    setShowRequestModal(true);
  }, [
    location.key,
    navState,
    searchParams,
    todayDateString,
    getNextValidHour,
    isPaciente,
    isOdontologo,
    user,
    servicesRaw,
    selectedServiceId,
    professionalsOptions,
  ]);

  // Helper para normalizar cadenas eliminando tildes y espacios
  const normalizeText = (str?: string) =>
    (str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  // Citas aisladas por rol (PACIENTE solo ve las suyas, ODONTOLOGO solo ve las suyas)
  const userRoleCitas = useMemo(() => {
    if (!isPaciente && !isOdontologo) return citas;

    return citas.filter((cita) => {
      // 1. Aislamiento por rol PACIENTE
      if (isPaciente) {
        const patientName = normalizeText(user?.name || user?.nombre || "");
        const patientEmail = (user?.email || "").toLowerCase().trim();
        const patientCedula = (user?.cedula || "").trim();
        const userPersonId = (user?.personId || "").toLowerCase().trim();
        const citaPersonId = (cita.personId || "").toLowerCase().trim();
        const citaPatientId = (cita.patientId || "").toLowerCase().trim();

        const isOwn =
          (user?.patientId && citaPatientId && areGuidsEqual(user.patientId, citaPatientId)) ||
          (userPersonId && citaPersonId && citaPersonId === userPersonId) ||
          (user?.id && citaPatientId && areGuidsEqual(user.id, citaPatientId)) ||
          (patientCedula && cita.pacienteCedula && cita.pacienteCedula === patientCedula) ||
          (patientEmail && cita.pacienteEmail && cita.pacienteEmail.toLowerCase() === patientEmail) ||
          (patientName &&
            cita.paciente &&
            (normalizeText(cita.paciente).includes(patientName) ||
              patientName.includes(normalizeText(cita.paciente))));

        return isOwn;
      }

      // 2. Aislamiento por rol ODONTÓLOGO
      if (isOdontologo) {
        const userPersonId = (user?.personId || "").toLowerCase().trim();
        const docName = normalizeText(user?.name || user?.nombre || "");
        const docNameParts = docName.split(/\s+/).filter((p) => p.length > 2);

        // Buscar la entidad profesional correspondiente al doctor logueado
        const myProf = profsEntities.find((p: any) => {
          const pPersonId = String(p.personId || "").toLowerCase().trim();
          if (userPersonId && pPersonId && pPersonId === userPersonId) return true;
          const pName = normalizeText(p.name || (p.firstName ? `${p.firstName} ${p.lastName || ""}` : ""));
          return docName && pName && (pName.includes(docName) || docName.includes(pName));
        });
        const myProfId = myProf?.id ? String(myProf.id).toLowerCase() : "";

        // Si la cita tiene el ID del profesional asignado y coincide con el doctor logueado
        if (myProfId && cita.professionalId && areGuidsEqual(cita.professionalId, myProfId)) {
          return true;
        }

        // Comparación por coincidencia de nombre (normalizado sin acentos)
        const citaProf = normalizeText(cita.profesional || "");
        if (docName && citaProf) {
          if (docNameParts.length > 0 && docNameParts.every((part) => citaProf.includes(part))) {
            return true;
          }
          if (citaProf.includes(docName) || docName.includes(citaProf)) {
            return true;
          }
        }

        return false;
      }

      return true;
    });
  }, [citas, isPaciente, isOdontologo, user, profsEntities]);

  // Filtrado reactivo de citas según filtros de búsqueda y fecha
  const citasFiltradas = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return userRoleCitas.filter((cita) => {
      // 1. Filtros de búsqueda de texto
      const matchSearch =
        searchValue === "" ||
        cita.paciente.toLowerCase().includes(searchValue) ||
        (cita.profesional && cita.profesional.toLowerCase().includes(searchValue)) ||
        cita.servicio.toLowerCase().includes(searchValue) ||
        (cita.motivo && cita.motivo.toLowerCase().includes(searchValue));

      // 2. Filtro por fecha
      const matchFecha = fecha === "" || cita.fecha === fecha;

      // 3. Filtro por estado
      const matchEstado = estadoFiltro === "Todos" || cita.estado === estadoFiltro;

      return matchSearch && matchFecha && matchEstado;
    });
  }, [userRoleCitas, search, fecha, estadoFiltro]);

  const countTodas = useMemo(() => {
    if (!search && !fecha) return userRoleCitas.length;
    const s = (search || "").toLowerCase().trim();
    return userRoleCitas.filter((c) => {
      const matchSearch = !s || c.paciente.toLowerCase().includes(s) || (c.profesional && c.profesional.toLowerCase().includes(s)) || c.servicio.toLowerCase().includes(s) || (c.motivo && c.motivo.toLowerCase().includes(s));
      const matchFecha = !fecha || c.fecha === fecha;
      return matchSearch && matchFecha;
    }).length;
  }, [userRoleCitas, search, fecha]);

  const pendingCount = useMemo(() => {
    const s = (search || "").toLowerCase().trim();
    return userRoleCitas.filter((c) => {
      if (c.estado !== "Pendiente") return false;
      const matchSearch = !s || c.paciente.toLowerCase().includes(s) || (c.profesional && c.profesional.toLowerCase().includes(s)) || c.servicio.toLowerCase().includes(s) || (c.motivo && c.motivo.toLowerCase().includes(s));
      const matchFecha = !fecha || c.fecha === fecha;
      return matchSearch && matchFecha;
    }).length;
  }, [userRoleCitas, search, fecha]);

  const countConfirmadas = useMemo(() => {
    const s = (search || "").toLowerCase().trim();
    return userRoleCitas.filter((c) => {
      if (c.estado !== "Confirmada") return false;
      const matchSearch = !s || c.paciente.toLowerCase().includes(s) || (c.profesional && c.profesional.toLowerCase().includes(s)) || c.servicio.toLowerCase().includes(s) || (c.motivo && c.motivo.toLowerCase().includes(s));
      const matchFecha = !fecha || c.fecha === fecha;
      return matchSearch && matchFecha;
    }).length;
  }, [userRoleCitas, search, fecha]);

  const handleCreateOrRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const newId = Date.now();
      const rawPaciente = isPaciente
        ? (user?.name || `${user?.nombre || "Andrés"} ${user?.apellido || "Pérez"}`)
        : formPaciente || "Paciente General";
      const pacienteNombre = rawPaciente.trim();

      const fechaValida = formFecha || todayDateString;
      const horaValida = normalizeTimeTo24h(formHora || getNextValidHour(fechaValida));

      // 1. Resolver Patient ID con soporte para nombres nuevos y creación al vuelo
      const resolvedPatient = await resolveOrCreatePatient({
        identifierOrName: pacienteNombre,
        patientsEntities,
        personsEntities,
        currentUser: user,
        isPacienteRole: isPaciente,
      });
      const targetPatientId = resolvedPatient.patientId;
      const finalPatientName = resolvedPatient.patientName || pacienteNombre;

      // 2. Resolver Professional ID
      // Si el paciente o administrador seleccionó un doctor, buscar su ID correspondiente.
      let targetProfId = "";
      const cleanSelectedProf = (formProfesional || "").trim();

      if (cleanSelectedProf) {
        const selectedDocOption = professionalsOptions.find((d) => 
          d.label.toLowerCase() === cleanSelectedProf.toLowerCase() || 
          d.label.toLowerCase().includes(cleanSelectedProf.toLowerCase()) ||
          cleanSelectedProf.toLowerCase().includes(d.label.toLowerCase()) ||
          areGuidsEqual(d.id, cleanSelectedProf)
        );
        const docIdFromOpt = selectedDocOption?.data?.professionalId || selectedDocOption?.id;
        const matchedProfEntity = profsEntities.find((p) => areGuidsEqual(p.id, docIdFromOpt));
        if (matchedProfEntity?.id) {
          targetProfId = matchedProfEntity.id;
        } else if (docIdFromOpt && docIdFromOpt.length > 20) {
          targetProfId = docIdFromOpt;
        } else if (profsEntities.length > 0 && profsEntities[0].id) {
          targetProfId = profsEntities[0].id;
        }
      }

      if (!targetProfId && !isPaciente) {
        if (profsEntities.length > 0 && profsEntities[0].id) {
          targetProfId = profsEntities[0].id;
        } else {
          targetProfId = "1d000000-0000-0000-0000-000000000001";
        }
      } else if (!targetProfId && isPaciente) {
        // Asignación automática: enviar profesional por defecto como candidato preferido
        targetProfId = profsEntities[0]?.id || "1d000000-0000-0000-0000-000000000001";
      }

      // 3. Resolver Service ID
      let targetServiceId = selectedServiceId;
      if (!targetServiceId && formServicio) {
        const matchedService = servicesEntities.find((s) => 
          s.name?.toLowerCase() === formServicio.toLowerCase() ||
          areGuidsEqual(s.id, formServicio)
        );
        if (matchedService?.id) {
          targetServiceId = matchedService.id;
        } else if (servicesRaw.length > 0) {
          const rawMatch = servicesRaw.find((s) => s.name?.toLowerCase() === formServicio.toLowerCase() || areGuidsEqual(s.id, formServicio));
          if (rawMatch?.id) targetServiceId = rawMatch.id;
        }
      }

      if (!targetServiceId && servicesRaw.length > 0) {
        targetServiceId = servicesRaw[0].id;
      } else if (!targetServiceId && servicesEntities.length > 0) {
        targetServiceId = servicesEntities[0].id;
      } else if (!targetServiceId) {
        const fallbackServiceId = "30000000-0000-0000-0000-000000000001";
        targetServiceId = fallbackServiceId;
      }

      const matchedDurationService =
        servicesRaw.find((s) => areGuidsEqual(s.id, targetServiceId)) ||
        servicesEntities.find((s) => areGuidsEqual(s.id, targetServiceId)) ||
        servicesRaw.find((s) => s.name?.toLowerCase() === (formServicio || "").toLowerCase());
      const durationMinutes = Math.max(15, matchedDurationService?.durationMinutes || 30);

      // Past + jornada checks use Colombia wall-clock (clinic TZ), not UTC.
      const scheduleError = validateClinicAppointmentSchedule(fechaValida, horaValida, durationMinutes);
      if (scheduleError) {
        setFormError(scheduleError);
        setIsSubmitting(false);
        return;
      }

      const { startsAt, endsAt } = calculateEndDateTime(fechaValida, horaValida, durationMinutes);

      // Validar que el paciente no tenga ya una cita activa en esa misma fecha y hora
      const targetPName = finalPatientName.toLowerCase().trim();
      const patientBusy = citas.find((c) => {
        if (c.fecha !== fechaValida) return false;
        const st = (c.estado || "").toLowerCase();
        if (st === "cancelada" || st === "cancelled" || st === "no disponible") return false;

        const [cH, cM] = (c.hora || "07:00").split(":").map(Number);
        const [vH, vM] = (horaValida || "07:00").split(":").map(Number);
        const cStart = (isNaN(cH) ? 7 : cH) * 60 + (isNaN(cM) ? 0 : cM);
        const vStart = (isNaN(vH) ? 7 : vH) * 60 + (isNaN(vM) ? 0 : vM);
        const overlap = Math.abs(cStart - vStart) < 30;
        if (!overlap) return false;

        const cPatient = (c.paciente || "").toLowerCase().trim();
        const sameId = Boolean(targetPatientId && c.patientId && areGuidsEqual(targetPatientId, c.patientId));
        const sameName = Boolean(cPatient === targetPName || (cPatient.length > 3 && targetPName.length > 3 && (cPatient.includes(targetPName) || targetPName.includes(cPatient))));
        return sameId || sameName;
      });

      if (patientBusy) {
        setFormError(`El paciente "${finalPatientName}" ya tiene una cita agendada para el ${fechaValida} a las ${patientBusy.hora} con ${patientBusy.profesional}. Un paciente no puede tener más de una cita a la misma hora.`);
        setIsSubmitting(false);
        return;
      }

      const resolvedProfDisplayName = cleanSelectedProf
        ? (professionalsOptions.find(d => areGuidsEqual(d.id, targetProfId) || d.label.toLowerCase() === cleanSelectedProf.toLowerCase())?.label || cleanSelectedProf)
        : (isPaciente ? "Por Asignar (Asignación automática)" : (professionalsOptions[0]?.label || "Dra. Laura Gómez"));

      const nuevaCita: Cita = {
        id: newId,
        paciente: finalPatientName,
        pacienteEmail: isPaciente ? (user?.email || "paciente@nexusodonto.com") : "",
        pacienteCedula: isPaciente ? (user?.cedula || "1076543210") : "",
        profesional: resolvedProfDisplayName,
        servicio: formServicio || servicesList[0] || "Valoración General Odontológica",
        fecha: fechaValida,
        hora: horaValida,
        estado: isPaciente ? "Pendiente" : "Confirmada",
        motivo: formMotivo || "Solicitud agendada vía portal web",
        patientId: targetPatientId,
        professionalId: targetProfId,
        serviceId: targetServiceId,
      };

      // Persistir en API backend .NET
      try {
        const createdFromApi = await appointmentService.create({
          patientId: targetPatientId,
          professionalId: targetProfId || "00000000-0000-0000-0000-000000000000",
          serviceId: targetServiceId,
          startsAt,
          endsAt,
          appointmentStatusId: isPaciente
            ? "10000000-0000-0000-0000-000000000001" // AGENDADA / PENDIENTE
            : "10000000-0000-0000-0000-000000000002", // CONFIRMADA
          appointmentOriginId: "20000000-0000-0000-0000-000000000003", // WEB
          reasonForVisit: nuevaCita.motivo || "Solicitud agendada vía portal web",
          notes: `Servicio: ${nuevaCita.servicio}. Paciente: ${nuevaCita.paciente}${cleanSelectedProf ? `. Preferencia: ${cleanSelectedProf}` : ""}`,
          autoAssignProfessional: isPaciente,
        });

        if (createdFromApi && createdFromApi.id) {
          nuevaCita.appointmentId = createdFromApi.id;
          if (createdFromApi.professionalId) {
            nuevaCita.professionalId = createdFromApi.professionalId;
            const docOpt = professionalsOptions.find(d => areGuidsEqual(d.id, createdFromApi.professionalId));
            if (docOpt) {
              nuevaCita.profesional = docOpt.label;
            }
          }
        }
      } catch (err: any) {
        console.warn("API appointment creation returned error/warning:", err);
        const serverMsg = String(err?.response?.data?.message || err?.message || "").toLowerCase();
        const rawServerMsg = String(err?.response?.data?.message || err?.message || "");
        const details = err?.response?.data?.details;
        let detailsMsg = "";
        if (details && typeof details === "object") {
          const allDetails = Object.values(details).flat().filter(Boolean);
          if (allDetails.length > 0) {
            detailsMsg = allDetails.join(". ");
          }
        }
        
        if (
          serverMsg.includes("fechas u horas pasadas") ||
          serverMsg.includes("fuera de la jornada") ||
          serverMsg.includes("receso de almuerzo")
        ) {
          setFormError(rawServerMsg);
          setIsSubmitting(false);
          return;
        } else if (serverMsg.includes("no hay odontólogos disponibles") || serverMsg.includes("no hay odontólogos activos")) {
          setFormError(rawServerMsg || "No hay odontólogos disponibles en ese horario. Por favor selecciona otra hora.");
          setIsSubmitting(false);
          return;
        } else if (serverMsg.includes("outside the professional's active availability") || serverMsg.includes("availability")) {
          const availabilityMsg = "El horario seleccionado está fuera de la jornada de atención del odontólogo (08:00 a 12:00 y 14:00 a 17:00). Elige un inicio donde el tratamiento termine antes del almuerzo o del cierre.";
          setFormError(availabilityMsg);
          setIsSubmitting(false);
          return;
        } else if (err?.response?.status === 409 || serverMsg.includes("conflict") || serverMsg.includes("overlap") || serverMsg.includes("already has an appointment")) {
          const conflictMsg = isPaciente
            ? "No hay odontólogos disponibles en ese horario. Por favor selecciona otra hora."
            : "El odontólogo ya tiene una cita asignada en ese rango horario. Por favor selecciona otra hora u otro profesional.";
          setFormError(conflictMsg);
          setIsSubmitting(false);
          return;
        } else if (detailsMsg) {
          setFormError(detailsMsg);
          setIsSubmitting(false);
          return;
        } else if (err?.response?.status === 400) {
          setFormError(err?.response?.data?.message || "Verifica que la fecha y hora seleccionadas sean válidas.");
          setIsSubmitting(false);
          return;
        }
      }

      const updated = [nuevaCita, ...citas];
      setCitas(updated);
      localStorage.setItem("nexus_citas", JSON.stringify(updated));

      // Si el paciente era un nombre escrito libremente, recordarlo en las opciones locales
      if (pacienteNombre && !patientsOptions.some(p => p.label.toLowerCase() === pacienteNombre.toLowerCase())) {
        setPatientsOptions(prev => [{ label: pacienteNombre, subLabel: "Paciente registrado en cita", id: targetPatientId }, ...prev]);
      }

      setShowRequestModal(false);
      setFormMotivo("");
      refreshNotifications();
      window.dispatchEvent(new CustomEvent("nexus_appointment_changed"));
      addNotification({
        title: isPaciente ? "Solicitud de Cita Enviada" : "Nueva Cita Registrada",
        message: isPaciente
          ? `Tu cita para ${nuevaCita.servicio} el ${nuevaCita.fecha} a las ${nuevaCita.hora} ha sido enviada y está en revisión.`
          : `Cita para ${nuevaCita.paciente} (${nuevaCita.servicio}) el ${nuevaCita.fecha} a las ${nuevaCita.hora}.`,
        link: isPaciente ? "/citas" : "/agenda",
        type: isPaciente ? "appointment_pending" : "appointment_confirmed",
      });
      fetchAppointmentsAndCatalogs().catch(() => {});
      setSuccessToast(
        isPaciente
          ? "¡Tu cita ha sido solicitada con éxito! Registrada en el sistema."
          : "¡Cita creada y confirmada exitosamente en la agenda!"
      );
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error("General appointment creation error:", err);
      const errMsg = err?.response?.data?.message || "No se pudo agendar la cita. Por favor verifica los datos ingresados.";
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (citaId: number, nuevoEstado: EstadoCita) => {
    const targetCita = citas.find((c) => c.id === citaId);
    if (!targetCita) return;

    const statusMap: Record<EstadoCita, string> = {
      Pendiente: "10000000-0000-0000-0000-000000000001",
      Confirmada: "10000000-0000-0000-0000-000000000002",
      "En Atención": "10000000-0000-0000-0000-000000000003",
      Completada: "10000000-0000-0000-0000-000000000004",
      Cancelada: "10000000-0000-0000-0000-000000000005",
      "No Asistió": "10000000-0000-0000-0000-000000000006",
    };

    if (targetCita.appointmentId) {
      if (nuevoEstado === "No Asistió") {
        try {
          await appointmentService.markNoShow(targetCita.appointmentId, "No asistió a la cita programada");
          setCitas((prev) => prev.map((c) => (c.id === citaId ? { ...c, estado: "No Asistió" } : c)));
          refreshNotifications();
          setSuccessToast("Cita registrada como No Asistió");
          setTimeout(() => setSuccessToast(null), 3000);
          return;
        } catch (err) {
          console.warn("Fallo al marcar no-show:", err);
        }
      }

      // Preservar startsAt / endsAt originales para no romper validaciones de horario en backend
      let effectiveStartsAt = targetCita.startsAt;
      let effectiveEndsAt = targetCita.endsAt;
      if (!effectiveStartsAt || !effectiveEndsAt) {
        const computed = calculateEndDateTime(
          targetCita.rawDate || (targetCita.fecha && /^\d{4}-\d{2}-\d{2}$/.test(targetCita.fecha) ? targetCita.fecha : todayDateString),
          targetCita.hora || "09:00",
          30
        );
        effectiveStartsAt = computed.startsAt;
        effectiveEndsAt = computed.endsAt;
      }

      // Resolver ID del profesional de forma robusta
      let resolvedProfId =
        targetCita.professionalId && targetCita.professionalId !== "00000000-0000-0000-0000-000000000000"
          ? targetCita.professionalId
          : undefined;

      if (!resolvedProfId) {
        const cleanProfName = (targetCita.profesional || "")
          .replace(/^dr\(a\)\.?\s*/i, "")
          .trim()
          .toLowerCase();

        const matchedProf = profsEntities.find((p) => {
          const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim().toLowerCase();
          return cleanProfName && (fullName.includes(cleanProfName) || cleanProfName.includes(fullName));
        });

        const matchedProfOption = professionalsOptions.find(
          (d) =>
            cleanProfName &&
            (d.label.toLowerCase().includes(cleanProfName) ||
              (d.data?.fullName && d.data.fullName.toLowerCase().includes(cleanProfName)))
        );

        resolvedProfId =
          matchedProf?.id ||
          matchedProfOption?.data?.professionalId ||
          matchedProfOption?.data?.id ||
          matchedProfOption?.id ||
          profsEntities.find((p) => p.id && p.id !== "00000000-0000-0000-0000-000000000000")?.id;
      }

      // Resolver servicio
      const matchedServ = servicesEntities.find((s) =>
        s.name?.toLowerCase().includes(targetCita.servicio?.toLowerCase() || "")
      );
      const resolvedServiceId =
        targetCita.serviceId ||
        matchedServ?.id ||
        servicesEntities[0]?.id ||
        "30000000-0000-0000-0000-000000000001";

      try {
        await appointmentService.update(targetCita.appointmentId, {
          patientId: targetCita.patientId,
          professionalId: resolvedProfId || "00000000-0000-0000-0000-000000000000",
          serviceId: resolvedServiceId,
          startsAt: effectiveStartsAt,
          endsAt: effectiveEndsAt,
          appointmentStatusId: statusMap[nuevoEstado] || "10000000-0000-0000-0000-000000000002",
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: targetCita.motivo,
          notes: `Estado actualizado a ${nuevoEstado}`,
          cancelledAt: nuevoEstado === "Cancelada" ? new Date().toISOString() : undefined,
          cancellationReason: nuevoEstado === "Cancelada" ? "Cita rechazada por la administración" : undefined,
        });
      } catch (err: any) {
        console.warn("Fallo en appointmentService.update, evaluando fallback:", err?.response?.status, err);
        // Si es cancelación / rechazo y falló por conflicto o validación de agenda en backend, eliminar la cita rechazada en el servidor
        if (nuevoEstado === "Cancelada") {
          try {
            await appointmentService.delete(targetCita.appointmentId);
          } catch (delErr) {
            console.warn("No se pudo eliminar la cita rechazada en el servidor:", delErr);
          }
        }
      }

      // Actualizar estado local
      setCitas((prev) => {
        const updated = prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c));
        localStorage.setItem("nexus_citas", JSON.stringify(updated));
        return updated;
      });

      refreshNotifications();
      const successMsg =
        nuevoEstado === "Cancelada"
          ? "Cita rechazada y actualizada con éxito"
          : `Estado actualizado: Cita ${nuevoEstado}`;
      setSuccessToast(successMsg);
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      setCitas((prev) => {
        const updated = prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c));
        localStorage.setItem("nexus_citas", JSON.stringify(updated));
        return updated;
      });
      refreshNotifications();
      setSuccessToast(
        nuevoEstado === "Cancelada"
          ? "Cita rechazada exitosamente"
          : `Estado actualizado localmente: Cita ${nuevoEstado}`
      );
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleAssignDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignFormError(null);
    setErrorMessage(null);

    if (!selectedCitaToAssign) return;

    const cleanFormProf = formProfesional.replace(/^dr\(a\)\.?\s*/i, "").trim().toLowerCase();
    const matchedProf = profsEntities.find((p) => {
      const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim().toLowerCase();
      return cleanFormProf && (fullName.includes(cleanFormProf) || cleanFormProf.includes(fullName));
    });
    const matchedProfOption = professionalsOptions.find(
      (d) =>
        d.label.toLowerCase() === formProfesional.toLowerCase() ||
        areGuidsEqual(d.id, formProfesional) ||
        (cleanFormProf && d.label.toLowerCase().includes(cleanFormProf))
    );
    const matchedProfId =
      matchedProfOption?.data?.professionalId ||
      matchedProfOption?.data?.id ||
      matchedProfOption?.id ||
      matchedProf?.id;

    if (!matchedProfId) {
      const msg = "Por favor selecciona un odontólogo profesional válido.";
      setAssignFormError(msg);
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const matchedServ = servicesEntities.find((s) =>
      s.name?.toLowerCase().includes(selectedCitaToAssign.servicio?.toLowerCase() || "")
    );
    const resolvedServiceId =
      selectedCitaToAssign.serviceId ||
      matchedServ?.id ||
      servicesEntities[0]?.id ||
      "30000000-0000-0000-0000-000000000001";

    const effectiveDate =
      formFecha ||
      selectedCitaToAssign.rawDate ||
      (selectedCitaToAssign.fecha && /^\d{4}-\d{2}-\d{2}$/.test(selectedCitaToAssign.fecha)
        ? selectedCitaToAssign.fecha
        : todayDateString);
    const effectiveHora = formHora || selectedCitaToAssign.hora || "09:00";

    const assignDurationService =
      servicesRaw.find((s) => areGuidsEqual(s.id, resolvedServiceId)) ||
      matchedServ ||
      servicesEntities.find((s) => areGuidsEqual(s.id, resolvedServiceId));
    const assignDurationMinutes = Math.max(15, assignDurationService?.durationMinutes || 30);

    const { startsAt, endsAt } = calculateEndDateTime(effectiveDate, effectiveHora, assignDurationMinutes);

    if (selectedCitaToAssign.appointmentId) {
      try {
        await appointmentService.update(selectedCitaToAssign.appointmentId, {
          patientId: selectedCitaToAssign.patientId,
          professionalId: matchedProfId,
          serviceId: resolvedServiceId,
          startsAt,
          endsAt,
          appointmentStatusId: "10000000-0000-0000-0000-000000000002", // CONFIRMADA
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: selectedCitaToAssign.motivo,
          notes: `Odontólogo asignado: ${formProfesional}`,
        });

        setCitas((prev) => {
          const updated: Cita[] = prev.map((c) =>
            c.id === selectedCitaToAssign.id
              ? {
                  ...c,
                  profesional: formProfesional,
                  professionalId: matchedProfId,
                  fecha: effectiveDate,
                  rawDate: effectiveDate,
                  hora: effectiveHora,
                  startsAt,
                  endsAt,
                  estado: "Confirmada" as EstadoCita,
                }
              : c
          );
          localStorage.setItem("nexus_citas", JSON.stringify(updated));
          return updated;
        });

        setShowAssignModal(false);
        setSelectedCitaToAssign(null);
        setAssignFormError(null);
        refreshNotifications();
        await fetchAppointmentsAndCatalogs();
        setSuccessToast("¡Cita aprobada y odontólogo asignado con éxito!");
        setTimeout(() => setSuccessToast(null), 3500);
      } catch (err: any) {
        console.error("Could not persist assigned doctor in API:", err);
        const errMsg = err?.response?.data?.message || "No se pudo asignar el odontólogo en el servidor.";
        setAssignFormError(errMsg);
        setErrorMessage(errMsg);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } else {
      setCitas((prev) => {
        const updated: Cita[] = prev.map((c) =>
          c.id === selectedCitaToAssign.id
            ? {
                ...c,
                profesional: formProfesional,
                professionalId: matchedProfId,
                fecha: effectiveDate,
                rawDate: effectiveDate,
                hora: effectiveHora,
                startsAt,
                endsAt,
                estado: "Confirmada" as EstadoCita,
              }
            : c
        );
        localStorage.setItem("nexus_citas", JSON.stringify(updated));
        return updated;
      });
      setShowAssignModal(false);
      setSelectedCitaToAssign(null);
      setAssignFormError(null);
      setSuccessToast("¡Cita asignada localmente con éxito!");
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleOpenAssign = (cita: Cita) => {
    setAssignFormError(null);
    setSelectedCitaToAssign(cita);
    setFormProfesional(cita.profesional || professionalsList[0] || "");
    const dateToUse =
      cita.rawDate ||
      (cita.fecha && /^\d{4}-\d{2}-\d{2}$/.test(cita.fecha) ? cita.fecha : todayDateString);
    setFormFecha(dateToUse);
    setFormHora(cita.hora ? normalizeTimeTo24h(cita.hora) : getNextValidHour(dateToUse));
    setShowAssignModal(true);
  };

  const handleOpenEdit = (cita?: Cita) => {
    setEditFormError(null);
    const targetCita = cita || citas[0];
    if (!targetCita) return;

    setSelectedCitaToEdit(targetCita);
    setEditPaciente(targetCita.paciente);
    setEditProfesional(targetCita.profesional || professionalsList[0] || "");
    setEditServicio(targetCita.servicio);
    setEditFecha(targetCita.fecha);
    setEditHora(targetCita.hora ? normalizeTimeTo24h(targetCita.hora) : getNextValidHour(targetCita.fecha));
    setEditEstado(targetCita.estado);
    setEditMotivo(targetCita.motivo || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);
    setErrorMessage(null);

    if (!selectedCitaToEdit) return;

    const horaEditValida = normalizeTimeTo24h(editHora || getNextValidHour(editFecha));

    // Solo revalidar horario si cambia fecha/hora (Colombia wall-clock + jornada).
    const isDateTimeChanged =
      selectedCitaToEdit.fecha !== editFecha ||
      normalizeTimeTo24h(selectedCitaToEdit.hora) !== horaEditValida;

    const matchedEditProfOption = professionalsOptions.find(
      (d) => d.label.toLowerCase() === editProfesional.toLowerCase() || areGuidsEqual(d.id, editProfesional)
    );
    const matchedProfId =
      matchedEditProfOption?.data?.professionalId ||
      matchedEditProfOption?.data?.id ||
      matchedEditProfOption?.id ||
      selectedCitaToEdit.professionalId;

    const matchedServiceId =
      servicesRaw.find((s) => s.name.toLowerCase() === editServicio.toLowerCase() || areGuidsEqual(s.id, editServicio))?.id ||
      selectedCitaToEdit.serviceId;

    const editDurationService =
      servicesRaw.find((s) => s.name.toLowerCase() === editServicio.toLowerCase() || areGuidsEqual(s.id, editServicio) || areGuidsEqual(s.id, matchedServiceId || "")) ||
      servicesEntities.find((s) => areGuidsEqual(s.id, matchedServiceId || "") || s.name?.toLowerCase() === editServicio.toLowerCase());
    const editDurationMinutes = Math.max(15, editDurationService?.durationMinutes || 30);

    if (isDateTimeChanged && editFecha) {
      const scheduleError = validateClinicAppointmentSchedule(editFecha, horaEditValida, editDurationMinutes);
      if (scheduleError) {
        setEditFormError(scheduleError);
        setErrorMessage(scheduleError);
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    const statusMap: Record<EstadoCita, string> = {
      "Pendiente": "10000000-0000-0000-0000-000000000001",
      "Confirmada": "10000000-0000-0000-0000-000000000002",
      "En Atención": "10000000-0000-0000-0000-000000000003",
      "Completada": "10000000-0000-0000-0000-000000000004",
      "Cancelada": "10000000-0000-0000-0000-000000000005",
      "No Asistió": "10000000-0000-0000-0000-000000000006",
    };

    const { startsAt, endsAt } = calculateEndDateTime(editFecha, horaEditValida, editDurationMinutes);

    let resolvedPatientId = selectedCitaToEdit.patientId;
    let finalEditPacienteName = editPaciente;
    if (editPaciente) {
      const resolvedPt = await resolveOrCreatePatient({
        identifierOrName: editPaciente,
        patientsEntities,
        personsEntities,
        currentUser: user,
        isPacienteRole: false,
      });
      resolvedPatientId = resolvedPt.patientId;
      finalEditPacienteName = resolvedPt.patientName || editPaciente;
    }

    const resolvedProfId = matchedProfId || selectedCitaToEdit.professionalId || (profsEntities[0]?.id || "1d000000-0000-0000-0000-000000000001");
    const resolvedServId = matchedServiceId || selectedCitaToEdit.serviceId || (servicesEntities[0]?.id || "30000000-0000-0000-0000-000000000001");

    if (selectedCitaToEdit.appointmentId) {
      try {
        await appointmentService.update(selectedCitaToEdit.appointmentId, {
          patientId: resolvedPatientId,
          professionalId: resolvedProfId,
          serviceId: resolvedServId,
          startsAt,
          endsAt,
          appointmentStatusId: statusMap[editEstado] || "10000000-0000-0000-0000-000000000002",
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: editMotivo,
          notes: `Editado: ${finalEditPacienteName} con ${editProfesional}`,
        });

        setCitas((prev) => {
          const updated = prev.map((c) =>
            c.id === selectedCitaToEdit.id
              ? {
                  ...c,
                  paciente: finalEditPacienteName,
                  patientId: resolvedPatientId,
                  profesional: editProfesional,
                  professionalId: matchedProfId,
                  servicio: editServicio,
                  serviceId: matchedServiceId,
                  fecha: editFecha,
                  rawDate: editFecha,
                  hora: editHora,
                  startsAt,
                  endsAt,
                  estado: editEstado,
                  motivo: editMotivo,
                }
              : c
          );
          localStorage.setItem("nexus_citas", JSON.stringify(updated));
          return updated;
        });

        setShowEditModal(false);
        setSelectedCitaToEdit(null);
        setEditFormError(null);
        refreshNotifications();
        await fetchAppointmentsAndCatalogs();
        setSuccessToast("¡Cita modificada y guardada exitosamente en base de datos!");
        setTimeout(() => setSuccessToast(null), 3500);
      } catch (e: any) {
        const errMsg = e?.response?.status === 409
          ? "Conflicto de horario: El odontólogo ya tiene una cita en ese horario. Por favor selecciona otra franja."
          : (e?.response?.data?.message || "No se pudo actualizar la cita en el servidor.");
        setEditFormError(errMsg);
        setErrorMessage(errMsg);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } else {
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
      setShowEditModal(false);
      setSelectedCitaToEdit(null);
      setEditFormError(null);
      setSuccessToast("¡Cita modificada localmente!");
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedCitaToEdit) return;
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la cita de ${selectedCitaToEdit.paciente}?`
    );
    if (!confirmDelete) return;

    if (selectedCitaToEdit.appointmentId) {
      try {
        await appointmentService.delete(selectedCitaToEdit.appointmentId);
        setCitas((prev) => {
          const updated = prev.filter((c) => c.id !== selectedCitaToEdit.id);
          localStorage.setItem("nexus_citas", JSON.stringify(updated));
          return updated;
        });
        setShowEditModal(false);
        setSelectedCitaToEdit(null);
        refreshNotifications();
        setSuccessToast("¡Cita eliminada correctamente en base de datos!");
        setTimeout(() => setSuccessToast(null), 3500);
      } catch (e: any) {
        console.error("API delete error:", e);
        setErrorMessage(e?.response?.data?.message || "No se pudo eliminar la cita en el servidor.");
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } else {
      setCitas((prev) => {
        const updated = prev.filter((c) => c.id !== selectedCitaToEdit.id);
        localStorage.setItem("nexus_citas", JSON.stringify(updated));
        return updated;
      });
      setShowEditModal(false);
      setSelectedCitaToEdit(null);
      setSuccessToast("¡Cita eliminada correctamente!");
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* TOASTS DE CONFIRMACIÓN Y ERROR (CAPA SUPERIOR ABSOLUTA z-[99999] EN ESQUINA INFERIOR DERECHA) */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/40 animate-slideUp backdrop-blur-md">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 bg-rose-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/50 animate-slideUp backdrop-blur-md">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ENCABEZADO Y ACCIÓN PRINCIPAL (ESTILO OFICIAL PACIENTES) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            {isPaciente ? "Mis Citas Odontológicas" : "Gestión de Citas"}
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
            disabled={loading}
            className="group p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm flex items-center justify-center disabled:opacity-60"
            title="Recargar datos desde la base de datos"
          >
            <DentistryReloadIcon size={20} loading={loading} />
          </button>

          <button
            type="button"
            onClick={() => {
              const defaultDate = todayDateString;
              const defaultHour = getNextValidHour(defaultDate);
              setFormPaciente(isPaciente ? (user?.name || "Andrés Pérez") : "");
              setFormFecha(defaultDate);
              setFormHora(defaultHour);
              setFormMotivo("");
              setFormError(null);
              if (isOdontologo && user?.name) {
                const myProf = professionalsOptions.find(p => p.label.toLowerCase().includes(user.name.toLowerCase()));
                if (myProf) {
                  setFormProfesional(myProf.label);
                }
              }
              if (servicesRaw.length > 0) {
                if (!selectedServiceId || !servicesRaw.some(s => areGuidsEqual(s.id, selectedServiceId))) {
                  setSelectedServiceId(servicesRaw[0].id);
                  setFormServicio(servicesRaw[0].name);
                }
              }
              setShowRequestModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
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
          {(isRecepcionista || isAdmin || isPaciente || isOdontologo) && (
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
                Todas ({countTodas})
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
                Confirmadas ({countConfirmadas})
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
        <div className="flex items-center gap-2 self-end md:self-auto min-w-[200px]">
          <GlassDatePicker
            value={fecha || ""}
            onChange={(val) => setFecha(val)}
            placeholder="Filtrar por fecha..."
            variant="cyan"
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
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md overflow-x-clip animate-slideUp animate-stagger-2">
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
                  <Stethoscope size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <p className="leading-relaxed">
                    Puedes elegir tu <strong>Odontólogo de preferencia</strong> o dejar la opción por defecto para que el equipo clínico te asigne el especialista disponible.
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

              <ModernServiceSelect
                id="serviceSelect"
                value={selectedServiceId || formServicio}
                onChange={(chosenId, chosenName) => {
                  setSelectedServiceId(chosenId);
                  setFormServicio(chosenName);
                  setFormError(null);
                }}
                services={servicesRaw}
                required
              />

              <ModernDoctorSelect
                id="patientDoctorSelect"
                value={formProfesional}
                onChange={(chosenDoctor) => {
                  setFormProfesional(chosenDoctor);
                  setFormError(null);
                }}
                doctors={professionalsOptions}
                selectedServiceName={formServicio}
                allowNoPreference={isPaciente}
                label={isPaciente ? "Odontólogo de Preferencia" : "Odontólogo Asignado"}
                optionalLabel={isPaciente ? "Opcional" : undefined}
                required={!isPaciente}
                placeholder={isPaciente ? "✨ Sin preferencia (Cualquier odontólogo)" : "Seleccionar odontólogo..."}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <GlassDatePicker
                    label="Fecha"
                    required
                    minDate={todayDateString}
                    value={formFecha}
                    onChange={(newDate) => {
                      setFormFecha(newDate);
                      if (newDate === todayDateString) {
                        const [currH] = (formHora || "00:00").split(":").map(Number);
                        const nowH = new Date().getHours();
                        if (isNaN(currH) || currH <= nowH) {
                          setFormHora(getNextValidHour(newDate));
                        }
                      }
                    }}
                    variant="teal"
                  />
                </div>

                <div>
                  <GlassTimePicker
                    label={isPaciente ? "Horario preferido" : "Hora"}
                    value={formHora || "08:00"}
                    minHour={8}
                    maxHour={17}
                    minuteStep={30}
                    onChange={(newTime) => {
                      setFormHora(newTime);
                      setFormError(null);
                    }}
                    variant="teal"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-tight">
                    Jornada: 08:00 - 12:00 | 14:00 - 17:00 (inicio + duración debe caber antes del cierre)
                  </span>
                </div>
              </div>

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

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <DentistryReloadIcon size={14} loading={true} />
                      <span>{isPaciente ? "Enviando..." : "Confirmando..."}</span>
                    </>
                  ) : (
                    <span>{isPaciente ? "Enviar Solicitud" : "Confirmar Cita"}</span>
                  )}
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
                  Asignar Odontólogo y Horario
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
                {selectedCitaToAssign.motivo && (
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100">Motivo:</strong> {selectedCitaToAssign.motivo}
                  </p>
                )}
              </div>

              <ModernDoctorSelect
                label="Odontólogo Tratante"
                value={formProfesional}
                onChange={(val) => setFormProfesional(val)}
                doctors={professionalsOptions}
                selectedServiceName={selectedCitaToAssign.servicio}
                allowNoPreference={false}
                required
                placeholder="Seleccionar odontólogo..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <GlassDatePicker
                    label="Fecha de Consulta"
                    required
                    minDate={todayDateString}
                    value={formFecha}
                    onChange={(val) => setFormFecha(val)}
                    variant="teal"
                  />
                </div>

                <div>
                  <GlassTimePicker
                    label="Hora de Consulta"
                    value={formHora || "08:00"}
                    minHour={8}
                    maxHour={17}
                    minuteStep={30}
                    onChange={(val) => setFormHora(val)}
                    variant="teal"
                  />
                </div>
              </div>

              {assignFormError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{assignFormError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <DentistryReloadIcon size={14} loading={true} />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Confirmar y Guardar</span>
                  )}
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

                  <ModernDoctorSelect
                    label="Odontólogo Asignado"
                    value={editProfesional}
                    onChange={(val) => setEditProfesional(val)}
                    doctors={professionalsOptions}
                    selectedServiceName={editServicio}
                    allowNoPreference={false}
                    required
                    placeholder="Seleccionar doctor..."
                  />
                </>
              )}

              <ModernServiceSelect
                label="Servicio o Tratamiento"
                value={editServicio}
                onChange={(_id, name) => setEditServicio(name)}
                services={servicesRaw}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <GlassDatePicker
                    label="Fecha"
                    required
                    minDate={todayDateString}
                    value={editFecha}
                    onChange={(val) => setEditFecha(val)}
                    variant="teal"
                  />
                </div>

                <div>
                  <GlassTimePicker
                    label="Hora"
                    value={editHora || "08:00"}
                    minHour={8}
                    maxHour={17}
                    minuteStep={30}
                    onChange={(val) => setEditHora(val)}
                    variant="teal"
                  />
                </div>
              </div>

              {!isPaciente && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estado de la Cita
                  </label>
                  <GlassSelect
                    value={editEstado}
                    onChange={(val) => setEditEstado(val as EstadoCita)}
                    options={[
                      { value: "Pendiente", label: "Pendiente" },
                      { value: "Confirmada", label: "Confirmada" },
                      { value: "En Atención", label: "En Atención" },
                      { value: "Completada", label: "Completada" },
                      { value: "Cancelada", label: "Cancelada" },
                      { value: "No Asistió", label: "No Asistió" },
                    ]}
                    className="w-full py-2.5 text-xs rounded-xl"
                  />
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

              {editFormError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                {!isPaciente && (
                  <button
                    type="button"
                    onClick={handleDeleteAppointment}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar Cita</span>
                  </button>
                )}

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-medium cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <DentistryReloadIcon size={14} loading={true} />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Guardar Cambios</span>
                    )}
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