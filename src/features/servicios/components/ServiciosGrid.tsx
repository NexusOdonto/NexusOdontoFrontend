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
      <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/20 backdrop-blur-md">
        <span className="text-4xl text-slate-400">
          ⌕
        </span>

        <strong className="mt-3 text-white">
          No se encontraron servicios
        </strong>

        <p className="mt-1 text-sm text-slate-400">
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
          className={`rounded-2xl border border-white/10 bg-slate-950/35 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/45 hover:shadow-2xl ${
            !servicio.activo
              ? "opacity-60"
              : ""
          }`}
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-teal-400/15 bg-teal-500/10 text-xl backdrop-blur-sm">
            🦷
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              {servicio.nombre}
            </h2>

            <p className="min-h-[40px] text-sm leading-relaxed text-slate-300">
              {servicio.descripcion}
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>
                ⏱ {servicio.duracion} min
              </span>

              <span className="font-semibold text-white">
                {formatCurrency(servicio.precio)}
              </span>
            </div>

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
                servicio.activo
                  ? "border-green-400/20 bg-green-500/10 text-green-400"
                  : "border-slate-400/20 bg-slate-500/10 text-slate-400"
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