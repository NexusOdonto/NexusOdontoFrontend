import type { Paciente } from "../../../types/pacientes";

interface PacientesTableProps {
  pacientes: Paciente[];
  loading: boolean;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PacientesTable({
  pacientes,
  loading,
  totalItems,
  totalPages,
  currentPage,
  onPageChange,
}: PacientesTableProps) {
  return (
    <section className="min-w-0 max-w-full">
      {/* INFORMACIÓN */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Pacientes
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          {totalItems} paciente
          {totalItems !== 1 ? "s" : ""} registrado
          {totalItems !== 1 ? "s" : ""}
        </p>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombre
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Documento
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Teléfono
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                Estado
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="px-4 py-4">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </td>

                  <td className="px-4 py-4">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </td>

                  <td className="px-4 py-4">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </td>

                  <td className="px-4 py-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  </td>
                </tr>
              ))
            ) : pacientes.length > 0 ? (
              pacientes.map((paciente) => (
                <tr
                  key={paciente.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {paciente.nombre}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {paciente.documento}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {paciente.telefono || "No registrado"}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        paciente.estado?.toLowerCase() === "activo"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {paciente.estado || "Activo"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl text-slate-300 dark:text-slate-600">
                      ⌕
                    </span>

                    <strong className="text-slate-900 dark:text-slate-100">
                      No se encontraron pacientes
                    </strong>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Intenta buscar por otro nombre o número de documento.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      {!loading &&
        pacientes.length > 0 &&
        totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Página {currentPage} de {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  onPageChange(currentPage - 1)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  onPageChange(currentPage + 1)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
    </section>
  );
}