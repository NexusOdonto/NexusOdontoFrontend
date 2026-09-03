export type RolUsuario =
  | "ADMINISTRADOR"
  | "ODONTOLOGO"
  | "RECEPCIONISTA"
  | "ASISTENTE"
  | "PACIENTE";

export type EstadoUsuario =
  | "Activo"
  | "Inactivo";

export interface Usuario {
  id: string;
  personId: string;
  name: string;
  email: string;
  roleIds: string[];
  roleName?: string;
  roleCode?: string;
  permissionsCount?: number;
  modulesList?: string[];
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