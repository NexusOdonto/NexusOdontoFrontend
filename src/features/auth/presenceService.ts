/**
 * Presencia en sesión.
 * - Local: mismo navegador (localStorage + BroadcastChannel) como respaldo.
 * - Remota: SignalR hub /hubs/notifications (UserOnline / UserOffline / PresenceSnapshot).
 */

const STORAGE_KEY = "nexus_online_users";
const CHANNEL_NAME = "nexus_presence";
const DOM_EVENT = "nexus-presence-changed";
const ONLINE_TTL_MS = 2 * 60 * 1000; // 2 min sin heartbeat = desconectado (solo local)

export type PresenceUserLike = {
  id?: string;
  personId?: string;
  cedula?: string;
  documento?: string;
  email?: string;
  correo?: string;
  name?: string;
  nombre?: string;
  apellido?: string;
  rol?: string;
};

export type PresenceEntry = {
  sessionKey: string;
  keys: string[];
  userId?: string;
  personId?: string;
  name?: string;
  role?: string;
  lastSeen: number;
};

type PresenceStore = Record<string, PresenceEntry>;

function normalizeKey(value?: string | null): string {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s.\-_]/g, "");
}

function buildKeys(user: PresenceUserLike): string[] {
  const raw = [
    user.cedula,
    user.documento,
    user.email,
    user.correo,
    user.id,
    user.personId,
  ];
  const keys = new Set<string>();
  for (const item of raw) {
    const n = normalizeKey(item);
    if (n) keys.add(n);
    // Mantener también la forma original trim (para docs numéricos exactos)
    const t = String(item || "").trim();
    if (t) keys.add(t);
    if (t) keys.add(t.toLowerCase());
  }
  return Array.from(keys);
}

function sessionKeyFor(user: PresenceUserLike): string {
  return (
    normalizeKey(user.id) ||
    normalizeKey(user.personId) ||
    normalizeKey(user.cedula || user.documento) ||
    normalizeKey(user.email || user.correo) ||
    `anon-${Date.now()}`
  );
}

function readStore(): PresenceStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);

    // Formato antiguo: string[]
    if (Array.isArray(parsed)) {
      const migrated: PresenceStore = {};
      const now = Date.now();
      parsed.forEach((k: string, idx: number) => {
        if (!k) return;
        const sk = normalizeKey(k) || `legacy-${idx}`;
        migrated[sk] = {
          sessionKey: sk,
          keys: [String(k), normalizeKey(k)].filter(Boolean),
          lastSeen: now,
        };
      });
      return migrated;
    }

    if (parsed && typeof parsed === "object") {
      return parsed as PresenceStore;
    }
  } catch {
    // ignore
  }
  return {};
}

function writeStore(store: PresenceStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  notifyListeners();
}

function pruneExpired(store: PresenceStore, now = Date.now()): PresenceStore {
  const next: PresenceStore = {};
  for (const [key, entry] of Object.entries(store)) {
    if (!entry?.lastSeen) continue;
    if (now - entry.lastSeen <= ONLINE_TTL_MS) {
      next[key] = entry;
    }
  }
  return next;
}

let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = () => {
        listeners.forEach((cb) => cb());
      };
    } catch {
      channel = null;
    }
  }
  return channel;
}

function notifyListeners(): void {
  listeners.forEach((cb) => cb());
  try {
    window.dispatchEvent(new Event(DOM_EVENT));
  } catch {
    // ignore
  }
  try {
    getChannel()?.postMessage({ type: "presence-updated", at: Date.now() });
  } catch {
    // ignore
  }
}

export function markUserOnline(user: PresenceUserLike | null | undefined): void {
  if (!user) return;
  const keys = buildKeys(user);
  if (keys.length === 0) return;

  const sk = sessionKeyFor(user);
  const store = pruneExpired(readStore());
  const name =
    user.name ||
    `${user.nombre || ""} ${user.apellido || ""}`.trim() ||
    undefined;

  store[sk] = {
    sessionKey: sk,
    keys,
    userId: user.id,
    personId: user.personId,
    name,
    role: user.rol,
    lastSeen: Date.now(),
  };
  writeStore(store);
}

export function markUserOffline(user: PresenceUserLike | null | undefined): void {
  if (!user) return;
  const keys = new Set(buildKeys(user));
  const sk = sessionKeyFor(user);
  const store = readStore();
  delete store[sk];

  for (const [key, entry] of Object.entries(store)) {
    if (entry.keys.some((k) => keys.has(normalizeKey(k)) || keys.has(k))) {
      delete store[key];
    }
  }
  writeStore(store);
}

export function touchPresence(user: PresenceUserLike | null | undefined): void {
  if (!user) return;
  markUserOnline(user);
}

export function getOnlineEntries(): PresenceEntry[] {
  return Object.values(pruneExpired(readStore()));
}

/** ---- Presencia remota (SignalR) ---- */

export type RemotePresenceUser = {
  userId?: string;
  UserId?: string;
  personId?: string;
  PersonId?: string;
  documentNumber?: string;
  DocumentNumber?: string;
  email?: string;
  Email?: string;
  name?: string;
  Name?: string;
  keys?: string[];
  Keys?: string[];
};

const remoteByUserId = new Map<string, PresenceEntry>();

function remoteEntryFromDto(dto: RemotePresenceUser): PresenceEntry | null {
  const userId = String(dto.userId || dto.UserId || "").trim();
  if (!userId) return null;

  const personId = String(dto.personId || dto.PersonId || "").trim() || undefined;
  const documentNumber = String(dto.documentNumber || dto.DocumentNumber || "").trim() || undefined;
  const email = String(dto.email || dto.Email || "").trim().toLowerCase() || undefined;
  const name = String(dto.name || dto.Name || "").trim() || undefined;
  const extraKeys = dto.keys || dto.Keys || [];

  const keys = buildKeys({
    id: userId,
    personId,
    cedula: documentNumber,
    documento: documentNumber,
    email,
    correo: email,
    name,
  });

  for (const k of extraKeys) {
    if (k) {
      keys.push(String(k));
      const n = normalizeKey(String(k));
      if (n) keys.push(n);
    }
  }

  return {
    sessionKey: userId.toLowerCase(),
    keys: Array.from(new Set(keys)),
    userId,
    personId,
    name,
    lastSeen: Date.now(),
  };
}

export function applyRemoteSnapshot(users: RemotePresenceUser[] | null | undefined): void {
  remoteByUserId.clear();
  if (Array.isArray(users)) {
    for (const dto of users) {
      const entry = remoteEntryFromDto(dto);
      if (entry?.userId) remoteByUserId.set(entry.userId.toLowerCase(), entry);
    }
  }
  notifyListeners();
}

export function setRemoteUserOnline(dto: RemotePresenceUser | null | undefined): void {
  if (!dto) return;
  const entry = remoteEntryFromDto(dto);
  if (!entry?.userId) return;
  remoteByUserId.set(entry.userId.toLowerCase(), entry);
  notifyListeners();
}

export function setRemoteUserOffline(dto: RemotePresenceUser | null | undefined): void {
  if (!dto) return;
  const userId = String(dto.userId || dto.UserId || "").trim().toLowerCase();
  if (!userId) return;
  remoteByUserId.delete(userId);
  notifyListeners();
}

export function clearRemotePresence(): void {
  if (remoteByUserId.size === 0) return;
  remoteByUserId.clear();
  notifyListeners();
}

export function getOnlineKeySet(): Set<string> {
  const set = new Set<string>();
  const addEntry = (entry: PresenceEntry) => {
    for (const k of entry.keys) {
      if (k) {
        set.add(k);
        set.add(normalizeKey(k));
      }
    }
  };

  for (const entry of getOnlineEntries()) addEntry(entry);
  for (const entry of remoteByUserId.values()) addEntry(entry);
  return set;
}

export function isAnyKeyOnline(candidates: Array<string | undefined | null>): boolean {
  const online = getOnlineKeySet();
  if (online.size === 0) return false;
  for (const c of candidates) {
    const t = String(c || "").trim();
    if (!t) continue;
    if (online.has(t) || online.has(t.toLowerCase()) || online.has(normalizeKey(t))) {
      return true;
    }
  }
  return false;
}

export function subscribePresence(callback: () => void): () => void {
  listeners.add(callback);

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  const onDom = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(DOM_EVENT, onDom);
  getChannel();

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DOM_EVENT, onDom);
  };
}
