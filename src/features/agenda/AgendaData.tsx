export type EstadoCita =
  | "Confirmada"
  | "En Atención"
  | "Pendiente"
  | "Completada"
  | "Disponible"
  | "No disponible";

export interface Cita {
  id: number;
  rawGuid?: string;
  patientId?: string;
  paciente: string;
  avatar?: string | null;
  servicio: string;
  odontologo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoCita;
  /** Cancelled appointments are hidden from the agenda. */
  cancelada?: boolean;
}

/** "No disponible" means no-show (or expired unattended, which the API also records as no-show). */
export function etiquetaEstadoAgenda(estado: EstadoCita): string {
  return estado === "No disponible" ? "No asistió" : estado;
}



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
    nombre: "Completada",
    color: "bg-emerald-400",
  },
  {
    nombre: "Libre",
    color: "bg-teal-400",
  },
];

export function sumarDias(fecha: Date, dias: number) {
  const nuevaFecha = new Date(fecha);

  nuevaFecha.setDate(
    nuevaFecha.getDate() + dias
  );

  return nuevaFecha;
}

export function obtenerInicioSemana(fecha: Date) {
  const nuevaFecha = new Date(fecha);

  const dia = nuevaFecha.getDay();

  nuevaFecha.setDate(
    nuevaFecha.getDate() - dia
  );

  nuevaFecha.setHours(0, 0, 0, 0);

  return nuevaFecha;
}

export function formatoFechaInput(fecha: Date) {
  const year = fecha.getFullYear();

  const month = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function obtenerNombreMes(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(fecha);
}

export function obtenerRangoSemana(
  inicioSemana: Date
) {
  const finSemana = sumarDias(
    inicioSemana,
    6
  );

  const inicio = new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "long",
    }
  ).format(inicioSemana);

  const fin = new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(finSemana);

  return `${inicio} - ${fin}`;
}

export function obtenerColorEvento(
  estado: EstadoCita
) {
  switch (estado) {
    case "Confirmada":
      return {
        contenedor:
          "border-teal-500/40 bg-teal-500/15 dark:bg-teal-500/10 text-teal-900 dark:text-teal-100 hover:bg-teal-500/25 dark:hover:bg-teal-500/20",
        punto: "bg-teal-500",
        titulo: "text-teal-950 dark:text-teal-100",
        texto: "text-teal-800/80 dark:text-slate-400",
      };

    case "En Atención":
      return {
        contenedor:
          "border-blue-500/40 bg-blue-500/15 dark:bg-blue-500/10 text-blue-900 dark:text-blue-100 hover:bg-blue-500/25 dark:hover:bg-blue-500/20",
        punto: "bg-blue-500",
        titulo: "text-blue-950 dark:text-blue-100",
        texto: "text-blue-800/80 dark:text-slate-400",
      };

    case "Pendiente":
      return {
        contenedor:
          "border-amber-500/40 bg-amber-500/15 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100 hover:bg-amber-500/25 dark:hover:bg-amber-500/20",
        punto: "bg-amber-500",
        titulo: "text-amber-950 dark:text-amber-100",
        texto: "text-amber-800/80 dark:text-slate-400",
      };

    case "Completada":
      return {
        contenedor:
          "border-purple-500/40 bg-purple-500/15 dark:bg-purple-500/10 text-purple-900 dark:text-purple-100 hover:bg-purple-500/25 dark:hover:bg-purple-500/20",
        punto: "bg-purple-500",
        titulo: "text-purple-950 dark:text-purple-100",
        texto: "text-purple-800/80 dark:text-slate-400",
      };

    case "Disponible":
      return {
        contenedor:
          "border-teal-500/40 bg-teal-500/15 dark:bg-teal-500/10 text-teal-900 dark:text-teal-100 hover:bg-teal-500/25 dark:hover:bg-teal-500/20",
        punto: "bg-teal-500",
        titulo: "text-teal-950 dark:text-teal-200",
        texto: "text-teal-800/80 dark:text-slate-400",
      };

    default:
      return {
        contenedor:
          "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200",
        punto: "bg-slate-400",
        titulo: "text-slate-900 dark:text-slate-200",
        texto: "text-slate-600 dark:text-slate-400",
      };
  }
}