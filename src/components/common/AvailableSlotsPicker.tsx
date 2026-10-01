import { useState, useEffect, useMemo } from "react";
import { Clock, Sun, Sunset, Sparkles, AlertCircle, UserCheck } from "lucide-react";
import { appointmentService, type AppointmentResponseDto } from "../../api/appointmentService";
import { getDoctorTurnoForDate } from "../../utils/doctorSchedules";
import { areGuidsEqual } from "../../utils/roleUtils";

export interface AvailableSlotsPickerProps {
  fecha: string; // YYYY-MM-DD
  doctorId?: string;
  doctorName?: string;
  durationMinutes?: number;
  value: string; // "HH:mm"
  onChange: (timeStr: string) => void;
  appointments?: AppointmentResponseDto[];
  variant?: "cyan" | "teal";
}

export function AvailableSlotsPicker({
  fecha,
  doctorId = "",
  doctorName = "",
  durationMinutes = 30,
  value,
  onChange,
  appointments: externalAppointments,
  variant = "cyan",
}: AvailableSlotsPickerProps) {
  const [internalAppointments, setInternalAppointments] = useState<AppointmentResponseDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Si no se pasaron citas externas, cargarlas internamente
  useEffect(() => {
    if (externalAppointments && externalAppointments.length > 0) {
      setInternalAppointments(externalAppointments);
      return;
    }

    let isMounted = true;
    async function loadApps() {
      setLoading(true);
      try {
        const apps = await appointmentService.getAll();
        if (isMounted && Array.isArray(apps)) {
          setInternalAppointments(apps);
        }
      } catch (err) {
        console.warn("Could not load appointments for AvailableSlotsPicker:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadApps();
    return () => {
      isMounted = false;
    };
  }, [externalAppointments]);

  const allAppointments = externalAppointments && externalAppointments.length > 0 ? externalAppointments : internalAppointments;

  const todayIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Cálculo en memoria de los horarios disponibles
  const { availableSlots, morningSlots, afternoonSlots, isSunday, doctorWorksToday } = useMemo(() => {
    if (!doctorId && !doctorName) {
      return { availableSlots: [], morningSlots: [], afternoonSlots: [], isSunday: false, doctorWorksToday: true };
    }

    if (!fecha) {
      return { availableSlots: [], morningSlots: [], afternoonSlots: [], isSunday: false, doctorWorksToday: false };
    }

    const [y, m, d] = fecha.split("-").map(Number);
    if (!y || !m || !d) {
      return { availableSlots: [], morningSlots: [], afternoonSlots: [], isSunday: false, doctorWorksToday: false };
    }

    const dateObj = new Date(y, m - 1, d);
    const isSun = dateObj.getDay() === 0;
    if (isSun) {
      return { availableSlots: [], morningSlots: [], afternoonSlots: [], isSunday: true, doctorWorksToday: false };
    }

    const turno = getDoctorTurnoForDate(doctorId || doctorName, dateObj);
    if (!turno.activo) {
      return { availableSlots: [], morningSlots: [], afternoonSlots: [], isSunday: false, doctorWorksToday: false };
    }

    const parseToMin = (tStr?: string, fallback = 0): number => {
      if (!tStr) return fallback;
      const [h, min] = tStr.split(":").map(Number);
      if (isNaN(h) || isNaN(min)) return fallback;
      return h * 60 + min;
    };

    const startWorkMin = parseToMin(turno.horaInicio, 8 * 60);
    const endWorkMin = parseToMin(turno.horaFin, 17 * 60);

    const hasLunch = !!turno.almuerzoActivo;
    const lunchStartMin = hasLunch ? parseToMin(turno.horaAlmuerzoInicio, 12 * 60) : -1;
    const lunchEndMin = hasLunch ? parseToMin(turno.horaAlmuerzoFin, 14 * 60) : -1;

    const effDuration = Math.max(15, durationMinutes || 30);

    // Intervalos ocupados por citas existentes
    const busyIntervals: Array<{ startMin: number; endMin: number }> = [];

    allAppointments.forEach((app) => {
      const isCancelled =
        !!app.cancelledAt ||
        areGuidsEqual(app.appointmentStatusId, "10000000-0000-0000-0000-000000000005") ||
        (app.statusName && app.statusName.toLowerCase().includes("cancel")) ||
        areGuidsEqual(app.appointmentStatusId, "10000000-0000-0000-0000-000000000006") ||
        (app.statusName && app.statusName.toLowerCase().includes("no asist"));

      if (isCancelled) return;

      const docMatch =
        areGuidsEqual(app.professionalId, doctorId) ||
        (doctorName && app.professionalName && app.professionalName.toLowerCase().includes(doctorName.toLowerCase()));

      if (!docMatch) return;

      const appDateIso = (app.startsAt || "").slice(0, 10);
      if (appDateIso !== fecha) return;

      const [_, timePart] = (app.startsAt || "").split("T");
      const [__, endTimePart] = (app.endsAt || "").split("T");

      if (timePart) {
        const startMin = parseToMin(timePart.slice(0, 5));
        let endMin = endTimePart ? parseToMin(endTimePart.slice(0, 5)) : startMin + 30;
        if (endMin <= startMin) endMin = startMin + 30;
        busyIntervals.push({ startMin, endMin });
      }
    });

    // Citas locales en caché de sesión
    try {
      const localRaw = localStorage.getItem("nexus_citas");
      const localList = localRaw ? JSON.parse(localRaw) : [];
      localList.forEach((lc: any) => {
        if (lc.fecha !== fecha) return;
        const docMatch =
          areGuidsEqual(lc.professionalId, doctorId) ||
          (doctorName && lc.profesional && lc.profesional.toLowerCase().includes(doctorName.toLowerCase()));
        if (!docMatch) return;

        const startMin = parseToMin(lc.hora);
        const endMin = startMin + 30;
        busyIntervals.push({ startMin, endMin });
      });
    } catch {}

    const now = new Date();
    const isToday = fecha === todayIso;
    const currentTotalMin = isToday ? now.getHours() * 60 + now.getMinutes() : -1;

    const validSlots: string[] = [];

    for (let slotStart = startWorkMin; slotStart + effDuration <= endWorkMin; slotStart += 30) {
      const slotEnd = slotStart + effDuration;

      if (hasLunch && slotStart < lunchEndMin && slotEnd > lunchStartMin) {
        continue;
      }

      if (isToday && slotStart <= currentTotalMin) {
        continue;
      }

      const isOccupied = busyIntervals.some((b) => slotStart < b.endMin && slotEnd > b.startMin);
      if (isOccupied) {
        continue;
      }

      const slotH = Math.floor(slotStart / 60);
      const slotM = slotStart % 60;
      validSlots.push(`${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`);
    }

    const morning = validSlots.filter((s) => parseToMin(s) < 12 * 60);
    const afternoon = validSlots.filter((s) => parseToMin(s) >= 14 * 60);

    return {
      availableSlots: validSlots,
      morningSlots: morning,
      afternoonSlots: afternoon,
      isSunday: false,
      doctorWorksToday: true,
    };
  }, [fecha, doctorId, doctorName, durationMinutes, allAppointments, todayIso]);

  // Si la hora seleccionada ya no es válida para la fecha/doctor elegidos, limpiarla
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (value && !availableSlots.includes(value)) {
        onChange("");
      }
    } else if (value) {
      onChange("");
    }
  }, [availableSlots, value, onChange]);

  const activeColor =
    variant === "teal"
      ? "bg-teal-600 text-white shadow-md shadow-teal-600/30 ring-2 ring-teal-400/50 scale-[1.02]"
      : "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-2 ring-cyan-400/50 scale-[1.02]";

  const hoverColor =
    variant === "teal"
      ? "hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-400/40"
      : "hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-400/40";

  const textColor =
    variant === "teal"
      ? "text-teal-600 dark:text-teal-400"
      : "text-cyan-600 dark:text-cyan-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Clock size={14} className={textColor} />
          <span>Horarios Disponibles</span>
        </label>
        {doctorId && availableSlots.length > 0 && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles size={11} />
            {availableSlots.length} turnos libres
          </span>
        )}
      </div>

      {!doctorId && !doctorName ? (
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-center space-y-1">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-1">
            <UserCheck size={16} />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Seleccione un odontólogo para ver sus horarios disponibles
          </p>
          <p className="text-[11px] text-slate-400">
            Los turnos libres se calculan en tiempo real excluyendo citas previas y descansos.
          </p>
        </div>
      ) : loading ? (
        <div className="py-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="w-3.5 h-3.5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span>Consultando disponibilidad en tiempo real...</span>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-semibold">Sin turnos disponibles en esta fecha</p>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              {isSunday
                ? "La clínica permanece cerrada los domingos. Por favor seleccione de lunes a sábado."
                : !doctorWorksToday
                ? `${doctorName || "El odontólogo"} no atiende en el día seleccionado. Elige otra fecha u otro odontólogo.`
                : `Todos los turnos de ${doctorName || "este doctor"} ya están apartados o pasaron para hoy. Por favor selecciona otra fecha.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
          {morningSlots.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sun size={12} className="text-amber-500" />
                <span>Mañana (08:00 - 12:00)</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {morningSlots.map((slot) => {
                  const isSelected = value === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onChange(slot)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center relative ${
                        isSelected
                          ? activeColor
                          : `bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 ${hoverColor}`
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {afternoonSlots.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sunset size={12} className={textColor} />
                <span>Tarde (14:00 - 17:00)</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                {afternoonSlots.map((slot) => {
                  const isSelected = value === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => onChange(slot)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center relative ${
                        isSelected
                          ? activeColor
                          : `bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 ${hoverColor}`
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <span>* Solo se muestran horarios hábiles y sin citas previas.</span>
            {value ? (
              <span className={`font-semibold ${textColor}`}>
                Seleccionado: {value}
              </span>
            ) : (
              <span className="italic text-slate-400">Ningún horario seleccionado</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
