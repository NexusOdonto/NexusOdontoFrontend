export type EstadoCita =
  | "Confirmada"
  | "En Atención"
  | "Pendiente"
  | "Disponible"
  | "No disponible";

export interface Cita {
  id: number;
  paciente: string;
  servicio: string;
  odontologo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoCita;
}

export const citasIniciales: Cita[] = [
  {
    id: 1,
    paciente: "Carlos Andrés Pérez",
    servicio: "Blanqueamiento Dental",
    odontologo: "Dra. Laura Gómez",
    fecha: "2026-09-01",
    horaInicio: "09:00",
    horaFin: "10:00",
    estado: "Confirmada",
  },
  {
    id: 2,
    paciente: "Lucía Ramírez",
    servicio: "Tratamiento de Endodoncia",
    odontologo: "Dra. Patricia Silva",
    fecha: "2026-09-02",
    horaInicio: "09:00",
    horaFin: "10:00",
    estado: "Confirmada",
  },
  {
    id: 3,
    paciente: "Andrés Pérez",
    servicio: "Limpieza y Valoración",
    odontologo: "Dra. Laura Gómez",
    fecha: "2026-09-01",
    horaInicio: "10:00",
    horaFin: "11:00",
    estado: "En Atención",
  },
  {
    id: 4,
    paciente: "Camila Rodríguez",
    servicio: "Control de Ortodoncia",
    odontologo: "Dra. Laura Gómez",
    fecha: "2026-09-04",
    horaInicio: "10:00",
    horaFin: "11:00",
    estado: "Confirmada",
  },
  {
    id: 5,
    paciente: "María Fernanda López",
    servicio: "Calza en Resina Pieza #16",
    odontologo: "Dr. Juan Martínez",
    fecha: "2026-09-03",
    horaInicio: "11:00",
    horaFin: "12:00",
    estado: "Confirmada",
  },
  {
    id: 6,
    paciente: "Espacio disponible",
    servicio: "Disponible para agendar",
    odontologo: "Dr. Juan Martínez",
    fecha: "2026-09-02",
    horaInicio: "12:00",
    horaFin: "13:00",
    estado: "Disponible",
  },
];

export const nombresDias = [
  "DOM",
  "LUN",
  "MAR",
  "MIÉ",
  "JUE",
  "VIE",
  "SÁB",
];

export const odontologos = [
  {
    nombre: "Todos los odontólogos",
    color: "bg-cyan-400",
  },
  {
    nombre: "Dra. Laura Gómez",
    color: "bg-cyan-400",
  },
  {
    nombre: "Dr. Juan Martínez",
    color: "bg-blue-400",
  },
  {
    nombre: "Dra. Patricia Silva",
    color: "bg-amber-400",
  },
];

export const tiposCita = [
  {
    nombre: "Confirmada",
    color: "bg-cyan-400",
  },
  {
    nombre: "En Atención",
    color: "bg-blue-400",
  },
  {
    nombre: "Pendiente",
    color: "bg-amber-400",
  },
  {
    nombre: "Libre",
    color: "bg-emerald-400",
  },
];

export function sumarDias(fecha: Date, dias: number) {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);

  return nuevaFecha;
}

export function obtenerInicioSemana(fecha: Date) {
  const nuevaFecha = new Date(fecha);
  const dia = nuevaFecha.getDay();

  nuevaFecha.setDate(nuevaFecha.getDate() - dia);
  nuevaFecha.setHours(0, 0, 0, 0);

  return nuevaFecha;
}

export function formatoFechaInput(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function obtenerNombreMes(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(fecha);
}

export function obtenerRangoSemana(inicioSemana: Date) {
  const finSemana = sumarDias(inicioSemana, 6);

  const inicio = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
  }).format(inicioSemana);

  const fin = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(finSemana);

  return `${inicio} - ${fin}`;
}

export function obtenerColorEvento(estado: EstadoCita) {
  switch (estado) {
    case "Confirmada":
      return {
        contenedor:
          "border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20",
        punto: "bg-cyan-400",
        titulo: "text-cyan-100",
        texto: "text-slate-400",
      };

    case "En Atención":
      return {
        contenedor:
          "border-blue-400/40 bg-blue-500/10 hover:bg-blue-500/20",
        punto: "bg-blue-400",
        titulo: "text-blue-100",
        texto: "text-slate-400",
      };

    case "Pendiente":
      return {
        contenedor:
          "border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20",
        punto: "bg-amber-400",
        titulo: "text-amber-100",
        texto: "text-slate-400",
      };

    case "Disponible":
      return {
        contenedor:
          "border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20",
        punto: "bg-emerald-400",
        titulo: "text-emerald-200",
        texto: "text-slate-400",
      };

    default:
      return {
        contenedor:
          "border-slate-600 bg-slate-800/50 hover:bg-slate-800",
        punto: "bg-slate-400",
        titulo: "text-slate-200",
        texto: "text-slate-400",
      };
  }
}