import { useCallback, useEffect, useState } from "react";
import { availabilityService } from "../api/availabilityService";

const REFRESH_MS = 60000;

/**
 * Ids (en minúsculas) de las citas marcadas como "Requiere reprogramación".
 * Si el endpoint no existe o falla, devuelve un conjunto vacío sin mostrar errores.
 */
export function useRequiresReschedule(enabled = true) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const list = await availabilityService.getRequiresReschedule();
      setIds(new Set(list.map((a) => String(a.appointmentId || "").toLowerCase()).filter(Boolean)));
    } catch {
      setIds((prev) => (prev.size === 0 ? prev : new Set()));
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    window.addEventListener("nexus_schedules_updated", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("nexus_schedules_updated", refresh);
    };
  }, [enabled, refresh]);

  const requiresReschedule = useCallback(
    (appointmentId?: string | null) => !!appointmentId && ids.has(appointmentId.toLowerCase()),
    [ids]
  );

  return { requiresReschedule, refresh, count: ids.size };
}
