import { formatCurrency } from "../../../utils/currency";
import { type Servicio } from "../../../types/servicios";

const serviciosIniciales: Servicio[] = [
  {
    id: 1,
    nombre: "Blanqueamiento dental",
    descripcion:
      "Tratamiento para mejorar el tono y apariencia de los dientes.",
    duracion: 60,
    precio: 80000,
    activo: true,
  },
  {
    id: 2,
    nombre: "Calza dental",
    descripcion:
      "Restauración de una pieza dental afectada por caries.",
    duracion: 45,
    precio: 60000,
    activo: true,
  },
  {
    id: 3,
    nombre: "Extracción dental",
    descripcion:
      "Procedimiento para retirar una pieza dental.",
    duracion: 30,
    precio: 50000,
    activo: false,
  },
  {
    id: 4,
    nombre: "Limpieza dental",
    descripcion:
      "Limpieza profesional para eliminar placa y sarro.",
    duracion: 40,
    precio: 45000,
    activo: true,
  },
  {
    id: 5,
    nombre: "Fluorización",
    descripcion:
      "Aplicación de flúor para ayudar a prevenir caries.",
    duracion: 20,
    precio: 30000,
    activo: true,
  },
];

interface ServiciosGridProps {
  servicios?: Servicio[];
}

export function ServiciosGrid({
  servicios = serviciosIniciales,
}: ServiciosGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {servicios.map((servicio) => (
        <article
          key={servicio.id}
          className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 transition-all hover:shadow-lg ${
            !servicio.activo
              ? "opacity-60"
              : ""
          }`}
        >
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-2xl mb-4">
            🦷
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {servicio.nombre}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              {servicio.descripcion}
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                ⏱ {servicio.duracion} min
              </span>

              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(servicio.precio)}
              </span>
            </div>

            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                servicio.activo
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
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