import {
  ChevronLeft,
  ChevronRight,
  Mail,
  UserRound,
} from "lucide-react";

import type { Usuario } from "../../../types/usuarios";

interface UsuariosTableProps {
  usuarios: Usuario[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getStatusClasses(isActive: boolean) {
  return isActive
    ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
    : "inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300";
}

function UsuariosTableSkeleton() {
  return (
    <div className="w-full space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 animate-pulse backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-white/10" />
            <div className="space-y-1.5">
              <div className="w-32 h-4 rounded bg-slate-300 dark:bg-white/10" />
              <div className="w-24 h-3 rounded bg-slate-200 dark:bg-white/5" />
            </div>
          </div>
          <div className="w-24 h-6 rounded-full bg-slate-300 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function UsuariosTable({
  usuarios,
  loading = false,
  currentPage,
  totalPages,
  onPageChange,
}: UsuariosTableProps) {
  if (loading) {
    return <UsuariosTableSkeleton />;
  }

  if (usuarios.length === 0) {
    return (
      <div className="flex min-h-60 w-full flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
          <UserRound size={24} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          No hay usuarios registrados
        </h3>
        <p className="mt-1 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          No se encontraron usuarios que coincidan con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/15 bg-slate-100/75 dark:bg-slate-900/60">
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Nombre
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Correo Electrónico
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Permisos Asignados
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Estado
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                className="transition-colors hover:bg-cyan-500/5 dark:hover:bg-cyan-400/10"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 dark:from-teal-400/30 dark:via-cyan-400/30 dark:to-blue-500/30 border border-cyan-500/40 dark:border-cyan-400/50 text-cyan-800 dark:text-cyan-200 font-extrabold shadow-sm">
                      <UserRound size={16} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {usuario.name}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <Mail size={14} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <span className="break-all">{usuario.email}</span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 border border-cyan-500/25">
                    {usuario.permissions.length} permisos
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className={getStatusClasses(usuario.isActive)}>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        usuario.isActive ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {usuario.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VISTA MÓVIL */}
      <div className="space-y-3 p-3 md:hidden">
        {usuarios.map((usuario) => (
          <article
            key={usuario.id}
            className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-800 dark:text-cyan-200 font-extrabold shadow-sm">
                  <UserRound size={17} className="text-teal-600 dark:text-teal-400" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {usuario.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Mail size={13} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="break-all">{usuario.email}</span>
                  </div>
                </div>
              </div>

              <span className={getStatusClasses(usuario.isActive)}>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    usuario.isActive ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {usuario.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 dark:border-white/15 pt-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Permisos Asignados
              </span>
              <span className="text-xs font-bold text-cyan-800 dark:text-cyan-200">
                {usuario.permissions.length} permisos
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200/80 dark:border-white/15">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-xs font-semibold"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-sm">
            {currentPage}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-xs font-semibold"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
