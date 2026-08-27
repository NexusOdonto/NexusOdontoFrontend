import { ServiciosGrid } from "./components/ServiciosGrid";

export function ServiciosView() {
  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Servicios
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Consulta los servicios disponibles del
              consultorio.
            </p>
          </div>
        </div>

        <ServiciosGrid />
      </div>
    </div>
  );
}