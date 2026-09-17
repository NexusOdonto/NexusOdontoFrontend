export type EstadoCita =
  | "Pendiente"
  | "Confirmada"
  | "En Atención"
  | "Completada"
  | "Cancelada"
  | "No Asistió";

export interface Cita {
  id: number;
  appointmentId?: string;
  patientId?: string;
  personId?: string;
  professionalId?: string;
  serviceId?: string;
  paciente: string;
  pacienteEmail?: string;
  pacienteCedula?: string;
  profesional?: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  motivo?: string;
  canBeAttended?: boolean;
  attendanceMessage?: string;
  startsAt?: string;
  endsAt?: string;
  rawDate?: string;
}
