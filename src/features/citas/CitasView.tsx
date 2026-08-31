import {
  CalendarDays,
  Plus,
  Search,
  X,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CitasTable } from "./components/CitasTable";
import { type Cita, type EstadoCita } from "./types";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";

const citasIniciales: Cita[] = [
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
    profesional: "Dr. Juan Martínez",
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
    profesional: "Dr. Juan Martínez",
    servicio: "Extracción Dental Cordal",
    fecha: "2026-09-22",
    hora: "14:00",
    estado: "Pendiente",
    motivo: "Dolor en cordal inferior izquierda",
  },
  {
    id: 5,
    paciente: "Claudia Ortiz",
    pacienteEmail: "claudia@correo.com",
    pacienteCedula: "1054321678",
    profesional: "Dra. Laura Gómez",
    servicio: "Control de Ortodoncia",
    fecha: "2026-09-01",
    hora: "11:30",
    estado: "En Atención",
    motivo: "Ajuste de brackets",
  },
];

const listaProfesionales = [
  "Dra. Laura Gómez",
  "Dr. Juan Martínez",
  "Dr. Carlos Méndez",
  "Dra. Patricia Silva",
];

const listaServicios = [
  "Limpieza y Valoración General",
  "Blanqueamiento Dental Láser",
  "Calza en Resina Simple / Compuesta",
  "Extracción Dental Simple / Quirúrgica",
  "Tratamiento de Endodoncia",
  "Control de Ortodoncia",
  "Implante Dental Osteointegrado",
  "Diseño de Sonrisa",
];

export function CitasView() {
  const { user } = useAuth();
  const role = getUserRole(user);

  const isPaciente = role === "PACIENTE";
  const isOdontologo = role === "ODONTOLOGO";
  const isRecepcionista = role === "RECEPCIONISTA";
  const isAdmin = role === "ADMINISTRADOR";

  const [citas, setCitas] = useState<Cita[]>(() => {
    const saved = localStorage.getItem("nexus_citas");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return citasIniciales;
      }
    }
    return citasIniciales;
  });

  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"Todos" | EstadoCita>("Todos");
  const [loading, setLoading] = useState(true);

  // Modales
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCitaToAssign, setSelectedCitaToAssign] = useState<Cita | null>(null);

  // Formulario Solicitud / Creación
  const [formPaciente, setFormPaciente] = useState(user?.name || "");
  const [formServicio, setFormServicio] = useState(listaServicios[0]);
  const [formFecha, setFormFecha] = useState("");
  const [formHora, setFormHora] = useState("09:00");
  const [formProfesional, setFormProfesional] = useState(listaProfesionales[0]);
  const [formMotivo, setFormMotivo] = useState("");

  useEffect(() => {
    localStorage.setItem("nexus_citas", JSON.stringify(citas));
  }, [citas]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  // Filtrado de citas según rol y filtros activos
  const citasFiltradas = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return citas.filter((cita) => {
      // 1. Aislamiento por rol
      if (isPaciente) {
        const patientName = (user?.name || user?.nombre || "").toLowerCase();
        const patientEmail = (user?.email || "").toLowerCase();
        const patientCedula = (user?.cedula || "");

        const isOwn =
          cita.paciente.toLowerCase().includes(patientName) ||
          (cita.pacienteEmail && cita.pacienteEmail.toLowerCase() === patientEmail) ||
          (cita.pacienteCedula && cita.pacienteCedula === patientCedula);

        if (!isOwn) return false;
      }

      if (isOdontologo) {
        const doctorName = (user?.name || user?.nombre || "").toLowerCase();
        if (doctorName && cita.profesional && !cita.profesional.toLowerCase().includes(doctorName)) {
          const isDoc = cita.profesional.toLowerCase().includes("laura") || cita.profesional.toLowerCase().includes("gómez");
          if (!isDoc && cita.profesional !== "") return false;
        }
      }

      // 2. Filtros de búsqueda
      const matchSearch =
        searchValue === "" ||
        cita.paciente.toLowerCase().includes(searchValue) ||
        (cita.profesional && cita.profesional.toLowerCase().includes(searchValue)) ||
        cita.servicio.toLowerCase().includes(searchValue) ||
        (cita.motivo && cita.motivo.toLowerCase().includes(searchValue));

      const matchFecha = fecha === "" || cita.fecha === fecha;
      const matchEstado = estadoFiltro === "Todos" || cita.estado === estadoFiltro;

      return matchSearch && matchFecha && matchEstado;
    });
  }, [citas, search, fecha, estadoFiltro, isPaciente, isOdontologo, user]);

  // Contadores para pestañas
  const pendingCount = useMemo(() => {
    return citas.filter((c) => c.estado === "Pendiente").length;
  }, [citas]);

  const handleCreateOrRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFecha) return;

    const newCita: Cita = {
      id: Date.now(),
      paciente: isPaciente ? (user?.name || "Andrés Pérez") : formPaciente || "Paciente Registrado",
      pacienteEmail: isPaciente ? user?.email : undefined,
      pacienteCedula: isPaciente ? user?.cedula : undefined,
      profesional: isPaciente ? "" : formProfesional,
      servicio: formServicio,
      fecha: formFecha,
      hora: formHora,
      estado: isPaciente ? "Pendiente" : "Confirmada",
      motivo: formMotivo || "Consulta general",
    };

    setCitas((prev) => [newCita, ...prev]);
    setShowRequestModal(false);
    setFormMotivo("");
    setFormFecha("");
  };

  const handleUpdateStatus = (citaId: number, nuevoEstado: EstadoCita) => {
    setCitas((prev) =>
      prev.map((c) => (c.id === citaId ? { ...c, estado: nuevoEstado } : c))
    );
  };

  const handleAssignDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCitaToAssign) return;

    setCitas((prev) =>
      prev.map((c) =>
        c.id === selectedCitaToAssign.id
          ? {
              ...c,
              profesional: formProfesional,
              hora: formHora || c.hora,
              estado: "Confirmada",
            }
          : c
      )
    );

    setShowAssignModal(false);
    setSelectedCitaToAssign(null);
  };

  const handleOpenAssign = (cita: Cita) => {
    setSelectedCitaToAssign(cita);
    setFormProfesional(cita.profesional || listaProfesionales[0]);
    setFormHora(cita.hora || "09:00");
    setShowAssignModal(true);
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO Y ACCIÓN PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isPaciente ? "Mis Citas Odontológicas" : "Gestión de Citas y Agenda"}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {isPaciente
              ? "Solicita nuevas consultas y realiza seguimiento a tus tratamientos."
              : "Control operativo de solicitudes, asignación de doctores y flujo clínico."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormPaciente(isPaciente ? (user?.name || "Andrés Pérez") : "");
            setShowRequestModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_4px_15px_rgba(20,184,166,0.3)] transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          <span>{isPaciente ? "Solicitar Cita" : "Nueva Cita Directa"}</span>
        </button>
      </div>

      {/* PESTAÑAS Y CONTADORES PARA RECEPCIÓN / ADMIN */}
      {(isRecepcionista || isAdmin) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setEstadoFiltro("Todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Todos"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Todas ({citas.length})
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro("Pendiente")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Pendiente"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Solicitudes Pendientes ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro("Confirmada")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Confirmada"
                ? "bg-teal-500 text-slate-950 font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Confirmadas
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro("En Atención")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "En Atención"
                ? "bg-blue-500 text-white font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            En Atención
          </button>

          <button
            type="button"
            onClick={() => setEstadoFiltro("Completada")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              estadoFiltro === "Completada"
                ? "bg-purple-600 text-white font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Completadas
          </button>
        </div>
      )}

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isPaciente ? "Buscar por servicio o motivo..." : "Buscar por paciente, doctor o servicio..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
          />

          {isPaciente && (
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 transition-colors"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          )}

          {(search || fecha || estadoFiltro !== "Todos") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFecha("");
                setEstadoFiltro("Todos");
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Limpiar filtros"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* TABLA PRINCIPAL DE CITAS */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CitasTable
          citas={citasFiltradas}
          loading={loading}
          onOpenAssignModal={handleOpenAssign}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* MODAL 1: SOLICITAR / CREAR CITA */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isPaciente ? "Solicitar Cita Odontológica" : "Agendar Nueva Cita Directa"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isPaciente
                      ? "Tu solicitud será revisada y confirmada por recepción."
                      : "Ingresa los datos para confirmar la cita de inmediato."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrRequest} className="p-6 space-y-4">
              {!isPaciente && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre del Paciente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana María Rodríguez"
                    value={formPaciente}
                    onChange={(e) => setFormPaciente(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Servicio / Tratamiento *
                </label>
                <select
                  value={formServicio}
                  onChange={(e) => setFormServicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                >
                  {listaServicios.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Fecha deseada *
                  </label>
                  <input
                    type="date"
                    required
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Hora estimada *
                  </label>
                  <input
                    type="time"
                    required
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {!isPaciente && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Odontólogo Asignado *
                  </label>
                  <select
                    value={formProfesional}
                    onChange={(e) => setFormProfesional(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                  >
                    {listaProfesionales.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo de la consulta / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe brevemente tus síntomas o motivo..."
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-colors shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Aprobar y Asignar Cita
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paciente: <span className="font-semibold text-teal-400">{selectedCitaToAssign.paciente}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDoctor} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <p className="text-slate-500">
                  <strong className="text-slate-700 dark:text-slate-300">Servicio:</strong> {selectedCitaToAssign.servicio}
                </p>
                <p className="text-slate-500">
                  <strong className="text-slate-700 dark:text-slate-300">Fecha solicitada:</strong> {selectedCitaToAssign.fecha}
                </p>
                {selectedCitaToAssign.motivo && (
                  <p className="text-slate-500">
                    <strong className="text-slate-700 dark:text-slate-300">Motivo:</strong> {selectedCitaToAssign.motivo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Seleccionar Odontólogo Tratante *
                </label>
                <select
                  value={formProfesional}
                  onChange={(e) => setFormProfesional(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500"
                >
                  {listaProfesionales.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirmar Hora de Consulta *
                </label>
                <input
                  type="time"
                  required
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-teal-500 [color-scheme:dark]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
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