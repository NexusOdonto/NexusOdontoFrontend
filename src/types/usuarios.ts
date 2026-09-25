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
  /** Account IsActive (not soft-deleted). Not the same as online presence. */
  isActive: boolean;
  /** Real-time session presence (SignalR / local presence hub). */
  isOnline?: boolean;
  status?: string;
  state?: string;
  avatar?: string | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}