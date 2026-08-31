export type EstadoCita =
  | "Pendiente"
  | "Confirmada"
  | "En Atención"
  | "Completada"
  | "Cancelada";

export interface Cita {
  id: number;
  paciente: string;
  pacienteEmail?: string;
  pacienteCedula?: string;
  profesional?: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  motivo?: string;
}
