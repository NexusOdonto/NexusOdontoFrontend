import type { AppointmentResponseDto } from "../../api/appointmentService";
import type { AvailabilityDto } from "../../api/availabilityService";
import { diaToIsoDay, doctorScheduleKeys } from "../../api/availabilityService";
import type { ProfessionalResponseDto } from "../../api/professionalService";
import type { TurnoDisponibilidad } from "../../utils/doctorSchedules";
import { formatConsultorioShortLabel } from "../../utils/consultorioLabel";
import { resolveProfessionalDisplayName } from "../../utils/professionalDisplayName";
import { getSpecialtyDisplayLabel } from "../../utils/specialtyLabels";
import { areGuidsEqual } from "../../utils/roleUtils";

type AvailabilityWithEffective = AvailabilityDto & {
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
};

/**
 * 🤖 [AI ASSISTANT GUIDE - MOTOR EN VIVO: EQUIPO EN TURNO HOY]:
 * -------------------------------------------------------------------------------------------------
 * 📌 PROPÓSITO:
 *    Calcula dinámicamente qué odontólogos están en jornada activa, en receso de almuerzo o fuera de turno hoy.
 * 
 * 🔍 LÓGICA DE COMPUTACIÓN:
 *    1. Extrae los minutos actuales del día (hora * 60 + minutos).
 *    2. Evalúa las franjas de turno y receso de almuerzo (lunchStartMinutes / lunchEndMinutes).
 *    3. Excluye citas canceladas o marcadas como inasistencia para calcular la carga real de pacientes del día.
 *    4. Nomenclatura: Formatea automáticamente "Sillón N" a "Consultorio N" para cumplir la directiva clínica.
 * 
 * 💡 TIPS PARA LA SUSTENTACIÓN:
 *    "Permite a recepcionistas y directores médicos visualizar de inmediato la capacidad operativa
 *    instalada de la clínica en cualquier momento del día."
 * -------------------------------------------------------------------------------------------------
 */
export interface EquipoTurnoItem {
  id: string;
  nombre: string;
  especialidad: string;
  /** "Consultorio N" o "" si no se conoce */
  consultorio: string;
  citasHoy: number;
  startMinutes: number;
  endMinutes: number;
  lunchStartMinutes?: number;
  lunchEndMinutes?: number;
}

const CANCELLED_STATUS_ID = "10000000-0000-0000-0000-000000000005";
const NO_SHOW_STATUS_ID = "10000000-0000-0000-0000-000000000006";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const toLocalDateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const toMinutes = (time?: string | null): number | undefined => {
  if (!time) return undefined;
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return undefined;
  return h * 60 + (Number.isNaN(m) ? 0 : m || 0);
};

const isoDayOf = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

const rowCoversDay = (row: AvailabilityDto, day: number) => {
  const start = Number(row.startDay);
  const end = Number(row.endDay || row.startDay);
  return start <= end ? day >= start && day <= end : day >= start || day <= end;
};

/** Fechas de vigencia opcionales; si faltan, la fila se considera abierta. */
const rowEffectiveOn = (row: AvailabilityWithEffective, dateKey: string) => {
  const from = row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : "";
  const to = row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : "";
  return (!from || from <= dateKey) && (!to || to >= dateKey);
};

export const isAppointmentCountable = (a: AppointmentResponseDto) => {
  if (a.cancelledAt) return false;
  const stId = String(a.appointmentStatusId || "").toLowerCase();
  if (stId === CANCELLED_STATUS_ID || stId === NO_SHOW_STATUS_ID) return false;
  const sn = String(a.statusName || "").toUpperCase();
  return !(sn.includes("CANCEL") || sn.includes("NO_ASIST") || sn.includes("NO ASIST") || sn.includes("NO_SHOW") || sn.includes("NOSHOW") || sn.includes("NO SHOW"));
};

/** Turno guardado localmente (nexus_doctor_schedules) de un profesional para una fecha, si existe. */
export const findSavedTurno = (
  professional: ProfessionalResponseDto,
  date: Date,
  savedSchedules: Record<string, TurnoDisponibilidad[]>
): TurnoDisponibilidad | undefined => {
  const key = doctorScheduleKeys(professional).find((k) => Array.isArray(savedSchedules[k]));
  if (!key) return undefined;
  const isoDay = isoDayOf(date);
  return savedSchedules[key].find((t) => diaToIsoDay(t.dia) === isoDay);
};

export const getConsultorioForProfessional = (
  professional: ProfessionalResponseDto | undefined,
  date: Date,
  savedSchedules: Record<string, TurnoDisponibilidad[]>
): string => {
  if (!professional) return "";
  return formatConsultorioShortLabel(findSavedTurno(professional, date, savedSchedules)?.sillon);
};

/**
 * Profesionales activos con horario vigente hoy.
 * Horas desde la API de disponibilidad; si esa API no respondió, se usan los horarios guardados localmente.
 * El consultorio solo existe en nexus_doctor_schedules.
 */
export const buildEquipoEnTurno = (options: {
  professionals: ProfessionalResponseDto[];
  availabilityRows: AvailabilityDto[] | null;
  appointments: AppointmentResponseDto[];
  savedSchedules: Record<string, TurnoDisponibilidad[]>;
  today?: Date;
}): EquipoTurnoItem[] => {
  const { professionals, availabilityRows, appointments, savedSchedules } = options;
  const today = options.today || new Date();
  const todayKey = toLocalDateKey(today);
  const isoDay = isoDayOf(today);

  const citasTodayByProf: Record<string, number> = {};
  appointments.forEach((a) => {
    if (!a.professionalId || !a.startsAt || !isAppointmentCountable(a)) return;
    const d = new Date(a.startsAt);
    const key = Number.isNaN(d.getTime()) ? String(a.startsAt).slice(0, 10) : toLocalDateKey(d);
    if (key !== todayKey) return;
    const pid = String(a.professionalId).toLowerCase();
    citasTodayByProf[pid] = (citasTodayByProf[pid] || 0) + 1;
  });

  const countFor = (profId: string) =>
    Object.entries(citasTodayByProf).reduce((acc, [pid, n]) => (areGuidsEqual(pid, profId) ? acc + n : acc), 0);

  const items: EquipoTurnoItem[] = [];

  professionals
    .filter((p) => p.id && p.isActive !== false)
    .forEach((p) => {
      let startMinutes: number | undefined;
      let endMinutes: number | undefined;
      let lunchStartMinutes: number | undefined;
      let lunchEndMinutes: number | undefined;

      if (availabilityRows) {
        const row = (availabilityRows as AvailabilityWithEffective[])
          .filter(
            (r) =>
              r.isActive !== false &&
              areGuidsEqual(r.professionalId, p.id) &&
              rowCoversDay(r, isoDay) &&
              rowEffectiveOn(r, todayKey)
          )
          .sort((a, b) => String(b.effectiveFrom || "").localeCompare(String(a.effectiveFrom || "")))[0];
        if (!row) return;
        startMinutes = toMinutes(row.startTime);
        endMinutes = toMinutes(row.endTime);
        lunchStartMinutes = toMinutes(row.lunchStartTime);
        lunchEndMinutes = toMinutes(row.lunchEndTime);
      } else {
        const turno = findSavedTurno(p, today, savedSchedules);
        if (!turno || !turno.activo) return;
        startMinutes = toMinutes(turno.horaInicio);
        endMinutes = toMinutes(turno.horaFin);
        if (turno.almuerzoActivo) {
          lunchStartMinutes = toMinutes(turno.horaAlmuerzoInicio);
          lunchEndMinutes = toMinutes(turno.horaAlmuerzoFin);
        }
      }

      if (startMinutes === undefined || endMinutes === undefined) return;
      const hasLunch =
        lunchStartMinutes !== undefined && lunchEndMinutes !== undefined && lunchStartMinutes < lunchEndMinutes;

      items.push({
        id: p.id,
        nombre: resolveProfessionalDisplayName({ professionalId: p.id, professionals }),
        especialidad: getSpecialtyDisplayLabel(p.specialtyName),
        consultorio: getConsultorioForProfessional(p, today, savedSchedules),
        citasHoy: countFor(p.id),
        startMinutes,
        endMinutes,
        lunchStartMinutes: hasLunch ? lunchStartMinutes : undefined,
        lunchEndMinutes: hasLunch ? lunchEndMinutes : undefined,
      });
    });

  return items;
};

export const isEnTurnoAhora = (item: EquipoTurnoItem, now: Date = new Date()) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < item.startMinutes || minutes >= item.endMinutes) return false;
  if (
    item.lunchStartMinutes !== undefined &&
    item.lunchEndMinutes !== undefined &&
    minutes >= item.lunchStartMinutes &&
    minutes < item.lunchEndMinutes
  ) {
    return false;
  }
  return true;
};
