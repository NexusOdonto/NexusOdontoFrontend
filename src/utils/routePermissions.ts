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
    "/atencion-chat",
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
    "/profesionales",
    "/servicios",
    "/historia-clinica",
    "/odontograma",
    "/perfil",
  ],
  RECEPCIONISTA: [
    "/dashboard",
    "/citas",
    "/agenda",
    "/atencion-chat",
    "/pacientes",
    "/pacientes/nuevo",
    "/profesionales",
    "/servicios",
    "/perfil",
  ],
  PACIENTE: [
    "/dashboard",
    "/citas",
    "/servicios",
    "/profesionales",
    "/perfil",
  ],
};

// Mapeo de rutas a permisos de módulo
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/citas": "APPOINTMENTS:VIEW",
  "/agenda": "APPOINTMENTS:VIEW",
  "/atencion-chat": "CHATBOT:VIEW",
  "/pacientes": "PATIENTS:VIEW",
  "/pacientes/nuevo": "PATIENTS:CREATE",
  "/profesionales": "PEOPLE:VIEW",
  "/servicios": "CATALOGS:VIEW",
  "/historia-clinica": "CLINICAL:VIEW",
  "/odontograma": "ODONTOGRAM:VIEW",
  "/usuarios": "USERS:VIEW",
  "/roles-permisos": "ROLES:VIEW",
  "/perfil": "PROFILE:VIEW",
};

/**
 * Obtiene el rol canónico del usuario con soporte resiliente a múltiples formatos
 */
export function getUserRole(user: unknown): SystemRole {
  if (!user || typeof user !== "object") return "PACIENTE";
  const u = user as Record<string, unknown>;

  // 1. Revisar propiedad rol / role directa
  const roleName = String(u.rol || u.role || "").trim().toUpperCase();
  if (roleName.includes("ADMIN")) return "ADMINISTRADOR";
  if (roleName.includes("ODONTO") || roleName.includes("DENTIST") || roleName.includes("DOCTOR")) return "ODONTOLOGO";
  if (roleName.includes("RECEPCION") || roleName.includes("RECEPTION")) return "RECEPCIONISTA";
  if (roleName.includes("PACIENTE") || roleName.includes("PATIENT")) return "PACIENTE";

  // 2. Revisar arreglo roleIds / roles
  const rolesArray: unknown[] = Array.isArray(u.roleIds) ? u.roleIds : Array.isArray(u.roles) ? u.roles : [];
  for (const r of rolesArray) {
    const rObj = r as Record<string, unknown>;
    const val = String(typeof r === "object" ? rObj?.id || rObj?.name || rObj?.code || "" : r).trim().toLowerCase();
    for (const [key, guid] of Object.entries(ROLE_GUIDS)) {
      if (val === guid.toLowerCase() || val === key.toLowerCase()) {
        return key as SystemRole;
      }
    }
  }

  // 3. Revisar permisos asignados como indicador secundario
  const permissions: string[] = Array.isArray(u.permissions) ? (u.permissions as string[]) : [];
  if (permissions.includes("USERS:VIEW") || permissions.includes("ROLES:VIEW")) {
    return "ADMINISTRADOR";
  }
  if (permissions.includes("CLINICAL:VIEW") || permissions.includes("ODONTOGRAM:VIEW")) {
    return "ODONTOLOGO";
  }
  if (permissions.includes("PEOPLE:VIEW") || permissions.includes("CATALOGS:VIEW")) {
    return "RECEPCIONISTA";
  }

  return "PACIENTE";
}

const ROUTE_ALIASES: Record<string, string> = {
  "/catalogo-servicios": "/servicios",
  "/tarifas": "/servicios",
  "/catalogo": "/servicios",
  "/consultorios": "/profesionales",
  "/turnos": "/profesionales",
};

/**
 * Valida de forma estricta si un usuario tiene acceso a una ruta específica según su rol.
 * El dashboard y perfil siempre son accesibles para todo usuario autenticado.
 */
export function hasRouteAccess(user: unknown, path: string): boolean {
  if (!user) return false;

  // Normalizar ruta para evitar discrepancias por query params o barras finales
  const cleanPath = path.split("?")[0].replace(/\/$/, "") || "/";
  const targetPath = ROUTE_ALIASES[cleanPath] || cleanPath;

  // /dashboard, /perfil y / siempre son accesibles para cualquier usuario autenticado
  if (targetPath === "/dashboard" || targetPath === "/perfil" || targetPath === "/") {
    return true;
  }

  const role = getUserRole(user);

  // Si es ADMINISTRADOR, acceso total
  if (role === "ADMINISTRADOR") {
    return true;
  }

  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || [];
  return allowedRoutes.includes(targetPath);
}
