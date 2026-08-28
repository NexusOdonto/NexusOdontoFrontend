import {
  CalendarDays,
  Clock3,
  UserRound,
} from "lucide-react";

import { type Cita } from "../types";

interface CitasTableProps {
  citas: Cita[];
  loading: boolean;
}

function formatearFecha(fecha: string) {
  const [year, month, day] =
    fecha.split("-").map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatearHora(hora: string) {
  const [hours, minutes] =
    hora.split(":").map(Number);

  const date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  )
    .format(date)
    .replace(" ", " ");
}

function estadoClasses(
  estado: Cita["estado"]
) {
  switch (estado) {
    case "Confirmada":
      return "border-slate-300 text-slate-100 dark:border-slate-500 dark:text-slate-100";

    case "Agendada":
      return "border-slate-300 text-slate-100 dark:border-slate-500 dark:text-slate-100";

    case "Atendida":
      return "border-primary-500/50 bg-primary-500/10 text-primary-400";

    case "Cancelada":
      return "border-slate-300 text-slate-100 dark:border-slate-500 dark:text-slate-100";

    default:
      return "border-slate-300 text-slate-100";
  }
}

export function CitasTable({
  citas,
  loading,
}: CitasTableProps) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="hidden overflow-hidden md:block">
          <div className="grid grid-cols-[1.35fr_1fr_1fr_1fr_180px] border-y border-slate-200/70 px-4 py-3 dark:border-slate-800/70">
            {[
              "Paciente",
              "Fecha y hora",
              "Profesional",
              "Servicio",
              "Estado",
            ].map((titulo) => (
              <div
                key={titulo}
                className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >
                {titulo}
              </div>
            ))}
          </div>

          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.35fr_1fr_1fr_1fr_180px] items-center border-b border-slate-200/70 px-4 py-5 dark:border-slate-800/70"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <div className="space-y-3 md:hidden">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 border-b border-slate-200/70 py-4 dark:border-slate-800/70"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (citas.length === 0) {
    return (
      <div className="flex min-h-60 w-full flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60">
          <CalendarDays
            size={22}
            className="text-slate-500"
          />
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          No hay citas
        </h3>

        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          No se encontraron citas con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* TABLA ESCRITORIO */}
      <div className="hidden min-w-[900px] md:block">
        {/* CABECERA */}
        <div className="grid grid-cols-[1.35fr_1fr_1fr_1fr_180px] border-y border-slate-200/70 bg-slate-900/20 px-4 py-3 dark:border-slate-800/70">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Paciente
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Fecha y hora
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Profesional
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Servicio
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Estado
          </div>
        </div>

        {/* FILAS */}
        {citas.map((cita) => (
          <div
            key={cita.id}
            className="grid grid-cols-[1.35fr_1fr_1fr_1fr_180px] items-center border-b border-slate-200/70 px-4 py-4 transition-colors duration-200 hover:bg-slate-800/20 dark:border-slate-800/70"
          >
            {/* PACIENTE */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10">
                <UserRound
                  size={17}
                  className="text-primary-500"
                />
              </div>

              <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {cita.paciente}
              </span>
            </div>

            {/* FECHA Y HORA */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={15}
                  className="shrink-0 text-primary-500"
                />

                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatearFecha(cita.fecha)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock3
                  size={14}
                  className="shrink-0 text-slate-500 dark:text-slate-400"
                />

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatearHora(cita.hora)}
                </span>
              </div>
            </div>

            {/* PROFESIONAL */}
            <div className="pr-4">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {cita.profesional}
              </span>
            </div>

            {/* SERVICIO */}
            <div className="pr-4">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {cita.servicio}
              </span>
            </div>

            {/* ESTADO */}
            <div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${estadoClasses(
                  cita.estado
                )}`}
              >
                {cita.estado}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* VISTA MÓVIL */}
      <div className="space-y-3 md:hidden">
        {citas.map((cita) => (
          <div
            key={cita.id}
            className="border-b border-slate-200/70 py-4 dark:border-slate-800/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10">
                  <UserRound
                    size={18}
                    className="text-primary-500"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cita.paciente}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                    {cita.profesional}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${estadoClasses(
                  cita.estado
                )}`}
              >
                {cita.estado}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fecha
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <CalendarDays
                    size={14}
                    className="text-primary-500"
                  />

                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {formatearFecha(
                      cita.fecha
                    )}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hora
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <Clock3
                    size={14}
                    className="text-primary-500"
                  />

                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {formatearHora(
                      cita.hora
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Servicio
              </p>

              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {cita.servicio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}