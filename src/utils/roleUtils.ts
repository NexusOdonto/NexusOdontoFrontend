/**
 * Helper para formatear y traducir identificadores UUID o códigos técnicos a nombres legibles de roles.
 */
export const formatRoleName = (role?: string | null): string => {
  if (!role) return "PACIENTE";

  const roleUpper = role.toUpperCase();

  // Mapeo por GUIDs conocidos de la base de datos
  if (roleUpper.includes("13000000-0000-0000-0000-000000000001") || roleUpper === "ADMIN" || roleUpper === "ADMINISTRADOR") {
    return "ADMINISTRADOR";
  }
  if (
    roleUpper.includes("13000000-0000-0000-0000-000000000002") ||
    roleUpper.includes("ODONT") ||
    roleUpper.includes("DOCTOR") ||
    roleUpper.includes("DENTIST")
  ) {
    return "ODONTÓLOGO";
  }
  if (
    roleUpper.includes("13000000-0000-0000-0000-000000000003") ||
    roleUpper.includes("RECEPC") ||
    roleUpper.includes("RECEPTION")
  ) {
    return "RECEPCIONISTA";
  }
  if (roleUpper.includes("13000000-0000-0000-0000-000000000004") || roleUpper.includes("AUXIL")) {
    return "AUXILIAR";
  }
  if (
    roleUpper.includes("13000000-0000-0000-0000-000000000005") ||
    roleUpper.includes("13000000") ||
    roleUpper.includes("PACIENT") ||
    roleUpper.includes("PATIENT")
  ) {
    return "PACIENTE";
  }

  // Si ya es un texto descriptivo, formatearlo limpio
  return role.replace(/_/g, " ").toUpperCase();
};

/**
 * Normaliza un GUID o UUID para comparaciones insensibles a mayúsculas y espacios.
 */
export const normalizeGuid = (guid?: unknown): string => {
  if (guid === null || guid === undefined) return "";
  if (typeof guid === "string") return guid.trim().toLowerCase();
  return String(guid).trim().toLowerCase();
};

/**
 * Compara dos identificadores GUID / RAW(16) de Oracle garantizando consistencia y seguridad de tipos.
 */
export const areGuidsEqual = (a?: unknown, b?: unknown): boolean => {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  const strA = typeof a === "string" ? a.trim().toLowerCase() : String(a).trim().toLowerCase();
  const strB = typeof b === "string" ? b.trim().toLowerCase() : String(b).trim().toLowerCase();
  if (!strA || !strB) return false;
  return strA === strB;
};

/** Seeded system administrator (AD001 / Carlos Administrator) — must not be deactivated. */
export const SEED_ADMIN_USER_ID = "1b000000-0000-0000-0000-000000000002";
export const SEED_ADMIN_PERSON_ID = "1b000000-0000-0000-0000-000000000001";
export const SEED_ADMIN_EMAIL = "admin@nexusodonto.com";

export const isSeedAdminUser = (usuario?: {
  id?: string;
  personId?: string;
  email?: string;
} | null): boolean => {
  if (!usuario) return false;
  return (
    areGuidsEqual(usuario.id, SEED_ADMIN_USER_ID) ||
    areGuidsEqual(usuario.personId, SEED_ADMIN_PERSON_ID) ||
    Boolean(usuario.email && usuario.email.trim().toLowerCase() === SEED_ADMIN_EMAIL)
  );
};
