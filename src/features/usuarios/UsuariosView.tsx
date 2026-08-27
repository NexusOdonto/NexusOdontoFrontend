import {
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { UsuariosTable } from "./components/UsuariosTable";
import type {
  RolUsuario,
  Usuario,
} from "../../types/usuarios";

const usuariosIniciales: Usuario[] = [
  {
    id: 1,
    nombre: "Six Sevenaldo Da Silva Jr",
    correo: "Six.Seveent@nexusodonto.com",
    rol: "Odontólogo",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Carlos Martínez",
    correo: "carlos.martinez@nexusodonto.com",
    rol: "Recepcionista",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Ana Rodríguez",
    correo: "ana.rodriguez@nexusodonto.com",
    rol: "Admin",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Juan Pérez",
    correo: "juan.perez@nexusodonto.com",
    rol: "Odontólogo",
    estado: "Inactivo",
  },
  {
    id: 5,
    nombre: "María López",
    correo: "maria.lopez@nexusodonto.com",
    rol: "Recepcionista",
    estado: "Activo",
  },
  {
    id: 6,
    nombre: "Andrés Silva",
    correo: "andres.silva@nexusodonto.com",
    rol: "Admin",
    estado: "Activo",
  },
  {
    id: 7,
    nombre: "Sofía Torres",
    correo: "sofia.torres@nexusodonto.com",
    rol: "Odontólogo",
    estado: "Activo",
  },
  {
    id: 8,
    nombre: "Diego Ramírez",
    correo: "diego.ramirez@nexusodonto.com",
    rol: "Recepcionista",
    estado: "Inactivo",
  },
];

const ITEMS_PER_PAGE = 5;

export function UsuariosView() {
  const [usuarios] =
    useState<Usuario[]>(usuariosIniciales);

  const [search, setSearch] = useState("");

  const [rol, setRol] = useState<
    "Todos" | RolUsuario
  >("Todos");

  const [estado, setEstado] = useState<
    "Todos" | Usuario["estado"]
  >("Todos");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [showModal, setShowModal] =
    useState(false);

  const usuariosFiltrados = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const matchSearch =
        !searchValue ||
        usuario.nombre
          .toLowerCase()
          .includes(searchValue) ||
        usuario.correo
          .toLowerCase()
          .includes(searchValue);

      const matchRol =
        rol === "Todos" ||
        usuario.rol === rol;

      const matchEstado =
        estado === "Todos" ||
        usuario.estado === estado;

      return (
        matchSearch &&
        matchRol &&
        matchEstado
      );
    });
  }, [usuarios, search, rol, estado]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      usuariosFiltrados.length /
        ITEMS_PER_PAGE,
    ),
  );

  const usuariosPagina = useMemo(() => {
    const start =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return usuariosFiltrados.slice(
      start,
      start + ITEMS_PER_PAGE,
    );
  }, [usuariosFiltrados, currentPage]);

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRolChange = (
    value: "Todos" | RolUsuario,
  ) => {
    setRol(value);
    setCurrentPage(1);
  };

  const handleEstadoChange = (
    value:
      | "Todos"
      | Usuario["estado"],
  ) => {
    setEstado(value);
    setCurrentPage(1);
  };

  const limpiarFiltros = () => {
    setSearch("");
    setRol("Todos");
    setEstado("Todos");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-full w-full bg-slate-50 p-6 transition-colors duration-300 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
          <header className="mb-7 flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Usuarios
                  </h1>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Gestiona el personal autorizado
                    para acceder a NexusOdonto.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowModal(true)
              }
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <Plus size={18} />
              Nuevo Usuario
            </button>
          </header>

          <section className="mb-7">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_200px]">
              <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800">
                <Search
                  size={18}
                  className="shrink-0 text-slate-500 dark:text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    handleSearchChange(
                      event.target.value,
                    )
                  }
                  placeholder="Buscar por nombre o correo..."
                  className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-400"
                />
              </div>

              <select
                value={rol}
                onChange={(event) =>
                  handleRolChange(
                    event.target
                      .value as
                      | "Todos"
                      | RolUsuario,
                  )
                }
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Todos">
                  Todos los roles
                </option>

                <option value="Odontólogo">
                  Odontólogo
                </option>

                <option value="Recepcionista">
                  Recepcionista
                </option>

                <option value="Admin">
                  Admin
                </option>
              </select>

              <select
                value={estado}
                onChange={(event) =>
                  handleEstadoChange(
                    event.target
                      .value as
                      | "Todos"
                      | Usuario["estado"],
                  )
                }
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Todos">
                  Todos los estados
                </option>

                <option value="Activo">
                  Activo
                </option>

                <option value="Inactivo">
                  Inactivo
                </option>
              </select>
            </div>

            {(search ||
              rol !== "Todos" ||
              estado !== "Todos") && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </section>

          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Personal autorizado
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {usuariosFiltrados.length}{" "}
                {usuariosFiltrados.length === 1
                  ? "usuario encontrado"
                  : "usuarios encontrados"}
              </p>
            </div>
          </div>

          <UsuariosTable
            usuarios={usuariosPagina}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 dark:bg-slate-950/60"
          onClick={() =>
            setShowModal(false)
          }
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
                  <UserRound size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Nuevo Usuario
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    El formulario se agregará en una
                    tarea posterior.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-8">
              <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Formulario de usuario pendiente.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}