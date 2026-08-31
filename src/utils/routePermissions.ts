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
};

/**
 * Valida si un usuario tiene acceso a una ruta específica.
 * El dashboard y perfil siempre son accesibles para todo usuario autenticado.
 */
export function hasRouteAccess(
  user: { roleIds?: string[]; permissions?: string[] } | null,
  path: string
): boolean {
  if (!user) return false;

  // /dashboard, /perfil y / siempre son accesibles para cualquier usuario autenticado
  if (path === "/dashboard" || path === "/perfil" || path === "/") {
    return true;
  }

  const roleIds = user.roleIds || [];
  const permissions = user.permissions || [];

  // Si tiene permiso administrativo total (USERS:VIEW o rol ADMINISTRADOR), acceso completo
  const isAdmin =
    roleIds.some(
      (r) =>
        r.toUpperCase() === "ADMINISTRADOR" ||
        r.toUpperCase() === "ADMIN" ||
        r.toLowerCase() === ROLE_GUIDS.ADMINISTRADOR.toLowerCase()
    ) || permissions.includes("USERS:VIEW");

  if (isAdmin) {
    return true;
  }

  // 1. Validar coincidencia con las rutas permitidas del Rol
  for (const [roleKey, allowedRoutes] of Object.entries(ROLE_ALLOWED_ROUTES)) {
    const roleGuid = (ROLE_GUIDS as Record<string, string>)[roleKey];
    const userHasRole = roleIds.some(
      (r) =>
        r.toUpperCase() === roleKey.toUpperCase() ||
        (roleGuid && r.toLowerCase() === roleGuid.toLowerCase())
    );

    if (userHasRole && allowedRoutes.includes(path)) {
      return true;
    }
  }

  // 2. Validar coincidencia con los permisos específicos
  const requiredPermission = ROUTE_PERMISSIONS[path];
  if (requiredPermission && permissions.includes(requiredPermission)) {
    return true;
  }

  return false;
}
