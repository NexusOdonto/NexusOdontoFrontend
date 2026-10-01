import axiosClient from './axiosClient';
import { areGuidsEqual } from '../utils/roleUtils';
import {
  type PendingDoctorSchedule,
  type TurnoDisponibilidad,
  getDefaultTurnosForDoctor,
  loadSavedDoctorSchedules,
  normalizeDoctorKey,
  replacePendingDoctorSchedules,
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
  /** Primer día (YYYY-MM-DD, inclusive) en que rige la fila; null = desde siempre. */
  effectiveFrom?: string | null;
  /** Último día (YYYY-MM-DD, inclusive) en que rige la fila; null = sin fin. */
  effectiveTo?: string | null;
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
  /** Día (YYYY-MM-DD) desde el que rige el horario guardado: siempre mañana. */
  effectiveFrom?: string;
  /** true si el guardado solo canceló un cambio pendiente y se conserva el horario actual. */
  revertedToCurrent?: boolean;
}

/** Fecha de hoy en Colombia (YYYY-MM-DD). */
export const colombiaTodayIso = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

/** Fecha local de un Date (YYYY-MM-DD), para comparar con effectiveFrom/effectiveTo. */
export const dateToIso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const addDaysIso = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return dateToIso(new Date(y, m - 1, d + days));
};

/** Día desde el que rige un horario guardado hoy (los cambios nunca aplican el mismo día). */
export const colombiaTomorrowIso = (): string => addDaysIso(colombiaTodayIso(), 1);

const isoDay = (value?: string | null): string => (value ? String(value).slice(0, 10) : '');

/** Una fila rige el día `dateIso` si está activa y el día cae en [effectiveFrom, effectiveTo] (null = abierto). */
export const isRowEffectiveOn = (row: AvailabilityDto, dateIso: string): boolean => {
  if (row.isActive === false) return false;
  const from = isoDay(row.effectiveFrom);
  const to = isoDay(row.effectiveTo);
  if (from && dateIso < from) return false;
  if (to && dateIso > to) return false;
  return true;
};

/** "mañana (miércoles 30 de septiembre)" o "el jueves 1 de octubre". */
export const formatEffectiveFrom = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const txt = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(y, m - 1, d)
  );
  return iso === colombiaTomorrowIso() ? `mañana (${txt})` : `el ${txt}`;
};

export const availabilityService = {
  /** La API devuelve todas las filas (ignora filtros); se filtra en el cliente. */
  getAll: async (): Promise<AvailabilityDto[]> => {
    try {
      const response = await axiosClient.get('/v1/Availabilities');
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      // Si el backend responde 500 o no está disponible, retornamos [] para que el frontend use los horarios locales sin romperse
      return [];
    }
  },

  getActiveByProfessional: async (professionalId: string): Promise<AvailabilityDto[]> => {
    const all = await availabilityService.getAll();
    const today = colombiaTodayIso();
    return all.filter((r) => isRowEffectiveOn(r, today) && areGuidsEqual(r.professionalId, professionalId));
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
      effectiveFrom: data.effectiveFrom ? String(data.effectiveFrom).slice(0, 10) : undefined,
      revertedToCurrent: Boolean(data.revertedToCurrent),
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

export interface ApiSchedules {
  /** Horario que rige hoy, por cada clave del doctor. */
  entries: Record<string, TurnoDisponibilidad[]>;
  byProfessionalId: Record<string, TurnoDisponibilidad[]>;
  /** Horario ya guardado que empieza a regir en una fecha futura (normalmente mañana). */
  pendingEntries: Record<string, PendingDoctorSchedule>;
  pendingByProfessionalId: Record<string, PendingDoctorSchedule>;
  /** Claves de los doctores que tienen filas en la API (para limpiar pendientes viejos). */
  apiKeys: string[];
}

/**
 * Construye el mapa clave → turnos a partir de las filas de la API, solo para los doctores que tienen filas.
 * Separa el horario que rige hoy del que está pendiente (rige desde mañana).
 */
export const buildSchedulesFromApi = (
  rows: AvailabilityDto[],
  professionals: ProfessionalLike[],
  savedSchedules: Record<string, TurnoDisponibilidad[]>
): ApiSchedules => {
  const result: ApiSchedules = {
    entries: {},
    byProfessionalId: {},
    pendingEntries: {},
    pendingByProfessionalId: {},
    apiKeys: [],
  };
  const today = colombiaTodayIso();
  const activeRows = rows.filter((r) => r.isActive !== false);

  professionals.forEach((p) => {
    if (!p.id) return;
    const profRows = activeRows.filter((r) => areGuidsEqual(r.professionalId, p.id));
    if (profRows.length === 0) return;
    const keys = doctorScheduleKeys(p);
    result.apiKeys.push(...keys);
    const baseKey = keys.find((k) => savedSchedules[k]);
    const base = baseKey ? savedSchedules[baseKey] : undefined;
    const profId = p.id.toLowerCase();

    const currentRows = profRows.filter((r) => isRowEffectiveOn(r, today));
    if (currentRows.length > 0) {
      const turnos = availabilityRowsToTurnos(currentRows, base);
      result.byProfessionalId[profId] = turnos;
      keys.forEach((k) => {
        result.entries[k] = turnos;
      });
    }

    const futureRows = profRows.filter((r) => isoDay(r.effectiveFrom) > today);
    if (futureRows.length > 0) {
      const effectiveFrom = futureRows.map((r) => isoDay(r.effectiveFrom)).sort()[0];
      const pending: PendingDoctorSchedule = {
        effectiveFrom,
        turnos: availabilityRowsToTurnos(
          futureRows.filter((r) => isRowEffectiveOn(r, effectiveFrom)),
          base
        ),
      };
      result.pendingByProfessionalId[profId] = pending;
      keys.forEach((k) => {
        result.pendingEntries[k] = pending;
      });
    }
  });

  return result;
};

/** Guarda en localStorage el horario de hoy y el pendiente de cada doctor que tiene filas en la API. */
export const saveApiSchedules = (schedules: ApiSchedules) => {
  saveDoctorSchedulesBulk(schedules.entries);
  replacePendingDoctorSchedules(schedules.pendingEntries, schedules.apiKeys);
};

/** Refleja en nexus_doctor_schedules los horarios guardados en la API (falla en silencio). */
export const syncDoctorSchedulesFromApi = async (professionals: ProfessionalLike[]): Promise<boolean> => {
  try {
    const rows = await availabilityService.getAll();
    const schedules = buildSchedulesFromApi(rows, professionals, loadSavedDoctorSchedules());
    if (schedules.apiKeys.length === 0) return false;
    saveApiSchedules(schedules);
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
