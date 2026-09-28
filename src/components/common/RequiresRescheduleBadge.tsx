import { CalendarClock } from "lucide-react";

export function RequiresRescheduleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/35 whitespace-nowrap ${className}`}
      title="El horario del odontólogo cambió y esta cita quedó por fuera. Se avisó al paciente para reprogramarla."
    >
      <CalendarClock size={11} className="shrink-0" />
      Requiere reprogramación
    </span>
  );
}
