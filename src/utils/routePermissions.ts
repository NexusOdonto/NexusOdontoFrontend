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
    "/historia-clinica",
    "/odontograma",
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

export const ROLE_PERMISSIONS_STORAGE_KEY = "nexus_custom_role_permissions_v1";

export const ROUTE_TO_MODULE: Record<string, string> = {
  "/citas": "citas",
  "/agenda": "citas",
  "/atencion-chat": "citas",
  "/pacientes": "pacientes",
  "/pacientes/nuevo": "pacientes",
  "/odontograma": "odontograma",
  "/historia-clinica": "historia_clinica",
  "/servicios": "servicios",
  "/profesionales": "profesionales",
  "/usuarios": "usuarios",
  "/roles-permisos": "roles",
  "/configuracion": "roles",
};

export const DEFAULT_ROLE_PERMISSIONS: Record<
  string,
  Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }>
> = {
  ADMINISTRADOR: {
    pacientes: { ver: true, crear: true, editar: true, eliminar: true },
    citas: { ver: true, crear: true, editar: true, eliminar: true },
    odontograma: { ver: true, crear: true, editar: true, eliminar: true },
    historia_clinica: { ver: true, crear: true, editar: true, eliminar: true },
    servicios: { ver: true, crear: true, editar: true, eliminar: true },
    profesionales: { ver: true, crear: true, editar: true, eliminar: true },
    usuarios: { ver: true, crear: true, editar: true, eliminar: true },
    roles: { ver: true, crear: true, editar: true, eliminar: true },
  },
  ODONTOLOGO: {
    pacientes: { ver: true, crear: true, editar: true, eliminar: false },
    citas: { ver: true, crear: false, editar: true, eliminar: false },
    odontograma: { ver: true, crear: true, editar: true, eliminar: false },
    historia_clinica: { ver: true, crear: true, editar: true, eliminar: false },
    servicios: { ver: true, crear: false, editar: false, eliminar: false },
    profesionales: { ver: true, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    roles: { ver: false, crear: false, editar: false, eliminar: false },
  },
  RECEPCIONISTA: {
    pacientes: { ver: true, crear: true, editar: true, eliminar: false },
    citas: { ver: true, crear: true, editar: true, eliminar: true },
    odontograma: { ver: true, crear: false, editar: false, eliminar: false },
    historia_clinica: { ver: false, crear: false, editar: false, eliminar: false },
    servicios: { ver: true, crear: false, editar: false, eliminar: false },
    profesionales: { ver: true, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    roles: { ver: false, crear: false, editar: false, eliminar: false },
  },
  PACIENTE: {
    pacientes: { ver: false, crear: false, editar: false, eliminar: false },
    citas: { ver: true, crear: true, editar: false, eliminar: false },
    odontograma: { ver: true, crear: false, editar: false, eliminar: false },
    historia_clinica: { ver: false, crear: false, editar: false, eliminar: false },
    servicios: { ver: true, crear: false, editar: false, eliminar: false },
    profesionales: { ver: true, crear: false, editar: false, eliminar: false },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false },
    roles: { ver: false, crear: false, editar: false, eliminar: false },
  },
};

export function getCustomPermissionsForRole(
  roleCode: string
): Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }> | null {
  try {
    const raw = localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      if (all && all[roleCode]) {
        return all[roleCode];
      }
    }
  } catch {
    // ignorar error de lectura
  }
  return DEFAULT_ROLE_PERMISSIONS[roleCode] || null;
}

/**
 * Valida de forma estricta si un usuario tiene acceso a una ruta específica según su rol
 * y según los permisos dinámicos configurados en la matriz de Roles y Permisos.
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

  // Si es ADMINISTRADOR, acceso total permanente
  if (role === "ADMINISTRADOR") {
    return true;
  }

  // 1. Evaluar matriz dinámica de permisos configurada desde el módulo de Roles
  const moduleKey = ROUTE_TO_MODULE[targetPath];
  if (moduleKey) {
    const customPerms = getCustomPermissionsForRole(role);
    if (customPerms && customPerms[moduleKey]) {
      // Si el permiso de visualización ('ver') está denegado, bloquear la ruta
      if (customPerms[moduleKey].ver === false) {
        return false;
      }
      // Si está explícitamente permitido, conceder acceso
      if (customPerms[moduleKey].ver === true) {
        return true;
      }
    }
  }

  // 2. Fallback a la matriz estática de rutas permitidas
  const allowedRoutes = ROLE_ALLOWED_ROUTES[role] || [];
  return allowedRoutes.includes(targetPath);
}

