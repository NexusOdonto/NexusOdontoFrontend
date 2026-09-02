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
import {
  appointmentService,
  type AppointmentResponseDto,
} from "../../api/appointmentService";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { professionalService } from "../../api/professionalService";
import { useNotifications } from "../../context/NotificationContext";

const citasFallback: Cita[] = [
  {
    id: 1,
    paciente: "Andrés Pérez",
    pacienteEmail: "paciente@nexusodonto.com",
    pacienteCedula: "1076543210",
    profesional: "Dra. Laura Gómez",
    servicio: "Limpieza y Valoración General",
    fecha: "2026-09-15",
    hora: "10:00",
    estado: "Confirmada",
    motivo: "Revisión semestral y limpieza dental",
  },
  {
    id: 2,
    paciente: "Carlos Andrés Pérez",
    pacienteEmail: "carlos.perez@correo.com",
    pacienteCedula: "1098761234",
    profesional: "",
    servicio: "Blanqueamiento Dental Láser",
    fecha: "2026-09-02",
    hora: "09:30",
    estado: "Pendiente",
    motivo: "Estética dental",
  },
  {
    id: 3,
    paciente: "María Fernanda López",
    pacienteEmail: "maria.lopez@correo.com",
    pacienteCedula: "1087654321",
    profesional: "Dra. Laura Gómez",
    servicio: "Calza en Resina Pieza #16",
    fecha: "2026-08-30",
    hora: "10:30",
    estado: "Completada",
    motivo: "Obturación por caries",
  },
  {
    id: 4,
    paciente: "Andrés Pérez",
    pacienteEmail: "paciente@nexusodonto.com",
    pacienteCedula: "1076543210",
    profesional: "",
    servicio: "Extracción Dental Cordal",
    fecha: "2026-09-22",
    hora: "14:00",
    estado: "Pendiente",
    motivo: "Dolor en cordal inferior izquierda",
  },
];

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

  const [estadoFiltro, setEstadoFiltro] = useState<
    "Todos" | EstadoCita
  >("Todos");

  const [loading, setLoading] = useState(true);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [selectedCitaToAssign, setSelectedCitaToAssign] =
    useState<Cita | null>(null);

  const [formPaciente, setFormPaciente] = useState(user?.name || "");
  const [formServicio, setFormServicio] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formHora, setFormHora] = useState("09:00");
  const [formProfesional, setFormProfesional] = useState("");
  const [formMotivo, setFormMotivo] = useState("");

  useEffect(() => {
    const filtroParam = searchParams.get("filtro");

    if (filtroParam === "Pendiente") {
      setEstadoFiltro("Pendiente");
    }
  }, [searchParams]);

  const fetchAppointmentsAndCatalogs = useCallback(async () => {
    setLoading(true);

    try {
      const servicesData = await serviceCatalogService
        .getAll()
        .catch(() => []);

      if (servicesData && servicesData.length > 0) {
        const names = servicesData.map((s) => s.name);

        setServicesList(names);
        setFormServicio(names[0]);
      } else {
        setFormServicio("Limpieza y Valoración General");
      }

      if (!isPaciente) {
        const profData = await professionalService
          .getAll()
          .catch(() => []);

        if (profData && profData.length > 0) {
          const profNames = profData.map((p) =>
            `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim()
          );

          setProfessionalsList(profNames);
          setFormProfesional(profNames[0]);
        } else {
          setFormProfesional("Dra. Laura Gómez");
        }
      }

      const apiAppointments: AppointmentResponseDto[] =
        await appointmentService.getAll().catch(() => []);

      if (apiAppointments && apiAppointments.length > 0) {
        const mapped: Cita[] = apiAppointments.map((a, idx) => {
          const startDate = a.startsAt
            ? a.startsAt.split("T")[0]
            : "2026-09-15";

          const startTime =
            a.startsAt && a.startsAt.includes("T")
              ? a.startsAt.split("T")[1].substring(0, 5)
              : "09:00";

          let estadoName: EstadoCita = "Confirmada";

          if (a.cancelledAt) {
            estadoName = "Cancelada";
          } else if (
            !a.professionalId ||
            a.professionalId ===
              "00000000-0000-0000-0000-000000000000"
          ) {
            estadoName = "Pendiente";
          }

          return {
            id: idx + 1,
            paciente: a.patientName || "Paciente",
            pacienteEmail: a.patientEmail,
            pacienteCedula: a.patientDocument,
            profesional:
              a.professionalName ||
              (a.professionalId ? "Dr. Asignado" : ""),
            servicio: a.serviceName || "Consulta General",
            fecha: startDate,
            hora: startTime,
            estado: estadoName,
            motivo: a.reasonForVisit || a.notes,
          };
        });

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
      console.warn(
        "API appointments offline, using local data:",
        error
      );

      setCitas(citasFallback);
    } finally {
      setLoading(false);
    }
  }, [isPaciente]);

  useEffect(() => {
    fetchAppointmentsAndCatalogs();
  }, [fetchAppointmentsAndCatalogs]);

  useEffect(() => {
    if (citas.length > 0) {
      localStorage.setItem(
        "nexus_citas",
        JSON.stringify(citas)
      );
    }
  }, [citas]);

  const citasFiltradas = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return citas.filter((cita) => {
      if (isPaciente) {
        const patientName = (
          user?.name ||
          user?.nombre ||
          ""
        ).toLowerCase();

        const patientEmail = (
          user?.email || ""
        ).toLowerCase();

        const patientCedula = user?.cedula || "";

        const isOwn =
          cita.paciente.toLowerCase().includes(patientName) ||
          (cita.pacienteEmail &&
            cita.pacienteEmail.toLowerCase() === patientEmail) ||
          (cita.pacienteCedula &&
            cita.pacienteCedula === patientCedula);

        if (!isOwn) return false;
      }

      if (isOdontologo) {
        const doctorName = (
          user?.name ||
          user?.nombre ||
          ""
        ).toLowerCase();

        if (
          doctorName &&
          cita.profesional &&
          !cita.profesional.toLowerCase().includes(doctorName)
        ) {
          const isDoc =
            cita.profesional.toLowerCase().includes("laura") ||
            cita.profesional.toLowerCase().includes("gómez");

          if (!isDoc && cita.profesional !== "") {
            return false;
          }
        }
      }

      const matchSearch =
        searchValue === "" ||
        cita.paciente.toLowerCase().includes(searchValue) ||
        (cita.profesional &&
          cita.profesional
            .toLowerCase()
            .includes(searchValue)) ||
        cita.servicio.toLowerCase().includes(searchValue) ||
        (cita.motivo &&
          cita.motivo.toLowerCase().includes(searchValue));

      const matchFecha =
        fecha === "" || cita.fecha === fecha;

      const matchEstado =
        estadoFiltro === "Todos" ||
        cita.estado === estadoFiltro;

      return (
        matchSearch &&
        matchFecha &&
        matchEstado
      );
    });
  }, [
    citas,
    search,
    fecha,
    estadoFiltro,
    isPaciente,
    isOdontologo,
    user,
  ]);

  const pendingCount = useMemo(() => {
    return citas.filter(
      (c) => c.estado === "Pendiente"
    ).length;
  }, [citas]);

  const handleCreateOrRequest = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formFecha) return;

    const newCita: Cita = {
      id: Date.now(),
      paciente: isPaciente
        ? user?.name || "Andrés Pérez"
        : formPaciente || "Paciente Registrado",

      pacienteEmail: isPaciente
        ? user?.email
        : undefined,

      pacienteCedula: isPaciente
        ? user?.cedula
        : undefined,

      profesional: isPaciente
        ? ""
        : formProfesional,

      servicio:
        formServicio || servicesList[0],

      fecha: formFecha,
      hora: formHora,

      estado: isPaciente
        ? "Pendiente"
        : "Confirmada",

      motivo:
        formMotivo || "Consulta general",
    };

    try {
      await appointmentService.create({
        patientId:
          user?.personId ||
          "11000000-0000-0000-0000-000000000001",

        professionalId: isPaciente
          ? "00000000-0000-0000-0000-000000000000"
          : "12000000-0000-0000-0000-000000000001",

        serviceId:
          "12000000-0000-0000-0000-000000000001",

        startsAt:
          `${formFecha}T${formHora}:00Z`,

        endsAt:
          `${formFecha}T${formHora}:30Z`,

        appointmentStatusId: isPaciente
          ? "14000000-0000-0000-0000-000000000001"
          : "14000000-0000-0000-0000-000000000002",

        appointmentOriginId: isPaciente
          ? "15000000-0000-0000-0000-000000000002"
          : "15000000-0000-0000-0000-000000000001",

        reasonForVisit: formMotivo,
      });
    } catch (err) {
      console.warn(
        "Could not save to API Appointments directly, stored in state:",
        err
      );
    }

    const updatedCitas = [
      newCita,
      ...citas,
    ];

    setCitas(updatedCitas);

    localStorage.setItem(
      "nexus_citas",
      JSON.stringify(updatedCitas)
    );

    refreshNotifications();

    setShowRequestModal(false);
    setFormMotivo("");
    setFormFecha("");

    setSuccessToast(
      isPaciente
        ? "¡Tu cita ha sido solicitada con éxito! Queda en estado Pendiente para revisión de Recepción."
        : "¡Cita agendada y confirmada con éxito!"
    );

    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleUpdateStatus = (
    citaId: number,
    nuevoEstado: EstadoCita
  ) => {
    setCitas((prev) => {
      const updated = prev.map((c) =>
        c.id === citaId
          ? {
              ...c,
              estado: nuevoEstado,
            }
          : c
      );

      localStorage.setItem(
        "nexus_citas",
        JSON.stringify(updated)
      );

      return updated;
    });

    refreshNotifications();
  };

  const handleAssignDoctor = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedCitaToAssign) return;

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

      localStorage.setItem(
        "nexus_citas",
        JSON.stringify(updated)
      );

      return updated;
    });

    setShowAssignModal(false);
    setSelectedCitaToAssign(null);

    refreshNotifications();

    setSuccessToast(
      "¡Cita aprobada y odontólogo asignado con éxito!"
    );

    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  const handleOpenAssign = (
    cita: Cita
  ) => {
    setSelectedCitaToAssign(cita);

    setFormProfesional(
      cita.profesional ||
        professionalsList[0]
    );

    setFormHora(
      cita.hora || "09:00"
    );

    setShowAssignModal(true);
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/85 dark:bg-slate-900/85 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-400/30 animate-scaleIn">
          <CheckCircle2
            size={18}
            className="text-teal-400 flex-shrink-0"
          />

          <span className="text-xs font-semibold">
            {successToast}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-100 dark:text-white">
            {isPaciente
              ? "Mis Citas Odontológicas"
              : "Gestión de Citas y Agenda"}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 dark:text-slate-400 mt-2">
            {isPaciente
              ? "Solicita nuevas consultas y realiza seguimiento a tus tratamientos."
              : "Control operativo de solicitudes, asignación de doctores y flujo clínico."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAppointmentsAndCatalogs}
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900/20 backdrop-blur-md hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Recargar datos desde la base de datos"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

          <button
            type="button"
            onClick={() => {
              setFormPaciente(
                isPaciente
                  ? user?.name ||
                      "Andrés Pérez"
                  : ""
              );

              setShowRequestModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_4px_15px_rgba(20,184,166,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />

            <span>
              {isPaciente
                ? "Solicitar Cita"
                : "Nueva Cita Directa"}
            </span>
          </button>
        </div>
      </div>

      {(isRecepcionista || isAdmin) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() =>
              setEstadoFiltro("Todos")
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Todos"
                ? "bg-white/90 text-slate-900"
                : "bg-slate-900/30 backdrop-blur-md text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            Todas ({citas.length})
          </button>

          <button
            type="button"
            onClick={() =>
              setEstadoFiltro("Pendiente")
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Pendiente"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-amber-500/10 backdrop-blur-md text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />

            Solicitudes Pendientes (
            {pendingCount})
          </button>

          <button
            type="button"
            onClick={() =>
              setEstadoFiltro("Confirmada")
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Confirmada"
                ? "bg-teal-500 text-slate-950 font-bold"
                : "bg-slate-900/30 backdrop-blur-md text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            Confirmadas
          </button>

          <button
            type="button"
            onClick={() =>
              setEstadoFiltro("En Atención")
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "En Atención"
                ? "bg-blue-500 text-white font-bold"
                : "bg-slate-900/30 backdrop-blur-md text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            En Atención
          </button>

          <button
            type="button"
            onClick={() =>
              setEstadoFiltro("Completada")
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Completada"
                ? "bg-purple-600 text-white font-bold"
                : "bg-slate-900/30 backdrop-blur-md text-slate-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            Completadas
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-900/35 backdrop-blur-xl p-3 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder={
              isPaciente
                ? "Buscar por servicio o motivo..."
                : "Buscar por paciente, doctor o servicio..."
            }
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-400 outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) =>
              setFecha(e.target.value)
            }
            className="px-3 py-2 bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
          />

          {isPaciente && (
            <select
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(
                  e.target.value as
                    | "Todos"
                    | EstadoCita
                )
              }
              className="px-3 py-2 bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500 transition-colors"
            >
              <option value="Todos">
                Todos los estados
              </option>

              <option value="Pendiente">
                Pendiente
              </option>

              <option value="Confirmada">
                Confirmada
              </option>

              <option value="Completada">
                Completada
              </option>

              <option value="Cancelada">
                Cancelada
              </option>
            </select>
          )}

          {(search ||
            fecha ||
            estadoFiltro !== "Todos") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFecha("");
                setEstadoFiltro("Todos");
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Limpiar filtros"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/35 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] overflow-hidden">
        <CitasTable
          citas={citasFiltradas}
          loading={loading}
          onOpenAssignModal={handleOpenAssign}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {isPaciente
                      ? "Solicitar Cita Odontológica"
                      : "Agendar Nueva Cita Directa"}
                  </h3>

                  <p className="text-xs text-slate-400">
                    {isPaciente
                      ? "Tu solicitud será enviada a recepción para asignación y confirmación."
                      : "Ingresa los datos para confirmar la cita de inmediato."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowRequestModal(false)
                }
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateOrRequest
              }
              className="p-6 space-y-4"
            >
              {!isPaciente && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre del Paciente *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana María Rodríguez"
                    value={formPaciente}
                    onChange={(e) =>
                      setFormPaciente(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Servicio / Tratamiento *
                </label>

                <select
                  value={formServicio}
                  onChange={(e) =>
                    setFormServicio(
                      e.target.value
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500"
                >
                  {servicesList.map((s) => (
                    <option
                      key={s}
                      value={s}
                    >
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Fecha deseada *
                  </label>

                  <input
                    type="date"
                    required
                    value={formFecha}
                    onChange={(e) =>
                      setFormFecha(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hora estimada *
                  </label>

                  <input
                    type="time"
                    required
                    value={formHora}
                    onChange={(e) =>
                      setFormHora(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {!isPaciente && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Odontólogo Asignado *
                  </label>

                  <select
                    value={formProfesional}
                    onChange={(e) =>
                      setFormProfesional(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500"
                  >
                    {professionalsList.map(
                      (p) => (
                        <option
                          key={p}
                          value={p}
                        >
                          {p}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motivo de la consulta /
                  Observaciones
                </label>

                <textarea
                  rows={2}
                  placeholder="Describe brevemente tus síntomas o motivo..."
                  value={formMotivo}
                  onChange={(e) =>
                    setFormMotivo(
                      e.target.value
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowRequestModal(false)
                  }
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  {isPaciente
                    ? "Enviar Solicitud a Recepción"
                    : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal &&
        selectedCitaToAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-scaleIn">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                    <Stethoscope size={20} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      Aprobar y Asignar Cita
                    </h3>

                    <p className="text-xs text-slate-400">
                      Paciente:{" "}
                      <span className="font-semibold text-teal-400">
                        {
                          selectedCitaToAssign.paciente
                        }
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAssignModal(false)
                  }
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={handleAssignDoctor}
                className="p-6 space-y-4"
              >
                <div className="p-3 rounded-xl bg-slate-950/50 border border-white/10 text-xs space-y-1">
                  <p className="text-slate-400">
                    <strong className="text-slate-200">
                      Servicio:
                    </strong>{" "}
                    {
                      selectedCitaToAssign.servicio
                    }
                  </p>

                  <p className="text-slate-400">
                    <strong className="text-slate-200">
                      Fecha solicitada:
                    </strong>{" "}
                    {
                      selectedCitaToAssign.fecha
                    }
                  </p>

                  {selectedCitaToAssign.motivo && (
                    <p className="text-slate-400">
                      <strong className="text-slate-200">
                        Motivo:
                      </strong>{" "}
                      {
                        selectedCitaToAssign.motivo
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Seleccionar Odontólogo
                    Tratante *
                  </label>

                  <select
                    value={formProfesional}
                    onChange={(e) =>
                      setFormProfesional(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500"
                  >
                    {professionalsList.map(
                      (p) => (
                        <option
                          key={p}
                          value={p}
                        >
                          {p}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirmar Hora de Consulta *
                  </label>

                  <input
                    type="time"
                    required
                    value={formHora}
                    onChange={(e) =>
                      setFormHora(
                        e.target.value
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAssignModal(false)
                    }
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/10"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
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