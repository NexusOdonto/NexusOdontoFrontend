/**
 * Utilidades para la gestión y sincronización de horarios, turnos y descansos de odontólogos.
 * Permite que cualquier edición en la vista de Profesionales se refleje inmediatamente en la Agenda y Citas.
 */

export interface TurnoDisponibilidad {
  dia: string;
  horaInicio: string;
  horaFin: string;
  sillon: string;
  activo: boolean;
  almuerzoActivo?: boolean;
  horaAlmuerzoInicio?: string;
  horaAlmuerzoFin?: string;
}

export const SCHEDULES_STORAGE_KEY = "nexus_doctor_schedules";

export const SILLONES_DISPONIBLES = [
  "Sillón 1 - Principal",
  "Sillón 2 - Quirúrgico",
  "Sillón 3 - Estética Dental",
  "Sillón 4 - Infantil & Preventivo",
];

export const NOMBRES_DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const getDefaultTurnosForDoctor = (idx: number = 0, customSillon?: string): TurnoDisponibilidad[] => {
  const mainSillon = customSillon || SILLONES_DISPONIBLES[idx % SILLONES_DISPONIBLES.length];
  const secondarySillon = SILLONES_DISPONIBLES[(idx + 1) % SILLONES_DISPONIBLES.length];

  return [
    { dia: "Lunes", horaInicio: "08:00", horaFin: "17:00", sillon: mainSillon, activo: true, almuerzoActivo: true, horaAlmuerzoInicio: "12:00", horaAlmuerzoFin: "14:00" },
    { dia: "Martes", horaInicio: "08:00", horaFin: "17:00", sillon: mainSillon, activo: true, almuerzoActivo: true, horaAlmuerzoInicio: "12:00", horaAlmuerzoFin: "14:00" },
    { dia: "Miércoles", horaInicio: "08:00", horaFin: "17:00", sillon: secondarySillon, activo: true, almuerzoActivo: true, horaAlmuerzoInicio: "12:00", horaAlmuerzoFin: "14:00" },
    { dia: "Jueves", horaInicio: "08:00", horaFin: "17:00", sillon: mainSillon, activo: true, almuerzoActivo: true, horaAlmuerzoInicio: "12:00", horaAlmuerzoFin: "14:00" },
    { dia: "Viernes", horaInicio: "08:00", horaFin: "17:00", sillon: mainSillon, activo: true, almuerzoActivo: true, horaAlmuerzoInicio: "12:00", horaAlmuerzoFin: "14:00" },
    { dia: "Sábado", horaInicio: "08:00", horaFin: "12:00", sillon: mainSillon, activo: idx % 2 === 0, almuerzoActivo: false, horaAlmuerzoInicio: "12:00", horaAlmuerzoFin: "14:00" },
    { dia: "Domingo", horaInicio: "08:00", horaFin: "12:00", sillon: mainSillon, activo: false, almuerzoActivo: false, horaAlmuerzoInicio: "12:00", horaAlmuerzoFin: "14:00" },
  ];
};

/** Normaliza nombres eliminando prefijos tipo Dr(a)., tildes y espacios */
export function normalizeDoctorKey(nameOrId?: string | null): string {
  if (!nameOrId) return "";
  return nameOrId
    .toLowerCase()
    .replace(/^dr\(a\)\.?\s*/i, "")
    .replace(/^dr\.?\s*/i, "")
    .replace(/^dra\.?\s*/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export const loadSavedDoctorSchedules = (): Record<string, TurnoDisponibilidad[]> => {
  try {
    const raw = localStorage.getItem(SCHEDULES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: Record<string, TurnoDisponibilidad[]> = JSON.parse(raw);
    Object.keys(parsed).forEach((key) => {
      if (Array.isArray(parsed[key])) {
        parsed[key] = parsed[key].map((t) => ({
          ...t,
          almuerzoActivo:
            t.almuerzoActivo !== undefined
              ? t.almuerzoActivo
              : t.dia !== "Sábado" && t.dia !== "Domingo" && t.horaFin > "13:00",
          horaAlmuerzoInicio: t.horaAlmuerzoInicio || "12:00",
          horaAlmuerzoFin: t.horaAlmuerzoFin || "14:00",
        }));
      }
    });
    return parsed;
  } catch {
    return {};
  }
};

export const saveDoctorSchedule = (profIdOrName: string, turnos: TurnoDisponibilidad[]) => {
  try {
    const schedules = loadSavedDoctorSchedules();
    const rawKey = profIdOrName.toLowerCase().trim();
    const normKey = normalizeDoctorKey(profIdOrName);

    schedules[rawKey] = turnos;
    if (normKey && normKey !== rawKey) {
      schedules[normKey] = turnos;
    }

    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));

    // Notificar en tiempo real a todas las vistas abiertas
    window.dispatchEvent(new CustomEvent("nexus_schedules_updated", { detail: { doctor: profIdOrName } }));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Error saving doctor schedule:", err);
  }
};

/** Escribe varios horarios (clave → turnos) de una sola vez y notifica a las vistas abiertas. */
export const saveDoctorSchedulesBulk = (entries: Record<string, TurnoDisponibilidad[]>) => {
  const keys = Object.keys(entries);
  if (keys.length === 0) return;
  try {
    const schedules = loadSavedDoctorSchedules();
    keys.forEach((k) => {
      schedules[k.toLowerCase().trim()] = entries[k];
    });
    localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
    window.dispatchEvent(new CustomEvent("nexus_schedules_updated", { detail: { bulk: true } }));
  } catch (err) {
    console.error("Error saving doctor schedules:", err);
  }
};

/**
 * Retorna el turno específico de un doctor para una fecha determinada.
 */
export function getDoctorTurnoForDate(
  doctorNameOrId: string,
  date: Date,
  schedulesMap?: Record<string, TurnoDisponibilidad[]>
): TurnoDisponibilidad {
  const map = schedulesMap || loadSavedDoctorSchedules();
  const rawKey = (doctorNameOrId || "").toLowerCase().trim();
  const normKey = normalizeDoctorKey(doctorNameOrId);

  let doctorTurnos: TurnoDisponibilidad[] | undefined = map[rawKey] || map[normKey];

  if (!doctorTurnos) {
    // Buscar coincidencia parcial
    const foundKey = Object.keys(map).find(
      (k) => (normKey && k.includes(normKey)) || (k && normKey && normKey.includes(k))
    );
    if (foundKey) {
      doctorTurnos = map[foundKey];
    }
  }

  const dayOfWeekIndex = date.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado
  const nombreDia = NOMBRES_DIAS_SEMANA[dayOfWeekIndex];

  if (doctorTurnos && Array.isArray(doctorTurnos)) {
    const matched = doctorTurnos.find((t) => t.dia.toLowerCase() === nombreDia.toLowerCase());
    if (matched) {
      return matched;
    }
  }

  // Fallback por defecto según día de la semana
  const defaultTurnos = getDefaultTurnosForDoctor(0);
  const def = defaultTurnos.find((t) => t.dia.toLowerCase() === nombreDia.toLowerCase());
  return (
    def || {
      dia: nombreDia,
      horaInicio: "08:00",
      horaFin: dayOfWeekIndex === 6 ? "12:00" : "17:00",
      sillon: "Sillón 1 - Principal",
      activo: dayOfWeekIndex !== 0,
      almuerzoActivo: dayOfWeekIndex >= 1 && dayOfWeekIndex <= 5,
      horaAlmuerzoInicio: "12:00",
      horaAlmuerzoFin: "14:00",
    }
  );
}

export interface DoctorScheduleBlocks {
  hasTurno: boolean;
  isFullDayClosed: boolean;
  horaInicio: string;
  horaFin: string;
  almuerzoActivo: boolean;
  horaAlmuerzoInicio?: string;
  horaAlmuerzoFin?: string;
  // Minutos desde las 00:00
  startMinutes: number;
  endMinutes: number;
  lunchStartMinutes?: number;
  lunchEndMinutes?: number;
  // Bloques para renderizado visual en la cuadrícula (07:00 a 19:00)
  blocks: {
    type: "early" | "lunch" | "closed" | "day_off";
    title: string;
    subTitle?: string;
    startHour: number; // en horas decimales, ej. 7 o 16.5
    endHour: number;
    topPx: number;
    heightPx: number;
  }[];
}

/**
 * Calcula los bloques visuales de descanso y no-disponibilidad de un odontólogo para un día.
 * La cuadrícula por defecto va de 07:00 a 19:00 (12 horas).
 */
export function getDoctorScheduleBlocks(
  doctorNameOrId: string,
  date: Date,
  horaAlturaPx: number,
  gridStartHour = 7,
  gridEndHour = 19,
  schedulesMap?: Record<string, TurnoDisponibilidad[]>
): DoctorScheduleBlocks {
  const turno = getDoctorTurnoForDate(doctorNameOrId, date, schedulesMap);

  const parseHourToDecimal = (horaStr: string): number => {
    if (!horaStr) return 0;
    const [h, m] = horaStr.split(":").map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  const toPx = (hourDecimal: number) => {
    return Math.max(0, (hourDecimal - gridStartHour) * horaAlturaPx);
  };

  const blocks: DoctorScheduleBlocks["blocks"] = [];

  // 1. Día completo no laborable
  if (!turno.activo || date.getDay() === 0) {
    blocks.push({
      type: "day_off",
      title: date.getDay() === 0 ? "Día No Laboral" : "Sin Turno Asignado",
      subTitle: date.getDay() === 0 ? "Clínica cerrada los Domingos" : "No atiende este día",
      startHour: gridStartHour,
      endHour: gridEndHour,
      topPx: 2,
      heightPx: (gridEndHour - gridStartHour) * horaAlturaPx - 4,
    });

    return {
      hasTurno: false,
      isFullDayClosed: true,
      horaInicio: turno.horaInicio,
      horaFin: turno.horaFin,
      almuerzoActivo: false,
      startMinutes: 0,
      endMinutes: 0,
      blocks,
    };
  }

  const startHourDec = parseHourToDecimal(turno.horaInicio);
  const endHourDec = parseHourToDecimal(turno.horaFin);
  const lunchStartDec = turno.horaAlmuerzoInicio ? parseHourToDecimal(turno.horaAlmuerzoInicio) : 12;
  const lunchEndDec = turno.horaAlmuerzoFin ? parseHourToDecimal(turno.horaAlmuerzoFin) : 14;

  // 2. Bloque previo al inicio de turno (ej. de 07:00 a 08:00 o 09:00)
  if (startHourDec > gridStartHour) {
    const topPx = toPx(gridStartHour) + 2;
    const heightPx = Math.max(10, (startHourDec - gridStartHour) * horaAlturaPx - 4);
    blocks.push({
      type: "early",
      title: `Inicia a las ${turno.horaInicio}`,
      subTitle: "Fuera de turno de atención",
      startHour: gridStartHour,
      endHour: startHourDec,
      topPx,
      heightPx,
    });
  }

  // 3. Bloque de almuerzo (si está activo para este día)
  if (turno.almuerzoActivo && lunchStartDec < lunchEndDec && lunchStartDec >= startHourDec && lunchEndDec <= endHourDec) {
    const topPx = toPx(lunchStartDec) + 2;
    const heightPx = Math.max(10, (lunchEndDec - lunchStartDec) * horaAlturaPx - 4);
    blocks.push({
      type: "lunch",
      title: "Receso de Almuerzo",
      subTitle: `${turno.horaAlmuerzoInicio} a ${turno.horaAlmuerzoFin}`,
      startHour: lunchStartDec,
      endHour: lunchEndDec,
      topPx,
      heightPx,
    });
  }

  // 4. Bloque posterior al fin de turno (ej. si sale a las 16:00, bloque de 16:00 a 19:00)
  if (endHourDec < gridEndHour) {
    const topPx = toPx(endHourDec) + 2;
    const heightPx = Math.max(10, (gridEndHour - endHourDec) * horaAlturaPx - 4);
    blocks.push({
      type: "closed",
      title: `Fin de Jornada (${turno.horaFin})`,
      subTitle: "Turno finalizado",
      startHour: endHourDec,
      endHour: gridEndHour,
      topPx,
      heightPx,
    });
  }

  return {
    hasTurno: true,
    isFullDayClosed: false,
    horaInicio: turno.horaInicio,
    horaFin: turno.horaFin,
    almuerzoActivo: !!turno.almuerzoActivo,
    horaAlmuerzoInicio: turno.horaAlmuerzoInicio,
    horaAlmuerzoFin: turno.horaAlmuerzoFin,
    startMinutes: Math.round(startHourDec * 60),
    endMinutes: Math.round(endHourDec * 60),
    lunchStartMinutes: turno.almuerzoActivo ? Math.round(lunchStartDec * 60) : undefined,
    lunchEndMinutes: turno.almuerzoActivo ? Math.round(lunchEndDec * 60) : undefined,
    blocks,
  };
}

/**
 * Valida si un horario solicitado está permitido según el turno configurado del odontólogo.
 */
export function validateDoctorScheduleAppointment(
  doctorNameOrId: string,
  dateStr: string,
  timeStr: string,
  durationMinutes = 30,
  schedulesMap?: Record<string, TurnoDisponibilidad[]>
): string | null {
  if (!doctorNameOrId || !dateStr || !timeStr) return null;

  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(m)) return null;

  const date = new Date(y, mo - 1, d);
  const turno = getDoctorTurnoForDate(doctorNameOrId, date, schedulesMap);

  if (!turno.activo || date.getDay() === 0) {
    return date.getDay() === 0
      ? "Los domingos la clínica permanece cerrada (día no laboral)."
      : `${doctorNameOrId} no atiende los días ${turno.dia} (día no programado en su turno).`;
  }

  const apptStartMinutes = h * 60 + m;
  const apptEndMinutes = apptStartMinutes + (durationMinutes || 30);

  const [startH, startM] = turno.horaInicio.split(":").map(Number);
  const turnoStartMinutes = startH * 60 + startM;

  const [endH, endM] = turno.horaFin.split(":").map(Number);
  const turnoEndMinutes = endH * 60 + endM;

  // Fuera del turno general
  if (apptStartMinutes < turnoStartMinutes) {
    return `${doctorNameOrId} inicia su jornada a las ${turno.horaInicio} los ${turno.dia}. Por favor selecciona una hora posterior.`;
  }

  if (apptEndMinutes > turnoEndMinutes) {
    return `${doctorNameOrId} finaliza su jornada a las ${turno.horaFin} los ${turno.dia}. El tratamiento seleccionado (${durationMinutes} min) excede la hora de salida.`;
  }

  // Almuerzo
  if (turno.almuerzoActivo && turno.horaAlmuerzoInicio && turno.horaAlmuerzoFin) {
    const [lsh, lsm] = turno.horaAlmuerzoInicio.split(":").map(Number);
    const lunchStartMinutes = lsh * 60 + lsm;

    const [leh, lem] = turno.horaAlmuerzoFin.split(":").map(Number);
    const lunchEndMinutes = leh * 60 + lem;

    const startsInLunch = apptStartMinutes >= lunchStartMinutes && apptStartMinutes < lunchEndMinutes;
    const endsInLunch = apptStartMinutes < lunchStartMinutes && apptEndMinutes > lunchStartMinutes;

    if (startsInLunch || endsInLunch) {
      return `☕ ${doctorNameOrId} se encuentra en su receso de almuerzo (${turno.horaAlmuerzoInicio} a ${turno.horaAlmuerzoFin}). Selecciona un horario antes o después de este receso.`;
    }
  }

  return null;
}
