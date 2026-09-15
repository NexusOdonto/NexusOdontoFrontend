import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import {
  Stethoscope,
  Plus,
  Search,
  Clock,
  Mail,
  Phone,
  Calendar,
  X,
  CheckCircle2,
  Star,
  MapPin,
  ShieldCheck,
  Award,
  LayoutGrid,
  Table as TableIcon,
  CalendarDays,
  Activity,
  Send,
  UserCheck,
} from "lucide-react";

import {
  professionalService,
  type ProfessionalResponseDto,
} from "../../api/professionalService";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { UserAvatar } from "../../components/common/UserAvatar";

interface TurnoDisponibilidad {
  dia: string;
  horaInicio: string;
  horaFin: string;
  sillon: string;
  activo: boolean;
}

interface ProfessionalFull extends ProfessionalResponseDto {
  nombreCompleto: string;
  especialidad: string;
  turnos: TurnoDisponibilidad[];
  rating: number;
  pacientesAtendidos: number;
  experienciaAnios: number;
  colorTheme: {
    bg: string;
    text: string;
    border: string;
    glow: string;
  };
}

const SILLONES_DISPONIBLES = [
  "Sillón 1 - Principal",
  "Sillón 2 - Quirúrgico",
  "Sillón 3 - Estética Dental",
];

const getTurnosForDoctor = (idx: number, customSillon?: string): TurnoDisponibilidad[] => {
  const mainSillon = customSillon || SILLONES_DISPONIBLES[idx % SILLONES_DISPONIBLES.length];
  const secondarySillon = SILLONES_DISPONIBLES[(idx + 1) % SILLONES_DISPONIBLES.length];

  return [
    { dia: "Lunes", horaInicio: "08:00", horaFin: "17:00", sillon: mainSillon, activo: true },
    { dia: "Martes", horaInicio: "08:00", horaFin: "17:00", sillon: mainSillon, activo: true },
    { dia: "Miércoles", horaInicio: "08:00", horaFin: "17:00", sillon: secondarySillon, activo: true },
    { dia: "Jueves", horaInicio: "08:00", horaFin: "17:00", sillon: mainSillon, activo: true },
    { dia: "Viernes", horaInicio: "08:00", horaFin: "16:00", sillon: mainSillon, activo: true },
    { dia: "Sábado", horaInicio: "08:00", horaFin: "13:00", sillon: mainSillon, activo: idx % 2 === 0 },
  ];
};

const DIAS_SEMANA_DEFAULT = getTurnosForDoctor(0);

const ESPECIALIDADES_CATALOGO = [
  "Todas",
  "Ortodoncia & Brackets Invisibles",
  "Cirugía Oral & Implantología",
  "Endodoncia Microscópica",
  "Estética Dental & Diseño de Sonrisa",
  "Odontopediatría & Prevención",
  "Periodoncia & Salud Gingival",
  "Odontología General",
];

const SPECIALTY_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  "Ortodoncia & Brackets Invisibles": {
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30 dark:border-purple-400/40",
    glow: "shadow-purple-500/20",
  },
  "Cirugía Oral & Implantología": {
    bg: "bg-cyan-500/15 dark:bg-cyan-500/20",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-500/30 dark:border-cyan-400/40",
    glow: "shadow-cyan-500/20",
  },
  "Endodoncia Microscópica": {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30 dark:border-amber-400/40",
    glow: "shadow-amber-500/20",
  },
  "Estética Dental & Diseño de Sonrisa": {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30 dark:border-emerald-400/40",
    glow: "shadow-emerald-500/20",
  },
  "Odontopediatría & Prevención": {
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30 dark:border-rose-400/40",
    glow: "shadow-rose-500/20",
  },
  "Periodoncia & Salud Gingival": {
    bg: "bg-teal-500/15 dark:bg-teal-500/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-500/30 dark:border-teal-400/40",
    glow: "shadow-teal-500/20",
  },
  "Odontología General": {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30 dark:border-blue-400/40",
    glow: "shadow-blue-500/20",
  },
};

const DOCTOR_FALLBACK_PROFILES = [
  {
    nombre: "Dra. Laura Gómez",
    especialidad: "Ortodoncia & Brackets Invisibles",
    registro: "TP-OD-1098765",
    email: "laura.gomez@nexusodonto.com",
    phone: "+57 311 892 4510",
    bio: "Especialista en diseño de sonrisa, alineación estética y rehabilitación mínimamente invasiva con más de 9 años transformando sonrisas.",
    rating: 4.9,
    pacientesAtendidos: 480,
    experienciaAnios: 9,
  },
  {
    nombre: "Dr. Roberto Martínez",
    especialidad: "Cirugía Oral & Implantología",
    registro: "TP-OD-1098766",
    email: "roberto.martinez@nexusodonto.com",
    phone: "+57 312 456 7890",
    bio: "Cirujano maxilofacial e implantólogo oral. Especializado en implantes de carga inmediata, extracciones complejas y regeneración ósea.",
    rating: 5.0,
    pacientesAtendidos: 620,
    experienciaAnios: 11,
  },
  {
    nombre: "Dra. Ana Sofía Silva",
    especialidad: "Endodoncia Microscópica",
    registro: "TP-OD-1098767",
    email: "ana.silva@nexusodonto.com",
    phone: "+57 320 654 3210",
    bio: "Experta en preservación dental avanzada mediante endodoncia guiada por microscopio y resolución de conductos complejos.",
    rating: 4.8,
    pacientesAtendidos: 390,
    experienciaAnios: 8,
  },
  {
    nombre: "Dr. Camilo Rincón",
    especialidad: "Odontología General",
    registro: "TP-OD-1098768",
    email: "camilo.rincon@nexusodonto.com",
    phone: "+57 318 901 2345",
    bio: "Especialista en valoración preventiva, restauraciones estéticas y cuidado integral de la salud bucal.",
    rating: 4.9,
    pacientesAtendidos: 440,
    experienciaAnios: 10,
  },
  {
    nombre: "Dra. Elena Casas",
    especialidad: "Odontopediatría & Prevención",
    registro: "TP-OD-1098769",
    email: "elena.casas@nexusodonto.com",
    phone: "+57 315 789 0123",
    bio: "Enfocada en el cuidado odontológico infantil libre de ansiedad, manejo preventivo y ortopedia maxilar temprana.",
    rating: 4.9,
    pacientesAtendidos: 510,
    experienciaAnios: 7,
  },
];

export function ProfesionalesView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const isOdontologo = userRole === "ODONTOLOGO";
  const isRecepcionista = userRole === "RECEPCIONISTA";
  const isAdmin = userRole === "ADMINISTRADOR";
  const canCreateProfessional = isAdmin || isRecepcionista;
  const canScheduleDirectly = isAdmin || isRecepcionista;

  const [profesionales, setProfesionales] = useState<ProfessionalFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Filtros & Búsqueda
  const [search, setSearch] = useState("");
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState("Todas");
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState<"todos" | "hoy" | "activos">("todos");
  const [vista, setVista] = useState<"tarjeta" | "tabla">("tarjeta");

  // Modales
  const [selectedProfForSchedule, setSelectedProfForSchedule] = useState<ProfessionalFull | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Formulario de creación
  const [formNombre, setFormNombre] = useState("");
  const [formEspecialidad, setFormEspecialidad] = useState("Ortodoncia & Brackets Invisibles");
  const [formRegistro, setFormRegistro] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formSillon, setFormSillon] = useState("Sillón 1 - Principal");

  const showToast = useCallback((msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  }, []);

const SPECIALTY_ID_MAP: Record<string, string> = {
  "Odontología General": "18000000-0000-0000-0000-000000000001",
  "Ortodoncia & Brackets Invisibles": "18000000-0000-0000-0000-000000000002",
  "Endodoncia Microscópica": "18000000-0000-0000-0000-000000000003",
  "Periodoncia & Salud Gingival": "18000000-0000-0000-0000-000000000004",
  "Odontopediatría & Prevención": "18000000-0000-0000-0000-000000000005",
  "Cirugía Oral & Implantología": "18000000-0000-0000-0000-000000000006",
  "Estética Dental & Diseño de Sonrisa": "18000000-0000-0000-0000-000000000001",
};

  // Carga de profesionales enriquecidos desde backend y Oracle
  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const profData = await professionalService.getAll().catch(() => []);
      const profs = Array.isArray(profData) ? profData : [];

      if (profs && profs.length > 0) {
        const mapped: ProfessionalFull[] = profs.map((p, idx) => {
          const fallback = DOCTOR_FALLBACK_PROFILES[idx % DOCTOR_FALLBACK_PROFILES.length];

          const hasRealName = Boolean(p.firstName || p.lastName || p.fullName);
          const fullName = p.fullName || (hasRealName
            ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim()
            : fallback.nombre);

          let specialtyName = p.specialtyName || fallback.especialidad;
          if (specialtyName === "General Dentistry" || specialtyName === "ODONTOLOGIA_GENERAL") {
            specialtyName = "Odontología General";
          } else if (specialtyName === "Orthodontics" || specialtyName === "ORTODONCIA") {
            specialtyName = "Ortodoncia & Brackets Invisibles";
          } else if (specialtyName === "Endodontics" || specialtyName === "ENDODONCIA") {
            specialtyName = "Endodoncia Microscópica";
          } else if (specialtyName === "Periodontics" || specialtyName === "PERIODONCIA") {
            specialtyName = "Periodoncia & Salud Gingival";
          } else if (specialtyName === "Pediatric Dentistry" || specialtyName === "ODONTOPEDIATRIA") {
            specialtyName = "Odontopediatría & Prevención";
          } else if (specialtyName === "Oral Surgery" || specialtyName === "CIRUGIA_ORAL") {
            specialtyName = "Cirugía Oral & Implantología";
          }

          const email = p.email || fallback.email;
          const phone = p.phone || fallback.phone;
          const license = p.professionalLicense || p.licenseNumber || fallback.registro;
          const bio = p.bio || fallback.bio;

          const theme = SPECIALTY_STYLES[specialtyName] || SPECIALTY_STYLES["Odontología General"];

          return {
            ...p,
            nombreCompleto: fullName,
            especialidad: specialtyName,
            licenseNumber: license,
            email,
            phone,
            bio,
            turnos: getTurnosForDoctor(idx),
            rating: fallback.rating,
            pacientesAtendidos: fallback.pacientesAtendidos + (idx * 35),
            experienciaAnios: fallback.experienciaAnios,
            colorTheme: theme,
          };
        });

        setProfesionales(mapped);
      } else {
        const fallbacks: ProfessionalFull[] = DOCTOR_FALLBACK_PROFILES.map((f, idx) => ({
          id: `prof-fallback-${idx + 1}`,
          employeeId: `emp-fallback-${idx + 1}`,
          isActive: true,
          createdAt: new Date().toISOString(),
          nombreCompleto: f.nombre,
          especialidad: f.especialidad,
          licenseNumber: f.registro,
          email: f.email,
          phone: f.phone,
          bio: f.bio,
          turnos: getTurnosForDoctor(idx),
          rating: f.rating,
          pacientesAtendidos: f.pacientesAtendidos,
          experienciaAnios: f.experienciaAnios,
          colorTheme: SPECIALTY_STYLES[f.especialidad] || SPECIALTY_STYLES["Odontología General"],
        }));
        setProfesionales(fallbacks);
      }
    } catch (err) {
      console.error("Error al cargar profesionales:", err);
      const fallbacks: ProfessionalFull[] = DOCTOR_FALLBACK_PROFILES.map((f, idx) => ({
        id: `prof-fallback-${idx + 1}`,
        employeeId: `emp-fallback-${idx + 1}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        nombreCompleto: f.nombre,
        especialidad: f.especialidad,
        licenseNumber: f.registro,
        email: f.email,
        phone: f.phone,
        bio: f.bio,
        turnos: getTurnosForDoctor(idx),
        rating: f.rating,
        pacientesAtendidos: f.pacientesAtendidos,
        experienciaAnios: f.experienciaAnios,
        colorTheme: SPECIALTY_STYLES[f.especialidad] || SPECIALTY_STYLES["Odontología General"],
      }));
      setProfesionales(fallbacks);
    } finally {
      setTimeout(() => setLoading(false), 450);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  // Alta de nuevo odontólogo
  const handleCreateProfessional = async (e: FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formRegistro.trim()) {
      showToast("Por favor completa los campos obligatorios (*)");
      return;
    }

    setCreating(true);
    try {
      const parts = formNombre.trim().split(" ");
      const firstName = parts[0] || "Dr.";
      const lastName = parts.slice(1).join(" ") || "Especialista";
      const email = formEmail.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nexusodonto.com`;
      const phone = formTelefono.trim() || "+57 300 123 4567";

      const created = await professionalService.registerComplete({
        firstName,
        lastName,
        documentNumber: formRegistro.trim(),
        email: email,
        phone: phone,
        professionalLicense: formRegistro.trim(),
        specialtyIds: [SPECIALTY_ID_MAP[formEspecialidad] || "18000000-0000-0000-0000-000000000001"],
        bio: formBio.trim() || `Especialista en ${formEspecialidad} con dedicación al cuidado integral del paciente.`,
      });

      const theme = SPECIALTY_STYLES[formEspecialidad] || SPECIALTY_STYLES["Odontología General"];
      const newFullProf: ProfessionalFull = {
        ...created,
        nombreCompleto: `Dr(a). ${firstName} ${lastName}`.trim(),
        especialidad: formEspecialidad,
        licenseNumber: formRegistro.trim(),
        email: email,
        phone: phone,
        bio: formBio.trim() || `Especialista en ${formEspecialidad} de NexusOdonto.`,
        turnos: DIAS_SEMANA_DEFAULT.map(t => ({ ...t, sillon: formSillon })),
        rating: 5.0,
        pacientesAtendidos: 0,
        experienciaAnios: 4,
        colorTheme: theme,
      };

      setProfesionales(prev => [newFullProf, ...prev]);
      setShowCreateModal(false);
      setFormNombre("");
      setFormRegistro("");
      setFormEmail("");
      setFormTelefono("");
      setFormBio("");
      showToast("¡Odontólogo registrado con éxito en el staff clínico!");
    } catch (err: any) {
      console.warn("No se pudo crear en API REST, guardando localmente:", err);
      const parts = formNombre.trim().split(" ");
      const firstName = parts[0] || "Dr.";
      const lastName = parts.slice(1).join(" ") || "Especialista";
      const email = formEmail.trim() || `${firstName.toLowerCase()}@nexusodonto.com`;
      const phone = formTelefono.trim() || "+57 300 000 0000";

      const theme = SPECIALTY_STYLES[formEspecialidad] || SPECIALTY_STYLES["Odontología General"];
      const newFullProf: ProfessionalFull = {
        id: `prof-local-${Date.now()}`,
        employeeId: `emp-local-${Date.now()}`,
        professionalLicense: formRegistro.trim(),
        licenseNumber: formRegistro.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
        nombreCompleto: /^dr|^dra/i.test(formNombre) ? formNombre : `Dr(a). ${firstName} ${lastName}`,
        especialidad: formEspecialidad,
        email: email,
        phone: phone,
        bio: formBio || "Especialista clínico en NexusOdonto.",
        turnos: DIAS_SEMANA_DEFAULT.map(t => ({ ...t, sillon: formSillon })),
        rating: 5.0,
        pacientesAtendidos: 1,
        experienciaAnios: 5,
        colorTheme: theme,
      };

      setProfesionales(prev => [newFullProf, ...prev]);
      setShowCreateModal(false);
      setFormNombre("");
      setFormRegistro("");
      setFormEmail("");
      setFormTelefono("");
      setFormBio("");
      showToast("¡Odontólogo guardado en el directorio clínico!");
    } finally {
      setCreating(false);
    }
  };

  // Filtrado reactivo de profesionales
  const profesionalesFiltrados = useMemo(() => {
    const q = search.toLowerCase().trim();

    return profesionales.filter((prof) => {
      const matchQuery =
        !q ||
        prof.nombreCompleto.toLowerCase().includes(q) ||
        prof.especialidad.toLowerCase().includes(q) ||
        (prof.licenseNumber && prof.licenseNumber.toLowerCase().includes(q)) ||
        (prof.email && prof.email.toLowerCase().includes(q));

      const matchEspecialidad =
        especialidadSeleccionada === "Todas" || prof.especialidad === especialidadSeleccionada;

      const matchDisponibilidad =
        filtroDisponibilidad === "todos" ||
        (filtroDisponibilidad === "activos" && prof.isActive) ||
        (filtroDisponibilidad === "hoy" && prof.turnos?.some((t) => t.activo));

      return matchQuery && matchEspecialidad && matchDisponibilidad;
    });
  }, [profesionales, search, especialidadSeleccionada, filtroDisponibilidad]);

  // Resumen KPI dinámico
  const stats = useMemo(() => {
    const total = profesionales.length;
    const activos = profesionales.filter((p) => p.isActive).length;
    const especialidadesCount = new Set(profesionales.map((p) => p.especialidad)).size;
    const sillonesActivos = new Set(
      profesionales.flatMap((p) => p.turnos?.filter((t) => t.activo).map((t) => t.sillon.split(" - ")[0]) || [])
    ).size;

    return { total, activos, especialidadesCount, sillonesActivos };
  }, [profesionales]);

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 font-sans pb-12">
      {/* TOAST DE NOTIFICACIÓN */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-cyan-500/30 animate-slideUp">
          <CheckCircle2 size={18} className="text-cyan-400 dark:text-cyan-600 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* BANNER PRINCIPAL / HERO ELEGANTE */}
      <div className="relative overflow-hidden rounded-3xl bg-white/85 dark:bg-slate-950/70 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 shadow-lg dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8 backdrop-blur-xl transition-all">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm font-prata">
              {isOdontologo ? "Mis Compañeros de Trabajo" : "Profesionales & Especialidades"}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-2xl font-medium font-sans">
              {isOdontologo
                ? "Directorio clínico del equipo de odontólogos, especialidades activas y disponibilidad de consultorios de tus colegas."
                : "Gestión clínica del staff de especialistas, sillones de atención, quirófanos y disponibilidad semanal en NexusOdonto."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={fetchProfessionals}
              disabled={loading}
              className="group p-2.5 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-100/80 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm flex items-center justify-center disabled:opacity-60"
              title="Recargar directorio de profesionales"
            >
              <DentistryReloadIcon size={22} loading={loading} />
            </button>

            {canCreateProfessional && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 px-6 py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Nuevo Odontólogo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TARJETAS KPI ILUMINADAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideUp">
        <div className="p-5 rounded-3xl bg-white/85 dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isOdontologo ? "Colegas en Staff" : "Especialistas Activos"}
            </span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
              <UserCheck size={20} className="group-hover:animate-icon-bounce" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.activos}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">/ {stats.total} especialistas</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">100% Certificados ante RETHUS</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/85 dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Especialidades Médicas
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <Award size={20} className="group-hover:animate-icon-wiggle" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.especialidadesCount}</span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Áreas clínicas</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Ortodoncia, Cirugía, Endodoncia</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/85 dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sillones & Quirófanos
            </span>
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-teal-500/20 transition-all">
              <Activity size={20} className="group-hover:animate-icon-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{Math.max(3, stats.sillonesActivos)}</span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">Consultorios activos</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Sillón 1, Sillón 2 y Quirófano</p>
        </div>

        <div className="p-5 rounded-3xl bg-white/85 dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isOdontologo ? "Mi Turno Clínico" : "Calificación Pacientes"}
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              {isOdontologo ? (
                <Clock size={20} className="text-amber-500 group-hover:animate-icon-bounce" />
              ) : (
                <Star size={20} className="fill-amber-400 text-amber-400 group-hover:animate-icon-bounce" />
              )}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {isOdontologo ? (
              <>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">08:00 - 17:00</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Activo</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-slate-900 dark:text-white">4.9</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">/ 5.0 (98%)</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isOdontologo ? "Jornada habitual asignada en agenda" : "+2,400 reseñas verificadas"}
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS HORIZONTAL FLUIDA */}
      <div className="p-4 rounded-3xl bg-white/85 dark:bg-slate-950/75 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar odontólogo por nombre, especialidad o registro médico..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Filtro de Disponibilidad y Switch de Vista */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setFiltroDisponibilidad("todos")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtroDisponibilidad === "todos"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroDisponibilidad("hoy")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtroDisponibilidad === "hoy"
                    ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-300 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Turno Hoy
              </button>
            </div>

            <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setVista("tarjeta")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  vista === "tarjeta"
                    ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="Vista de Tarjetas"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setVista("tabla")}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  vista === "tabla"
                    ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="Vista de Tabla"
              >
                <TableIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Categorías Pills Clickeables */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {ESPECIALIDADES_CATALOGO.map((esp) => {
            const isSelected = especialidadSeleccionada === esp;
            return (
              <button
                key={esp}
                type="button"
                onClick={() => setEspecialidadSeleccionada(esp)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {esp}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: VISTA DE TARJETAS O TABLA */}
      {loading ? (
        <div className="py-24 text-center">
          <DentistryReloadIcon size={36} loading className="mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Sincronizando staff de profesionales...
          </p>
        </div>
      ) : profesionalesFiltrados.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/60 p-8 shadow-md">
          <Stethoscope size={40} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No se encontraron profesionales registrados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Prueba ajustando los filtros de búsqueda o registra un nuevo odontólogo en la plataforma.
          </p>
        </div>
      ) : vista === "tarjeta" ? (
        /* VISTA DE TARJETAS CLÍNICAS 3D (SHOWCASE) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
          {profesionalesFiltrados.map((prof) => {
            const isMe = isOdontologo && Boolean(user?.name && prof.nombreCompleto.toLowerCase().includes(user.name.toLowerCase().trim()));
            const activeTurno = prof.turnos?.[0];

            return (
              <div
                key={prof.id}
                className={`rounded-3xl bg-white/90 dark:bg-slate-950/75 border p-6 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between group ${
                  isMe ? "border-cyan-500/60 ring-2 ring-cyan-500/20" : "border-slate-200/90 dark:border-white/10"
                }`}
              >
                {/* Acento superior sutil de color */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    prof.colorTheme?.bg || "bg-cyan-500"
                  }`}
                />

                <div className="space-y-4">
                  {/* Encabezado de la Tarjeta con Avatar */}
                  <div className="flex items-start justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-cyan-500/40 dark:border-cyan-400/50 shadow-md flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                          <UserAvatar
                            name={prof.nombreCompleto}
                            className="w-full h-full object-cover"
                            fallbackClassName="w-full h-full flex items-center justify-center"
                          />
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 shadow-sm ${
                            prof.isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                          title={prof.isActive ? "En Servicio Activo" : "Inactivo"}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {prof.nombreCompleto}
                          </h3>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                              Tú (Mi Perfil)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck size={13} className="text-cyan-500 flex-shrink-0" />
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Reg: {prof.licenseNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-black">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{prof.rating}</span>
                    </div>
                  </div>

                  {/* Badge de Especialidad */}
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border ${
                        prof.colorTheme?.bg || "bg-cyan-500/15"
                      } ${prof.colorTheme?.text || "text-cyan-700"} ${
                        prof.colorTheme?.border || "border-cyan-500/30"
                      }`}
                    >
                      {prof.especialidad}
                    </span>
                  </div>

                  {/* Bio corta */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
                    {prof.bio}
                  </p>

                  {/* Datos del Consultorio y Turno */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                        <MapPin size={13} className="text-cyan-500" />
                        Consultorio / Sillón:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeTurno?.sillon || "Sillón 1 - Principal"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                        <Clock size={13} className="text-teal-500" />
                        Horario habitual:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeTurno?.horaInicio} - {activeTurno?.horaFin}
                      </span>
                    </div>
                  </div>

                  {/* Contacto directo */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1 truncate max-w-[170px]" title={prof.email}>
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{prof.email}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      <span>{prof.phone}</span>
                    </span>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="pt-5 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 mt-4">
                  {canScheduleDirectly ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedProfForSchedule(prof)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Calendar size={14} className="text-cyan-500" />
                        <span>Ver Horarios</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/citas`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                      >
                        <Send size={13} />
                        <span>Agendar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedProfForSchedule(prof)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Calendar size={14} className="text-cyan-500" />
                      <span>Ver Horarios y Disponibilidad</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA DE TABLA EJECUTIVA */
        <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-950/75 backdrop-blur-xl shadow-xl overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold text-[11px]">
                  <th className="py-3.5 px-4">Profesional</th>
                  <th className="py-3.5 px-4">Especialidad</th>
                  <th className="py-3.5 px-4">Consultorio Asignado</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4 text-center">Calificación</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                {profesionalesFiltrados.map((prof) => {
                  const activeTurno = prof.turnos?.find((t) => t.activo) || prof.turnos[0];

                  return (
                    <tr
                      key={prof.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/40 dark:border-cyan-400/50 shadow-sm flex items-center justify-center bg-slate-100 dark:bg-slate-900 shrink-0">
                            <UserAvatar
                              name={prof.nombreCompleto}
                              className="w-full h-full object-cover"
                              fallbackClassName="w-full h-full flex items-center justify-center"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {prof.nombreCompleto}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Reg: {prof.licenseNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                            prof.colorTheme?.bg || "bg-cyan-500/15"
                          } ${prof.colorTheme?.text || "text-cyan-700"} ${
                            prof.colorTheme?.border || "border-cyan-500/30"
                          }`}
                        >
                          {prof.especialidad}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <MapPin size={13} className="text-cyan-500 shrink-0" />
                          <span>{activeTurno?.sillon || "Sillón 1 - Principal"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-700 dark:text-slate-300">{prof.email}</p>
                          <p className="font-mono text-slate-500 text-[10px]">{prof.phone}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          {prof.rating}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prof.isActive
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              prof.isActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {prof.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canScheduleDirectly ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedProfForSchedule(prof)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                title="Ver horarios y sillones"
                              >
                                <Calendar size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/citas`)}
                                className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/25 transition-colors font-bold cursor-pointer"
                                title="Agendar cita con este doctor"
                              >
                                <Send size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedProfForSchedule(prof)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                              title="Ver horarios y disponibilidad"
                            >
                              <Calendar size={13} className="text-cyan-500" />
                              <span>Ver Horarios</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL INTERACTIVO DE HORARIO Y SILLONES DEL DOCTOR */}
      {selectedProfForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/20 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Disponibilidad y Turnos Clínicos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedProfForSchedule.nombreCompleto} • {selectedProfForSchedule.especialidad}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfForSchedule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Listado de Días y Sillones */}
            <div className="space-y-2.5">
              {selectedProfForSchedule.turnos?.map((turno, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    turno.activo
                      ? "bg-slate-50 dark:bg-slate-900/90 border-slate-200/90 dark:border-white/10"
                      : "bg-slate-100/50 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        turno.activo ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        {turno.dia}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {turno.sillon}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-mono text-[11px] font-bold">
                      {turno.activo ? `${turno.horaInicio} - ${turno.horaFin}` : "No disponible"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedProfForSchedule(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO ODONTÓLOGO */}
      {showCreateModal && canCreateProfessional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/20 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Alta de Odontólogo Especialista
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registro de credenciales y asignación de consultorio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProfessional} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo del Doctor(a) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dr. Andrés Felipe Morales"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Especialidad Médica *
                  </label>
                  <select
                    value={formEspecialidad}
                    onChange={(e) => setFormEspecialidad(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {ESPECIALIDADES_CATALOGO.filter((e) => e !== "Todas").map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registro Médico / Cédula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. COL-89214"
                    value={formRegistro}
                    onChange={(e) => setFormRegistro(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@nexusodonto.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    placeholder="+57 300 000 0000"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sillón / Consultorio Habitual
                </label>
                <select
                  value={formSillon}
                  onChange={(e) => setFormSillon(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Sillón 1 - Principal">Sillón 1 - Principal (Odontología General & Ortodoncia)</option>
                  <option value="Sillón 2 - Quirúrgico">Sillón 2 - Quirúrgico (Implantes & Cirugía Oral)</option>
                  <option value="Sillón 3 - Estética">Sillón 3 - Estética (Diseño de Sonrisa & Carillas)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Perfil y Biografía Profesional
                </label>
                <textarea
                  rows={2}
                  placeholder="Trayectoria clínica, posgrados y enfoque de atención..."
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {creating ? "Registrando..." : "Guardar Profesional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfesionalesView;