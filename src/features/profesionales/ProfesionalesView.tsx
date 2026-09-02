import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type FormEvent,
} from "react";
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
  Upload,
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
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");
  const [especialidadFilter, setEspecialidadFilter] =
    useState("Todas las especialidades");
  const [estadoFilter, setEstadoFilter] =
    useState("Todos los estados");
  const [disponibilidadFilter, setDisponibilidadFilter] =
    useState("Cualquier disponibilidad");

  const [vista, setVista] =
    useState<"lista" | "tarjeta">("lista");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  const [selectedProfForSchedule, setSelectedProfForSchedule] =
    useState<ProfessionalFull | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [successToast, setSuccessToast] =
    useState<string | null>(null);

  const [formNombre, setFormNombre] = useState("");
  const [formEspecialidad, setFormEspecialidad] =
    useState("Odontología General");
  const [formRegistro, setFormRegistro] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formBio, setFormBio] = useState("");

  const showToast = useCallback((message: string) => {
    setSuccessToast(message);

    window.setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  }, []);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);

    try {
      const data = await professionalService.getAll();

      if (data && data.length > 0) {
        const mapped: ProfessionalFull[] = data.map((p, index) => {
          const fallback =
            fallbackProfessionals[
              index % fallbackProfessionals.length
            ];

          const firstName = p.firstName?.trim() || "";
          const lastName = p.lastName?.trim() || "";

          const fullName =
            firstName || lastName
              ? `Dr(a). ${firstName} ${lastName}`.trim()
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

        const uniqueProfessionals = mapped.filter(
          (professional, index, array) =>
            array.findIndex(
              (item) =>
                item.id === professional.id,
            ) === index,
        );

        setProfesionales(uniqueProfessionals);
      } else {
        setProfesionales(fallbackProfessionals);
      }
    } catch (error) {
      console.warn(
        "API Professionals unavailable, using fallback:",
        error,
      );

      setProfesionales(fallbackProfessionals);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [
    search,
    especialidadFilter,
    estadoFilter,
    disponibilidadFilter,
    itemsPerPage,
  ]);

  const resetForm = () => {
    setFormNombre("");
    setFormEspecialidad("Odontología General");
    setFormRegistro("");
    setFormEmail("");
    setFormTelefono("");
    setFormBio("");
  };

  const handleCloseCreateModal = () => {
    if (creating) return;

    setShowCreateModal(false);
    resetForm();
  };

  const handleCreateProfessional = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (creating) return;

    const nombre = formNombre.trim();
    const registro = formRegistro.trim();

    if (!nombre || !registro) {
      showToast(
        "Completa los campos obligatorios",
      );
      return;
    }

    const normalizedName = nombre
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    const normalizedLicense = registro
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();

    const alreadyExists = profesionales.some(
      (professional) => {
        const existingName = professional.nombreCompleto
          .replace(/dr\(a\)\.|dra\.|dr\./gi, "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();

        const existingLicense = professional.licenseNumber
          .toLowerCase()
          .replace(/\s+/g, "")
          .trim();

        return (
          existingName === normalizedName ||
          existingLicense === normalizedLicense
        );
      },
    );

    if (alreadyExists) {
      showToast(
        "Este profesional ya se encuentra registrado",
      );
      return;
    }

    setCreating(true);

    const timestamp = Date.now();

    const nameParts = nombre
      .replace(/dr\(a\)\.|dra\.|dr\./gi, "")
      .trim()
      .split(/\s+/);

    const firstName = nameParts[0] || "";
    const lastName =
      nameParts.slice(1).join(" ") || "";

    const newProf: ProfessionalFull = {
      id: `prof-${timestamp}`,
      personId: `person-${timestamp}`,
      specialtyId: "esp-gen",
      licenseNumber: registro,
      bio:
        formBio.trim() ||
        "Profesional odontológico en NexusOdonto.",
      isActive: true,
      createdAt: new Date().toISOString(),
      firstName,
      lastName,
      nombreCompleto:
        /^dr|^dra/i.test(nombre)
          ? nombre
          : `Dr(a). ${nombre}`,
      especialidad: formEspecialidad,
      email:
        formEmail.trim() ||
        "contacto@nexusodonto.com",
      phone:
        formTelefono.trim() ||
        "+57 300 000 0000",
      turnos: defaultTurnos,
    };

    let createdInApi = false;

    try {
      await professionalService.create({
        personId: newProf.personId,
        specialtyId:
          "12000000-0000-0000-0000-000000000001",
        licenseNumber: newProf.licenseNumber,
        bio: newProf.bio,
        isActive: true,
      });

      createdInApi = true;
    } catch (error) {
      console.warn(
        "Could not save professional directly:",
        error,
      );
    }

    setProfesionales((prev) => {
      const exists = prev.some(
        (professional) =>
          professional.id === newProf.id ||
          professional.licenseNumber
            .toLowerCase()
            .replace(/\s+/g, "") ===
            newProf.licenseNumber
              .toLowerCase()
              .replace(/\s+/g, ""),
      );

      if (exists) {
        return prev;
      }

      return [newProf, ...prev];
    });

    setCurrentPage(1);
    setShowCreateModal(false);
    resetForm();

    showToast(
      createdInApi
        ? "¡Odontólogo registrado exitosamente!"
        : "Profesional agregado correctamente",
    );

    setCreating(false);
  };

  const especialidades = useMemo(() => {
    return [
      "Todas las especialidades",
      ...Array.from(
        new Set(
          profesionales
            .map((p) => p.especialidad)
            .filter(Boolean),
        ),
      ),
    ];
  }, [profesionales]);

  const profesionalesFiltrados = useMemo(() => {
    const query = search.toLowerCase().trim();

    return profesionales.filter((p) => {
      const matchesSearch =
        !query ||
        p.nombreCompleto
          .toLowerCase()
          .includes(query) ||
        p.especialidad
          .toLowerCase()
          .includes(query) ||
        p.licenseNumber
          .toLowerCase()
          .includes(query) ||
        (p.email || "")
          .toLowerCase()
          .includes(query) ||
        (p.phone || "")
          .toLowerCase()
          .includes(query);

      const matchesSpecialty =
        especialidadFilter ===
          "Todas las especialidades" ||
        p.especialidad === especialidadFilter;

      const matchesStatus =
        estadoFilter === "Todos los estados" ||
        (estadoFilter === "Activos" &&
          p.isActive) ||
        (estadoFilter === "Inactivos" &&
          !p.isActive);

      const activeDays =
        p.turnos?.filter(
          (turno) => turno.activo,
        ).length || 0;

      const matchesAvailability =
        disponibilidadFilter ===
          "Cualquier disponibilidad" ||
        (disponibilidadFilter ===
          "Disponible hoy" &&
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

  const totalPages = Math.max(
    1,
    Math.ceil(
      profesionalesFiltrados.length /
        itemsPerPage,
    ),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentProfessionals = useMemo(() => {
    const start =
      (currentPage - 1) * itemsPerPage;

    return profesionalesFiltrados.slice(
      start,
      start + itemsPerPage,
    );
  }, [
    profesionalesFiltrados,
    currentPage,
    itemsPerPage,
  ]);

  const goToPage = (page: number) => {
    setCurrentPage(
      Math.max(
        1,
        Math.min(page, totalPages),
      ),
    );
  };

  const clearFilters = () => {
    setSearch("");
    setEspecialidadFilter(
      "Todas las especialidades",
    );
    setEstadoFilter("Todos los estados");
    setDisponibilidadFilter(
      "Cualquier disponibilidad",
    );
  };

  const getInitials = (nombre: string) => {
    return nombre
      .replace(/Dr\(a\)\.|Dra\.|Dr\./gi, "")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word.charAt(0).toUpperCase(),
      )
      .join("");
  };

  const getSpecialtyShortName = (
    specialty: string,
  ) => {
    const normalized =
      specialty.toLowerCase();

    if (
      normalized.includes("ortodoncia")
    ) {
      return "Ortodoncia";
    }

    if (
      normalized.includes("cirugía") ||
      normalized.includes("implantología")
    ) {
      return "Implantología";
    }

    if (
      normalized.includes("endodoncia")
    ) {
      return "Endodoncia";
    }

    if (
      normalized.includes("odontología general")
    ) {
      return "Odontología General";
    }

    return specialty;
  };

  const getExperience = (
    professional: ProfessionalFull,
  ) => {
    const created =
      new Date(
        professional.createdAt,
      ).getFullYear();

    const current =
      new Date().getFullYear();

    const years = Math.max(
      1,
      current - created,
    );

    return `Más de ${
      years + 5
    } años de experiencia`;
  };

  const getNextAvailability = (
    professional: ProfessionalFull,
  ) => {
    const activeTurn =
      professional.turnos?.find(
        (turno) => turno.activo,
      );

    return {
      date:
        professional.firstName === "Patricia"
          ? "Mañana, 9:00 AM"
          : professional.firstName === "Juan"
            ? "Hoy, 3:30 PM"
            : "Hoy, 2:00 PM",
      room:
        activeTurn?.sillon ||
        "Consultorio 1",
    };
  };

  const activeProfessionals =
    profesionales.filter(
      (p) => p.isActive,
    ).length;

  const activeSpecialties =
    new Set(
      profesionales.map(
        (p) => p.especialidad,
      ),
    ).size;

  return (
    <div className="relative h-[calc(100vh-70px)] w-full overflow-hidden bg-transparent px-3 py-3 text-slate-900 dark:text-slate-100 lg:px-5 lg:py-5">
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-white px-5 py-3 text-slate-900 shadow-2xl dark:bg-slate-950 dark:text-white">
          <CheckCircle2
            size={18}
            className="text-cyan-500"
          />

          <span className="text-sm font-semibold">
            {successToast}
          </span>
        </div>
      )}

      <div className="mx-auto flex h-full w-full max-w-[1600px] min-w-0 flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
              <Users
                size={27}
                className="text-cyan-500 dark:text-cyan-400"
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl">
                Profesionales y Disponibilidad
              </h1>

              <p className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 sm:block lg:text-sm">
                Gestiona tu equipo de odontólogos,
                especialidades médicas y horarios de
                atención.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:gap-3">
            <button
              type="button"
              onClick={() =>
                showToast(
                  "Función de importación próximamente disponible",
                )
              }
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 md:flex"
            >
              <Upload size={16} />
              Importar profesionales
            </button>

            <button
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-400 active:scale-95 lg:px-5"
            >
              <Plus size={17} />

              <span className="hidden sm:inline">
                Nuevo profesional
              </span>
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            icon={
              <UserRoundCheck size={23} />
            }
            title="Profesionales activos"
            value={activeProfessionals}
            description="En servicio actualmente"
          />

          <StatCard
            icon={<Calendar size={23} />}
            title="Disponibles hoy"
            value={
              profesionales.filter((p) =>
                p.turnos?.some(
                  (t) => t.activo,
                ),
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

        <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(0,1fr)] gap-3 overflow-hidden">
          <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xl dark:border-slate-700/70 dark:bg-slate-950/70">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Buscar profesional"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="my-3 border-t border-slate-200 dark:border-slate-800" />

              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold">
                  Filtros
                </span>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-3">
                <FilterSelect
                  label="Especialidad"
                  value={especialidadFilter}
                  onChange={
                    setEspecialidadFilter
                  }
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
                  value={
                    disponibilidadFilter
                  }
                  onChange={
                    setDisponibilidadFilter
                  }
                  options={[
                    "Cualquier disponibilidad",
                    "Disponible hoy",
                  ]}
                />
              </div>

              <div className="mt-4">
                <span className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Vista
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setVista("lista")
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      vista === "lista"
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300"
                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <List size={15} />
                    Lista
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setVista("tarjeta")
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                      vista === "tarjeta"
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300"
                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Grid2X2 size={15} />
                    Tarjeta
                  </button>
                </div>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl dark:border-slate-700/70 dark:bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
                  <Clock
                    size={19}
                    className="text-cyan-500 dark:text-cyan-400"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-bold">
                    Horario general
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Lunes - Viernes
                  </p>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    8:00 AM - 6:00 PM
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  showToast(
                    "Visualización de horarios próximamente disponible",
                  )
                }
                className="mt-4 w-full text-center text-xs font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Ver horarios detallados →
              </button>
            </div>
          </aside>

          <main className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-2xl dark:border-slate-700/70 dark:bg-slate-950/70">
            {vista === "lista" ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="grid shrink-0 grid-cols-[minmax(190px,1.2fr)_minmax(160px,1fr)_100px_minmax(150px,0.75fr)_35px] gap-4 border-b border-slate-200 px-4 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>Profesional</span>
                  <span>Especialidad</span>
                  <span>Estado</span>
                  <span>Próxima disponibilidad</span>
                  <span>Acciones</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <RefreshCw
                        size={26}
                        className="animate-spin text-cyan-500 dark:text-cyan-400"
                      />
                    </div>
                  ) : currentProfessionals.length ===
                    0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <Users
                        size={35}
                        className="text-slate-400 dark:text-slate-600"
                      />

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No se encontraron profesionales
                      </p>
                    </div>
                  ) : (
                    currentProfessionals.map(
                      (prof) => {
                        const availability =
                          getNextAvailability(
                            prof,
                          );

                        return (
                          <div
                            key={prof.id}
                            className="grid min-h-[145px] grid-cols-[minmax(190px,1.2fr)_minmax(160px,1fr)_100px_minmax(150px,0.75fr)_35px] items-center gap-4 border-b border-slate-200 px-4 py-3 transition hover:bg-slate-900/[0.02] dark:border-slate-800 dark:hover:bg-white/[0.025]"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-500/10 bg-cyan-500/10 text-sm font-bold text-cyan-700 dark:text-cyan-200">
                                {getInitials(
                                  prof.nombreCompleto,
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                    {
                                      prof.nombreCompleto
                                    }
                                  </h3>

                                  <CheckCircle2
                                    size={13}
                                    className="shrink-0 text-cyan-500 dark:text-cyan-400"
                                  />
                                </div>

                                <p className="mt-1 truncate text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                                  {
                                    prof.especialidad
                                  }
                                </p>

                                <p className="mt-2 text-[10px] text-slate-500">
                                  REG:{" "}
                                  {
                                    prof.licenseNumber
                                  }
                                </p>

                                {prof.email && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                    <Mail
                                      size={10}
                                    />

                                    <span className="truncate">
                                      {
                                        prof.email
                                      }
                                    </span>
                                  </div>
                                )}

                                {prof.phone && (
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                    <Phone
                                      size={10}
                                    />

                                    <span className="truncate">
                                      {
                                        prof.phone
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="min-w-0">
                              <span className="inline-flex max-w-full truncate rounded-full border border-cyan-500/30 bg-cyan-500/5 px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-200">
                                {getSpecialtyShortName(
                                  prof.especialidad,
                                )}
                              </span>

                              <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {prof.bio}
                              </p>

                              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                <Calendar
                                  size={12}
                                />

                                <span>
                                  {getExperience(
                                    prof,
                                  )}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                  prof.isActive
                                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
                                    : "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    prof.isActive
                                      ? "bg-cyan-500 dark:bg-cyan-400"
                                      : "bg-slate-400 dark:bg-slate-500"
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
                                setSelectedProfForSchedule(
                                  prof,
                                )
                              }
                              className="min-w-0 rounded-xl p-2 text-left transition hover:bg-cyan-500/5"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                <Calendar
                                  size={15}
                                  className="text-slate-400"
                                />

                                <span className="truncate">
                                  {
                                    availability.date
                                  }
                                </span>
                              </div>

                              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <MapPin
                                  size={14}
                                />

                                <span className="truncate">
                                  {
                                    availability.room
                                  }
                                </span>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProfForSchedule(
                                  prof,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-300"
                            >
                              <MoreVertical
                                size={18}
                              />
                            </button>
                          </div>
                        );
                      },
                    )
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                  <p className="hidden text-xs text-slate-500 sm:block">
                    Mostrando{" "}
                    {profesionalesFiltrados.length ===
                    0
                      ? 0
                      : (currentPage - 1) *
                          itemsPerPage +
                        1}{" "}
                    a{" "}
                    {Math.min(
                      currentPage *
                        itemsPerPage,
                      profesionalesFiltrados.length,
                    )}{" "}
                    de{" "}
                    {
                      profesionalesFiltrados.length
                    }{" "}
                    profesionales
                  </p>

                  <div className="flex items-center gap-1">
                    <PaginationButton
                      onClick={() =>
                        goToPage(1)
                      }
                      disabled={
                        currentPage === 1
                      }
                    >
                      <ChevronsLeft
                        size={15}
                      />
                    </PaginationButton>

                    <PaginationButton
                      onClick={() =>
                        goToPage(
                          currentPage - 1,
                        )
                      }
                      disabled={
                        currentPage === 1
                      }
                    >
                      <ChevronLeft size={15} />
                    </PaginationButton>

                    {Array.from(
                      {
                        length: Math.min(
                          totalPages,
                          5,
                        ),
                      },
                      (_, index) => {
                        const page =
                          index + 1;

                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() =>
                              goToPage(page)
                            }
                            className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                              currentPage ===
                              page
                                ? "bg-cyan-500 text-slate-950"
                                : "border border-slate-200 text-slate-500 hover:border-cyan-500/30 hover:text-cyan-600 dark:border-slate-800 dark:text-slate-400 dark:hover:text-cyan-300"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}

                    <PaginationButton
                      onClick={() =>
                        goToPage(
                          currentPage + 1,
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                    >
                      <ChevronRight
                        size={15}
                      />
                    </PaginationButton>

                    <PaginationButton
                      onClick={() =>
                        goToPage(
                          totalPages,
                        )
                      }
                      disabled={
                        currentPage ===
                        totalPages
                      }
                    >
                      <ChevronsRight
                        size={15}
                      />
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
                          Number(
                            e.target.value,
                          ),
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
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
              <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden p-4">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <RefreshCw
                      size={26}
                      className="animate-spin text-cyan-500 dark:text-cyan-400"
                    />
                  </div>
                ) : currentProfessionals.length ===
                  0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <Users
                      size={35}
                      className="text-slate-400 dark:text-slate-600"
                    />

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No se encontraron profesionales
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {currentProfessionals.map(
                      (prof) => (
                        <div
                          key={prof.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-950/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 font-bold text-cyan-700 dark:text-cyan-300">
                                {getInitials(
                                  prof.nombreCompleto,
                                )}
                              </div>

                              <div className="min-w-0">
                                <h3 className="truncate font-bold">
                                  {
                                    prof.nombreCompleto
                                  }
                                </h3>

                                <p className="mt-1 truncate text-xs text-cyan-600 dark:text-cyan-400">
                                  {
                                    prof.especialidad
                                  }
                                </p>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                                prof.isActive
                                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
                                  : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {prof.isActive
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </div>

                          <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {prof.bio}
                          </p>

                          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedProfForSchedule(
                                  prof,
                                )
                              }
                              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/5 py-2.5 text-xs font-bold text-cyan-600 transition hover:bg-cyan-500/10 dark:text-cyan-300"
                            >
                              <Calendar
                                size={15}
                              />

                              Ver agenda
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedProfForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Calendar
                    size={21}
                    className="text-cyan-500 dark:text-cyan-400"
                  />
                </div>

                <div>
                  <h3 className="font-bold">
                    Agenda profesional
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {
                      selectedProfForSchedule.nombreCompleto
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProfForSchedule(
                    null,
                  )
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[55vh] space-y-3 overflow-y-auto p-6">
              {selectedProfForSchedule.turnos?.map(
                (turno) => (
                  <div
                    key={`${turno.dia}-${turno.horaInicio}`}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      turno.activo
                        ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                        : "border-slate-200 bg-slate-100 opacity-50 dark:border-slate-800 dark:bg-slate-950"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">
                        {turno.dia}
                      </p>

                      <p className="mt-1 text-xs text-cyan-600 dark:text-cyan-400">
                        {turno.horaInicio} -{" "}
                        {turno.horaFin}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {turno.sillon}
                      </p>

                      <span
                        className={`mt-2 inline-flex items-center gap-1 text-xs ${
                          turno.activo
                            ? "text-cyan-600 dark:text-cyan-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            turno.activo
                              ? "bg-cyan-500 dark:bg-cyan-400"
                              : "bg-slate-400 dark:bg-slate-600"
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

            <div className="border-t border-slate-200 p-5 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setSelectedProfForSchedule(
                    null,
                  )
                }
                className="w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold">
                  Nuevo profesional
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Registra un nuevo integrante del
                  equipo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseCreateModal}
                disabled={creating}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/5"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateProfessional
              }
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
                <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Especialidad
                </label>

                <select
                  value={formEspecialidad}
                  onChange={(e) =>
                    setFormEspecialidad(
                      e.target.value,
                    )
                  }
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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

                  <option>
                    Periodoncia
                  </option>

                  <option>
                    Odontopediatría
                  </option>
                </select>
              </div>

              <FormInput
                label="Registro profesional"
                value={formRegistro}
                onChange={setFormRegistro}
                placeholder="REG-ODO-00000"
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Biografía
                </label>

                <textarea
                  value={formBio}
                  onChange={(e) =>
                    setFormBio(
                      e.target.value,
                    )
                  }
                  disabled={creating}
                  rows={3}
                  placeholder="Experiencia y descripción profesional..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={creating}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating && (
                    <RefreshCw
                      size={14}
                      className="animate-spin"
                    />
                  )}

                  {creating
                    ? "Registrando..."
                    : "Registrar profesional"}
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
  icon: ReactNode;
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
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-lg dark:border-slate-700/70 dark:bg-slate-950/70">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>

        <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
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
      <label className="mb-2 block text-[11px] text-slate-500 dark:text-slate-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
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
  children: ReactNode;
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
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-cyan-500/30 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-800 dark:text-slate-400 dark:hover:text-cyan-300"
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
      <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-300">
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
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-600"
      />
    </div>
  );
}

export default ProfesionalesView;