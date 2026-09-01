import {
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UsuariosTable } from "./components/UsuariosTable";

import type {
  Usuario,
  Role,
} from "../../types/usuarios";
import { userService } from "../../api/userService";
import { roleService } from "../../api/roleService";
import { documentTypeService } from "../../api/documentTypeService";

const ITEMS_PER_PAGE = 5;

export function UsuariosView() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  const [rol, setRol] = useState<
    "Todos" | string
  >("Todos");

  const [estado, setEstado] = useState<
    "Todos" | "Activo" | "Inactivo"
  >("Todos");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [showModal, setShowModal] =
    useState(false);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoApellido, setNuevoApellido] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState("");
  const [nuevoTipoDocumento, setNuevoTipoDocumento] = useState("");
  const [nuevoDocumento, setNuevoDocumento] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");

  const [nuevoEstado, setNuevoEstado] =
    useState<"Activo" | "Inactivo">("Activo");

  const [errorForm, setErrorForm] =
    useState("");

  // Cargar usuarios, roles y tipos de documento al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [usersData, rolesData, docTypesData] = await Promise.all([
          userService.getAll().catch(() => []),
          roleService.getAll().catch(() => []),
          documentTypeService.getAll().catch(() => [])
        ]);
        setUsuarios(
          (usersData as any[]).map((u) => ({
            id: u.id,
            personId: u.personId,
            name: u.name || "",
            email: u.email || "",
            roleIds: u.roleIds || [],
            permissions: u.permissions || [],
            isActive: u.isActive ?? true,
          }))
        );
        setRoles(rolesData as Role[]);
        setDocumentTypes(docTypesData as any[]);
        if (docTypesData && docTypesData.length > 0) {
          setNuevoTipoDocumento(docTypesData[0].id);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const coincideBusqueda =
        !searchValue ||
        usuario.name
          .toLowerCase()
          .includes(searchValue) ||
        usuario.email
          .toLowerCase()
          .includes(searchValue);

      const coincideRol =
        rol === "Todos" ||
        usuario.roleIds.includes(rol);

      const coincideEstado =
        estado === "Todos" ||
        (estado === "Activo" ? usuario.isActive : !usuario.isActive);

      return (
        coincideBusqueda &&
        coincideRol &&
        coincideEstado
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
    value: "Todos" | string,
  ) => {
    setRol(value);
    setCurrentPage(1);
  };

  const handleEstadoChange = (
    value:
      | "Todos"
      | "Activo"
      | "Inactivo",
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

  const abrirModal = () => {
    // Reset campos de persona
    setNuevoNombre("");
    setNuevoApellido("");
    setNuevoCorreo("");
    setNuevoPassword("");
    setNuevoRol(roles.find(r => r.code !== "ASISTENTE")?.id || "");
    setNuevoEstado("Activo");
    setErrorForm("");
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setErrorForm("");
  };

  const registrarUsuario = async () => {
    const nombre = nuevoNombre.trim();
    const apellido = nuevoApellido.trim();
    const correo = nuevoCorreo.trim();
    const password = nuevoPassword.trim();
    const docNum = nuevoDocumento.trim() || `10${Date.now().toString().slice(-8)}`;

    if (!nombre || !correo || !password || !nuevoRol) {
      setErrorForm(
        "Completa todos los campos obligatorios.",
      );
      return;
    }

    // Verificar si el correo ya existe
    const correoExiste = usuarios.some(
      (usuario) =>
        usuario.email.toLowerCase() ===
        correo.toLowerCase(),
    );

    if (correoExiste) {
      setErrorForm("Ya existe un usuario con ese correo.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Registro de usuario:', { nombre, apellido, correo, docNum, rol: nuevoRol, estado: nuevoEstado });
      setErrorForm("La creación de usuarios requiere registrar primero la persona asociada en la base de datos.");
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorForm("Error al crear el usuario. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="box-border w-full min-w-0 max-w-full overflow-x-hidden">
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Cargando usuarios...
            </p>
          </div>
        </div>
      ) : (
        <>
          <header className="mb-6 flex w-full min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500 sm:h-11 sm:w-11">
                <ShieldCheck size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                  Usuarios
                </h1>

                <p className="mt-1 max-w-2xl break-words text-sm leading-5 text-slate-600 dark:text-slate-400">
                  Gestiona el personal autorizado para
                  acceder a NexusOdonto.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={abrirModal}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 sm:w-auto sm:px-5"
            >
              <Plus size={18} />
              Nuevo Usuario
            </button>
          </header>

      <section className="mb-6 w-full min-w-0">
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_200px_180px]">
          <div className="flex h-11 min-w-0 w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800">
            <Search
              size={17}
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
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <select
            value={rol}
            onChange={(event) =>
              handleRolChange(
                event.target.value as
                  | "Todos"
                  | string,
              )
            }
            className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="Todos">
              Todos los roles
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            value={estado}
            onChange={(event) =>
              handleEstadoChange(
                event.target.value as
                  | "Todos"
                      | "Activo"
                      | "Inactivo",
              )
            }
            className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
          <div className="mt-3 flex justify-end">
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

      <div className="mb-4 min-w-0">
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

      <div className="w-full min-w-0 max-w-full">
        <UsuariosTable
          usuarios={usuariosPagina}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
        </>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex min-h-screen w-full max-w-[100vw] items-center justify-center overflow-x-hidden overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-sm sm:p-4 dark:bg-slate-950/60"
          onClick={cerrarModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nuevo-usuario-title"
            className="my-4 box-border w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5 dark:border-slate-800">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
                  <UserRound size={19} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="nuevo-usuario-title"
                    className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Nuevo Usuario
                  </h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Registra un nuevo usuario en el sistema.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                <label
                  htmlFor="nuevo-nombre"
                  className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                    Nombre
                </label>

                <input
                  id="nuevo-nombre"
                  type="text"
                  value={nuevoNombre}
                  onChange={(event) =>
                    setNuevoNombre(
                      event.target.value,
                    )
                  }
                    placeholder="Ej. Laura"
                  className="box-border h-11 w-full max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="nuevo-apellido"
                    className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Apellido
                  </label>

                  <input
                    id="nuevo-apellido"
                    type="text"
                    value={nuevoApellido}
                    onChange={(event) =>
                      setNuevoApellido(
                        event.target.value,
                      )
                    }
                    placeholder="Ej. Gómez"
                    className="box-border h-11 w-full max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="nuevo-correo"
                  className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Correo electrónico
                </label>

                <input
                  id="nuevo-correo"
                  type="email"
                  value={nuevoCorreo}
                  onChange={(event) =>
                    setNuevoCorreo(
                      event.target.value,
                    )
                  }
                  placeholder="correo@nexusodonto.com"
                  className="box-border h-11 w-full max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="nuevo-tipo-documento"
                    className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Tipo de documento
                  </label>

                  <select
                    id="nuevo-tipo-documento"
                    value={nuevoTipoDocumento}
                    onChange={(event) =>
                      setNuevoTipoDocumento(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {documentTypes.map((docType) => (
                      <option key={docType.id} value={docType.id}>
                        {docType.name}
                    </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="nuevo-documento"
                    className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    Número de documento
                  </label>

                  <input
                    id="nuevo-documento"
                    type="text"
                    value={nuevoDocumento}
                    onChange={(event) =>
                      setNuevoDocumento(
                        event.target.value,
                      )
                    }
                    placeholder="Ej. 1234567890"
                    className="box-border h-11 w-full max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="nuevo-telefono"
                  className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Teléfono (opcional)
                </label>

                <input
                  id="nuevo-telefono"
                  type="tel"
                  value={nuevoTelefono}
                  onChange={(event) =>
                    setNuevoTelefono(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. +57 300 123 4567"
                  className="box-border h-11 w-full max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="nuevo-password"
                  className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Contraseña
                </label>

                <input
                  id="nuevo-password"
                  type="password"
                  value={nuevoPassword}
                  onChange={(event) =>
                    setNuevoPassword(
                      event.target.value,
                    )
                  }
                  placeholder="•••••••••"
                  className="box-border h-11 w-full max-w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="nuevo-rol"
                  className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Rol
                </label>

                <select
                  id="nuevo-rol"
                  value={nuevoRol}
                  onChange={(event) =>
                    setNuevoRol(
                      event.target.value,
                      )
                    }
                    className="h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                  {roles.filter(role => role.code !== "ASISTENTE").map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                  </select>
              </div>

              {errorForm && (
                <p className="break-words rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {errorForm}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800">
              <button
                type="button"
                onClick={cerrarModal}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={registrarUsuario}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registrando...
                  </>
                ) : (
                  <>
                <Plus size={16} />
                Registrar usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

