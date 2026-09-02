export interface Servicio {
  id: number | string;
  codigo?: string;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  activo: boolean;
  categoria?: string;
}
