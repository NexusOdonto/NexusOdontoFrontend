import {
  ChevronLeft,
  ChevronRight,
  Mail,
  UserRound,
} from "lucide-react";

import { cn } from "../../../utils/cn";

import type {
  EstadoUsuario,
  RolUsuario,
  Usuario,
} from "../../../types/usuarios";

interface UsuariosTableProps {
  usuarios: Usuario[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getRoleClasses(rol: RolUsuario) {
  return cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    {
      "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300":
        rol === "Odontólogo",

      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300":
        rol === "Recepcionista",

      "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300":
        rol === "Admin",
    },
  );
}

function getStatusClasses(
  estado: EstadoUsuario,
) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
    {
      "border-success/30 bg-success/10 text-success":
        estado === "Activo",

      "border-danger/30 bg-danger/10 text-danger":
        estado === "Inactivo",
    },
  );
}

function UsuariosTableSkeleton() {
  return (
    <>
      <div className="hidden divide-y divide-slate-200 dark:divide-slate-800 md:block">
        {Array.from({ length: 5 }).map(
          (_, index) => (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 px-5 py-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />

                <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />

              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ),
        )}
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />

                <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="mb-3 h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />

              <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ),
        )}
      </div>
    </>
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
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
          <UserRound size={20} />
        </div>

        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          No hay usuarios
        </h3>

        <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
          No se encontraron usuarios que
          coincidan con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                Nombre
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                Correo
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                Rol
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                Estado
              </th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b border-slate-200 transition-colors duration-200 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                      <UserRound size={16} />
                    </div>

                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {usuario.nombre}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Mail size={15} />

                    <span className="break-all">
                      {usuario.correo}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={getRoleClasses(
                      usuario.rol,
                    )}
                  >
                    {usuario.rol}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={getStatusClasses(
                      usuario.estado,
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        usuario.estado ===
                          "Activo"
                          ? "bg-success"
                          : "bg-danger",
                      )}
                    />

                    {usuario.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {usuarios.map((usuario) => (
          <article
            key={usuario.id}
            className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <UserRound size={17} />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {usuario.nombre}
                  </h3>

                  <div className="mt-1 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Mail
                      size={14}
                      className="mt-0.5 shrink-0"
                    />

                    <span className="break-all">
                      {usuario.correo}
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={getStatusClasses(
                  usuario.estado,
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    usuario.estado === "Activo"
                      ? "bg-success"
                      : "bg-danger",
                  )}
                />

                {usuario.estado}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Rol
              </span>

              <span
                className={getRoleClasses(
                  usuario.rol,
                )}
              >
                {usuario.rol}
              </span>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Página {currentPage} de {totalPages}
        </p>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() =>
              onPageChange(currentPage - 1)
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-primary-500 px-2 text-xs font-semibold text-white">
            {currentPage}
          </span>

          <button
            type="button"
            disabled={
              currentPage === totalPages
            }
            onClick={() =>
              onPageChange(currentPage + 1)
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}