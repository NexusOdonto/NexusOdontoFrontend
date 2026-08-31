export type RolUsuario =
  | "ADMINISTRADOR"
  | "ODONTOLOGO"
  | "RECEPCIONISTA"
  | "ASISTENTE"
  | "PACIENTE";

export interface Usuario {
  id: string;
  personId: string;
  name: string;
  email: string;
  roleIds: string[];
  permissions: string[];
  isActive: boolean;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}