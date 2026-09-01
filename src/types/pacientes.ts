export interface Paciente {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  estado: string;
  correo?: string;
  fechaNacimiento?: string;
  proximaCita?: string;
  alergias?: string;
  genero?: string;
}

export const PACIENTES_STORAGE_KEY = "nexusodontopacientes";
