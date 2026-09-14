/** Identifiers reserved for the BOT_SERVICE seed account (not for interactive UI). */
export const RESERVED_SERVICE_IDENTIFIERS = [
  'BOT001',
  'BOT-SERVICE-01',
  'bot_service@nexusodonto.com',
] as const;

/** Role GUID for BOT_SERVICE (RoleSeeder.BotService). */
export const BOT_SERVICE_ROLE_ID = '13000000-0000-0000-0000-000000000006';

export function isReservedServiceAccount(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return RESERVED_SERVICE_IDENTIFIERS.some((id) => id.toLowerCase() === normalized);
}

export function isBotServiceUser(user: {
  roleIds?: string[];
  rol?: string;
  email?: string;
  cedula?: string;
} | null | undefined): boolean {
  if (!user) return false;

  if (
    user.roleIds?.some(
      (id) => id.trim().toLowerCase() === BOT_SERVICE_ROLE_ID.toLowerCase()
    )
  ) {
    return true;
  }

  const rol = (user.rol || '').toUpperCase();
  if (rol.includes('BOT_SERVICE') || rol.includes('BOT SERVICE')) {
    return true;
  }

  return (
    isReservedServiceAccount(user.email) || isReservedServiceAccount(user.cedula)
  );
}

export const RESERVED_ACCOUNT_LOGIN_MESSAGE =
  'Esta cuenta es de servicio interno y no puede usarse desde el panel web.';

export const RESERVED_ACCOUNT_REGISTER_MESSAGE =
  'Este documento o correo está reservado para una cuenta de servicio del sistema.';
