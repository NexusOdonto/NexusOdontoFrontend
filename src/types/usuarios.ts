export type RolUsuario =
  | "Odontólogo"
  | "Recepcionista"
  | "Admin";

export type EstadoUsuario =
  | "Activo"
  | "Inactivo";

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
}