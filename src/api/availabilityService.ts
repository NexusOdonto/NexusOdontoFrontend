import axiosClient from './axiosClient';
import { areGuidsEqual } from '../utils/roleUtils';
import {
  type TurnoDisponibilidad,
  getDefaultTurnosForDoctor,
  loadSavedDoctorSchedules,
  normalizeDoctorKey,
  saveDoctorSchedulesBulk,
} from '../utils/doctorSchedules';

export interface AvailabilityDto {
  id: string;
  professionalId: string;
  /** ISO: 1 = lunes ... 7 = domingo */
  startDay: number;
  endDay: number;
  startTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface AvailabilityRowDto {
  startDay: number;
  endDay: number;
  startTime: string;
  lunchStartTime: string;
  lunchEndTime: string;
  endTime: string;
}

export interface AffectedAppointmentDto {
  appointmentId: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  serviceId?: string;
  serviceName?: string;
  professionalId: string;
  professionalName?: string;
  startsAt: string;
  endsAt: string;
  statusCode?: string;
}

export interface RequiresRescheduleDto extends AffectedAppointmentDto {
  notificationStatus?: string;
  notifiedAt?: string;
}

export interface ReplaceScheduleResultDto {
  rows: AvailabilityDto[];
  affected: AffectedAppointmentDto[];
  notified: number;
  failed: number;
}

export const availabilityService = {
  /** La API devuelve todas las filas (ignora filtros); se filtra en el cliente. */
  getAll: async (): Promise<AvailabilityDto[]> => {
    const response = await axiosClient.get('/v1/Availabilities');
    return Array.isArray(response.data) ? response.data : [];
  },

  getActiveByProfessional: async (professionalId: string): Promise<AvailabilityDto[]> => {
    const all = await availabilityService.getAll();
    return all.filter((r) => r.isActive !== false && areGuidsEqual(r.professionalId, professionalId));
  },

  getImpact: async (professionalId: string, rows: AvailabilityRowDto[]): Promise<AffectedAppointmentDto[]> => {
    const response = await axiosClient.post('/v1/Availabilities/impact', { professionalId, rows });
    return Array.isArray(response.data) ? response.data : [];
  },

  replaceForProfessional: async (
    professionalId: string,
    rows: AvailabilityRowDto[],
    notifyPatients: boolean
  ): Promise<ReplaceScheduleResultDto> => {
    const response = await axiosClient.put(`/v1/Availabilities/professional/${professionalId}`, {
      rows,
      notifyPatients,
    });
    const data = response.data || {};
    return {
      rows: Array.isArray(data.rows) ? data.rows : [],
      affected: Array.isArray(data.affected) ? data.affected : [],
      notified: Number(data.notified) || 0,
      failed: Number(data.failed) || 0,
    };
  },

  getRequiresReschedule: async (): Promise<RequiresRescheduleDto[]> => {
    const response = await axiosClient.get('/v1/Appointments/requires-reschedule');
    return Array.isArray(response.data) ? response.data : [];
  },
};

const DIA_TO_ISO: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 7,
};

const ISO_TO_DIA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const normalizeDia = (dia: string) =>
  dia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const diaToIsoDay = (dia: string): number | undefined => DIA_TO_ISO[normalizeDia(dia)];

const toHHmm = (time?: string): string => {
  if (!time) return '';
  const [h = '0', m = '0'] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
};

const hasLunch = (t: TurnoDisponibilidad) =>
  t.almuerzoActivo ?? (t.dia !== 'Sábado' && t.horaFin > '13:00');

/** Un día activo = una fila con startDay = endDay. Sin almuerzo: lunchStart = lunchEnd = startTime. */
export const turnosToAvailabilityRows = (turnos: TurnoDisponibilidad[]): AvailabilityRowDto[] =>
  turnos
    .filter((t) => t.activo)
    .map((t) => {
      const day = diaToIsoDay(t.dia);
      if (!day) return null;
      const startTime = toHHmm(t.horaInicio);
      const endTime = toHHmm(t.horaFin);
      const lunch = hasLunch(t) && t.horaAlmuerzoInicio && t.horaAlmuerzoFin;
      return {
        startDay: day,
        endDay: day,
        startTime,
        lunchStartTime: lunch ? toHHmm(t.horaAlmuerzoInicio) : startTime,
        lunchEndTime: lunch ? toHHmm(t.horaAlmuerzoFin) : startTime,
        endTime,
      };
    })
    .filter((r): r is AvailabilityRowDto => r !== null)
    .sort((a, b) => a.startDay - b.startDay);

const rowCoversDay = (row: AvailabilityDto, day: number) => {
  const start = Number(row.startDay);
  const end = Number(row.endDay || row.startDay);
  return start <= end ? day >= start && day <= end : day >= start || day <= end;
};

/**
 * Expande las filas de la API (rangos startDay..endDay) en un turno por día (lunes a domingo).
 * El sillón no existe en la API: se conserva el del horario base (localStorage o por defecto).
 */
export const availabilityRowsToTurnos = (
  rows: AvailabilityDto[],
  baseTurnos?: TurnoDisponibilidad[]
): TurnoDisponibilidad[] => {
  const base = baseTurnos && baseTurnos.length > 0 ? baseTurnos : getDefaultTurnosForDoctor(0);
  const fallbackSillon = base.find((t) => t.sillon)?.sillon || 'Sillón 1 - Principal';

  return ISO_TO_DIA.slice(1).map((dia, i) => {
    const day = i + 1;
    const baseTurno = base.find((t) => diaToIsoDay(t.dia) === day);
    const row = rows.find((r) => rowCoversDay(r, day));
    const sillon = baseTurno?.sillon || fallbackSillon;

    if (!row) {
      return {
        dia,
        horaInicio: baseTurno?.horaInicio || '08:00',
        horaFin: baseTurno?.horaFin || '17:00',
        sillon,
        activo: false,
        almuerzoActivo: false,
        horaAlmuerzoInicio: baseTurno?.horaAlmuerzoInicio || '12:00',
        horaAlmuerzoFin: baseTurno?.horaAlmuerzoFin || '14:00',
      };
    }

    const lunchStart = toHHmm(row.lunchStartTime);
    const lunchEnd = toHHmm(row.lunchEndTime);
    const lunchActive = Boolean(lunchStart && lunchEnd && lunchStart !== lunchEnd);
    return {
      dia,
      horaInicio: toHHmm(row.startTime),
      horaFin: toHHmm(row.endTime),
      sillon,
      activo: true,
      almuerzoActivo: lunchActive,
      horaAlmuerzoInicio: lunchActive ? lunchStart : baseTurno?.horaAlmuerzoInicio || '12:00',
      horaAlmuerzoFin: lunchActive ? lunchEnd : baseTurno?.horaAlmuerzoFin || '14:00',
    };
  });
};

/** Claves con las que las vistas buscan el horario de un doctor en nexus_doctor_schedules. */
export const doctorScheduleKeys = (professional: {
  id?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}): string[] => {
  const names = [
    professional.fullName,
    professional.firstName || professional.lastName
      ? `Dr(a). ${professional.firstName || ''} ${professional.lastName || ''}`.trim()
      : undefined,
  ];
  const keys = new Set<string>();
  if (professional.id) keys.add(professional.id.toLowerCase().trim());
  names.forEach((n) => {
    if (!n) return;
    keys.add(n.toLowerCase().trim());
    const norm = normalizeDoctorKey(n);
    if (norm) keys.add(norm);
  });
  return [...keys];
};

type ProfessionalLike = { id?: string; fullName?: string; firstName?: string; lastName?: string };

/**
 * Construye el mapa clave → turnos a partir de las filas de la API, solo para los doctores que tienen filas.
 * Devuelve también los turnos por id de profesional.
 */
export const buildSchedulesFromApi = (
  rows: AvailabilityDto[],
  professionals: ProfessionalLike[],
  savedSchedules: Record<string, TurnoDisponibilidad[]>
): { entries: Record<string, TurnoDisponibilidad[]>; byProfessionalId: Record<string, TurnoDisponibilidad[]> } => {
  const entries: Record<string, TurnoDisponibilidad[]> = {};
  const byProfessionalId: Record<string, TurnoDisponibilidad[]> = {};
  const activeRows = rows.filter((r) => r.isActive !== false);

  professionals.forEach((p) => {
    if (!p.id) return;
    const profRows = activeRows.filter((r) => areGuidsEqual(r.professionalId, p.id));
    if (profRows.length === 0) return;
    const keys = doctorScheduleKeys(p);
    const baseKey = keys.find((k) => savedSchedules[k]);
    const turnos = availabilityRowsToTurnos(profRows, baseKey ? savedSchedules[baseKey] : undefined);
    byProfessionalId[p.id.toLowerCase()] = turnos;
    keys.forEach((k) => {
      entries[k] = turnos;
    });
  });

  return { entries, byProfessionalId };
};

/** Refleja en nexus_doctor_schedules los horarios guardados en la API (falla en silencio). */
export const syncDoctorSchedulesFromApi = async (professionals: ProfessionalLike[]): Promise<boolean> => {
  try {
    const rows = await availabilityService.getAll();
    const { entries } = buildSchedulesFromApi(rows, professionals, loadSavedDoctorSchedules());
    if (Object.keys(entries).length === 0) return false;
    saveDoctorSchedulesBulk(entries);
    return true;
  } catch {
    return false;
  }
};

export const isGuid = (value?: string): boolean =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const getAvailabilityErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { status?: number; data?: unknown } };
  const status = e?.response?.status;
  if (status === 404) {
    return 'El servidor todavía no tiene disponible la gestión de horarios (404). Tus cambios no se han perdido; intenta guardar de nuevo más tarde.';
  }
  if (status === 403) return 'No tienes permisos para modificar los horarios de este odontólogo.';
  const data = e?.response?.data as { message?: string; title?: string; detail?: string } | string | undefined;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const msg = data.message || data.detail || data.title;
    if (msg) return msg;
  }
  if (!e?.response) return 'No se pudo conectar con el servidor. Tus cambios no se han perdido; intenta de nuevo.';
  return fallback;
};
