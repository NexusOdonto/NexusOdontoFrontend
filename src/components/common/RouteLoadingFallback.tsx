import { DentistryReloadIcon } from "./DentistryReloadIcon";

interface RouteLoadingFallbackProps {
  message?: string;
}

export function RouteLoadingFallback({
  message = "Cargando NexusOdonto...",
}: RouteLoadingFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/90 dark:bg-slate-950 transition-colors">
      <div className="text-center flex flex-col items-center">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 dark:bg-cyan-500/25 blur-xl animate-pulse" />
          <DentistryReloadIcon
            size={64}
            loading
            className="relative z-10 drop-shadow-[0_4px_12px_rgba(6,182,212,0.4)]"
          />
        </div>
        <p className="text-sm text-slate-700 dark:text-cyan-300 font-semibold tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
