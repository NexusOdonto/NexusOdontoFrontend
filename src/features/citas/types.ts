export type EstadoCita =
  | "Agendada"
  | "Confirmada"
  | "Atendida"
  | "Cancelada";

export interface Cita {
  id: number;
  paciente: string;
  profesional: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
}
