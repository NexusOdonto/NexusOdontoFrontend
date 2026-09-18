import { useEffect, useState } from "react";
import { subscribePresence } from "./presenceService";

/** Fuerza re-render cuando cambia la presencia online (misma pestaña u otras). */
export function usePresenceTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const unsubscribe = subscribePresence(bump);
    // Refresco por TTL (sesiones que dejan de hacer heartbeat)
    const interval = window.setInterval(bump, 30_000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, []);

  return tick;
}
