import { areGuidsEqual } from "./roleUtils";

/** Known seeded professionals — used when Persons/Employees catalogs are not readable (e.g. patient role). */
export const KNOWN_PROFESSIONAL_NAMES: Record<string, string> = {
  "1d000000-0000-0000-0000-000000000001": "Dra. Laura Gómez",
  "1d000000-0000-0000-0000-000000000002": "Dr. Roberto Martínez",
  "1d000000-0000-0000-0000-000000000003": "Dra. Ana Sofía Silva",
};

const LAURA_PROFESSIONAL_ID = "1d000000-0000-0000-0000-000000000001";
const UNKNOWN_PROFESSIONAL = "Profesional";

function isLauraName(name?: string | null): boolean {
  return !!name && /laura\s+g[oó]mez/i.test(String(name));
}

function knownNameById(professionalId?: string | null): string | undefined {
  if (!professionalId) return undefined;
  const key = String(professionalId).toLowerCase();
  if (KNOWN_PROFESSIONAL_NAMES[key]) return KNOWN_PROFESSIONAL_NAMES[key];
  for (const [id, name] of Object.entries(KNOWN_PROFESSIONAL_NAMES)) {
    if (areGuidsEqual(id, professionalId)) return name;
  }
  return undefined;
}

function formatFromParts(first?: string, last?: string, full?: string): string | undefined {
  if (full && String(full).trim()) return String(full).trim();
  const joined = `${first || ""} ${last || ""}`.replace(/\s+/g, " ").trim();
  if (!joined) return undefined;
  if (/^dr\.?\s|^dra\.?\s|^dr\(a\)\.?\s/i.test(joined)) return joined;
  return `Dr(a). ${joined}`;
}

/**
 * Resolve a professional display name by id from catalog / known seeds.
 * NEVER invents "Dra. Laura Gómez" for a different professionalId.
 */
export function resolveProfessionalDisplayName(options: {
  professionalId?: string | null;
  /** Prefer catalog/API name only when it is not a wrong hardcoded Laura for another id */
  professionalName?: string | null;
  catalogById?: Record<string, string>;
  professionals?: Array<{
    id?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }>;
}): string {
  const { professionalId, professionalName, catalogById, professionals } = options;
  const fromSeed = knownNameById(professionalId);

  // Known seeded IDs always win — prevents patient-role catalogs that invent Laura for every id.
  if (fromSeed) return fromSeed;

  if (professionalId && catalogById) {
    const fromMap = catalogById[String(professionalId).toLowerCase()];
    if (
      fromMap &&
      fromMap.trim() &&
      fromMap !== UNKNOWN_PROFESSIONAL &&
      !(isLauraName(fromMap) && !areGuidsEqual(professionalId, LAURA_PROFESSIONAL_ID))
    ) {
      return fromMap.trim();
    }
  }

  if (professionalId && professionals?.length) {
    const prof = professionals.find((p) => p.id && areGuidsEqual(p.id, professionalId));
    if (prof) {
      const fromProf = formatFromParts(prof.firstName, prof.lastName, prof.fullName || prof.name);
      if (
        fromProf &&
        !(isLauraName(fromProf) && !areGuidsEqual(professionalId, LAURA_PROFESSIONAL_ID))
      ) {
        return fromProf;
      }
    }
  }

  const raw = professionalName ? String(professionalName).trim() : "";
  if (raw && !/^especialista$/i.test(raw)) {
    if (professionalId && isLauraName(raw) && !areGuidsEqual(professionalId, LAURA_PROFESSIONAL_ID)) {
      return UNKNOWN_PROFESSIONAL;
    }
    return raw;
  }

  return UNKNOWN_PROFESSIONAL;
}

export const PROFESSIONAL_FALLBACK_LABEL = UNKNOWN_PROFESSIONAL;