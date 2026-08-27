export interface Paciente {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  estado: string;
}

export const PACIENTES_STORAGE_KEY = "nexusodontopacientes";
