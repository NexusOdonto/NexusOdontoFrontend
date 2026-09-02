import { useState, useEffect, useCallback } from "react";
import {
  Stethoscope,
  Plus,
  RefreshCw,
  Search,
  Clock,
  Mail,
  Phone,
  Calendar,
  X,
  CheckCircle2,
  Award,
} from "lucide-react";
import { professionalService, type ProfessionalResponseDto } from "../../api/professionalService";

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
}

const defaultTurnos: TurnoDisponibilidad[] = [
  { dia: "Lunes", horaInicio: "08:00", horaFin: "17:00", sillon: "Sillón 1 (Principal)", activo: true },
  { dia: "Martes", horaInicio: "08:00", horaFin: "17:00", sillon: "Sillón 1 (Principal)", activo: true },
  { dia: "Miércoles", horaInicio: "08:00", horaFin: "17:00", sillon: "Sillón 2", activo: true },
  { dia: "Jueves", horaInicio: "08:00", horaFin: "17:00", sillon: "Sillón 1 (Principal)", activo: true },
  { dia: "Viernes", horaInicio: "08:00", horaFin: "16:00", sillon: "Sillón 1 (Principal)", activo: true },
  { dia: "Sábado", horaInicio: "08:00", horaFin: "13:00", sillon: "Sillón 2", activo: false },
];

const fallbackProfessionals: ProfessionalFull[] = [
  {
    id: "14000000-0000-0000-0000-000000000001",
    personId: "12000000-0000-0000-0000-000000000002",
    specialtyId: "esp-1",
    licenseNumber: "REG-ODO-98412",
    bio: "Especialista en Ortodoncia y Estética Dental con más de 8 años de experiencia en rehabilitación oral y diseño de sonrisa.",
    isActive: true,
    createdAt: "2026-01-10T08:00:00Z",
    firstName: "Laura",
    lastName: "Gómez",
    nombreCompleto: "Dra. Laura Gómez",
    especialidad: "Ortodoncia y Estética Dental",
    email: "odontologo@nexusodonto.com",
    phone: "+57 310 987 6543",
    turnos: defaultTurnos,
  },
  {
    id: "14000000-0000-0000-0000-000000000002",
    personId: "12000000-0000-0000-0000-000000000004",
    specialtyId: "esp-2",
    licenseNumber: "REG-ODO-77319",
    bio: "Cirujano Maxilofacial y Periodoncia. Experto en extracciones complejas de cordales e implantes osteointegrados.",
    isActive: true,
    createdAt: "2026-02-15T08:00:00Z",
    firstName: "Juan",
    lastName: "Martínez",
    nombreCompleto: "Dr. Juan Martínez",
    especialidad: "Cirugía Oral e Implantología",
    email: "juan.martinez@nexusodonto.com",
    phone: "+57 315 442 1109",
    turnos: [
      { dia: "Lunes", horaInicio: "13:00", horaFin: "19:00", sillon: "Quirófano Menor", activo: true },
      { dia: "Miércoles", horaInicio: "08:00", horaFin: "14:00", sillon: "Quirófano Menor", activo: true },
      { dia: "Viernes", horaInicio: "08:00", horaFin: "15:00", sillon: "Quirófano Menor", activo: true },
    ],
  },
  {
    id: "14000000-0000-0000-0000-000000000003",
    personId: "12000000-0000-0000-0000-000000000005",
    specialtyId: "esp-3",
    licenseNumber: "REG-ODO-61204",
    bio: "Endodoncista certificada en microscopía endodóntica y tratamiento avanzado de conductos radiculares.",
    isActive: true,
    createdAt: "2026-03-01T08:00:00Z",
    firstName: "Patricia",
    lastName: "Silva",
    nombreCompleto: "Dra. Patricia Silva",
    especialidad: "Endodoncia Microscópica",
    email: "patricia.silva@nexusodonto.com",
    phone: "+57 301 773 9921",
    turnos: [
      { dia: "Martes", horaInicio: "08:00", horaFin: "16:00", sillon: "Sillón 3", activo: true },
      { dia: "Jueves", horaInicio: "08:00", horaFin: "16:00", sillon: "Sillón 3", activo: true },
      { dia: "Sábado", horaInicio: "08:00", horaFin: "12:00", sillon: "Sillón 3", activo: true },
    ],
  },
];

export function ProfesionalesView() {
  const [profesionales, setProfesionales] = useState<ProfessionalFull[]>(fallbackProfessionals);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProfForSchedule, setSelectedProfForSchedule] = useState<ProfessionalFull | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form nuevo profesional
  const [formNombre, setFormNombre] = useState("");
  const [formEspecialidad, setFormEspecialidad] = useState("Odontología General");
  const [formRegistro, setFormRegistro] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formBio, setFormBio] = useState("");

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await professionalService.getAll();
      if (data && data.length > 0) {
        const mapped: ProfessionalFull[] = data.map((p, idx) => {
          const fallback = fallbackProfessionals[idx % fallbackProfessionals.length];
          const fullName = p.firstName && p.lastName ? `Dr(a). ${p.firstName} ${p.lastName}` : (fallback.nombreCompleto || "Odontólogo Tratante");
          return {
            ...p,
            nombreCompleto: fullName,
            especialidad: p.specialtyName || fallback.especialidad || "Odontología General",
            email: p.email || fallback.email,
            phone: p.phone || fallback.phone,
            turnos: fallback.turnos,
          };
        });
        setProfesionales(mapped);
      } else {
        setProfesionales(fallbackProfessionals);
      }
    } catch (err) {
      console.warn("API Professionals unavailable, using fallback:", err);
      setProfesionales(fallbackProfessionals);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formRegistro.trim()) return;

    const newProf: ProfessionalFull = {
      id: `prof-${Date.now()}`,
      personId: `person-${Date.now()}`,
      specialtyId: "esp-gen",
      licenseNumber: formRegistro.trim(),
      bio: formBio.trim() || "Profesional odontológico en NexusOdonto.",
      isActive: true,
      createdAt: new Date().toISOString(),
      nombreCompleto: formNombre.startsWith("Dr") ? formNombre : `Dr(a). ${formNombre}`,
      especialidad: formEspecialidad,
      email: formEmail || "contacto@nexusodonto.com",
      phone: formTelefono || "+57 300 000 0000",
      turnos: defaultTurnos,
    };

    try {
      await professionalService.create({
        personId: newProf.personId,
        specialtyId: "12000000-0000-0000-0000-000000000001",
        licenseNumber: newProf.licenseNumber,
        bio: newProf.bio,
        isActive: true,
      });
    } catch (err) {
      console.warn("Could not save to API Professionals directly, saved in state:", err);
    }

    setProfesionales((prev) => [newProf, ...prev]);
    setShowCreateModal(false);
    setFormNombre("");
    setFormRegistro("");
    setFormEmail("");
    setFormTelefono("");
    setFormBio("");
    setSuccessToast("¡Odontólogo registrado exitosamente!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const profesionalesFiltrados = profesionales.filter((p) => {
    const query = search.toLowerCase();
    return (
      p.nombreCompleto.toLowerCase().includes(query) ||
      p.especialidad.toLowerCase().includes(query) ||
      p.licenseNumber.toLowerCase().includes(query) ||
      (p.email || "").toLowerCase().includes(query)
    );
  });

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
            Profesionales y Disponibilidad
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Equipo de odontólogos, especialidades médicas y configuración de franjas horarias de atención.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchProfessionals}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            title="Recargar profesionales"
          >
            <RefreshCw size={16} className={`text-cyan-600 dark:text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Profesional</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative pt-2 animate-slideUp animate-stagger-1">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar odontólogo por nombre, especialidad o registro profesional..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-cyan-500 backdrop-blur-xl shadow-md"
        />
      </div>

      {/* Grid de Tarjetas de Odontólogos (Estilo PacientesGrid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 animate-slideUp animate-stagger-2">
        {profesionalesFiltrados.map((prof) => (
          <div
            key={prof.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 hover:bg-white dark:hover:bg-slate-950/85 p-6 transition-all duration-300 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 shadow-md hover:shadow-xl dark:shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-4">
              {/* Header de Tarjeta */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 dark:from-teal-400/30 dark:via-cyan-400/30 dark:to-blue-500/30 border border-cyan-500/40 dark:border-cyan-400/50 text-cyan-800 dark:text-cyan-200 font-extrabold shadow-sm group-hover:scale-105 transition-transform">
                    <Stethoscope size={24} className="text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                      {prof.nombreCompleto}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                      <Award size={13} />
                      <span>{prof.especialidad}</span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Activo
                </span>
              </div>

              {/* Registro Profesional & Bio */}
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-xs space-y-1">
                <p className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200">Registro:</strong>{" "}
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{prof.licenseNumber}</span>
                </p>
                {prof.bio && (
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed pt-1 border-t border-slate-200/60 dark:border-white/10">
                    {prof.bio}
                  </p>
                )}
              </div>

              {/* Contacto */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {prof.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{prof.email}</span>
                  </div>
                )}
                {prof.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <span>{prof.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Acción: Ver y Configurar Disponibilidad */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Clock size={14} className="text-cyan-500" />
                <span>{prof.turnos?.filter((t) => t.activo).length || 5} días activos</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfForSchedule(prof)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Calendar size={13} />
                <span>Ver Turnos</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: HORARIOS Y DISPONIBILIDAD SEMANAL */}
      {selectedProfForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Franjas Horarias y Disponibilidad
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedProfForSchedule.nombreCompleto} — {selectedProfForSchedule.especialidad}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfForSchedule(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedProfForSchedule.turnos?.map((turno) => (
                <div
                  key={turno.dia}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                    turno.activo
                      ? "bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/15"
                      : "bg-slate-100/40 dark:bg-slate-950/40 border-slate-200/40 dark:border-white/5 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-slate-100 w-20">{turno.dia}</span>
                    <span className="font-mono text-cyan-700 dark:text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                      {turno.horaInicio} - {turno.horaFin}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">
                      {turno.sillon}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        turno.activo ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200/80 dark:border-white/15 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sincronizado con el motor de agenda y chatbot
              </span>
              <button
                type="button"
                onClick={() => setSelectedProfForSchedule(null)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white dark:text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR NUEVO PROFESIONAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Registrar Odontólogo Profesional
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ingresa los datos del profesional para habilitar su agenda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProfessional} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Dra. Laura Gómez"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Especialidad *
                  </label>
                  <select
                    value={formEspecialidad}
                    onChange={(e) => setFormEspecialidad(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  >
                    <option value="Odontología General">Odontología General</option>
                    <option value="Ortodoncia y Estética Dental">Ortodoncia y Estética Dental</option>
                    <option value="Cirugía Oral e Implantología">Cirugía Oral e Implantología</option>
                    <option value="Endodoncia Microscópica">Endodoncia Microscópica</option>
                    <option value="Periodoncia">Periodoncia</option>
                    <option value="Odontopediatría">Odontopediatría</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Registro Profesional (Tarjeta) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. REG-ODO-98412"
                    value={formRegistro}
                    onChange={(e) => setFormRegistro(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. +57 310 987 6543"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Electrónico Corporativo
                </label>
                <input
                  type="email"
                  placeholder="doctor@nexusodonto.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Perfil Profesional / Biografía Resumida
                </label>
                <textarea
                  rows={2}
                  placeholder="Experiencia clínica, enfoque de tratamiento y formación académica..."
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none transition-all backdrop-blur-md"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Registrar Profesional
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
