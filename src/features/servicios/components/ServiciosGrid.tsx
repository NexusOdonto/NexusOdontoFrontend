import { formatCurrency } from "../../../utils/currency";
import type { Servicio } from "../../../types/servicios";

interface ServiciosGridProps {
  servicios: Servicio[];
}

export function ServiciosGrid({
  servicios,
}: ServiciosGridProps) {
  if (servicios.length === 0) {
    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800">

        <span className="text-4xl text-slate-300 dark:text-slate-600">
          ⌕
        </span>

        <strong className="mt-3 text-slate-900 dark:text-slate-100">
          No se encontraron servicios
        </strong>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Intenta cambiar tu búsqueda o los filtros.
        </p>

      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

      {servicios.map((servicio) => (
        <article
          key={servicio.id}
          className={`rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${
            !servicio.activo
              ? "opacity-60"
              : ""
          }`}
        >

          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-xl dark:bg-primary-900/30">
            🦷
          </div>

          <div className="space-y-3">

            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {servicio.nombre}
            </h2>

            <p className="min-h-[40px] text-sm text-slate-600 dark:text-slate-400">
              {servicio.descripcion}
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">

              <span>
                ⏱ {servicio.duracion} min
              </span>

              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(servicio.precio)}
              </span>

            </div>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                servicio.activo
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {servicio.activo
                ? "Activo"
                : "Inactivo"}
            </span>

          </div>

        </article>
      ))}

    </div>
  );
}