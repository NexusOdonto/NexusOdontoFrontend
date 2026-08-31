export const ROLE_GUIDS = {
  ADMINISTRADOR: "13000000-0000-0000-0000-000000000001",
  ODONTOLOGO: "13000000-0000-0000-0000-000000000002",
  RECEPCIONISTA: "13000000-0000-0000-0000-000000000003",
  PACIENTE: "13000000-0000-0000-0000-000000000005",
} as const;

export type SystemRole = keyof typeof ROLE_GUIDS;

export const ROLE_ALLOWED_ROUTES: Record<SystemRole, string[]> = {
  ADMINISTRADOR: [
    "/dashboard",
    "/citas",
    "/agenda",
    "/pacientes",
    "/pacientes/nuevo",
    "/profesionales",
    "/servicios",
    "/historia-clinica",
    "/odontograma",
    "/usuarios",
    "/roles-permisos",
    "/configuracion",
    "/perfil",
  ],
  ODONTOLOGO: [
    "/dashboard",
    "/citas",
    "/agenda",
    "/pacientes",
    "/pacientes/nuevo",
    "/historia-clinica",
    "/odontograma",
    "/perfil",
  ],
  RECEPCIONISTA: [
    "/dashboard",
    "/citas",
    "/agenda",
    "/pacientes",
    "/pacientes/nuevo",
    "/profesionales",
    "/servicios",
    "/perfil",
  ],
  PACIENTE: [
    "/dashboard",
    "/citas",
    "/perfil",
  ],
};

// Mapeo de rutas a permisos de módulo
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/citas": "APPOINTMENTS:VIEW",
  "/agenda": "APPOINTMENTS:VIEW",
  "/pacientes": "PATIENTS:VIEW",
  "/pacientes/nuevo": "PATIENTS:CREATE",
  "/profesionales": "PEOPLE:VIEW",
  "/servicios": "CATALOGS:VIEW",
  "/historia-clinica": "CLINICAL:VIEW",
  "/odontograma": "ODONTOGRAM:VIEW",
  "/usuarios": "USERS:VIEW",
  "/roles-permisos": "ROLES:VIEW",
  "/configuracion": "CATALOGS:VIEW",
  "/perfil": "PROFILE:VIEW",
};

/**
 * Obtiene el rol canónico del usuario
 */
export function getUserRole(user: { roleIds?: string[]; rol?: string } | null): SystemRole {
  if (!user) return "PACIENTE";
  const roleName = (user.rol || "").toUpperCase();
  if (roleName === "ADMINISTRADOR" || roleName === "ADMIN") return "ADMINISTRADOR";
  if (roleName === "ODONTOLOGO" || roleName === "DENTIST") return "ODONTOLOGO";
  if (roleName === "RECEPCIONISTA" || roleName === "RECEPTIONIST") return "RECEPCIONISTA";
  if (roleName === "PACIENTE" || roleName === "PATIENT") return "PACIENTE";

  const roleIds = user.roleIds || [];
  for (const [key, guid] of Object.entries(ROLE_GUIDS)) {
    if (roleIds.some((r) => r.toLowerCase() === guid.toLowerCase() || r.toUpperCase() === key)) {
      return key as SystemRole;
    }
  }

  return "PACIENTE";
}

/**
 * Valida de forma estricta si un usuario tiene acceso a una ruta específica según su rol.
 * El dashboard y perfil siempre son accesibles para todo usuario autenticado.
 */
export function hasRouteAccess(
  user: { roleIds?: string[]; permissions?: string[]; rol?: string } | null,
  path: string
): boolean {
  if (!user) return false;

  // Normalizar ruta para evitar discrepancias
  const cleanPath = path.split("?")[0].replace(/\/$/, "") || "/";

  // /dashboard, /perfil y / siempre son accesibles para cualquier usuario autenticado
  if (cleanPath === "/dashboard" || cleanPath === "/perfil" || cleanPath === "/") {
    return true;
  }

  const role = getUserRole(user);

  // Si es ADMINISTRADOR o cuenta con permiso global de usuario, acceso total
  if (role === "ADMINISTRADOR") {
    return true;
  }

  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || [];
  return allowedRoutes.includes(cleanPath);
}
