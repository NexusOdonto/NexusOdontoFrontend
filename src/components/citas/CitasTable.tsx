import {
  CalendarDays,
  Clock3,
  UserRound,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "../../utils/cn";

export type EstadoCita =
  | "Agendada"
  | "Confirmada"
  | "Atendida"
  | "Cancelada";

export interface Cita {
  id: number;
  paciente: string;
  profesional: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
}

interface CitasTableProps {
  citas: Cita[];
  loading?: boolean;
}

function getStatusClasses(
  estado: EstadoCita,
) {
  return cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
    {
      "border-success/30 bg-success/10 text-success":
        estado === "Confirmada",

      "border-info/30 bg-info/10 text-info":
        estado === "Agendada",

      "border-primary-500/30 bg-primary-500/10 text-primary-700 dark:text-primary-300":
        estado === "Atendida",

      "border-danger/30 bg-danger/10 text-danger":
        estado === "Cancelada",
    },
  );
}

function formatDate(fecha: string) {
  return format(
    parseISO(fecha),
    "d 'de' MMMM, yyyy",
    {
      locale: es,
    },
  );
}

function formatTime(hora: string) {
  const [hours, minutes] = hora
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return hora;
  }

  const period =
    hours >= 12 ? "p.m." : "a.m.";

  const displayHour =
    hours % 12 === 0
      ? 12
      : hours % 12;

  return `${String(displayHour).padStart(
    2,
    "0",
  )}:${String(minutes).padStart(
    2,
    "0",
  )} ${period}`;
}

function CitasTableSkeleton() {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {Array.from({ length: 4 }).map(
        (_, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-4 px-5 py-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />

              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

            <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        ),
      )}
    </div>
  );
}

export function CitasTable({
  citas,
  loading = false,
}: CitasTableProps) {
  if (loading) {
    return <CitasTableSkeleton />;
  }

  if (citas.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center border-t border-slate-200 px-6 text-center dark:border-slate-800">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
          <CalendarDays size={20} />
        </div>

        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          No hay citas
        </h3>

        <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
          No existen citas que coincidan con
          los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
              Paciente
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
              Fecha y hora
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
              Profesional
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
              Servicio
            </th>

            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
              Estado
            </th>
          </tr>
        </thead>

        <tbody>
          {citas.map((cita) => (
            <tr
              key={cita.id}
              className="border-b border-slate-200 transition-colors duration-200 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                    <UserRound size={16} />
                  </div>

                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cita.paciente}
                  </span>
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <CalendarDays
                      size={15}
                      className="text-primary-500"
                    />

                    {formatDate(cita.fecha)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock3 size={14} />

                    {formatTime(cita.hora)}
                  </div>
                </div>
              </td>

              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                {cita.profesional}
              </td>

              <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                {cita.servicio}
              </td>

              <td className="px-5 py-4">
                <span
                  className={getStatusClasses(
                    cita.estado,
                  )}
                >
                  {cita.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}