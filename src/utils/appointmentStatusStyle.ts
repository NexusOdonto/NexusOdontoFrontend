/** Single colour palette for appointment status tags across the app. */
const ESTILOS: Record<string, string> = {
  pendiente: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  confirmada: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  "en atencion": "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  completada: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  "no asistio": "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  cancelada: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const DOTS: Record<string, string> = {
  pendiente: "bg-amber-500",
  confirmada: "bg-teal-500",
  "en atencion": "bg-blue-500",
  completada: "bg-purple-500",
  "no asistio": "bg-slate-500",
  cancelada: "bg-rose-500",
};

function clave(estado: string): string {
  return (estado || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function estiloEstadoCita(estado: string): string {
  return ESTILOS[clave(estado)] ?? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";
}

export function puntoEstadoCita(estado: string): string {
  return DOTS[clave(estado)] ?? "bg-slate-500";
}
