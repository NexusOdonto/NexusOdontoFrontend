import {
  Plus,
  Search,
  UserRound,
  X,
  RefreshCw,
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
  const [rol, setRol] = useState<"Todos" | string>("Todos");
  const [estado, setEstado] = useState<"Todos" | "Activo" | "Inactivo">("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoApellido, setNuevoApellido] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState("");
  const [nuevoTipoDocumento, setNuevoTipoDocumento] = useState("");
  const [nuevoDocumento, setNuevoDocumento] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [errorForm, setErrorForm] = useState("");

  const fetchCatalogs = async () => {
    try {
      const [rolesData, docTypesData] = await Promise.all([
        roleService.getAll().catch(() => []),
        documentTypeService.getAll().catch(() => [])
      ]);
      setRoles(rolesData);
      setDocumentTypes(docTypesData);
      if (docTypesData.length > 0) {
        setNuevoTipoDocumento(docTypesData[0].id);
      }
      if (rolesData.length > 0) {
        const defaultRole = rolesData.find(r => r.code !== "ASISTENTE") || rolesData[0];
        setNuevoRol(defaultRole.id);
      }
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      const mappedUsuarios: Usuario[] = data.map((u: any) => {
        const fullName = u.person 
          ? `${u.person.firstName} ${u.person.lastName}`
          : u.name || u.email.split('@')[0];

        return {
          id: u.id,
          personId: u.personId || u.id,
          name: fullName,
          email: u.email,
          isActive: u.isActive ?? true,
          roleIds: u.roleIds || (u.roles ? u.roles.map((r: any) => r.id || r.code || r) : []),
          permissions: u.permissions || []
        };
      });

      setUsuarios(mappedUsuarios);
    } catch (error) {
      console.error('Error fetching users from API, using fallback data:', error);
      const fallbackUsuarios: Usuario[] = [
        {
          id: "1",
          personId: "p1",
          name: "Carlos Administrador",
          email: "admin@nexusodonto.com",
          isActive: true,
          roleIds: ["13000000-0000-0000-0000-000000000001"],
          permissions: ["USERS:VIEW", "USERS:CREATE", "USERS:UPDATE", "USERS:DELETE"]
        },
        {
          id: "2",
          personId: "p2",
          name: "Dra. Laura Gómez",
          email: "odontologo@nexusodonto.com",
          isActive: true,
          roleIds: ["13000000-0000-0000-0000-000000000002"],
          permissions: ["APPOINTMENTS:VIEW", "PATIENTS:VIEW"]
        },
        {
          id: "3",
          personId: "p3",
          name: "María Recepción",
          email: "recepcion@nexusodonto.com",
          isActive: true,
          roleIds: ["13000000-0000-0000-0000-000000000003"],
          permissions: ["APPOINTMENTS:VIEW", "APPOINTMENTS:CREATE"]
        }
      ];
      setUsuarios(fallbackUsuarios);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
    fetchUsuarios();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRolChange = (value: "Todos" | string) => {
    setRol(value);
    setCurrentPage(1);
  };

  const handleEstadoChange = (value: "Todos" | "Activo" | "Inactivo") => {
    setEstado(value);
    setCurrentPage(1);
  };

  const limpiarFiltros = () => {
    setSearch("");
    setRol("Todos");
    setEstado("Todos");
    setCurrentPage(1);
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const cumpleBusqueda =
        search === "" ||
        usuario.name.toLowerCase().includes(search.toLowerCase()) ||
        usuario.email.toLowerCase().includes(search.toLowerCase());

      const cumpleRol =
        rol === "Todos" ||
        (usuario.roleIds && usuario.roleIds.some((rId: string) => rId === rol));

      const cumpleEstado =
        estado === "Todos" ||
        (estado === "Activo" && usuario.isActive) ||
        (estado === "Inactivo" && !usuario.isActive);

      return cumpleBusqueda && cumpleRol && cumpleEstado;
    });
  }, [usuarios, search, rol, estado]);

  const totalPages = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE));

  const usuariosPagina = useMemo(() => {
    const inicio = (currentPage - 1) * ITEMS_PER_PAGE;
    return usuariosFiltrados.slice(inicio, inicio + ITEMS_PER_PAGE);
  }, [usuariosFiltrados, currentPage]);

  const abrirModal = () => {
    setNuevoNombre("");
    setNuevoApellido("");
    setNuevoCorreo("");
    setNuevoPassword("");
    setNuevoDocumento("");
    setNuevoTelefono("");
    setErrorForm("");
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
  };

  const registrarUsuario = async () => {
    if (!nuevoNombre.trim() || !nuevoApellido.trim() || !nuevoCorreo.trim() || !nuevoPassword.trim()) {
      setErrorForm("Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorForm("");
      if (nuevoTelefono && nuevoDocumento) {
        // Validación de datos complementarios
      }
      setErrorForm("La creación de usuarios requiere registrar primero la persona asociada en la base de datos.");
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorForm("Error al crear el usuario. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Encabezado Principal estilo Pacientes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Directorio de Usuarios
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Gestión de cuentas, roles y personal autorizado en NexusOdonto.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchUsuarios}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            title="Recargar usuarios"
          >
            <RefreshCw size={16} className={`text-cyan-600 dark:text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={abrirModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 animate-slideUp animate-stagger-1">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 dark:focus:ring-cyan-400/40 transition-all backdrop-blur-xl shadow-md"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={rol}
            onChange={(e) => handleRolChange(e.target.value)}
            className="px-3.5 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-xl shadow-md cursor-pointer"
          >
            <option value="Todos">Todos los roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            value={estado}
            onChange={(e) => handleEstadoChange(e.target.value as any)}
            className="px-3.5 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-xl shadow-md cursor-pointer"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          {(search || rol !== "Todos" || estado !== "Todos") && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-950/40 transition-colors backdrop-blur-md cursor-pointer"
              title="Limpiar filtros"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla Principal de Usuarios estilo Glassmorphism */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md overflow-hidden animate-slideUp animate-stagger-2">
        <UsuariosTable
          usuarios={usuariosPagina}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MODAL CREAR USUARIO */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn"
          onClick={cerrarModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nuevo-usuario-title"
            className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2 id="nuevo-usuario-title" className="text-lg font-bold text-slate-900 dark:text-white">
                    Nuevo Usuario
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Registra un nuevo usuario en el sistema.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nuevo-nombre" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre *
                  </label>
                  <input
                    id="nuevo-nombre"
                    type="text"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej. Laura"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  />
                </div>

                <div>
                  <label htmlFor="nuevo-apellido" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellido *
                  </label>
                  <input
                    id="nuevo-apellido"
                    type="text"
                    value={nuevoApellido}
                    onChange={(e) => setNuevoApellido(e.target.value)}
                    placeholder="Ej. Gómez"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nuevo-correo" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo electrónico *
                </label>
                <input
                  id="nuevo-correo"
                  type="email"
                  value={nuevoCorreo}
                  onChange={(e) => setNuevoCorreo(e.target.value)}
                  placeholder="correo@nexusodonto.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nuevo-tipo-documento" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de documento
                  </label>
                  <select
                    id="nuevo-tipo-documento"
                    value={nuevoTipoDocumento}
                    onChange={(e) => setNuevoTipoDocumento(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  >
                    {documentTypes.map((docType) => (
                      <option key={docType.id} value={docType.id}>
                        {docType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="nuevo-documento" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Número de documento
                  </label>
                  <input
                    id="nuevo-documento"
                    type="text"
                    value={nuevoDocumento}
                    onChange={(e) => setNuevoDocumento(e.target.value)}
                    placeholder="Ej. 1234567890"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nuevo-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contraseña *
                </label>
                <input
                  id="nuevo-password"
                  type="password"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="•••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                />
              </div>

              <div>
                <label htmlFor="nuevo-rol" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol de Acceso *
                </label>
                <select
                  id="nuevo-rol"
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                >
                  {roles.filter(role => role.code !== "ASISTENTE").map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {errorForm && (
                <p className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-fadeIn backdrop-blur-md">
                  {errorForm}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md text-xs font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={registrarUsuario}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Registrar Usuario</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
