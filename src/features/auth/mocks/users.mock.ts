export type Role = "ADMINISTRADOR" | "ODONTOLOGO" | "RECEPCIONISTA" | "PACIENTE";

export interface User {
  id: number | string;
  email: string;
  cedula: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Role;
  avatar?: string;
  telefono?: string;
  direccion?: string;
  sexo?: string;
}

export const MOCK_USERS: User[] = [];

export function authenticateUser(_identifier: string, _password: string): User | null {
  return null;
}