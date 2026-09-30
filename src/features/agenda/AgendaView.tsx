import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  Hourglass,
  X,
  Save,
  Check,
  Trash2,
  CalendarDays,
  Plus,
  AlertCircle,
  Users,
  Stethoscope,
  Sparkles,
  Copy,
  Calendar,
  ShieldCheck,
  Folder,
  FolderOpen,
  Smile,
  Utensils,
  Ban,
  Moon,
  PlayCircle,
  FileText,
} from "lucide-react";
import { CarruselAlmuerzoUnificado } from "./CarruselAlmuerzoUnificado";
import { estiloEstadoCita, puntoEstadoCita } from "../../utils/appointmentStatusStyle";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { UserAvatar } from "../../components/common/UserAvatar";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";

import {
  type Cita,
  type EstadoCita,
  nombresDias,
  odontologos as odontologosFallback,
  sumarDias,
  obtenerInicioSemana,
  formatoFechaInput,
  obtenerNombreMes,
  obtenerRangoSemana,
  etiquetaEstadoAgenda,
} from "./AgendaData";

/**
 * 🤖 [AI ASSISTANT GUIDE - MATRIZ DE AGENDAMIENTO CLÍNICO SEMANAL]:
 * -------------------------------------------------------------------------------------------------
 * 📌 PROPÓSITO:
 *    Representación visual del calendario clínico semanal (Lun-Dom) dividido en franjas de 60 minutos.
 * 
 * 🔍 REGLAS CLÍNICAS Y ARQUITECTURA:
 *    • Agrupamiento en Carpetas Dossier: Si coinciden varias citas en la misma hora, se consolidan
 *      en una tarjeta "📁 N Citas" para evitar solapamientos gráficos y mantener legibilidad.
 *    • Protección de Franja de Almuerzo: El carrusel unificado (12:00 a 14:00) bloquea visualmente
 *      y previene agendamientos que colisionen con el descanso reglamentario del personal médico.
 *    • Consistencia de Estados: Las citas canceladas o marcadas como inasistencia ("No asistió")
 *      se diferencian cromáticamente y deshabilitan el acceso a la atención médica.
 * 
 * 💡 TIPS PARA LA SUSTENTACIÓN:
 *    "La agenda valida dinámicamente la duración en sillón configurada para cada servicio dental,
 *    evitando sobreventas de turnos y asegurando tiempos quirúrgicos reales."
 * -------------------------------------------------------------------------------------------------
 */
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { useNotifications } from "../../context/NotificationContext";
import { appointmentService, type AppointmentResponseDto } from "../../api/appointmentService";
import { professionalService } from "../../api/professionalService";
import { serviceCatalogService, type ServiceResponseDto } from "../../api/serviceCatalogService";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { SelectOrWriteInput, type SelectOption } from "../../components/common/SelectOrWriteInput";
import { ModernServiceSelect } from "../../components/common/ModernServiceSelect";
import { ModernDoctorSelect } from "../../components/common/ModernDoctorSelect";
import { areGuidsEqual } from "../../utils/roleUtils";
import { getSpecialtyDisplayLabel } from "../../utils/specialtyLabels";
import { resolveOrCreatePatient } from "../../utils/patientResolution";
import { validateClinicAppointmentSchedule } from "../../utils/clinicSchedule";
import {
  PROFESSIONAL_FALLBACK_LABEL,
  resolveProfessionalDisplayName,
} from "../../utils/professionalDisplayName";
import { GlassSelect } from "../../components/common/GlassSelect";
import { GlassTimePicker } from "../../components/common/GlassTimePicker";
import {
  type TurnoDisponibilidad,
  type DoctorScheduleBlocks,
  loadSavedDoctorSchedules,
  getDoctorScheduleBlocks,
  validateDoctorScheduleAppointment,
} from "../../utils/doctorSchedules";
import { syncDoctorSchedulesFromApi } from "../../api/availabilityService";
import { useRequiresReschedule } from "../../utils/useRequiresReschedule";
import { RequiresRescheduleBadge } from "../../components/common/RequiresRescheduleBadge";

const getDoctorColorClass = (docName: string, lista: { nombre: string; color: string }[]) => {
  const found = lista.find(
    (d) => d.nombre.toLowerCase().trim() === (docName || "").toLowerCase().trim()
  );
  if (found && found.color) return found.color;
  const colors = ["bg-cyan-400", "bg-blue-400", "bg-purple-400", "bg-amber-400", "bg-emerald-400", "bg-rose-400"];
  let hash = 0;
  for (let i = 0; i < (docName || "").length; i++) hash = (hash + docName.charCodeAt(i)) % colors.length;
  return colors[hash];
};

const getDoctorTheme = (docName: string, lista: { nombre: string; color: string }[]) => {
  const colorClass = getDoctorColorClass(docName, lista);
  if (colorClass.includes("cyan")) {
    return {
      dot: "bg-cyan-500 dark:bg-cyan-400",
      badge: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-500/40",
      borderLeft: "border-l-cyan-500 dark:border-l-cyan-400",
      accent: "text-cyan-600 dark:text-cyan-400",
    };
  }
  if (colorClass.includes("blue")) {
    return {
      dot: "bg-blue-500 dark:bg-blue-400",
      badge: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30 dark:border-blue-500/40",
      borderLeft: "border-l-blue-500 dark:border-l-blue-400",
      accent: "text-blue-600 dark:text-blue-400",
    };
  }
  if (colorClass.includes("purple") || colorClass.includes("violet")) {
    return {
      dot: "bg-purple-500 dark:bg-purple-400",
      badge: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/40",
      borderLeft: "border-l-purple-500 dark:border-l-purple-400",
      accent: "text-purple-600 dark:text-purple-400",
    };
  }
  if (colorClass.includes("amber") || colorClass.includes("yellow")) {
    return {
      dot: "bg-amber-500 dark:bg-amber-400",
      badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40",
      borderLeft: "border-l-amber-500 dark:border-l-amber-400",
      accent: "text-amber-600 dark:text-amber-400",
    };
  }
  if (colorClass.includes("emerald") || colorClass.includes("green")) {
    return {
      dot: "bg-emerald-500 dark:bg-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40",
      borderLeft: "border-l-emerald-500 dark:border-l-emerald-400",
      accent: "text-emerald-600 dark:text-emerald-400",
    };
  }
  return {
    dot: "bg-rose-500 dark:bg-rose-400",
    badge: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40",
    borderLeft: "border-l-rose-500 dark:border-l-rose-400",
    accent: "text-rose-600 dark:text-rose-400",
  };
};

const formatoFechaLarga = (fecha: Date) => {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
};

export const translateServiceName = (name?: string): string => {
  if (!name) return "Valoración General";
  const map: Record<string, string> = {
    "general assessment": "Valoración General",
    "dental prophylaxis": "Profilaxis Dental",
    "composite resin filling": "Restauración en Resina",
    "teeth whitening": "Blanqueamiento Dental",
    "dental cleaning": "Limpieza Dental",
    "resin restoration": "Restauración en Resina",
    "orthodontic control": "Control de Ortodoncia",
    "tooth extraction": "Extracción Dental",
    "root canal": "Endodoncia",
  };
  return map[name.trim().toLowerCase()] || name;
};

export function AgendaView() {
  const { user } = useAuth();
  const { refreshNotifications, addNotification } = useNotifications();
  const role = getUserRole(user);
  const isPaciente = role === "PACIENTE";
  const isOdontologo = role === "ODONTOLOGO";
  const { requiresReschedule } = useRequiresReschedule(!isPaciente);

  // Modo de visualización: semana completa o vista diaria por odontólogo
  const [modoVista, setModoVista] = useState<"semana" | "odontologos">("semana");

  // Citas locales y de la base de datos
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fechaActual, setFechaActual] = useState(new Date());

  // Catálogos reales del backend
  const [profesionalesEntities, setProfesionalesEntities] = useState<any[]>([]);
  const [serviciosEntities, setServiciosEntities] = useState<ServiceResponseDto[]>([]);
  const [pacientesEntities, setPacientesEntities] = useState<any[]>([]);
  const [personsEntities, setPersonsEntities] = useState<any[]>([]);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>([]);
  const [listaOdontologos, setListaOdontologos] = useState(odontologosFallback);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const doctorSelectOptions = useMemo<SelectOption[]>(() => {
    if (profesionalesEntities && profesionalesEntities.length > 0) {
      return profesionalesEntities.map((p: any) => {
        const nombre =
          p.fullName ||
          (p.firstName || p.lastName
            ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim()
            : p.name || "Dr. Odontólogo");
        const specName = getSpecialtyDisplayLabel(
          p.specialtyName || p.specialty || "Odontología General"
        );
        return {
          id: p.id,
          label: nombre,
          subLabel: `Especialidad: ${specName}`,
          specialty: specName,
          avatar: p.avatar || null,
          data: p,
        };
      });
    }
    return [
      { label: "Dra. Laura Gómez", subLabel: "Especialidad: Ortodoncia y Estética", specialty: "Ortodoncia y Estética", id: "1d000000-0000-0000-0000-000000000001" },
      { label: "Dr. Roberto Martínez", subLabel: "Especialidad: Cirugía Oral e Implantología", specialty: "Cirugía Oral e Implantología", id: "1d000000-0000-0000-0000-000000000002" },
      { label: "Dra. Ana Sofía Silva", subLabel: "Especialidad: Endodoncia y Periodoncia", specialty: "Endodoncia y Periodoncia", id: "1d000000-0000-0000-0000-000000000003" },
      { label: "Dr. Carlos Santana", subLabel: "Especialidad: Odontología Integral", specialty: "Odontología Integral", id: "8e7c7aa0-f574-41a8-8995-55faef58cdfb" },
      { label: "Dr. Juan Martínez", subLabel: "Especialidad: Odontología General", specialty: "Odontología General" },
      { label: "Dra. Patricia Silva", subLabel: "Especialidad: Endodoncia Microscópica", specialty: "Endodoncia Microscópica" },
    ];
  }, [profesionalesEntities]);

  const [odontologosSeleccionados, setOdontologosSeleccionados] = useState<string[]>([
    "Todos los odontólogos",
  ]);

  const [doctorSchedulesMap, setDoctorSchedulesMap] = useState<Record<string, TurnoDisponibilidad[]>>(loadSavedDoctorSchedules);

  useEffect(() => {
    const handleSchedulesChanged = () => {
      setDoctorSchedulesMap(loadSavedDoctorSchedules());
    };
    window.addEventListener("nexus_schedules_updated", handleSchedulesChanged);
    window.addEventListener("storage", handleSchedulesChanged);
    return () => {
      window.removeEventListener("nexus_schedules_updated", handleSchedulesChanged);
      window.removeEventListener("storage", handleSchedulesChanged);
    };
  }, []);

  const selectedSingleDoctor = useMemo(() => {
    if (
      odontologosSeleccionados.length === 1 &&
      odontologosSeleccionados[0] !== "Todos los odontólogos"
    ) {
      return odontologosSeleccionados[0];
    }
    return null;
  }, [odontologosSeleccionados]);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Preselección de odontólogo si se recibe por parámetro URL o navegación desde Profesionales
  useEffect(() => {
    const targetDoc =
      searchParams.get("doctor") ||
      (location.state as any)?.doctor ||
      (location.state as any)?.odontologo;

    if (targetDoc && typeof targetDoc === "string") {
      const trimmedTarget = targetDoc.trim().toLowerCase();
      const match = listaOdontologos.find((doc) => {
        const docLower = doc.nombre.toLowerCase();
        return (
          docLower.includes(trimmedTarget) ||
          trimmedTarget.includes(docLower) ||
          docLower.replace(/dr\(a\)\.\s*|dr\.\s*|dra\.\s*/i, "").trim() ===
            trimmedTarget.replace(/dr\(a\)\.\s*|dr\.\s*|dra\.\s*/i, "").trim()
        );
      });

      if (match && match.nombre !== "Todos los odontólogos") {
        setOdontologosSeleccionados([match.nombre]);
      } else {
        setOdontologosSeleccionados([targetDoc.trim()]);
      }
    }
  }, [location.state, searchParams, listaOdontologos]);
  const [selectedClusterModal, setSelectedClusterModal] = useState<{
    fecha: string;
    horaInicio: string;
    horaFin: string;
    citas: Cita[];
  } | null>(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [citaDetalle, setCitaDetalle] = useState<Cita | null>(null);
  const [copiadoCita, setCopiadoCita] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaActual, setHoraActual] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const pacienteDetalleAvatar = useMemo(() => {
    if (!citaDetalle) return null;
    if (citaDetalle.avatar) return citaDetalle.avatar;
    if (isPaciente && user) {
      const userAv = (user as any).avatar || (user as any).fotoUrl;
      if (userAv) return userAv;
    }

    const ptEntity = pacientesEntities.find((p: any) =>
      areGuidsEqual(p.id, citaDetalle.patientId) ||
      (p.name && citaDetalle.paciente && p.name.trim().toLowerCase() === citaDetalle.paciente.trim().toLowerCase())
    );
    const perEntity = personsEntities.find((per: any) =>
      (ptEntity && areGuidsEqual(per.id, ptEntity.personId)) ||
      areGuidsEqual(per.id, citaDetalle.patientId) ||
      (`${per.firstName || ""} ${per.lastName || ""}`.trim().toLowerCase() === (citaDetalle.paciente || "").trim().toLowerCase())
    );

    const found =
      ptEntity?.avatar ||
      ptEntity?.fotoUrl ||
      ptEntity?.profilePicture ||
      perEntity?.avatar ||
      perEntity?.fotoUrl ||
      perEntity?.profilePicture;
    if (found) return found;

    if (citaDetalle.patientId) {
      const lsAv = localStorage.getItem(`user_avatar_${citaDetalle.patientId}`);
      if (lsAv) return lsAv;
    }
    return null;
  }, [citaDetalle, isPaciente, user, pacientesEntities, personsEntities]);

  useEffect(() => {
    const actualizarHora = () => {
      setHoraActual(new Date());
    };
    actualizarHora();
    const intervalo = setInterval(actualizarHora, 60000);
    return () => {
      clearInterval(intervalo);
    };
  }, []);

  const [nuevaCita, setNuevaCita] = useState({
    paciente: isPaciente ? (user?.name || "Paciente") : "",
    patientId: isPaciente ? (user?.id || "") : "",
    servicio: "Valoración General",
    odontologo: PROFESSIONAL_FALLBACK_LABEL,
    horaInicio: "09:00",
    horaFin: "10:00",
    estado: "Confirmada" as EstadoCita,
  });

  // Cargar citas reales y catálogos de backend
  const fetchAgendaData = useCallback(async () => {
    setLoading(true);
    try {
      const [apiApps, profs, srvs, pts, pers] = await Promise.allSettled([
        appointmentService.getAll(),
        professionalService.getAll(),
        serviceCatalogService.getAll(),
        patientService.getAll(),
        personService.getAll(),
      ]);

      // 1. Odontólogos
      if (profs.status === "fulfilled" && Array.isArray(profs.value) && profs.value.length > 0) {
        setProfesionalesEntities(profs.value);
        void syncDoctorSchedulesFromApi(profs.value);
        const colores = ["bg-cyan-400", "bg-blue-400", "bg-amber-400", "bg-purple-400", "bg-emerald-400"];
        const docsMapeados = profs.value.map((p: any, idx: number) => {
          const nombre =
            p.firstName || p.lastName
              ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim()
              : `Dr. Especialista #${idx + 1}`;
          return {
            nombre,
            color: colores[idx % colores.length],
          };
        });

        // Filtrar nombres únicos
        const uniqueDocs: { nombre: string; color: string }[] = [];
        docsMapeados.forEach((d) => {
          if (!uniqueDocs.some((u) => u.nombre === d.nombre)) {
            uniqueDocs.push(d);
          }
        });

        setListaOdontologos([
          { nombre: "Todos los odontólogos", color: "bg-cyan-400" },
          ...uniqueDocs,
        ]);


        if (isOdontologo) {
          const docName = (user?.name || user?.nombre || "").toLowerCase();
          const myDoc = uniqueDocs.find((d) => {
            const dNorm = d.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const docNorm = docName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const parts = docNorm.split(/\s+/).filter((p) => p.length > 2);
            return parts.length > 0 && parts.every((p) => dNorm.includes(p));
          });
          if (myDoc) {
            setOdontologosSeleccionados([myDoc.nombre]);
          }
        }

        if (uniqueDocs.length > 0) {
          setNuevaCita((prev) => ({ ...prev, odontologo: uniqueDocs[0].nombre }));
        }
      }

      // 2. Catálogo de Servicios sincronizado estrictamente con API y Catálogo de Servicios
      let mergedAgendaServices: any[] = [];
      if (srvs.status === "fulfilled" && Array.isArray(srvs.value) && srvs.value.length > 0) {
        mergedAgendaServices = srvs.value
          .filter((s: any) => s.isActive !== false && s.activo !== false)
          .map((s: any) => ({
            ...s,
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
              mergedAgendaServices = localList
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
          console.warn("Error reading local catalog in AgendaView:", err);
        }
      }

      setServiciosEntities(mergedAgendaServices);
      if (mergedAgendaServices.length > 0) {
        setNuevaCita((prev) => ({
          ...prev,
          servicio: prev.servicio && mergedAgendaServices.some((s) => s.name === prev.servicio) ? prev.servicio : mergedAgendaServices[0].name,
        }));
      }

      // 3. Pacientes y Personas (Autocomplete interactivo)
      const ptsList = pts.status === "fulfilled" && Array.isArray(pts.value) ? pts.value : [];
      const persList = pers.status === "fulfilled" && Array.isArray(pers.value) ? pers.value : [];
      setPacientesEntities(ptsList);
      setPersonsEntities(persList);

      const personsMap: Record<string, any> = {};
      persList.forEach((p: any) => {
        if (p.id) personsMap[String(p.id).toLowerCase()] = p;
      });

      const opts: SelectOption[] = [];
      const seenNames = new Set<string>();

      ptsList.forEach((pt: any) => {
        const person = pt.personId ? personsMap[String(pt.personId).toLowerCase()] : undefined;
        const name = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : (pt.name || "Paciente Registrado");
        const doc = person?.documentNumber || pt.documentNumber || "";
        const email = person?.email || pt.email || "";
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          opts.push({
            id: pt.id,
            label: name,
            subLabel: doc ? `Cédula: ${doc}${email ? ` • ${email}` : ""}` : email,
            data: { patientId: pt.id, personId: pt.personId, doc, email },
          });
        }
      });

      persList.forEach((per: any) => {
        const name = `${per.firstName || ""} ${per.lastName || ""}`.trim();
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          opts.push({
            id: per.id,
            label: name,
            subLabel: per.documentNumber ? `Cédula: ${per.documentNumber}${per.email ? ` • ${per.email}` : ""}` : per.email,
            data: { personId: per.id, doc: per.documentNumber, email: per.email },
          });
        }
      });

      if (opts.length === 0) {
        opts.push(
          { label: "Andrés Pérez", subLabel: "Cédula: 1076543210 • paciente@nexusodonto.com", id: "1e000000-0000-0000-0000-000000000001", data: { patientId: "1e000000-0000-0000-0000-000000000001" } },
          { label: "Camila López", subLabel: "Cédula: 1098765436", id: "1e000000-0000-0000-0000-000000000002", data: { patientId: "1e000000-0000-0000-0000-000000000002" } },
          { label: "Felipe Torres", subLabel: "Cédula: 1098765437", id: "1e000000-0000-0000-0000-000000000003", data: { patientId: "1e000000-0000-0000-0000-000000000003" } },
          { label: "Valentina Mendoza", subLabel: "Cédula: 1098765438", id: "1e000000-0000-0000-0000-000000000004", data: { patientId: "1e000000-0000-0000-0000-000000000004" } }
        );
      }
      setPatientOptions(opts);

      // 4. Citas guardadas en API backend
      if (apiApps.status === "fulfilled" && Array.isArray(apiApps.value)) {
        const mappedFromBackend: Cita[] = apiApps.value
          .filter((a: AppointmentResponseDto) => !a.cancelledAt)
          .map((a: AppointmentResponseDto, idx: number) => {
            let fechaStr = formatoFechaInput(new Date());
            let inicio = "09:00";
            let fin = "10:00";

            if (a.startsAt) {
              const startDate = new Date(a.startsAt);
              if (!isNaN(startDate.getTime())) {
                fechaStr = formatoFechaInput(startDate);
                inicio = startDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
              } else {
                fechaStr = a.startsAt.split("T")[0] || fechaStr;
              }
            }

            if (a.endsAt) {
              const endDate = new Date(a.endsAt);
              if (!isNaN(endDate.getTime())) {
                fin = endDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
              }
            }

            // Enriquecimiento de nombres reales a partir de los catálogos y entidades
            const ptEntity = ptsList.find((p: any) => areGuidsEqual(p.id, a.patientId));
            const perEntity = persList.find((per: any) => 
              (ptEntity && areGuidsEqual(per.id, ptEntity.personId)) ||
              areGuidsEqual(per.id, a.patientId)
            );

            let resolvedPatientName = a.patientName;
            if (!resolvedPatientName || resolvedPatientName === "Paciente Agendado") {
              if (perEntity) {
                resolvedPatientName = `${perEntity.firstName || ""} ${perEntity.lastName || ""}`.trim();
              } else if (ptEntity?.firstName || ptEntity?.lastName) {
                resolvedPatientName = `${ptEntity.firstName || ""} ${ptEntity.lastName || ""}`.trim();
              }
            }

            let resolvedProfName = resolveProfessionalDisplayName({
              professionalId: a.professionalId,
              professionalName: a.professionalName,
              professionals: profs.status === "fulfilled" && Array.isArray(profs.value) ? profs.value : [],
            });

            let resolvedServiceName = a.serviceName;
            if (!resolvedServiceName || resolvedServiceName === "Consulta Odontológica") {
              const srvsList = srvs.status === "fulfilled" && Array.isArray(srvs.value) ? srvs.value : [];
              const srvEntity = srvsList.find((s: any) => areGuidsEqual(s.id, a.serviceId));
              if (srvEntity?.name) {
                resolvedServiceName = srvEntity.name;
              }
            }
            resolvedServiceName = translateServiceName(resolvedServiceName);

            const stId = a.appointmentStatusId ? String(a.appointmentStatusId).toLowerCase() : "";
            let estadoMapeado: EstadoCita = "Confirmada";
            let cancelada = false;
            const sn = (a.statusName || "").toUpperCase();

            if (a.cancelledAt || stId === "10000000-0000-0000-0000-000000000005" || sn.includes("CANCEL")) {
              estadoMapeado = "No disponible";
              cancelada = true;
            } else if (stId === "10000000-0000-0000-0000-000000000006" || sn.includes("NO_ASIST") || sn.includes("NO ASIST")) {
              estadoMapeado = "No disponible";
            } else if (stId === "10000000-0000-0000-0000-000000000004" || sn.includes("COMPLET") || sn.includes("ATENDIDA")) {
              estadoMapeado = "Completada";
            } else if (stId === "10000000-0000-0000-0000-000000000003" || sn.includes("ATEN") || sn.includes("ATTEND")) {
              estadoMapeado = "En Atención";
            } else if (stId === "10000000-0000-0000-0000-000000000001" || sn.includes("PEND") || sn.includes("AGEN") || sn.includes("SCHEDULED")) {
              estadoMapeado = "Pendiente";
            } else if (stId === "10000000-0000-0000-0000-000000000002" || sn.includes("CONFIRM")) {
              estadoMapeado = "Confirmada";
            }

            // Expiración temporal si ya venció
            if (estadoMapeado !== "Completada" && estadoMapeado !== "En Atención" && estadoMapeado !== "No disponible") {
              try {
                const [aYear, aMonth, aDay] = fechaStr.split("-").map(Number);
                const [aHour, aMin] = inicio.split(":").map(Number);
                const aDate = new Date(aYear, aMonth - 1, aDay, aHour || 0, aMin || 0);
                const now = new Date();
                if (!isNaN(aDate.getTime()) && now.getTime() > (aDate.getTime() + 45 * 60 * 1000)) {
                  estadoMapeado = "No disponible";
                }
              } catch {
                // Ignore
              }
            }

            const fallbackDoc = PROFESSIONAL_FALLBACK_LABEL;

            const resolvedPatientAvatar =
              (ptEntity as any)?.avatar ||
              (ptEntity as any)?.fotoUrl ||
              (ptEntity as any)?.profilePicture ||
              (perEntity as any)?.avatar ||
              (perEntity as any)?.fotoUrl ||
              (perEntity as any)?.profilePicture ||
              (a.patientId ? localStorage.getItem(`user_avatar_${a.patientId}`) : null) ||
              null;

            return {
              id: idx + 1000,
              rawGuid: a.id,
              patientId: a.patientId,
              paciente: resolvedPatientName || "Paciente Registrado",
              avatar: resolvedPatientAvatar,
              servicio: resolvedServiceName || "Valoración General",
              odontologo: resolvedProfName || fallbackDoc,
              fecha: fechaStr,
              horaInicio: inicio,
              horaFin: fin,
              estado: estadoMapeado,
              cancelada,
            };
          });

        // The API is the source of truth: only keep local entries never saved to it (no rawGuid).
        setCitas((prev) => {
          const combinadas = [...mappedFromBackend];
          prev.forEach((p) => {
            if (
              !p.rawGuid &&
              !combinadas.some(
                (c) =>
                  c.fecha === p.fecha &&
                  c.horaInicio === p.horaInicio &&
                  c.odontologo === p.odontologo
              )
            ) {
              combinadas.push(p);
            }
          });
          return combinadas;
        });
      }
    } catch (err) {
      console.warn("Sincronización inicial de agenda con backend:", err);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  }, []);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  const inicioSemana = useMemo(() => {
    return obtenerInicioSemana(fechaActual);
  }, [fechaActual]);

  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      sumarDias(inicioSemana, index)
    );
  }, [inicioSemana]);

  const citasFiltradas = useMemo(() => {
    const activas = citas.filter((cita) => !cita.cancelada);
    if (odontologosSeleccionados.includes("Todos los odontólogos")) {
      return activas;
    }
    return activas.filter((cita) =>
      odontologosSeleccionados.includes(cita.odontologo)
    );
  }, [citas, odontologosSeleccionados]);

  const fechasSemanaStr = useMemo(() => {
    return diasSemana.map((d) => formatoFechaInput(d));
  }, [diasSemana]);

  const citasSemana = useMemo(() => {
    return citasFiltradas.filter((cita) => fechasSemanaStr.includes(cita.fecha));
  }, [citasFiltradas, fechasSemanaStr]);

  const citasHoy = useMemo(() => {
    const hoy = formatoFechaInput(new Date());
    return citasFiltradas.filter((cita) => cita.fecha === hoy).length;
  }, [citasFiltradas]);

  const confirmadas = useMemo(() => {
    return citasSemana.filter(
      (cita) =>
        (cita.estado || "").toLowerCase() === "confirmada" ||
        (cita.estado || "").toLowerCase() === "confirmed"
    ).length;
  }, [citasSemana]);

  const pendientes = useMemo(() => {
    return citasSemana.filter(
      (cita) =>
        (cita.estado || "").toLowerCase() === "pendiente" ||
        (cita.estado || "").toLowerCase() === "pending"
    ).length;
  }, [citasSemana]);

  const espaciosDisponibles = useMemo(() => {
    const activeProfs = odontologosSeleccionados.includes("Todos los odontólogos")
      ? listaOdontologos.filter((o) => o.nombre !== "Todos los odontólogos")
      : listaOdontologos.filter((o) => odontologosSeleccionados.includes(o.nombre));
    const numOdontologos = activeProfs.length;
    if (numOdontologos === 0) return 0;

    // F-09: Calcular franjas laborales reales por semana (L-V: 10 franjas útiles, Sáb: 5 franjas, Dom: 0)
    let totalSlotsSemana = 0;
    diasSemana.forEach((d) => {
      const dayOfWeek = d.getDay(); // 0 = Domingo, 6 = Sábado
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        totalSlotsSemana += 10 * numOdontologos;
      } else if (dayOfWeek === 6) {
        totalSlotsSemana += 5 * numOdontologos;
      }
    });

    // Citas activas de la semana que ocupan franjas
    const ocupadasSemana = citasSemana.filter((cita) => {
      const st = (cita.estado || "").toLowerCase();
      return st !== "cancelada" && st !== "no disponible" && st !== "cancelled";
    }).length;

    return Math.max(0, totalSlotsSemana - ocupadasSemana);
  }, [diasSemana, citasSemana, odontologosSeleccionados, listaOdontologos]);

  const doctoresParaColumnas = useMemo(() => {
    const sinTodos = listaOdontologos.filter(
      (d) => d.nombre !== "Todos los odontólogos"
    );
    if (odontologosSeleccionados.includes("Todos los odontólogos")) {
      return sinTodos;
    }
    const filtrados = sinTodos.filter((d) =>
      odontologosSeleccionados.includes(d.nombre)
    );
    return filtrados.length > 0 ? filtrados : sinTodos;
  }, [listaOdontologos, odontologosSeleccionados]);

  const cambiarFecha = (direccion: number) => {
    if (modoVista === "semana") {
      setFechaActual((fecha) => sumarDias(fecha, direccion * 7));
    } else {
      setFechaActual((fecha) => sumarDias(fecha, direccion));
    }
  };

  const irHoy = () => {
    setFechaActual(new Date());
  };

  const fechaTextoHeader = useMemo(() => {
    if (modoVista === "semana") {
      return obtenerRangoSemana(inicioSemana);
    }
    const str = formatoFechaLarga(fechaActual);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [modoVista, inicioSemana, fechaActual]);

  const citasDiaActual = useMemo(() => {
    const fechaTexto = formatoFechaInput(fechaActual);
    return citas.filter((cita) => cita.fecha === fechaTexto);
  }, [citas, fechaActual]);

  const cambiarOdontologo = (nombre: string) => {
    if (nombre === "Todos los odontólogos") {
      setOdontologosSeleccionados(["Todos los odontólogos"]);
      return;
    }

    setOdontologosSeleccionados((actuales) => {
      const sinTodos = actuales.filter(
        (odontologo) => odontologo !== "Todos los odontólogos"
      );

      if (sinTodos.includes(nombre)) {
        const nuevos = sinTodos.filter(
          (odontologo) => odontologo !== nombre
        );
        return nuevos.length > 0 ? nuevos : ["Todos los odontólogos"];
      }

      return [...sinTodos, nombre];
    });
  };

  const obtenerCitasDia = (fecha: Date) => {
    const fechaTexto = formatoFechaInput(fecha);
    return citasFiltradas.filter((cita) => cita.fecha === fechaTexto);
  };

  const abrirNuevaCita = (fecha: Date, hora: string, odontologoPredeterminado?: string) => {
    const fechaStr = formatoFechaInput(fecha);
    const scheduleError = validateClinicAppointmentSchedule(fechaStr, hora);
    if (scheduleError) {
      setErrorMessage(scheduleError);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const horaNumero = Number(hora.split(":")[0]);
    const horaFin = `${String(horaNumero + 1).padStart(2, "0")}:00`;

    setFormError(null);
    setFechaSeleccionada(fechaStr);

    let docToSelect = odontologoPredeterminado;
    if (!docToSelect) {
      if (odontologosSeleccionados.length === 1 && odontologosSeleccionados[0] !== "Todos los odontólogos") {
        docToSelect = odontologosSeleccionados[0];
      } else if (listaOdontologos.length > 1) {
        docToSelect = listaOdontologos[1].nombre;
      } else if (listaOdontologos.length === 1) {
        docToSelect = listaOdontologos[0].nombre;
      } else {
        docToSelect = PROFESSIONAL_FALLBACK_LABEL;
      }
    }

    if (docToSelect && docToSelect !== "Todos los odontólogos") {
      const docScheduleError = validateDoctorScheduleAppointment(
        docToSelect,
        fechaStr,
        hora,
        30,
        doctorSchedulesMap
      );
      if (docScheduleError) {
        setErrorMessage(docScheduleError);
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    setNuevaCita({
      paciente: isPaciente ? (user?.name || "Paciente") : "",
      patientId: isPaciente ? (user?.id || "") : "",
      servicio: serviciosEntities.length > 0 ? serviciosEntities[0].name : "Valoración General",
      odontologo: docToSelect || PROFESSIONAL_FALLBACK_LABEL,
      horaInicio: hora,
      horaFin,
      estado: isPaciente ? "Pendiente" : "Confirmada",
    });

    setMostrarModal(true);
  };

  const guardarCita = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("-> Iniciando guardado de cita en Agenda...");
    console.log("Paciente seleccionado:", nuevaCita.paciente, "ID:", nuevaCita.patientId);
    console.log("Formulario:", { fechaSeleccionada, horaInicio: nuevaCita.horaInicio, servicio: nuevaCita.servicio, odontologo: nuevaCita.odontologo });

    if (!nuevaCita.paciente?.trim()) {
      setFormError("Debes seleccionar o ingresar un paciente válido.");
      setErrorMessage("Debes seleccionar un paciente válido.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    if (!nuevaCita.servicio?.trim()) {
      setFormError("Debes seleccionar un servicio o tratamiento.");
      setErrorMessage("Debes seleccionar un servicio.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    if (!nuevaCita.odontologo?.trim() && !isPaciente) {
      setFormError("Debes seleccionar un odontólogo.");
      setErrorMessage("Debes seleccionar un profesional.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const matchedService = serviciosEntities.find((s) => s.name === nuevaCita.servicio || areGuidsEqual(s.id, nuevaCita.servicio));
      const serviceIdToUse = matchedService?.id || (serviciosEntities.length > 0 ? serviciosEntities[0].id : "30000000-0000-0000-0000-000000000001");
      const durationMinutes = Math.max(15, matchedService?.durationMinutes || 30);

      const scheduleError = validateClinicAppointmentSchedule(
        fechaSeleccionada,
        nuevaCita.horaInicio || "09:00",
        durationMinutes
      );
      if (scheduleError) {
        setFormError(scheduleError);
        setErrorMessage(scheduleError);
        setTimeout(() => setErrorMessage(null), 6000);
        setIsSubmitting(false);
        return;
      }

      const matchedProf = profesionalesEntities.find((p) => {
        const pFullName = `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim();
        return pFullName === nuevaCita.odontologo || p.firstName === nuevaCita.odontologo || areGuidsEqual(p.id, nuevaCita.odontologo);
      });
      const profIdToUse = matchedProf?.id;
      if (!profIdToUse && !isPaciente) {
        setFormError("Debes seleccionar un odontólogo válido del listado de profesionales.");
        setErrorMessage("Debes seleccionar un profesional válido.");
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSubmitting(false);
        return;
      }

      const finalProfId = profIdToUse || (profesionalesEntities.length > 0 ? profesionalesEntities[0].id : null);
      if (!finalProfId) {
        setFormError("No hay un profesional activo disponible en el sistema.");
        setErrorMessage("No hay un profesional disponible.");
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSubmitting(false);
        return;
      }

      // Resolución dinámica de paciente (búsqueda o creación al vuelo para evitar fallbacks erróneos)
      const resolvedPatient = await resolveOrCreatePatient({
        identifierOrName: nuevaCita.patientId || nuevaCita.paciente,
        patientsEntities: pacientesEntities,
        personsEntities: personsEntities,
        currentUser: user,
        isPacienteRole: isPaciente,
      });

      const patientIdToUse = resolvedPatient.patientId;
      const patientNameToUse = resolvedPatient.patientName || nuevaCita.paciente;

      if (!patientIdToUse) {
        setFormError("Debes seleccionar o ingresar un paciente válido.");
        setErrorMessage("Debes ingresar un paciente válido.");
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSubmitting(false);
        return;
      }

      const [h, m] = (nuevaCita.horaInicio || "09:00").split(":").map(Number);
      const safeH = String(isNaN(h) ? 9 : h).padStart(2, "0");
      const safeM = String(isNaN(m) ? 0 : m).padStart(2, "0");

      const startTotalMins = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m);
      const endTotalMins = startTotalMins + durationMinutes;
      const safeEH = String(Math.floor(endTotalMins / 60) % 24).padStart(2, "0");
      const safeEM = String(endTotalMins % 60).padStart(2, "0");

      const startsAtLocal = `${fechaSeleccionada}T${safeH}:${safeM}:00`;
      const endsAtLocal = `${fechaSeleccionada}T${safeEH}:${safeEM}:00`;

      // Validar fecha y hora según rol
      if (fechaSeleccionada && nuevaCita.horaInicio) {
        const selectedDateTime = new Date(startsAtLocal);
        if (isPaciente) {
          const minAllowedDateTime = new Date(Date.now() + 30 * 60 * 1000);
          if (selectedDateTime < minAllowedDateTime) {
            const msg = "Las citas deben solicitarse con al menos 30 minutos de anticipación.";
            setFormError(msg);
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            setIsSubmitting(false);
            return;
          }
        } else {
          const selectedDay = new Date(`${fechaSeleccionada}T00:00:00`);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDay < today) {
            const msg = "No se pueden programar citas en fechas pasadas.";
            setFormError(msg);
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 5000);
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Validar disponibilidad del paciente, odontólogo y de la clínica en la franja horaria
      const startMinTotal = Number(safeH) * 60 + Number(safeM);
      const endMinTotal = Number(safeEH) * 60 + Number(safeEM);

      const activeCitasDia = citas.filter((c) => {
        if (c.fecha !== fechaSeleccionada) return false;
        const st = (c.estado || "").toLowerCase();
        return st !== "cancelada" && st !== "no disponible" && st !== "cancelled";
      });

      const overlappingCitas = activeCitasDia.filter((c) => {
        const [cHIni, cMIni] = (c.horaInicio || "07:00").split(":").map(Number);
        const [cHFin, cMFin] = (c.horaFin || "08:00").split(":").map(Number);
        const cStart = (isNaN(cHIni) ? 7 : cHIni) * 60 + (isNaN(cMIni) ? 0 : cMIni);
        const cEnd = (isNaN(cHFin) ? 8 : cHFin) * 60 + (isNaN(cMFin) ? 0 : cMFin);
        return startMinTotal < cEnd && endMinTotal > cStart;
      });

      // 1. Validar que el MISMO PACIENTE no tenga más de una cita a la misma hora
      const targetPatientName = (patientNameToUse || nuevaCita.paciente || "").toLowerCase().trim();
      const patientBusy = overlappingCitas.find((c) => {
        const cPatient = (c.paciente || "").toLowerCase().trim();
        const cPatientId = c.patientId || "";
        const sameId = Boolean(patientIdToUse && cPatientId && areGuidsEqual(patientIdToUse, cPatientId));
        const sameName = Boolean(cPatient === targetPatientName || (cPatient.length > 3 && targetPatientName.length > 3 && (cPatient.includes(targetPatientName) || targetPatientName.includes(cPatient))));
        return sameId || sameName;
      });

      if (patientBusy) {
        const msg = `El paciente "${patientNameToUse || nuevaCita.paciente}" ya tiene una cita agendada en este horario (${patientBusy.horaInicio} - ${patientBusy.horaFin}) con ${patientBusy.odontologo}. Un paciente no puede tener más de una cita a la misma hora.`;
        setFormError(msg);
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 6000);
        setIsSubmitting(false);
        return;
      }

      // 2. Si el usuario seleccionó un profesional específico, comprobar si ese profesional ya tiene cita
      if (nuevaCita.odontologo && nuevaCita.odontologo.trim() && !isPaciente) {
        const targetDoc = nuevaCita.odontologo.toLowerCase().trim();
        const docBusy = overlappingCitas.find((c) => {
          const cDoc = (c.odontologo || "").toLowerCase().trim();
          return cDoc === targetDoc || cDoc.includes(targetDoc) || targetDoc.includes(cDoc);
        });

        if (docBusy) {
          const msg = `El/La profesional ${nuevaCita.odontologo} ya tiene una cita asignada en este horario (${docBusy.horaInicio} - ${docBusy.horaFin}). Elige otro profesional disponible u otro horario.`;
          setFormError(msg);
          setErrorMessage(msg);
          setTimeout(() => setErrorMessage(null), 6000);
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Comprobar si TODOS los profesionales de la clínica están ocupados en este bloque
      const allActiveDocs = listaOdontologos.filter((d) => d.nombre !== "Todos los odontólogos");
      const busyDocNames = new Set(overlappingCitas.map((c) => c.odontologo.toLowerCase().trim()));
      if (allActiveDocs.length > 0 && busyDocNames.size >= allActiveDocs.length) {
        const msg = "No hay ningún odontólogo disponible en este horario. Todos los profesionales se encuentran en consulta.";
        setFormError(msg);
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 6000);
        setIsSubmitting(false);
        return;
      }

      const payload = {
        patientId: patientIdToUse,
        professionalId: finalProfId,
        serviceId: serviceIdToUse,
        startsAt: startsAtLocal,
        endsAt: endsAtLocal,
        appointmentStatusId:
          nuevaCita.estado === "Pendiente"
            ? "10000000-0000-0000-0000-000000000001"
            : "10000000-0000-0000-0000-000000000002",
        appointmentOriginId: "20000000-0000-0000-0000-000000000003",
        reasonForVisit: `Agendado desde agenda interactiva para ${patientNameToUse}`,
        notes: `Servicio: ${nuevaCita.servicio}. Odontólogo: ${nuevaCita.odontologo}`,
        autoAssignProfessional: isPaciente,
      };

      console.log("Payload enviado a la API:", payload);
      const res = await appointmentService.create(payload);
      console.log("Respuesta backend:", res);

      setSuccessToast("¡Cita agendada exitosamente en el servidor!");
      setTimeout(() => setSuccessToast(null), 3500);

      // Actualizar notificaciones del sistema en tiempo real
      refreshNotifications();
      window.dispatchEvent(new CustomEvent("nexus_appointment_changed"));
      addNotification({
        title: nuevaCita.estado === "Pendiente" ? "Nueva Cita Pendiente" : "Cita Agendada",
        message: `${nuevaCita.servicio} para ${patientNameToUse} con ${nuevaCita.odontologo}.`,
        link: "/agenda",
        type: nuevaCita.estado === "Pendiente" ? "appointment_pending" : "appointment_confirmed",
      });

      // Cierre del modal y refresco de agenda
      setMostrarModal(false);
      await fetchAgendaData();
    } catch (error: any) {
      console.error("Error capturado al guardar cita en /agenda:", error.response?.data || error);
      const serverMsg = String(error?.response?.data?.message || error?.message || "").toLowerCase();
      const details = error?.response?.data?.details;
      let detailsMsg = "";
      if (details && typeof details === "object") {
        const allDetails = Object.values(details).flat().filter(Boolean);
        if (allDetails.length > 0) {
          detailsMsg = allDetails.join(". ");
        }
      }

      let errorMsg = "No se pudo registrar la cita en el servidor.";
      if (
        serverMsg.includes("fechas u horas pasadas") ||
        serverMsg.includes("fuera de la jornada") ||
        serverMsg.includes("receso de almuerzo")
      ) {
        errorMsg = error?.response?.data?.message || errorMsg;
      } else if (serverMsg.includes("no hay odontólogos disponibles") || serverMsg.includes("no hay odontólogos activos")) {
        errorMsg = error?.response?.data?.message || "No hay odontólogos disponibles en ese horario. Por favor selecciona otra hora.";
      } else if (serverMsg.includes("outside the professional's active availability") || serverMsg.includes("availability")) {
        errorMsg = "El horario seleccionado está fuera de la jornada de atención (08:00 a 12:00 y 14:00 a 17:00). Elige un inicio donde el tratamiento termine antes del almuerzo o del cierre.";
      } else if (error?.response?.status === 409 || serverMsg.includes("conflict") || serverMsg.includes("overlap") || serverMsg.includes("already has an appointment")) {
        errorMsg = isPaciente
          ? "No hay odontólogos disponibles en ese horario. Por favor selecciona otra hora."
          : "El odontólogo ya tiene una cita asignada en ese rango horario. Por favor selecciona otra hora u otro profesional.";
      } else if (detailsMsg) {
        errorMsg = detailsMsg;
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      setFormError(errorMsg);
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarCita = async (id: number, rawGuid?: string) => {
    try {
      if (rawGuid && rawGuid.length > 10) {
        try {
          await appointmentService.delete(rawGuid);
        } catch (deleteError: any) {
          if (deleteError?.response?.status !== 404) throw deleteError;
        }
      }
      // A-08: Filtrar por rawGuid solo si existe; de lo contrario, filtrar exclusivamente por id
      setCitas((actuales) =>
        actuales.filter((cita) => {
          if (rawGuid) {
            return !cita.rawGuid || cita.rawGuid !== rawGuid;
          }
          return cita.id !== id;
        })
      );
      setSuccessToast("Cita eliminada correctamente");
      setTimeout(() => setSuccessToast(null), 3500);
      await fetchAgendaData();
    } catch (error: any) {
      console.error("Error al eliminar cita:", error);
      const errorMsg = error?.response?.data?.message || "No se pudo eliminar la cita en el servidor";
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const statusGuidMap: Record<EstadoCita, string> = {
    "Pendiente": "10000000-0000-0000-0000-000000000001",
    "Confirmada": "10000000-0000-0000-0000-000000000002",
    "En Atención": "10000000-0000-0000-0000-000000000003",
    "Completada": "10000000-0000-0000-0000-000000000004",
    "No disponible": "10000000-0000-0000-0000-000000000005",
    "Disponible": "10000000-0000-0000-0000-000000000002",
  };

  const actualizarEstadoCita = async (targetCita: Cita, nuevoEstado: EstadoCita) => {
    try {
      if (targetCita.rawGuid && targetCita.rawGuid.length > 10) {
        let resolvedProfId: string | undefined;
        const cleanProf = (targetCita.odontologo || "").replace(/^dr\(a\)\.?\s*/i, "").trim().toLowerCase();
        const foundProf = profesionalesEntities.find((p) => {
          const fn = `${p.firstName || ""} ${p.lastName || ""}`.trim().toLowerCase();
          return cleanProf && (fn.includes(cleanProf) || cleanProf.includes(fn));
        });
        resolvedProfId = foundProf?.id || profesionalesEntities[0]?.id || "00000000-0000-0000-0000-000000000000";

        const cleanServ = (targetCita.servicio || "").trim().toLowerCase();
        const foundServ = serviciosEntities.find((s) => (s.name || "").trim().toLowerCase() === cleanServ);
        const resolvedServId = foundServ?.id || serviciosEntities[0]?.id || "30000000-0000-0000-0000-000000000001";

        const startsAt = `${targetCita.fecha}T${targetCita.horaInicio}:00`;
        const endsAt = `${targetCita.fecha}T${targetCita.horaFin}:00`;

        await appointmentService.update(targetCita.rawGuid, {
          patientId: targetCita.patientId,
          professionalId: resolvedProfId || "00000000-0000-0000-0000-000000000000",
          serviceId: resolvedServId,
          startsAt,
          endsAt,
          appointmentStatusId: statusGuidMap[nuevoEstado] || "10000000-0000-0000-0000-000000000002",
          appointmentOriginId: "20000000-0000-0000-0000-000000000003",
          reasonForVisit: `Servicio: ${targetCita.servicio}`,
          notes: `Estado actualizado a ${nuevoEstado}`,
          cancelledAt: nuevoEstado === "No disponible" ? new Date().toISOString() : undefined,
          cancellationReason: nuevoEstado === "No disponible" ? "Cancelada desde la agenda" : undefined,
        });
      }

      const seCancela = nuevoEstado === "No disponible";
      setCitas((prev) =>
        prev.map((c) =>
          c.id === targetCita.id || (targetCita.rawGuid && c.rawGuid === targetCita.rawGuid)
            ? { ...c, estado: nuevoEstado, cancelada: seCancela || c.cancelada }
            : c
        )
      );

      if (citaDetalle && (citaDetalle.id === targetCita.id || (targetCita.rawGuid && citaDetalle.rawGuid === targetCita.rawGuid))) {
        setCitaDetalle((prev) => (prev && !seCancela ? { ...prev, estado: nuevoEstado } : null));
      }

      refreshNotifications();
      window.dispatchEvent(new CustomEvent("nexus_appointment_changed"));

      const msg =
        nuevoEstado === "Completada"
          ? "¡Cita marcada como Terminada / Completada con éxito!"
          : nuevoEstado === "En Atención"
          ? "Cita iniciada: Paciente En Atención"
          : `Estado actualizado a: ${nuevoEstado}`;

      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 3500);
      await fetchAgendaData();
    } catch (err: any) {
      console.error("Error al actualizar estado en agenda:", err);
      setCitas((prev) =>
        prev.map((c) => (c.id === targetCita.id || (targetCita.rawGuid && c.rawGuid === targetCita.rawGuid) ? { ...c, estado: nuevoEstado } : c))
      );
      if (citaDetalle && (citaDetalle.id === targetCita.id || (targetCita.rawGuid && citaDetalle.rawGuid === targetCita.rawGuid))) {
        setCitaDetalle((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      }
      setSuccessToast(`Estado actualizado localmente a: ${nuevoEstado}`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const HORA_ALTURA_PX = 110;

  interface CitaPosicionada extends Cita {
    top: number;
    height: number;
    leftStyle: string;
    widthStyle: string;
    totalColumnas: number;
    colIndex: number;
    duracionMinutos?: number;
    isCluster?: boolean;
    clusterCitas?: Cita[];
  }

  const calcularPosicionesDia = (citasList: Cita[]): CitaPosicionada[] => {
    if (citasList.length === 0) return [];

    // Agrupar citas por hora exacta de inicio (7 a 18)
    const porHora: Record<number, Cita[]> = {};
    citasList.forEach((cita) => {
      const [h] = (cita.horaInicio || "07:00").split(":").map(Number);
      const safeH = isNaN(h) ? 7 : Math.min(Math.max(h, 7), 18);
      if (!porHora[safeH]) {
        porHora[safeH] = [];
      }
      porHora[safeH].push(cita);
    });

    const resultado: CitaPosicionada[] = [];

    Object.entries(porHora).forEach(([horaStr, citasBloque]) => {
      const hora = Number(horaStr);
      const top = (hora - 7) * HORA_ALTURA_PX + 2;
      const height = HORA_ALTURA_PX - 4;
      const horaInicioStr = `${String(hora).padStart(2, "0")}:00`;
      const horaFinStr = `${String(hora + 1).padStart(2, "0")}:00`;

      resultado.push({
        id: citasBloque[0].id,
        rawGuid: citasBloque[0].rawGuid,
        paciente: citasBloque.length === 1 ? citasBloque[0].paciente : `${citasBloque.length} Pacientes`,
        servicio: citasBloque.length === 1 ? citasBloque[0].servicio : "Múltiples Servicios",
        odontologo: citasBloque[0].odontologo,
        fecha: citasBloque[0].fecha,
        horaInicio: horaInicioStr,
        horaFin: horaFinStr,
        estado: citasBloque[0].estado,
        top,
        height,
        leftStyle: "3px",
        widthStyle: "calc(100% - 6px)",
        totalColumnas: 1,
        colIndex: 0,
        isCluster: true,
        clusterCitas: citasBloque,
      });
    });

    return resultado;
  };

  const obtenerPosicionHoraActual = () => {
    const fechaHoy = formatoFechaInput(horaActual);
    if (modoVista === "semana") {
      const estaSemana = diasSemana.some(
        (dia) => formatoFechaInput(dia) === fechaHoy
      );
      if (!estaSemana) {
        return null;
      }
    } else {
      if (formatoFechaInput(fechaActual) !== fechaHoy) {
        return null;
      }
    }
    const hora = horaActual.getHours();
    const minutos = horaActual.getMinutes();
    if (hora < 7 || hora > 18) {
      return null;
    }
    return ((hora - 7) + minutos / 60) * HORA_ALTURA_PX;
  };

  const posicionHoraActual = obtenerPosicionHoraActual();

  const gridTemplateColumnsSemana = "50px repeat(7, minmax(72px, 1fr))";
  const gridTemplateColumnsDoctores = `50px repeat(${Math.max(doctoresParaColumnas.length, 1)}, minmax(180px, 1fr))`;
  const gridTemplateColumns = modoVista === "semana" ? gridTemplateColumnsSemana : gridTemplateColumnsDoctores;

  const renderCitaCard = (cita: CitaPosicionada) => {
    const clusterList = cita.clusterCitas && cita.clusterCitas.length > 0 ? cita.clusterCitas : [cita];
    const totalCitas = clusterList.length;
    const needsReschedule = clusterList.some((c) => requiresReschedule(c.rawGuid));

    return (
      <div
        key={`slot-card-${cita.fecha}-${cita.horaInicio}-${cita.id}`}
        onClick={() => {
          setSelectedClusterModal({
            fecha: cita.fecha,
            horaInicio: cita.horaInicio,
            horaFin: cita.horaFin,
            citas: clusterList,
          });
        }}
        style={{
          top: `${cita.top}px`,
          height: `${cita.height}px`,
          left: cita.leftStyle,
          width: cita.widthStyle,
        }}
        className="group absolute z-20 rounded-2xl border-2 border-sky-500/60 dark:border-sky-400/70 bg-gradient-to-br from-sky-500/15 via-cyan-500/10 to-blue-500/15 dark:from-sky-950/85 dark:via-cyan-950/75 dark:to-blue-950/85 backdrop-blur-xl shadow-md hover:shadow-xl hover:border-sky-400 hover:-translate-y-1 hover:scale-[1.01] active:scale-98 transition-all duration-300 cursor-pointer p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden"
        title={`Ver ${totalCitas} ${totalCitas === 1 ? "cita agendada" : "citas agendadas"} a las ${cita.horaInicio}`}
      >
        {/* Cabecera: Hora Inicio/Fin a la Izquierda, Badge de Citas a la Derecha */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-500/40 group-hover:rotate-6 transition-transform shadow-xs">
              <Clock3 size={13} className="text-sky-600 dark:text-sky-300" />
            </div>
            <span className="font-sans text-xs font-extrabold text-sky-950 dark:text-sky-100 truncate tracking-tight">
              {cita.horaInicio} - {cita.horaFin}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-sans bg-sky-500/20 text-sky-900 dark:text-sky-200 border border-sky-500/35 shrink-0 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>{totalCitas} {totalCitas === 1 ? "Cita" : "Citas"}</span>
          </span>
        </div>

        {needsReschedule && (
          <div className="mt-1 min-w-0">
            <RequiresRescheduleBadge className="max-w-full truncate" />
          </div>
        )}

        {/* Pie: Botón / Enlace de Acción a Ancho Completo */}
        <div className="w-full mt-auto pt-2 flex items-center justify-between text-xs font-bold font-sans text-sky-700 dark:text-sky-300 border-t border-sky-500/20 group-hover:text-sky-950 dark:group-hover:text-sky-100 transition-colors">
          <span className="flex items-center gap-1.5">
            <Folder size={13} className="text-sky-600 dark:text-sky-400" />
            <span>Ver citas agendadas</span>
          </span>
          <span className="text-sm transition-transform group-hover:translate-x-1 font-bold">→</span>
        </div>
      </div>
    );
  };

  const renderDoctorScheduleBlock = (
    b: DoctorScheduleBlocks["blocks"][number],
    docName?: string
  ) => {
    if (b.type === "day_off") {
      return (
        <div
          key={`dayoff-${b.topPx}-${b.startHour}`}
          onClick={(e) => {
            e.stopPropagation();
            setErrorMessage(`El/La profesional ${docName || ""} no atiende este día (día no programado en su turno).`);
            setTimeout(() => setErrorMessage(null), 5000);
          }}
          className="absolute left-1.5 right-1.5 z-20 flex flex-col items-center justify-center p-2 rounded-xl border border-indigo-400/30 dark:border-indigo-500/30 bg-indigo-500/[0.06] dark:bg-indigo-950/40 backdrop-blur-[1.5px] cursor-not-allowed select-none transition-all hover:bg-indigo-500/[0.09] dark:hover:bg-indigo-950/55"
          style={{
            top: `${b.topPx}px`,
            height: `${b.heightPx}px`,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(99,102,241,0.06) 0px, rgba(99,102,241,0.06) 10px, transparent 10px, transparent 20px)",
          }}
          title={`${b.title} • ${b.subTitle}`}
        >
          <div className="flex flex-col items-center gap-1.5 text-center px-2 py-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-indigo-200/90 dark:border-indigo-500/30 shadow-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Ban size={18} />
            </div>
            <span className="text-xs font-bold font-sans text-indigo-950 dark:text-indigo-200">
              {b.title}
            </span>
            <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300/80 font-medium font-sans leading-tight">
              {b.subTitle}
            </span>
          </div>
        </div>
      );
    }

    if (b.type === "early") {
      return (
        <div
          key={`early-${b.topPx}-${b.startHour}`}
          onClick={(e) => {
            e.stopPropagation();
            setErrorMessage(`El/La profesional ${docName || ""} ${b.title.toLowerCase()}. No es posible agendar antes de esa hora.`);
            setTimeout(() => setErrorMessage(null), 5000);
          }}
          className="absolute left-1.5 right-1.5 z-20 flex items-center justify-center p-2 rounded-xl border border-slate-300/70 dark:border-slate-700/60 bg-slate-200/35 dark:bg-slate-800/35 backdrop-blur-[1px] cursor-not-allowed select-none transition-all hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
          style={{
            top: `${b.topPx}px`,
            height: `${b.heightPx}px`,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 10px, transparent 10px, transparent 20px)",
          }}
          title={`${b.title} • ${b.subTitle}`}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-[10px] font-medium font-sans shadow-xs">
            <Clock3 size={12} className="text-slate-500 dark:text-slate-300" />
            <span>{b.title}</span>
          </div>
        </div>
      );
    }

    if (b.type === "lunch") {
      return (
        <div
          key={`lunch-${b.topPx}-${b.startHour}`}
          onClick={(e) => {
            e.stopPropagation();
            setErrorMessage(`☕ Horario de descanso/almuerzo de ${docName || "personal médico"} (${b.subTitle}).`);
            setTimeout(() => setErrorMessage(null), 4500);
          }}
          className="absolute left-1.5 right-1.5 z-20 flex flex-col items-center justify-center p-2 rounded-xl border border-sky-400/40 dark:border-sky-500/40 bg-sky-500/[0.08] dark:bg-sky-950/45 backdrop-blur-[1.5px] cursor-not-allowed select-none transition-all hover:bg-sky-500/[0.12] dark:hover:bg-sky-950/60 shadow-sm"
          style={{
            top: `${b.topPx}px`,
            height: `${b.heightPx}px`,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(56,189,248,0.08) 0px, rgba(56,189,248,0.08) 10px, transparent 10px, transparent 20px)",
          }}
          title={`Receso de Almuerzo • ${b.subTitle}`}
        >
          <div className="flex flex-col items-center gap-1 text-center px-2 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-sky-200/90 dark:border-sky-500/40 shadow-xs">
            <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <Utensils size={13} />
              <span className="text-[11px] font-bold font-sans">Receso Almuerzo</span>
            </div>
            <span className="text-[9.5px] font-mono text-sky-700/80 dark:text-sky-300/80 font-semibold">
              {b.subTitle}
            </span>
          </div>
        </div>
      );
    }

    if (b.type === "closed") {
      return (
        <div
          key={`closed-${b.topPx}-${b.startHour}`}
          onClick={(e) => {
            e.stopPropagation();
            setErrorMessage(`🌙 ${docName ? `${docName} finaliza su jornada` : "La jornada finaliza"} a las ${b.title.match(/\((.*?)\)/)?.[1] || "17:00"}.`);
            setTimeout(() => setErrorMessage(null), 5000);
          }}
          className="absolute left-1.5 right-1.5 z-20 flex items-center justify-center p-2 rounded-xl border border-slate-300/70 dark:border-slate-700/60 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-[1px] cursor-not-allowed select-none transition-all hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
          style={{
            top: `${b.topPx}px`,
            height: `${b.heightPx}px`,
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 10px, transparent 10px, transparent 20px)",
          }}
          title={`${b.title} • ${b.subTitle}`}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-[10px] font-normal font-sans shadow-xs">
            <Moon size={12} className="text-slate-500 dark:text-slate-300" />
            <span>{b.title}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Toast Notificación (CAPA SUPERIOR ABSOLUTA z-[99999] EN ESQUINA INFERIOR DERECHA) */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-slate-900/95 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-slideUp">
          <Check size={18} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Toast Error Notificación */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-950/95 text-rose-300 border border-rose-500/40 shadow-2xl backdrop-blur-xl animate-slideUp">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      <div className="min-h-full w-full overflow-hidden px-4 pb-6 pt-4 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <main className="min-w-0 space-y-4">
              {/* Tarjetas KPI Superiores */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-cyan-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                    <CalendarDays size={20} className="group-hover:animate-icon-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Citas hoy</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{citasHoy}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Total programadas</p>
                  </div>
                </div>

                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-cyan-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                    <Clock3 size={20} className="group-hover:animate-icon-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Espacios disponibles</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{espaciosDisponibles}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Para agendar</p>
                  </div>
                </div>

                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-blue-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                    <CheckCircle2 size={20} className="group-hover:animate-icon-wiggle" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Confirmadas</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{confirmadas}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Citas confirmadas</p>
                  </div>
                </div>

                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-amber-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                    <Hourglass size={20} className="group-hover:animate-icon-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pendientes</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{pendientes}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Por confirmar</p>
                  </div>
                </div>
              </section>

              {/* Calendario Principal */}
              <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 shadow-md backdrop-blur-sm">
                {/* Cabecera y Controles */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={irHoy}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Hoy
                    </button>

                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => cambiarFecha(-1)}
                        className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title={modoVista === "semana" ? "Semana anterior" : "Día anterior"}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarFecha(1)}
                        className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title={modoVista === "semana" ? "Semana siguiente" : "Día siguiente"}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {fechaTextoHeader}
                    </p>

                    {/* Selector de modo de vista: Semana vs Por Odontólogo */}
                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 p-0.5 sm:ml-2">
                      <button
                        type="button"
                        onClick={() => setModoVista("semana")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          modoVista === "semana"
                            ? "bg-cyan-500 text-slate-950 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <CalendarDays size={14} />
                        <span>Semana</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoVista("odontologos")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          modoVista === "odontologos"
                            ? "bg-cyan-500 text-slate-950 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Users size={14} />
                        <span>Por Odontólogo (Día)</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchAgendaData}
                      disabled={loading}
                      className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-400 transition hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center disabled:opacity-50 active:scale-95 shadow-sm"
                      title="Sincronizar agenda con backend"
                    >
                      <DentistryReloadIcon size={18} loading={loading} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const nextHour = now.getHours() + 1;
                        const horaStr = nextHour >= 7 && nextHour <= 18 ? `${String(nextHour).padStart(2, "0")}:00` : "09:00";
                        abrirNuevaCita(now, horaStr);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <Plus size={16} />
                      <span>Nueva Cita</span>
                    </button>
                  </div>
                </div>

                {/* Filtro Rápido Odontólogos */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 text-xs">
                  {listaOdontologos.map((doc) => {
                    const seleccionado = odontologosSeleccionados.includes(doc.nombre);
                    return (
                      <button
                        key={doc.nombre}
                        type="button"
                        onClick={() => cambiarOdontologo(doc.nombre)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
                          seleccionado
                            ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
                            : "border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${doc.color}`} />
                        <span>{doc.nombre}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Matriz Calendario */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60">
                  <div className={modoVista === "semana" ? "w-full min-w-[554px]" : "w-full min-w-[700px]"}>
                    {/* Encabezado Columnas Días u Odontólogos */}
                    {modoVista === "semana" ? (
                      <div
                        className="grid border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50/95 dark:bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md"
                        style={{ gridTemplateColumns }}
                      >
                        <div className="py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 sticky left-0 z-40 bg-slate-50/95 dark:bg-slate-900/90">
                          GMT-5
                        </div>

                        {diasSemana.map((dia, idx) => {
                          const esHoy =
                            formatoFechaInput(dia) === formatoFechaInput(horaActual);
                          const esSeleccionado =
                            formatoFechaInput(dia) === formatoFechaInput(fechaActual);
                          return (
                            <div
                              key={idx}
                              onClick={() => setFechaActual(dia)}
                              className={`py-2 text-center border-l border-slate-200 dark:border-slate-800/60 transition-colors cursor-pointer hover:bg-cyan-500/5 ${
                                esHoy ? "bg-cyan-500/10 dark:bg-cyan-500/15" : esSeleccionado ? "bg-slate-200/50 dark:bg-slate-800/40" : ""
                              }`}
                              title="Clic para seleccionar este día"
                            >
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {nombresDias[dia.getDay()]}
                              </p>
                              <p
                                className={`mt-0.5 text-sm font-bold inline-flex items-center justify-center h-6 w-6 rounded-full ${
                                  esHoy
                                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {dia.getDate()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="grid border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50/95 dark:bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md"
                        style={{ gridTemplateColumns }}
                      >
                        <div className="py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 sticky left-0 z-40 bg-slate-50/95 dark:bg-slate-900/90">
                          GMT-5
                        </div>

                        {doctoresParaColumnas.map((doc, idx) => {
                          const docTheme = getDoctorTheme(doc.nombre, listaOdontologos);
                          const citasDocHoy = citasDiaActual.filter((c) => {
                            const cDoc = (c.odontologo || "").toLowerCase().trim();
                            const dDoc = doc.nombre.toLowerCase().trim();
                            return cDoc === dDoc || cDoc.includes(dDoc) || dDoc.includes(cDoc);
                          });

                          return (
                            <div
                              key={idx}
                              className="py-2.5 px-3 text-center border-l border-slate-200 dark:border-slate-800/60"
                            >
                              <div className="flex items-center justify-center gap-1.5 min-w-0">
                                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${docTheme.dot}`} />
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {doc.nombre}
                                </p>
                              </div>
                              <div className="mt-1 flex items-center justify-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${docTheme.badge}`}>
                                  {citasDocHoy.length} {citasDocHoy.length === 1 ? "cita hoy" : "citas hoy"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Cuerpo de Horas y Eventos */}
                    <div
                      className="relative grid bg-white/70 dark:bg-slate-900/40"
                      style={{
                        gridTemplateColumns,
                        height: `${12 * HORA_ALTURA_PX}px`,
                      }}
                    >
                      {/* Línea Hora Actual */}
                      {posicionHoraActual !== null && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-30 flex items-center opacity-80"
                          style={{ top: `${posicionHoraActual}px` }}
                        >
                          {/* Punto indicador de 8px sólido sobre la columna de horas */}
                          <div className="absolute left-[44px] -translate-x-1/2 flex items-center justify-center">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-sm" />
                            </span>
                          </div>
                          {/* Línea horizontal suave con degradado hacia los bordes */}
                          <div className="h-[1.5px] w-full ml-[50px] bg-gradient-to-r from-rose-500/90 via-rose-500/75 to-rose-500/20 shadow-[0_0_6px_rgba(244,63,94,0.35)]" />
                        </div>
                      )}

                      {/* Columna Horas Eje Y */}
                      <div className="relative border-r border-slate-200 dark:border-slate-800 text-right pr-2 bg-slate-50/50 dark:bg-slate-900/30 sticky left-0 z-25 backdrop-blur-xs">
                        {Array.from({ length: 12 }, (_, i) => {
                          const hora = i + 7;
                          const esDescanso = hora === 12 || hora === 13;
                          return (
                            <div
                              key={hora}
                              className={`absolute right-2 text-[11px] font-sans font-semibold flex items-center justify-end gap-1 ${
                                esDescanso
                                  ? "text-sky-600 dark:text-sky-400 font-bold"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                              style={{ top: `${i * HORA_ALTURA_PX - 7}px` }}
                              title={esDescanso ? "Horario de descanso clínico (12:00 - 14:00)" : undefined}
                            >
                              {esDescanso && <Utensils size={10} className="text-sky-500 shrink-0" />}
                              <span>{`${String(hora).padStart(2, "0")}:00`}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Franja Unificada Horizontal de Descanso Clínico LED (Lunes a Sábado 12:00 a 14:00) SOLO cuando NO hay un doctor individual seleccionado */}
                      {modoVista === "semana" && !selectedSingleDoctor ? (
                        <CarruselAlmuerzoUnificado
                          topPx={(12 - 7) * HORA_ALTURA_PX + 2}
                          heightPx={2 * HORA_ALTURA_PX - 4}
                          leftPx="calc(50px + ((100% - 50px) * (1 / 7)))"
                          width="calc((100% - 50px) * (6 / 7))"
                          horaInicioDescanso="12:00"
                          horaFinDescanso="14:00"
                          onIntentarAgendar={() => {
                            setErrorMessage("☕ Horario de descanso clínico (12:00 a 14:00). Durante este periodo el personal médico se encuentra en descanso/almuerzo.");
                            setTimeout(() => setErrorMessage(null), 4500);
                          }}
                        />
                      ) : null}

                      {modoVista === "semana" ? (
                        // 7 Columnas de Días (Semana Completa)
                        diasSemana.map((dia, idx) => {
                          const citasDia = obtenerCitasDia(dia);
                          const citasPosicionadas = calcularPosicionesDia(citasDia);
                          const esHoy =
                            formatoFechaInput(dia) === formatoFechaInput(horaActual);
                          const dayOfWeek = dia.getDay(); // 0 = Domingo, 6 = Sábado, 1-5 = Lunes-Viernes
                          const singleDocBlocks = selectedSingleDoctor
                            ? getDoctorScheduleBlocks(
                                selectedSingleDoctor,
                                dia,
                                HORA_ALTURA_PX,
                                7,
                                19,
                                doctorSchedulesMap
                              )
                            : null;

                          return (
                            <div
                              key={idx}
                              className={`relative border-r border-slate-200 dark:border-slate-800/60 ${
                                esHoy ? "bg-cyan-500/3 dark:bg-cyan-500/2" : ""
                              }`}
                            >
                              {/* Líneas Horarias */}
                              {Array.from({ length: 12 }, (_, i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    abrirNuevaCita(
                                      dia,
                                      `${String(i + 7).padStart(2, "0")}:00`
                                    )
                                  }
                                  className="absolute left-0 right-0 border-b border-slate-200/70 dark:border-slate-800/40 hover:bg-cyan-500/10 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                  style={{
                                    top: `${i * HORA_ALTURA_PX}px`,
                                    height: `${HORA_ALTURA_PX}px`,
                                  }}
                                  title={`Agendar para el día ${dia.toLocaleDateString("es-CO")} a las ${String(i + 7).padStart(2, "0")}:00`}
                                />
                              ))}

                              {/* Bloques de Horario y Descanso: Si hay un solo odontólogo seleccionado, se reflejan sus turnos reales */}
                              {singleDocBlocks ? (
                                singleDocBlocks.blocks.map((b) =>
                                  renderDoctorScheduleBlock(b, selectedSingleDoctor || undefined)
                                )
                              ) : (
                                <>
                                  {/* Domingo: Día no laboral (Todo el día bloqueado) */}
                                  {dayOfWeek === 0 && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setErrorMessage("Los domingos la clínica permanece cerrada. No es posible agendar citas este día.");
                                        setTimeout(() => setErrorMessage(null), 5000);
                                      }}
                                      className="absolute left-1.5 right-1.5 z-20 flex flex-col items-center justify-center p-2 rounded-xl border border-indigo-400/30 dark:border-indigo-500/30 bg-indigo-500/[0.06] dark:bg-indigo-950/40 backdrop-blur-[1.5px] cursor-not-allowed select-none transition-all hover:bg-indigo-500/[0.09] dark:hover:bg-indigo-950/55"
                                      style={{
                                        top: "2px",
                                        height: `${12 * HORA_ALTURA_PX - 4}px`,
                                        backgroundImage: "repeating-linear-gradient(135deg, rgba(99,102,241,0.06) 0px, rgba(99,102,241,0.06) 10px, transparent 10px, transparent 20px)",
                                      }}
                                      title="Día no laboral • Clínica cerrada los Domingos"
                                    >
                                      <div className="flex flex-col items-center gap-1.5 text-center px-2 py-3 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-indigo-200/90 dark:border-indigo-500/30 shadow-md">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                          <Ban size={18} />
                                        </div>
                                        <span className="text-xs font-bold font-sans text-indigo-950 dark:text-indigo-200">
                                          Día No Laboral
                                        </span>
                                        <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300/80 font-medium font-sans leading-tight">
                                          Clínica cerrada
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Sábado: Tarde cerrada (14:00 a 19:00 bloqueado) */}
                                  {dayOfWeek === 6 && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setErrorMessage("Los sábados la clínica atiende en la mañana (08:00 a 12:00) con descanso de 12:00 a 14:00. En la tarde permanece cerrada.");
                                        setTimeout(() => setErrorMessage(null), 5000);
                                      }}
                                      className="absolute left-1.5 right-1.5 z-20 flex flex-col items-center justify-center p-2 rounded-xl border border-indigo-400/30 dark:border-indigo-500/30 bg-indigo-500/[0.06] dark:bg-indigo-950/40 backdrop-blur-[1.5px] cursor-not-allowed select-none transition-all hover:bg-indigo-500/[0.09] dark:hover:bg-indigo-950/55"
                                      style={{
                                        top: `${7 * HORA_ALTURA_PX + 2}px`,
                                        height: `${5 * HORA_ALTURA_PX - 4}px`,
                                        backgroundImage: "repeating-linear-gradient(135deg, rgba(99,102,241,0.06) 0px, rgba(99,102,241,0.06) 10px, transparent 10px, transparent 20px)",
                                      }}
                                      title="No se labora • Sábado tarde cerrado (14:00 a 19:00)"
                                    >
                                      <div className="flex flex-col items-center gap-1 text-center px-2 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-indigo-200/90 dark:border-indigo-500/30 shadow-md">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                          <Moon size={15} />
                                        </div>
                                        <span className="text-[11px] font-bold font-sans text-indigo-950 dark:text-indigo-200">
                                          No se labora
                                        </span>
                                        <span className="text-[9.5px] text-indigo-600/80 dark:text-indigo-300/80 font-medium font-sans leading-tight">
                                          Sábado tarde cerrado
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Lunes a Viernes: Cierre general (17:00 a 19:00) */}
                                  {dayOfWeek >= 1 && dayOfWeek <= 5 && (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setErrorMessage("🌙 La jornada de atención finaliza a las 17:00 (5:00 PM).");
                                        setTimeout(() => setErrorMessage(null), 5000);
                                      }}
                                      className="absolute left-1.5 right-1.5 z-20 flex items-center justify-center p-2 rounded-xl border border-slate-300/70 dark:border-slate-700/60 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-[1px] cursor-not-allowed select-none transition-all hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                                      style={{
                                        top: `${10 * HORA_ALTURA_PX + 2}px`,
                                        height: `${2 * HORA_ALTURA_PX - 4}px`,
                                        backgroundImage: "repeating-linear-gradient(135deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 10px, transparent 10px, transparent 20px)",
                                      }}
                                      title="Cierre de Clínica • Atención hasta las 17:00"
                                    >
                                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-[10px] font-normal font-sans shadow-xs">
                                        <Moon size={12} className="text-slate-500 dark:text-slate-300" />
                                        <span>Cierre 17:00</span>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Citas / Eventos */}
                              {citasPosicionadas.map(renderCitaCard)}
                            </div>
                          );
                        })
                      ) : (
                        // Columnas por Odontólogo (Vista Diaria)
                        doctoresParaColumnas.map((doc, idx) => {
                          const citasDoc = citasDiaActual.filter((c) => {
                            const cDoc = (c.odontologo || "").toLowerCase().trim();
                            const dDoc = doc.nombre.toLowerCase().trim();
                            return cDoc === dDoc || cDoc.includes(dDoc) || dDoc.includes(cDoc);
                          });
                          const citasPosicionadas = calcularPosicionesDia(citasDoc);
                          const docBlocks = getDoctorScheduleBlocks(
                            doc.nombre,
                            fechaActual,
                            HORA_ALTURA_PX,
                            7,
                            19,
                            doctorSchedulesMap
                          );

                          return (
                            <div
                              key={idx}
                              className="relative border-r border-slate-200 dark:border-slate-800/60"
                            >
                              {/* Líneas Horarias */}
                              {Array.from({ length: 12 }, (_, i) => (
                                <div
                                  key={i}
                                  onClick={() =>
                                    abrirNuevaCita(
                                      fechaActual,
                                      `${String(i + 7).padStart(2, "0")}:00`,
                                      doc.nombre
                                    )
                                  }
                                  className="absolute left-0 right-0 border-b border-slate-200/70 dark:border-slate-800/40 hover:bg-cyan-500/10 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                  style={{
                                    top: `${i * HORA_ALTURA_PX}px`,
                                    height: `${HORA_ALTURA_PX}px`,
                                  }}
                                  title={`Agendar con ${doc.nombre} a las ${String(i + 7).padStart(2, "0")}:00`}
                                />
                              ))}

                              {/* Bloques de descanso, turno y almuerzo personalizados de este odontólogo */}
                              {docBlocks.blocks.map((b) =>
                                renderDoctorScheduleBlock(b, doc.nombre)
                              )}

                              {/* Citas del Odontólogo */}
                              {citasPosicionadas.map(renderCitaCard)}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </main>

            {/* Barra Lateral Derecha */}
            <aside className="space-y-4">
              {/* Calendario Miniatura */}
              <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 shadow-md backdrop-blur-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {obtenerNombreMes(fechaActual)} {fechaActual.getFullYear()}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFechaActual(
                          new Date(
                            fechaActual.getFullYear(),
                            fechaActual.getMonth() - 1,
                            1
                          )
                        )
                      }
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFechaActual(
                          new Date(
                            fechaActual.getFullYear(),
                            fechaActual.getMonth() + 1,
                            1
                          )
                        )
                      }
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Días Mini Calendario */}
                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px]">
                  {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                    <span key={i} className="font-semibold text-slate-400 dark:text-slate-500">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: 31 }, (_, i) => {
                    const diaNum = i + 1;
                    const esSeleccionado = diaNum === fechaActual.getDate();
                    return (
                      <button
                        key={diaNum}
                        type="button"
                        onClick={() =>
                          setFechaActual(
                            new Date(
                              fechaActual.getFullYear(),
                              fechaActual.getMonth(),
                              diaNum
                            )
                          )
                        }
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition cursor-pointer mx-auto ${
                          esSeleccionado
                            ? "bg-cyan-500 font-bold text-slate-950 shadow-sm"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {diaNum}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Convenciones y Leyenda */}
              <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 shadow-md backdrop-blur-sm space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200 dark:border-slate-800">
                  Estados de Cita
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-cyan-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Confirmada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">En Atención</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Pendiente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Disponible</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Modal Detalle de Cita */}
      <AnimatePresence>
        {citaDetalle && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCitaDetalle(null)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 360 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl text-slate-900 dark:text-white z-10"
            >
              {/* Header con gradiente decorativo y fecha */}
              <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600/15 via-blue-600/10 to-indigo-600/15 dark:from-cyan-500/20 dark:via-blue-500/15 dark:to-indigo-500/20 px-6 py-5 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-inner">
                      <CalendarDays size={22} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                        Expediente de la Cita
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Calendar size={13} className="text-cyan-500" />
                        <span className="font-semibold capitalize">
                          {citaDetalle.fecha}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCitaDetalle(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Contenido Principal */}
              <div className="p-6 space-y-4">
                {/* Tarjeta Destacada del Paciente */}
                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 rounded-2xl overflow-hidden border border-cyan-500/40 dark:border-cyan-400/40 bg-slate-100 dark:bg-slate-900 shadow-md ring-2 ring-cyan-500/20 flex items-center justify-center">
                      <UserAvatar
                        avatar={pacienteDetalleAvatar}
                        name={citaDetalle.paciente}
                        className="h-full w-full object-cover"
                        fallbackClassName="h-full w-full flex items-center justify-center font-bold text-lg"
                        animate="hover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/20 px-2 py-0.5 rounded-md">
                        Paciente Clínico
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate mt-0.5" title={citaDetalle.paciente}>
                        {citaDetalle.paciente}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const textToCopy = `Cita Odontológica\nPaciente: ${citaDetalle.paciente}\nFecha: ${citaDetalle.fecha}\nHorario: ${citaDetalle.horaInicio} - ${citaDetalle.horaFin}\nServicio: ${citaDetalle.servicio}\nOdontólogo: ${citaDetalle.odontologo}\nEstado: ${citaDetalle.estado}`;
                      navigator.clipboard.writeText(textToCopy);
                      setCopiadoCita(true);
                      setTimeout(() => setCopiadoCita(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 shadow-xs active:scale-95"
                    title="Copiar información de la cita"
                  >
                    {copiadoCita ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiadoCita ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>

                {/* Cuadrícula 2x2 de Detalles Clínicos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Tratamiento / Servicio */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                      <Sparkles size={14} className="text-cyan-500" />
                      <span>Tratamiento / Servicio</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {citaDetalle.servicio}
                    </p>
                  </div>

                  {/* Odontólogo Asignado */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                      <Stethoscope size={14} className="text-blue-500" />
                      <span>Odontólogo Asignado</span>
                    </div>
                    <p className="font-bold text-cyan-700 dark:text-cyan-400 text-sm truncate">
                      {citaDetalle.odontologo}
                    </p>
                  </div>

                  {/* Horario y Duración */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                      <Clock3 size={14} className="text-amber-500" />
                      <span>Horario de Atención</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {citaDetalle.horaInicio} - {citaDetalle.horaFin}
                      </span>
                    </div>
                  </div>

                  {/* Estado de la Cita */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>Estado Clínico</span>
                    </div>
                    <div className="pt-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${estiloEstadoCita(etiquetaEstadoAgenda(citaDetalle.estado))} ${citaDetalle.estado === "En Atención" ? "animate-pulse" : ""}`}
                      >
                        {citaDetalle.estado === "Completada" ? (
                          <CheckCircle2 size={13} />
                        ) : citaDetalle.estado === "En Atención" ? (
                          <PlayCircle size={13} />
                        ) : citaDetalle.estado === "No disponible" ? (
                          <Ban size={13} />
                        ) : (
                          <span className={`h-2 w-2 rounded-full ${puntoEstadoCita(citaDetalle.estado)}`} />
                        )}
                        {etiquetaEstadoAgenda(citaDetalle.estado)}
                      </span>
                      {requiresReschedule(citaDetalle.rawGuid) && (
                        <RequiresRescheduleBadge className="ml-1.5 mt-1" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Panel de Gestión del Estado y Cierre de Consulta */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10 border border-teal-500/20 dark:border-teal-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-teal-500" />
                      <span>Control y Cierre de Consulta</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-300 tracking-wider bg-teal-500/15 px-2 py-0.5 rounded-md">
                      Acción Inmediata
                    </span>
                  </div>

                  {citaDetalle.estado === "No disponible" ? (
                    <div className={`flex items-center gap-2.5 p-3.5 rounded-xl border shadow-xs ${estiloEstadoCita("No asistió")}`}>
                      <Ban size={20} className="shrink-0" />
                      <div>
                        <p className="text-xs font-extrabold">El paciente no asistió a esta cita y no puede ser atendida</p>
                        <p className="text-[11px] opacity-80">Si el paciente necesita atención, agenda una nueva cita.</p>
                      </div>
                    </div>
                  ) : citaDetalle.estado === "Completada" ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-xs font-extrabold">Esta cita ya fue finalizada y completada</p>
                          <p className="text-[11px] opacity-80">La sesión odontológica se encuentra registrada como completada.</p>
                        </div>
                      </div>
                      {!isPaciente && (
                        <button
                          type="button"
                          onClick={() => actualizarEstadoCita(citaDetalle, "En Atención")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-900 dark:text-emerald-200 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
                          title="Volver a abrir cita para modificaciones"
                        >
                          Reabrir Atención
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Botón Principal: Finalizar Cita */}
                      <button
                        type="button"
                        onClick={() => actualizarEstadoCita(citaDetalle, "Completada")}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-98 cursor-pointer"
                      >
                        <CheckCircle2 size={16} className="text-slate-950" />
                        <span>Marcar Cita como Terminada / Completada</span>
                      </button>

                      {/* Botones secundarios de acción clínica para Profesionales / Administradores */}
                      {!isPaciente && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {citaDetalle.estado !== "En Atención" && (
                            <button
                              type="button"
                              onClick={() => actualizarEstadoCita(citaDetalle, "En Atención")}
                              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-blue-500/40 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer shadow-xs active:scale-95"
                            >
                              <PlayCircle size={14} />
                              <span>En Atención</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setCitaDetalle(null);
                              navigate("/odontograma", {
                                state: {
                                  appointmentId: citaDetalle.rawGuid,
                                  patientId: citaDetalle.patientId,
                                  patientName: citaDetalle.paciente,
                                },
                              });
                            }}
                            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-cyan-500/40 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-bold text-xs hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition cursor-pointer shadow-xs active:scale-95"
                          >
                            <Smile size={14} />
                            <span>Odontograma</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCitaDetalle(null);
                              navigate("/historia-clinica", {
                                state: {
                                  patientId: citaDetalle.patientId,
                                  patientName: citaDetalle.paciente,
                                },
                              });
                            }}
                            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer shadow-xs active:scale-95"
                          >
                            <FileText size={14} />
                            <span>Historia</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Acciones Inferior */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => {
                    eliminarCita(citaDetalle.id, citaDetalle.rawGuid);
                    setCitaDetalle(null);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:border-rose-400 cursor-pointer shadow-xs active:scale-95"
                >
                  <Trash2 size={15} />
                  <span>Eliminar Cita</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCitaDetalle(null)}
                  className="rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-6 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer shadow-xs active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Desplegable de Todas las Citas del Horario (Cluster Folder Modal) */}
      <AnimatePresence>
        {selectedClusterModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClusterModal(null)}
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 360 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl text-slate-900 dark:text-white z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-blue-500/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 shadow-inner">
                    <FolderOpen size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                        Dossier de Citas ({selectedClusterModal.citas.length})
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-mono">
                        {selectedClusterModal.horaInicio} - {selectedClusterModal.horaFin}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                      {selectedClusterModal.fecha} • Consultas programadas simultáneamente
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClusterModal(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lista de Citas */}
              <div className="p-6 overflow-y-auto space-y-3.5 flex-1 max-h-[55vh]">
                {selectedClusterModal.citas.map((cita, idx) => {
                  return (
                    <div
                      key={cita.id || idx}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:border-teal-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-cyan-500/40 dark:border-cyan-400/50 shadow-sm flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                          <UserAvatar
                            name={cita.paciente}
                            avatar={cita.avatar}
                            className="h-full w-full object-cover"
                            fallbackClassName="h-full w-full flex items-center justify-center font-bold text-xs"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate" title={cita.paciente}>
                              {cita.paciente}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${estiloEstadoCita(etiquetaEstadoAgenda(cita.estado))}`}>
                              {etiquetaEstadoAgenda(cita.estado)}
                            </span>
                            {requiresReschedule(cita.rawGuid) && <RequiresRescheduleBadge />}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap mt-1">
                            <span className="text-cyan-700 dark:text-cyan-400 font-semibold flex items-center gap-1">
                              <Sparkles size={12} />
                              <span>{cita.servicio}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <Stethoscope size={12} className="text-cyan-500" />
                              <span>{cita.odontologo}</span>
                            </span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                              {cita.horaInicio} - {cita.horaFin}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones de la cita */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClusterModal(null);
                            setCitaDetalle(cita);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                          title="Ver Ficha y Expediente"
                        >
                          Ver Detalle
                        </button>

                        {(role === "ODONTOLOGO" || role === "ADMINISTRADOR") && cita.estado !== "No disponible" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClusterModal(null);
                              navigate("/odontograma", {
                                state: {
                                  appointmentId: cita.rawGuid,
                                  patientName: cita.paciente,
                                },
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95"
                            title="Iniciar Consulta y Odontograma"
                          >
                            <Smile size={13} />
                            <span>Atender</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            eliminarCita(cita.id, cita.rawGuid);
                            setSelectedClusterModal((prev) => {
                              if (!prev) return null;
                              const updated = prev.citas.filter((c) => c.id !== cita.id);
                              if (updated.length === 0) return null;
                              return { ...prev, citas: updated };
                            });
                          }}
                          className="p-1.5 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                          title="Eliminar esta cita"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => {
                    const [y, m, d] = selectedClusterModal.fecha.split("-").map(Number);
                    const dateObj = new Date(y, m - 1, d);
                    const hora = selectedClusterModal.horaInicio;
                    setSelectedClusterModal(null);
                    abrirNuevaCita(dateObj, hora);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  <Plus size={15} />
                  <span>Agendar Otra Cita en este Horario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedClusterModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Agendar Cita */}
      {mostrarModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-scaleIn text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Agendar Cita en Agenda</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {fechaSeleccionada} · {nuevaCita.horaInicio}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={19} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fecha de la Cita *
                </label>
                <input
                  type="date"
                  required
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 transition-all"
                />
              </div>

              <SelectOrWriteInput
                label="Paciente"
                required
                value={nuevaCita.paciente}
                onChange={(val, opt) =>
                  setNuevaCita((actual) => ({
                    ...actual,
                    paciente: val,
                    patientId: opt?.data?.patientId || opt?.id || actual.patientId,
                  }))
                }
                options={patientOptions}
                placeholder="Escribe o busca por nombre o documento..."
                type="paciente"
              />

              <ModernServiceSelect
                label="Tratamiento / Servicio"
                value={nuevaCita.servicio}
                onChange={(_id, name) =>
                  setNuevaCita((actual) => ({
                    ...actual,
                    servicio: name,
                  }))
                }
                services={serviciosEntities}
                required
              />

              <ModernDoctorSelect
                label="Odontólogo"
                value={nuevaCita.odontologo}
                onChange={(val) =>
                  setNuevaCita((actual) => ({
                    ...actual,
                    odontologo: val,
                  }))
                }
                doctors={doctorSelectOptions}
                selectedServiceName={nuevaCita.servicio}
                allowNoPreference={false}
                required
                placeholder="Seleccionar odontólogo..."
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hora Inicio *
                  </label>
                  <GlassTimePicker
                    value={nuevaCita.horaInicio}
                    onChange={(val) => {
                      const [h, m] = val.split(":").map(Number);
                      const endMinutesTotal = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m) + 45;
                      const endH = Math.floor(endMinutesTotal / 60) % 24;
                      const endM = endMinutesTotal % 60;
                      const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                      setNuevaCita((actual) => ({
                        ...actual,
                        horaInicio: val,
                        horaFin: endStr,
                      }));
                    }}
                    minHour={7}
                    maxHour={19}
                    minuteStep={15}
                    variant="cyan"
                    quickPresets={["08:00", "09:00", "10:00", "14:00", "15:00", "16:00"]}
                    className="w-full py-2"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hora Finalización *
                  </label>
                  <GlassTimePicker
                    value={nuevaCita.horaFin}
                    onChange={(val) =>
                      setNuevaCita((actual) => ({
                        ...actual,
                        horaFin: val,
                      }))
                    }
                    minHour={8}
                    maxHour={20}
                    minuteStep={15}
                    variant="cyan"
                    quickPresets={["09:00", "10:00", "11:00", "15:00", "16:00", "17:00"]}
                    className="w-full py-2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estado de la Cita
                </label>
                <GlassSelect
                  value={nuevaCita.estado}
                  onChange={(val) =>
                    setNuevaCita((actual) => ({
                      ...actual,
                      estado: val as EstadoCita,
                    }))
                  }
                  options={[
                    { value: "Confirmada", label: "Confirmada" },
                    { value: "Pendiente", label: "Pendiente" },
                    { value: "En Atención", label: "En Atención" },
                  ]}
                  className="w-full py-2.5 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarCita}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {isSubmitting ? "Guardando..." : "Guardar Cita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AgendaView;
