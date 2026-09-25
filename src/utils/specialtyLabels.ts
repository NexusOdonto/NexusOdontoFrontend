/**
 * Etiquetas de especialidad odontológica en español para UI.
 * No altera códigos/IDs enviados a la API; solo presentación.
 *
 * Uso compartido: profesionales, citas, agenda, odontograma, etc.
 * Importar `getSpecialtyDisplayLabel` en lugar de mapear en cada vista.
 */

const SPECIALTY_DISPLAY_LABELS: Record<string, string> = {
  // English API / seed names
  "general dentistry": "Odontología General",
  orthodontics: "Ortodoncia",
  endodontics: "Endodoncia",
  periodontics: "Periodoncia",
  "pediatric dentistry": "Odontopediatría",
  "oral surgery": "Cirugía Oral",
  "oral and maxillofacial surgery": "Cirugía Oral",
  prosthodontics: "Prostodoncia",
  "cosmetic dentistry": "Estética Dental",
  "aesthetic dentistry": "Estética Dental",
  implantology: "Implantología",

  // Codes (underscored / spaced)
  odontologia_general: "Odontología General",
  "odontologia general": "Odontología General",
  ortodoncia: "Ortodoncia",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
  odontopediatria: "Odontopediatría",
  cirugia_oral: "Cirugía Oral",
  "cirugia oral": "Cirugía Oral",
  estetica_dental: "Estética Dental",
  "estetica dental": "Estética Dental",
  implantologia: "Implantología",
  prostodoncia: "Prostodoncia",
};

function normalizeSpecialtyKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Traduce nombre/código de especialidad (EN o code) a etiqueta corta en español.
 * Si ya viene en español (p. ej. "Odontología General"), se conserva.
 */
export function getSpecialtyDisplayLabel(raw?: string | null): string {
  if (!raw || !String(raw).trim()) return "Odontología General";

  const original = String(raw).trim();
  const lower = original.toLowerCase();
  const normalized = normalizeSpecialtyKey(original);
  const codeKey = normalized.replace(/\s+/g, "_");

  if (SPECIALTY_DISPLAY_LABELS[lower]) return SPECIALTY_DISPLAY_LABELS[lower];
  if (SPECIALTY_DISPLAY_LABELS[normalized]) return SPECIALTY_DISPLAY_LABELS[normalized];
  if (SPECIALTY_DISPLAY_LABELS[codeKey]) return SPECIALTY_DISPLAY_LABELS[codeKey];

  return original;
}

/** Alias usado por odontograma y otros módulos. */
export const toSpanishSpecialty = getSpecialtyDisplayLabel;
