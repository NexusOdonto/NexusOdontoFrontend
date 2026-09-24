/** Clinic timezone: Colombia (UTC-5, no DST). */
const CLINIC_TIME_ZONE = "America/Bogota";

const PAST_MSG = "No se pueden programar citas en fechas u horas pasadas.";
const SUNDAY_MSG = "Los domingos la clínica permanece cerrada (día no laboral). Por favor selecciona de lunes a sábado.";
const SATURDAY_MSG =
  "Los sábados se atiende únicamente de 08:00 a 12:00. El horario no cabe en la jornada de la mañana según la duración del tratamiento.";
const LUNCH_MSG =
  "El horario de 12:00 a 14:00 corresponde al descanso clínico del equipo. La jornada es 08:00 a 12:00 | 14:00 a 17:00.";
const OUTSIDE_HOURS_MSG =
  "La cita no cabe en la jornada de atención según la duración del tratamiento (Lunes a Viernes: 08:00-12:00 | 14:00-17:00; Sábados: 08:00-12:00).";

/** Current clinic wall-clock as a comparable local Date (date/time parts from America/Bogota). */
export function getColombiaNow(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  let hour = Number(get("hour"));
  // Some engines emit "24" for midnight under hour12:false
  if (hour === 24) hour = 0;
  const minute = Number(get("minute"));
  const second = Number(get("second"));

  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * Validates past datetime (Colombia) and clinic jornada separately.
 * An start is accepted only when start + durationMinutes fits before lunch or clinic close
 * (weekdays 17:00 / Saturdays 12:00). Ending exactly at close is allowed.
 * Returns an error message or null when valid.
 */
export function validateClinicAppointmentSchedule(
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 30
): string | null {
  if (!dateStr || !timeStr) return null;

  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(m)) return null;

  const selected = new Date(y, mo - 1, d, h, m, 0);
  const now = getColombiaNow();
  // 5-minute grace matches backend clock-skew tolerance
  if (selected.getTime() < now.getTime() - 5 * 60 * 1000) {
    return PAST_MSG;
  }

  const dayOfWeek = selected.getDay(); // 0 = Domingo, 6 = Sábado
  const startMinutes = h * 60 + m;
  const duration = Math.max(15, durationMinutes || 30);
  const endMinutes = startMinutes + duration;

  const morningOpen = 8 * 60;
  const lunchStart = 12 * 60;
  const afternoonOpen = 14 * 60;
  const weekdayClose = 17 * 60;
  const saturdayClose = 12 * 60;

  // 1. Domingos cerrado
  if (dayOfWeek === 0) {
    return SUNDAY_MSG;
  }

  // 2. Sábados: 08:00 a 12:00 (inicio + duración ≤ 12:00)
  if (dayOfWeek === 6) {
    if (startMinutes < morningOpen || startMinutes >= saturdayClose || endMinutes > saturdayClose) {
      return SATURDAY_MSG;
    }
    return null;
  }

  // 3. Lunes a Viernes: no empezar en almuerzo; el bloque no cruza almuerzo ni cierra después de 17:00
  if (startMinutes >= lunchStart && startMinutes < afternoonOpen) {
    return LUNCH_MSG;
  }

  if (startMinutes < lunchStart) {
    if (startMinutes < morningOpen || endMinutes > lunchStart) {
      return OUTSIDE_HOURS_MSG;
    }
    return null;
  }

  if (startMinutes < afternoonOpen || startMinutes >= weekdayClose || endMinutes > weekdayClose) {
    return OUTSIDE_HOURS_MSG;
  }

  return null;
}
