/**
 * Los horarios guardados (nexus_doctor_schedules) usan valores como "Sillón 1 - Principal".
 * Se conservan tal cual para no romper datos existentes; en pantalla se muestran como "Consultorio".
 */
export function formatConsultorioLabel(value?: string | null): string {
  if (!value || !String(value).trim()) return "";
  return String(value).trim().replace(/^sill[oó]n\b/i, "Consultorio");
}

/** Versión corta sin descripción: "Sillón 2 - Quirúrgico" → "Consultorio 2". */
export function formatConsultorioShortLabel(value?: string | null): string {
  return formatConsultorioLabel(value).split(" - ")[0].trim();
}
