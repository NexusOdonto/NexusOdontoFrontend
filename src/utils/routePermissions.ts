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
export function getUserRole(user: any): SystemRole {
  if (!user) return "PACIENTE";

  // 1. Revisar propiedad rol / role directa
  const roleName = String(user.rol || user.role || "").trim().toUpperCase();
  if (roleName.includes("ADMIN")) return "ADMINISTRADOR";
  if (roleName.includes("ODONTO") || roleName.includes("DENTIST") || roleName.includes("DOCTOR")) return "ODONTOLOGO";
  if (roleName.includes("RECEPCION") || roleName.includes("RECEPTION")) return "RECEPCIONISTA";
  if (roleName.includes("PACIENTE") || roleName.includes("PATIENT")) return "PACIENTE";

  // 2. Revisar arreglo roleIds / roles
  const rolesArray: any[] = Array.isArray(user.roleIds) ? user.roleIds : Array.isArray(user.roles) ? user.roles : [];
  for (const r of rolesArray) {
    const val = String(typeof r === "object" ? r?.id || r?.name || r?.code || "" : r).trim().toLowerCase();
    for (const [key, guid] of Object.entries(ROLE_GUIDS)) {
      if (val === guid.toLowerCase() || val === key.toLowerCase()) {
        return key as SystemRole;
      }
    }
  }

  // 3. Revisar permisos asignados como indicador secundario
  const permissions: string[] = Array.isArray(user.permissions) ? user.permissions : [];
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

/**
 * Valida de forma estricta si un usuario tiene acceso a una ruta específica según su rol.
 * El dashboard y perfil siempre son accesibles para todo usuario autenticado.
 */
export function hasRouteAccess(user: any, path: string): boolean {
  if (!user) return false;

  // Normalizar ruta para evitar discrepancias por query params o barras finales
  const cleanPath = path.split("?")[0].replace(/\/$/, "") || "/";

  // /dashboard, /perfil y / siempre son accesibles para cualquier usuario autenticado
  if (cleanPath === "/dashboard" || cleanPath === "/perfil" || cleanPath === "/") {
    return true;
  }

  const role = getUserRole(user);

  // Si es ADMINISTRADOR, acceso total
  if (role === "ADMINISTRADOR") {
    return true;
  }

  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || [];
  return allowedRoutes.includes(cleanPath);
}
