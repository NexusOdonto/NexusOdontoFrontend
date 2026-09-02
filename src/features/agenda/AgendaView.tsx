import { useState, useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Plus,
  Stethoscope,
  X,
  CheckCircle2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { appointmentService } from "../../api/appointmentService";

interface AgendaSlot {
  id: string;
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

const doctoresList = [
  "Todos los Odontólogos",
  "Dra. Laura Gómez",
  "Dr. Juan Martínez",
  "Dra. Patricia Silva",
];

const initialSlots: AgendaSlot[] = [
  {
    id: "slot-1",
    hora: "09:00",
    paciente: "Carlos Andrés Pérez",
    servicio: "Blanqueamiento Dental Láser",
    doctor: "Dra. Laura Gómez",
    estado: "Confirmada",
    motivo: "Estética dental sesión #1",
  },
  {
    id: "slot-2",
    hora: "10:00",
    paciente: "Andrés Pérez",
    servicio: "Limpieza y Valoración General",
    doctor: "Dra. Laura Gómez",
    estado: "En Atención",
    motivo: "Control preventivo",
  },
  {
    id: "slot-3",
    hora: "11:00",
    doctor: "Dra. Laura Gómez",
    estado: "Libre",
  },
  {
    id: "slot-4",
    hora: "14:00",
    paciente: "María Fernanda López",
    servicio: "Calza en Resina Pieza #16",
    doctor: "Dr. Juan Martínez",
    estado: "Confirmada",
    motivo: "Obturación por caries",
  },
  {
    id: "slot-5",
    hora: "15:00",
    paciente: "Andrés Pérez",
    servicio: "Extracción Dental Cordal",
    doctor: "Dr. Juan Martínez",
    estado: "Pendiente",
    motivo: "Dolor e inflamación",
  },
  {
    id: "slot-6",
    hora: "16:00",
    doctor: "Dr. Juan Martínez",
    estado: "Libre",
  },
  {
    id: "slot-7",
    hora: "10:00",
    paciente: "Lucía Ramirez",
    servicio: "Tratamiento de Endodoncia",
    doctor: "Dra. Patricia Silva",
    estado: "Confirmada",
    motivo: "Conductos pieza #24",
  },
];

export function AgendaView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isPaciente = role === "PACIENTE";

  const [selectedDate, setSelectedDate] = useState<string>("2026-09-15");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("Todos los Odontólogos");
  const [slots, setSlots] = useState<AgendaSlot[]>(initialSlots);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<{ hora: string; doctor: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form agendamiento rápido
  const [formPaciente, setFormPaciente] = useState(isPaciente ? (user?.name || "Andrés Pérez") : "");
  const [formServicio, setFormServicio] = useState("Limpieza y Valoración General");
  const [formMotivo, setFormMotivo] = useState("");

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
        doctor: selectedDoctor === "Todos los Odontólogos" ? "Dra. Laura Gómez" : selectedDoctor,
        estado: "Libre" as const,
      };
    });
  }, [slots, selectedDoctor]);

  const handleOpenBook = (hora: string, doctor: string) => {
    setSelectedSlotForBooking({ hora, doctor });
    setFormPaciente(isPaciente ? (user?.name || "Andrés Pérez") : "");
    setShowBookModal(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;

    const newSlot: AgendaSlot = {
      id: `slot-${Date.now()}`,
      hora: selectedSlotForBooking.hora,
      doctor: selectedSlotForBooking.doctor,
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
        patientId: "1e000000-0000-0000-0000-000000000001", // Andrés Pérez
        professionalId: "1d000000-0000-0000-0000-000000000001", // Dra. Laura Gómez
        serviceId: "30000000-0000-0000-0000-000000000001", // Valoración General
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
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm text-xs font-semibold"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => handleOpenBook("09:00", selectedDoctor === "Todos los Odontólogos" ? "Dra. Laura Gómez" : selectedDoctor)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Reservar Cita en Agenda
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedDate} a las <strong className="text-cyan-600 dark:text-cyan-400">{selectedSlotForBooking.hora}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-200">Doctor Asignado:</strong> {selectedSlotForBooking.doctor}
                </p>
              </div>

              {!isPaciente && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre del Paciente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana María Rodríguez"
                    value={formPaciente}
                    onChange={(e) => setFormPaciente(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 backdrop-blur-md"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tratamiento / Procedimiento *
                </label>
                <select
                  value={formServicio}
                  onChange={(e) => setFormServicio(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 backdrop-blur-md"
                >
                  <option value="Limpieza y Valoración General">Limpieza y Valoración General</option>
                  <option value="Blanqueamiento Dental Láser">Blanqueamiento Dental Láser</option>
                  <option value="Calza en Resina Simple">Calza en Resina Simple</option>
                  <option value="Extracción Dental Cordal">Extracción Dental Cordal</option>
                  <option value="Control de Ortodoncia">Control de Ortodoncia</option>
                  <option value="Tratamiento de Endodoncia">Tratamiento de Endodoncia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo de la Cita / Síntomas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle de la consulta..."
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none backdrop-blur-md"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar en Agenda
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
