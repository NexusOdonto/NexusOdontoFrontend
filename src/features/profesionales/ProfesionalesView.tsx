import { useState, useEffect, useCallback, useMemo } from "react";
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
  Users,
  UserRoundCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  List,
  Grid2X2,
  MoreVertical,
} from "lucide-react";

import {
  professionalService,
  type ProfessionalResponseDto,
} from "../../api/professionalService";

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
  {
    dia: "Lunes",
    horaInicio: "08:00",
    horaFin: "17:00",
    sillon: "Sillón 1",
    activo: true,
  },
  {
    dia: "Martes",
    horaInicio: "08:00",
    horaFin: "17:00",
    sillon: "Sillón 1",
    activo: true,
  },
  {
    dia: "Miércoles",
    horaInicio: "08:00",
    horaFin: "17:00",
    sillon: "Sillón 2",
    activo: true,
  },
  {
    dia: "Jueves",
    horaInicio: "08:00",
    horaFin: "17:00",
    sillon: "Sillón 1",
    activo: true,
  },
  {
    dia: "Viernes",
    horaInicio: "08:00",
    horaFin: "16:00",
    sillon: "Sillón 1",
    activo: true,
  },
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
      {
        dia: "Lunes",
        horaInicio: "13:00",
        horaFin: "19:00",
        sillon: "Consultorio 1",
        activo: true,
      },
      {
        dia: "Miércoles",
        horaInicio: "08:00",
        horaFin: "14:00",
        sillon: "Consultorio 1",
        activo: true,
      },
      {
        dia: "Viernes",
        horaInicio: "08:00",
        horaFin: "15:00",
        sillon: "Consultorio 1",
        activo: true,
      },
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
      {
        dia: "Martes",
        horaInicio: "08:00",
        horaFin: "16:00",
        sillon: "Consultorio 3",
        activo: true,
      },
      {
        dia: "Jueves",
        horaInicio: "08:00",
        horaFin: "16:00",
        sillon: "Consultorio 3",
        activo: true,
      },
      {
        dia: "Sábado",
        horaInicio: "08:00",
        horaFin: "12:00",
        sillon: "Consultorio 3",
        activo: true,
      },
    ],
  },
];

export function ProfesionalesView() {
  const [profesionales, setProfesionales] =
    useState<ProfessionalFull[]>(fallbackProfessionals);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [especialidadFilter, setEspecialidadFilter] =
    useState("Todas las especialidades");
  const [estadoFilter, setEstadoFilter] =
    useState("Todos los estados");
  const [disponibilidadFilter, setDisponibilidadFilter] =
    useState("Cualquier disponibilidad");
  const [vista, setVista] = useState<"lista" | "tarjeta">("lista");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  const [selectedProfForSchedule, setSelectedProfForSchedule] =
    useState<ProfessionalFull | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [formNombre, setFormNombre] = useState("");
  const [formEspecialidad, setFormEspecialidad] =
    useState("Odontología General");
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
          const fallback =
            fallbackProfessionals[
              idx % fallbackProfessionals.length
            ];

          const fullName =
            p.firstName && p.lastName
              ? `Dr(a). ${p.firstName} ${p.lastName}`
              : fallback.nombreCompleto;

          return {
            ...p,
            nombreCompleto: fullName,
            especialidad:
              p.specialtyName ||
              fallback.especialidad ||
              "Odontología General",
            email: p.email || fallback.email,
            phone: p.phone || fallback.phone,
            turnos: fallback.turnos,
          };
        });

        setProfesionales(mapped);
      } else {
        setProfesionales(fallbackProfessionals);
      }
    } catch {
      setProfesionales(fallbackProfessionals);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const handleCreateProfessional = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!formNombre.trim() || !formRegistro.trim()) {
      return;
    }

    const newProf: ProfessionalFull = {
      id: `prof-${Date.now()}`,
      personId: `person-${Date.now()}`,
      specialtyId: "esp-gen",
      licenseNumber: formRegistro.trim(),
      bio:
        formBio.trim() ||
        "Profesional odontológico en NexusOdonto.",
      isActive: true,
      createdAt: new Date().toISOString(),
      firstName: formNombre.trim().split(" ")[0],
      lastName:
        formNombre.trim().split(" ").slice(1).join(" ") || "",
      nombreCompleto: formNombre.startsWith("Dr")
        ? formNombre.trim()
        : `Dr(a). ${formNombre.trim()}`,
      especialidad: formEspecialidad,
      email:
        formEmail.trim() ||
        "contacto@nexusodonto.com",
      phone:
        formTelefono.trim() ||
        "+57 300 000 0000",
      turnos: defaultTurnos,
    };

    setProfesionales((prev) => {
      const alreadyExists = prev.some(
        (prof) =>
          prof.licenseNumber.toLowerCase() ===
          newProf.licenseNumber.toLowerCase(),
      );

      if (alreadyExists) {
        return prev;
      }

      return [newProf, ...prev];
    });

    setShowCreateModal(false);
    setFormNombre("");
    setFormEspecialidad("Odontología General");
    setFormRegistro("");
    setFormEmail("");
    setFormTelefono("");
    setFormBio("");

    setSuccessToast("¡Odontólogo registrado exitosamente!");

    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  const especialidades = useMemo(() => {
    return [
      "Todas las especialidades",
      ...Array.from(
        new Set(profesionales.map((p) => p.especialidad)),
      ),
    ];
  }, [profesionales]);

  const profesionalesFiltrados = useMemo(() => {
    const query = search.toLowerCase().trim();

    return profesionales.filter((p) => {
      const matchesSearch =
        !query ||
        p.nombreCompleto.toLowerCase().includes(query) ||
        p.especialidad.toLowerCase().includes(query) ||
        p.licenseNumber.toLowerCase().includes(query) ||
        (p.email || "").toLowerCase().includes(query);

      const matchesSpecialty =
        especialidadFilter === "Todas las especialidades" ||
        p.especialidad === especialidadFilter;

      const matchesStatus =
        estadoFilter === "Todos los estados" ||
        (estadoFilter === "Activos" && p.isActive) ||
        (estadoFilter === "Inactivos" && !p.isActive);

      const activeDays =
        p.turnos?.filter((t) => t.activo).length || 0;

      const matchesAvailability =
        disponibilidadFilter === "Cualquier disponibilidad" ||
        (disponibilidadFilter === "Disponible hoy" &&
          activeDays > 0);

      return (
        matchesSearch &&
        matchesSpecialty &&
        matchesStatus &&
        matchesAvailability
      );
    });
  }, [
    profesionales,
    search,
    especialidadFilter,
    estadoFilter,
    disponibilidadFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    especialidadFilter,
    estadoFilter,
    disponibilidadFilter,
    itemsPerPage,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(profesionalesFiltrados.length / itemsPerPage),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentProfessionals = profesionalesFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const goToPage = (page: number) => {
    setCurrentPage(
      Math.max(1, Math.min(page, totalPages)),
    );
  };

  const clearFilters = () => {
    setSearch("");
    setEspecialidadFilter("Todas las especialidades");
    setEstadoFilter("Todos los estados");
    setDisponibilidadFilter("Cualquier disponibilidad");
  };

  const getInitials = (nombre: string) => {
    return nombre
      .replace("Dra.", "")
      .replace("Dr.", "")
      .replace("Dr(a).", "")
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const getSpecialtyShortName = (specialty: string) => {
    if (specialty.toLowerCase().includes("ortodoncia")) {
      return "Ortodoncia";
    }

    if (specialty.toLowerCase().includes("cirugía")) {
      return "Implantología";
    }

    if (specialty.toLowerCase().includes("endodoncia")) {
      return "Endodoncia";
    }

    return specialty;
  };

  const getExperience = (professional: ProfessionalFull) => {
    const created = new Date(
      professional.createdAt,
    ).getFullYear();

    const current = new Date().getFullYear();

    const years = Math.max(1, current - created);

    return `Más de ${years + 5} años de experiencia`;
  };

  const getNextAvailability = (
    professional: ProfessionalFull,
  ) => {
    const activeTurn = professional.turnos?.find(
      (turno) => turno.activo,
    );

    return {
      date:
        professional.firstName === "Patricia"
          ? "Mañana, 9:00 AM"
          : professional.firstName === "Juan"
            ? "Hoy, 3:30 PM"
            : "Hoy, 2:00 PM",
      room: activeTurn?.sillon || "Consultorio 1",
    };
  };

  const activeProfessionals = profesionales.filter(
    (p) => p.isActive,
  ).length;

  const activeSpecialties = new Set(
    profesionales.map((p) => p.especialidad),
  ).size;

  const generalActiveDays = defaultTurnos.filter(
    (turno) => turno.activo,
  ).length;

  return (
    <div className="relative h-[calc(100vh-70px)] w-full overflow-hidden px-3 py-3 text-slate-100 lg:px-5 lg:py-5">
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-slate-950 px-5 py-3 shadow-2xl">
          <CheckCircle2
            size={18}
            className="text-cyan-400"
          />

          <span className="text-sm font-semibold">
            {successToast}
          </span>
        </div>
      )}

      <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10">
              <Users
                size={27}
                className="text-cyan-400"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
                Profesionales y Disponibilidad
              </h1>

              <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                Gestiona tu equipo de odontólogos,
                especialidades médicas y horarios de
                atención.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-400 active:scale-95"
          >
            <Plus size={17} />

            <span className="hidden sm:inline">
              Nuevo profesional
            </span>
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            icon={<UserRoundCheck size={23} />}
            title="Profesionales activos"
            value={activeProfessionals}
            description="En servicio actualmente"
          />

          <StatCard
            icon={<Calendar size={23} />}
            title="Disponibles hoy"
            value={
              profesionales.filter((p) =>
                p.turnos?.some((t) => t.activo),
              ).length
            }
            description="Con disponibilidad"
          />

          <StatCard
            icon={<Calendar size={23} />}
            title="Citas asignadas hoy"
            value={11}
            description="Total programadas"
          />

          <StatCard
            icon={<Star size={23} />}
            title="Especialidades"
            value={activeSpecialties}
            description="Áreas de especialidad"
          />

          <StatCard
            icon={<Stethoscope size={23} />}
            title="Total profesionales"
            value={profesionales.length}
            description="En el sistema"
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[245px_minmax(0,1fr)] gap-3">
          <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-3 shadow-xl backdrop-blur-xl">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Buscar profesional"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <div className="my-3 border-t border-slate-800" />

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold">
                  Filtros
                </span>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-3">
                <FilterSelect
                  label="Especialidad"
                  value={especialidadFilter}
                  onChange={setEspecialidadFilter}
                  options={especialidades}
                />

                <FilterSelect
                  label="Estado"
                  value={estadoFilter}
                  onChange={setEstadoFilter}
                  options={[
                    "Todos los estados",
                    "Activos",
                    "Inactivos",
                  ]}
                />

                <FilterSelect
                  label="Disponibilidad"
                  value={disponibilidadFilter}
                  onChange={setDisponibilidadFilter}
                  options={[
                    "Cualquier disponibilidad",
                    "Disponible hoy",
                  ]}
                />
              </div>

              <div className="mt-4">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Vista
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVista("lista")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      vista === "lista"
                        ? "border border-cyan-400/20 bg-cyan-500/15 text-cyan-300"
                        : "border border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <List size={15} />
                    Lista
                  </button>

                  <button
                    type="button"
                    onClick={() => setVista("tarjeta")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      vista === "tarjeta"
                        ? "border border-cyan-400/20 bg-cyan-500/15 text-cyan-300"
                        : "border border-slate-700 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Grid2X2 size={15} />
                    Tarjeta
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/70 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-800 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
                  <Clock
                    size={19}
                    className="text-cyan-400"
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold">
                    Horario general
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Horarios de atención
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-4">
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Jornada
                    </p>

                    <p className="mt-1 text-sm font-bold text-white">
                      8:00 AM - 6:00 PM
                    </p>
                  </div>

                  <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/[0.04] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Disponibilidad
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />

                      <p className="text-xs font-semibold text-cyan-300">
                        {generalActiveDays} días activos esta semana
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSuccessToast(
                      "Visualización de horarios próximamente disponible",
                    )
                  }
                  className="mt-4 w-full rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-3 py-3 text-center text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/10 hover:text-cyan-300"
                >
                  Ver horarios detallados →
                </button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
            {vista === "lista" ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="grid shrink-0 grid-cols-[1.15fr_1fr_0.7fr_0.8fr_40px] gap-4 border-b border-slate-800 px-4 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  <span>Profesional</span>
                  <span>Especialidad</span>
                  <span>Estado</span>
                  <span>Próxima disponibilidad</span>
                  <span>Acciones</span>
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <RefreshCw
                        size={26}
                        className="animate-spin text-cyan-400"
                      />
                    </div>
                  ) : currentProfessionals.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <Users
                        size={35}
                        className="text-slate-600"
                      />

                      <p className="text-sm text-slate-400">
                        No se encontraron profesionales
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col">
                      {currentProfessionals.map((prof) => {
                        const availability =
                          getNextAvailability(prof);

                        return (
                          <div
                            key={prof.id}
                            className="grid min-h-0 flex-1 grid-cols-[1.15fr_1fr_0.7fr_0.8fr_40px] items-center gap-4 border-b border-slate-800 px-4 py-3 last:border-b-0 transition hover:bg-white/[0.025]"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-400/10 bg-cyan-500/10 text-sm font-bold text-cyan-200">
                                {getInitials(
                                  prof.nombreCompleto,
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="truncate text-sm font-bold text-white">
                                    {prof.nombreCompleto}
                                  </h3>

                                  <CheckCircle2
                                    size={13}
                                    className="shrink-0 text-cyan-400"
                                  />
                                </div>

                                <p className="mt-1 truncate text-xs font-semibold text-cyan-400">
                                  {prof.especialidad}
                                </p>

                                <p className="mt-2 text-[10px] text-slate-500">
                                  REG: {prof.licenseNumber}
                                </p>

                                {prof.email && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                    <Mail size={10} />

                                    <span className="truncate">
                                      {prof.email}
                                    </span>
                                  </div>
                                )}

                                {prof.phone && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                    <Phone size={10} />

                                    <span>{prof.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/5 px-3 py-1.5 text-xs font-medium text-cyan-200">
                                {getSpecialtyShortName(
                                  prof.especialidad,
                                )}
                              </span>

                              <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-400">
                                {prof.bio}
                              </p>

                              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
                                <Calendar size={12} />

                                <span>
                                  {getExperience(prof)}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                  prof.isActive
                                    ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                                    : "border-slate-600 bg-slate-800 text-slate-400"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    prof.isActive
                                      ? "bg-cyan-400"
                                      : "bg-slate-500"
                                  }`}
                                />

                                {prof.isActive
                                  ? "Activo"
                                  : "Inactivo"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProfForSchedule(prof)
                              }
                              className="min-w-0 text-left"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                <Calendar
                                  size={15}
                                  className="text-slate-400"
                                />

                                <span>
                                  {availability.date}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                                <MapPin size={14} />

                                <span>
                                  {availability.room}
                                </span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProfForSchedule(prof)
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-cyan-500/10 hover:text-cyan-300"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
                  <p className="hidden text-xs text-slate-500 sm:block">
                    Mostrando{" "}
                    {profesionalesFiltrados.length === 0
                      ? 0
                      : (currentPage - 1) *
                          itemsPerPage +
                        1}{" "}
                    a{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      profesionalesFiltrados.length,
                    )}{" "}
                    de {profesionalesFiltrados.length} profesionales
                  </p>

                  <div className="flex items-center gap-1">
                    <PaginationButton
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft size={15} />
                    </PaginationButton>

                    <PaginationButton
                      onClick={() =>
                        goToPage(currentPage - 1)
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={15} />
                    </PaginationButton>

                    {Array.from(
                      {
                        length: Math.min(totalPages, 5),
                      },
                      (_, index) => {
                        const page = index + 1;

                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => goToPage(page)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                              currentPage === page
                                ? "bg-cyan-500 text-slate-950"
                                : "border border-slate-800 text-slate-400 hover:border-cyan-400/30 hover:text-cyan-300"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}

                    <PaginationButton
                      onClick={() =>
                        goToPage(currentPage + 1)
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={15} />
                    </PaginationButton>

                    <PaginationButton
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight size={15} />
                    </PaginationButton>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-slate-500 lg:block">
                      Mostrar
                    </span>

                    <select
                      value={itemsPerPage}
                      onChange={(e) =>
                        setItemsPerPage(
                          Number(e.target.value),
                        )
                      }
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none focus:border-cyan-500"
                    >
                      <option value={3}>
                        3 por página
                      </option>

                      <option value={5}>
                        5 por página
                      </option>

                      <option value={10}>
                        10 por página
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {currentProfessionals.map((prof) => (
                    <div
                      key={prof.id}
                      className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10 font-bold text-cyan-300">
                            {getInitials(
                              prof.nombreCompleto,
                            )}
                          </div>

                          <div>
                            <h3 className="font-bold">
                              {prof.nombreCompleto}
                            </h3>

                            <p className="mt-1 text-xs text-cyan-400">
                              {prof.especialidad}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            prof.isActive
                              ? "bg-cyan-500/10 text-cyan-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {prof.isActive
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </div>

                      <p className="mt-5 text-sm leading-6 text-slate-400">
                        {prof.bio}
                      </p>

                      <div className="mt-5 border-t border-slate-800 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProfForSchedule(prof)
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/5 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/10"
                        >
                          <Calendar size={15} />
                          Ver agenda
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedProfForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Calendar
                    size={21}
                    className="text-cyan-400"
                  />
                </div>

                <div>
                  <h3 className="font-bold">
                    Agenda profesional
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {selectedProfForSchedule.nombreCompleto}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProfForSchedule(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[55vh] space-y-3 overflow-y-auto p-6">
              {selectedProfForSchedule.turnos?.map(
                (turno) => (
                  <div
                    key={turno.dia}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      turno.activo
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-800 bg-slate-950 opacity-50"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">
                        {turno.dia}
                      </p>

                      <p className="mt-1 text-xs text-cyan-400">
                        {turno.horaInicio} -{" "}
                        {turno.horaFin}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {turno.sillon}
                      </p>

                      <span
                        className={`mt-2 inline-flex items-center gap-1 text-xs ${
                          turno.activo
                            ? "text-cyan-400"
                            : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            turno.activo
                              ? "bg-cyan-400"
                              : "bg-slate-600"
                          }`}
                        />

                        {turno.activo
                          ? "Disponible"
                          : "No disponible"}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="border-t border-slate-800 p-5">
              <button
                type="button"
                onClick={() =>
                  setSelectedProfForSchedule(null)
                }
                className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <div>
                <h3 className="text-lg font-bold">
                  Nuevo profesional
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Registra un nuevo integrante del equipo.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateModal(false)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleCreateProfessional}
              className="space-y-4 p-6"
            >
              <FormInput
                label="Nombre completo"
                value={formNombre}
                onChange={setFormNombre}
                placeholder="Ej. Dra. Laura Gómez"
                required
              />

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Especialidad
                </label>

                <select
                  value={formEspecialidad}
                  onChange={(e) =>
                    setFormEspecialidad(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                >
                  <option>
                    Odontología General
                  </option>

                  <option>
                    Ortodoncia y Estética Dental
                  </option>

                  <option>
                    Cirugía Oral e Implantología
                  </option>

                  <option>
                    Endodoncia Microscópica
                  </option>

                  <option>Periodoncia</option>

                  <option>Odontopediatría</option>
                </select>
              </div>

              <FormInput
                label="Registro profesional"
                value={formRegistro}
                onChange={setFormRegistro}
                placeholder="REG-ODO-00000"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Correo"
                  value={formEmail}
                  onChange={setFormEmail}
                  placeholder="doctor@email.com"
                />

                <FormInput
                  label="Teléfono"
                  value={formTelefono}
                  onChange={setFormTelefono}
                  placeholder="+57 300 000 0000"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-300">
                  Biografía
                </label>

                <textarea
                  value={formBio}
                  onChange={(e) =>
                    setFormBio(e.target.value)
                  }
                  rows={3}
                  placeholder="Experiencia y descripción profesional..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Registrar profesional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}

function StatCard({
  icon,
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-4 shadow-lg backdrop-blur-xl">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-2xl font-bold text-white">
          {value}
        </p>

        <p className="truncate text-[10px] text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <div>
      <label className="mb-2 block text-[11px] text-slate-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-300 outline-none focus:border-cyan-500"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

interface PaginationButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

function PaginationButton({
  children,
  disabled,
  onClick,
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}

function FormInput({
  label,
  value,
  placeholder,
  required,
  onChange,
}: FormInputProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-300">
        {label}
        {required && " *"}
      </label>

      <input
        type="text"
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
      />
    </div>
  );
}

export default ProfesionalesView;