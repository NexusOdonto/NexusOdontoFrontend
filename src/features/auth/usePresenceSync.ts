import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { signalRService } from "../../api/signalrService";
import {
  applyRemoteSnapshot,
  clearRemotePresence,
  setRemoteUserOffline,
  setRemoteUserOnline,
  type RemotePresenceUser,
} from "./presenceService";

/**
 * Sincroniza presencia remota vía el hub de notificaciones existente.
 * No crea un hub nuevo: reutiliza /hubs/notifications.
 */
export function usePresenceSync(userId: string | null | undefined): void {
  useEffect(() => {
    if (!userId) {
      clearRemotePresence();
      return;
    }

    let cancelled = false;
    let conn: signalR.HubConnection | null = null;

    const onOnline = (payload: RemotePresenceUser) => setRemoteUserOnline(payload);
    const onOffline = (payload: RemotePresenceUser) => setRemoteUserOffline(payload);
    const onSnapshot = (users: RemotePresenceUser[]) => applyRemoteSnapshot(users);

    const setup = async () => {
      conn = await signalRService.startConnection();
      if (cancelled || !conn) return;

      signalRService.on("UserOnline", onOnline);
      signalRService.on("UserOffline", onOffline);
      signalRService.on("PresenceSnapshot", onSnapshot);

      try {
        // Enriquecer claves y pedir snapshot actual
        await conn.invoke("SyncPresence");
      } catch {
        try {
          const users = await conn.invoke<RemotePresenceUser[]>("GetOnlineUsers");
          applyRemoteSnapshot(users);
        } catch {
          // Hub antiguo sin métodos de presencia: se mantiene fallback local
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      signalRService.off("UserOnline", onOnline);
      signalRService.off("UserOffline", onOffline);
      signalRService.off("PresenceSnapshot", onSnapshot);
      clearRemotePresence();
    };
  }, [userId]);
}
