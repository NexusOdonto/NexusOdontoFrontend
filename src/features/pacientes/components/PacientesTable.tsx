import type { Paciente } from "../../../types/pacientes";
import { UserAvatar } from "../../../components/common/UserAvatar";

interface PacientesTableProps {
  pacientes: Paciente[];
  loading: boolean;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectPaciente?: (paciente: Paciente) => void;
}

export function PacientesTable({
  pacientes,
  loading,
  totalItems,
  totalPages,
  currentPage,
  onPageChange,
  onSelectPaciente,
}: PacientesTableProps) {

  return (
    <section className="min-w-0 max-w-full rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md dark:shadow-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between min-h-[460px]">
      {/* HEADER DE LA LISTA */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Pacientes
          </span>
          <span className="rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 dark:border-cyan-400/40">
            {totalItems} {totalItems === 1 ? "paciente" : "pacientes"}
          </span>
        </div>
      </div>

      {/* TABLA MINIMALISTA */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="h-10 border-b border-slate-200/80 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3 text-right">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" />
                      <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                  </td>
                </tr>
              ))
            ) : pacientes.length > 0 ? (
              pacientes.map((paciente, idx) => (
                <tr
                  key={paciente.id}
                  onClick={() => onSelectPaciente?.(paciente)}
                  className={`group h-[60px] cursor-pointer transition-colors hover:bg-slate-100/90 dark:hover:bg-white/10 animate-fadeIn animate-stagger-${(idx % 6) + 1}`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-2xl overflow-hidden border border-cyan-500/40 dark:border-cyan-400/50 shadow-sm bg-slate-100 dark:bg-slate-900 group-hover:scale-105 transition-transform duration-200">
                        <UserAvatar
                          name={paciente.nombre}
                          avatar={paciente.fotoUrl}
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full flex items-center justify-center"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                        {paciente.nombre}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-sm font-mono font-semibold text-slate-900 dark:text-slate-200">
                    {paciente.documento}
                  </td>

                  <td className="px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {paciente.telefono || "No registrado"}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    {(() => {
                      const isActivo =
                        paciente.estado?.toLowerCase() === "activo" ||
                        ((paciente as any).isActive !== false && paciente.estado?.toLowerCase() !== "inactivo");

                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm border ${
                            isActivo
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/30"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActivo
                                ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse"
                                : "bg-rose-500 dark:bg-rose-400"
                            }`}
                          />
                          {isActivo ? "Activo" : "Inactivo"}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xl">
                      ⌕
                    </div>
                    <strong className="text-slate-900 dark:text-white text-base">
                      No se encontraron pacientes
                    </strong>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                      Intenta buscar con otro nombre, documento o número telefónico.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN MINIMALISTA */}
      {!loading && pacientes.length > 0 && totalPages > 1 && (
        <div className="mt-auto flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 pt-4">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de{" "}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>
  );
}