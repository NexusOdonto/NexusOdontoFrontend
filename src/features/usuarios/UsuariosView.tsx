import {
  Plus,
  Search,
  UserRound,
  X,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { UsuariosTable } from "./components/UsuariosTable";
import { useAuth } from "../auth/AuthContext";
import { areGuidsEqual } from "../../utils/roleUtils";

import type {
  Usuario,
  Role,
} from "../../types/usuarios";
import { userService } from "../../api/userService";
import { roleService } from "../../api/roleService";
import { documentTypeService } from "../../api/documentTypeService";
import { personService } from "../../api/personService";

const ITEMS_PER_PAGE = 5;

const ROLE_PRESETS: Record<string, { name: string; code: string; modules: string[]; description: string; permissions: Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }> }> = {
  "13000000-0000-0000-0000-000000000001": {
    name: "Administrador del Sistema",
    code: "ADMINISTRADOR",
    description: "Acceso total para configurar el sistema, gestionar usuarios, roles, catálogo y finanzas.",
    modules: ["Pacientes", "Citas", "Odontograma", "Historia Clínica", "Servicios", "Profesionales", "Usuarios", "Roles y Permisos"],
    permissions: {
      "Pacientes": { ver: true, crear: true, editar: true, eliminar: true },
      "Citas & Agenda": { ver: true, crear: true, editar: true, eliminar: true },
      "Odontograma": { ver: true, crear: true, editar: true, eliminar: true },
      "Historia Clínica": { ver: true, crear: true, editar: true, eliminar: true },
      "Catálogo Servicios": { ver: true, crear: true, editar: true, eliminar: true },
      "Profesionales": { ver: true, crear: true, editar: true, eliminar: true },
      "Gestión Usuarios": { ver: true, crear: true, editar: true, eliminar: true },
      "Roles & Permisos": { ver: true, crear: true, editar: true, eliminar: true },
    },
  },
  "13000000-0000-0000-0000-000000000002": {
    name: "Odontólogo Especialista",
    code: "ODONTOLOGO",
    description: "Atención clínica de pacientes, registro de odontograma, evolución clínica y consulta de agenda.",
    modules: ["Pacientes", "Citas", "Odontograma", "Historia Clínica", "Servicios", "Profesionales"],
    permissions: {
      "Pacientes": { ver: true, crear: true, editar: true, eliminar: false },
      "Citas & Agenda": { ver: true, crear: false, editar: true, eliminar: false },
      "Odontograma": { ver: true, crear: true, editar: true, eliminar: false },
      "Historia Clínica": { ver: true, crear: true, editar: true, eliminar: false },
      "Catálogo Servicios": { ver: true, crear: false, editar: false, eliminar: false },
      "Profesionales": { ver: true, crear: false, editar: false, eliminar: false },
      "Gestión Usuarios": { ver: false, crear: false, editar: false, eliminar: false },
      "Roles & Permisos": { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  "13000000-0000-0000-0000-000000000003": {
    name: "Recepcionista / Admisiones",
    code: "RECEPCIONISTA",
    description: "Agendamiento, recepción de pacientes, validación de citas y control de pagos.",
    modules: ["Pacientes", "Citas", "Servicios", "Profesionales"],
    permissions: {
      "Pacientes": { ver: true, crear: true, editar: true, eliminar: false },
      "Citas & Agenda": { ver: true, crear: true, editar: true, eliminar: true },
      "Odontograma": { ver: true, crear: false, editar: false, eliminar: false },
      "Historia Clínica": { ver: false, crear: false, editar: false, eliminar: false },
      "Catálogo Servicios": { ver: true, crear: false, editar: false, eliminar: false },
      "Profesionales": { ver: true, crear: false, editar: false, eliminar: false },
      "Gestión Usuarios": { ver: false, crear: false, editar: false, eliminar: false },
      "Roles & Permisos": { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  "13000000-0000-0000-0000-000000000004": {
    name: "Asistente Dental",
    code: "ASISTENTE",
    description: "Apoyo en procedimientos clínicos, preparación de instrumental y visualización de historias.",
    modules: ["Pacientes", "Citas", "Odontograma"],
    permissions: {
      "Pacientes": { ver: true, crear: false, editar: false, eliminar: false },
      "Citas & Agenda": { ver: true, crear: false, editar: false, eliminar: false },
      "Odontograma": { ver: true, crear: false, editar: false, eliminar: false },
      "Historia Clínica": { ver: true, crear: false, editar: false, eliminar: false },
      "Catálogo Servicios": { ver: false, crear: false, editar: false, eliminar: false },
      "Profesionales": { ver: true, crear: false, editar: false, eliminar: false },
      "Gestión Usuarios": { ver: false, crear: false, editar: false, eliminar: false },
      "Roles & Permisos": { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  "13000000-0000-0000-0000-000000000005": {
    name: "Paciente Registrado",
    code: "PACIENTE",
    description: "Acceso al portal del paciente para consultar citas agendadas y perfil clínico.",
    modules: ["Mis Citas", "Mi Perfil Clínico"],
    permissions: {
      "Pacientes": { ver: false, crear: false, editar: false, eliminar: false },
      "Citas & Agenda": { ver: true, crear: true, editar: false, eliminar: false },
      "Odontograma": { ver: false, crear: false, editar: false, eliminar: false },
      "Historia Clínica": { ver: false, crear: false, editar: false, eliminar: false },
      "Catálogo Servicios": { ver: true, crear: false, editar: false, eliminar: false },
      "Profesionales": { ver: true, crear: false, editar: false, eliminar: false },
      "Gestión Usuarios": { ver: false, crear: false, editar: false, eliminar: false },
      "Roles & Permisos": { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
};

export function UsuariosView() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [rol, setRol] = useState<"Todos" | string>("Todos");
  const [estado, setEstado] = useState<"Todos" | "Activo" | "Inactivo">("Todos");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal Crear Usuario
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

  // Modal Gestión de Rol y Permisos
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<Usuario | null>(null);
  const [selectedRoleIdForUser, setSelectedRoleIdForUser] = useState<string>("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ text: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCatalogs = async () => {
    try {
      const [rolesData, docTypesData] = await Promise.all([
        roleService.getAll().catch(() => []),
        documentTypeService.getAll().catch(() => [])
      ]);
      const humanRoles = (rolesData || []).filter(
        (r: any) => !r.code?.toUpperCase().includes("BOT") && !r.name?.toLowerCase().includes("bot") && !r.name?.toLowerCase().includes("chatbot")
      );
      setRoles(humanRoles);
      setDocumentTypes(docTypesData);
      if (docTypesData.length > 0) {
        setNuevoTipoDocumento(docTypesData[0].id);
      }
      if (humanRoles.length > 0) {
        const defaultRole = humanRoles.find((r: any) => r.code !== "ASISTENTE") || humanRoles[0];
        setNuevoRol(defaultRole.id);
      }
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const [data, personsData, rolesData] = await Promise.all([
        userService.getAll({ includeInactive: true }).catch(() => userService.getAll().catch(() => [])),
        personService.getAll().catch(() => []),
        roleService.getAll().catch(() => []),
      ]);

      const isBotUser = (u: any) => {
        const email = (u.email || "").toLowerCase();
        const name = (u.name || (u.person ? `${u.person.firstName} ${u.person.lastName}` : "")).toLowerCase();
        const code = (u.roleCode || "").toUpperCase();
        return email.includes("bot") || email.includes("chatbot") || name.includes("bot service") || name.includes("chatbot") || code.includes("BOT");
      };

      const filteredApiData = (data || []).filter((u: any) => !isBotUser(u));

      const mappedUsuarios: Usuario[] = filteredApiData.map((u: any, idx: number) => {
        const matchedPerson = personsData.find((p: any) => p.id === u.personId);

        let fullName = "Usuario del Sistema";
        if (u.person && (u.person.firstName || u.person.lastName)) {
          fullName = `${u.person.firstName || ""} ${u.person.lastName || ""}`.trim();
        } else if (matchedPerson && (matchedPerson.firstName || matchedPerson.lastName)) {
          fullName = `${matchedPerson.firstName || ""} ${matchedPerson.lastName || ""}`.trim();
        } else if (u.name) {
          fullName = u.name;
        } else if (u.email && typeof u.email === "string" && u.email.includes("@")) {
          fullName = u.email.split("@")[0];
        } else {
          fullName = `Usuario #${idx + 1}`;
        }

        const userEmail = matchedPerson?.email || u.email || `usuario${idx + 1}@nexusodonto.com`;

        // Resolver rol real a partir de roleIds
        const userRoleIds: string[] = u.roleIds || [];
        let primaryRoleId = userRoleIds[0];

        // Si no viene roleId, deducir según email / datos del sistema
        if (!primaryRoleId) {
          if (userEmail.includes("admin")) primaryRoleId = "13000000-0000-0000-0000-000000000001";
          else if (userEmail.includes("odontologo")) primaryRoleId = "13000000-0000-0000-0000-000000000002";
          else if (userEmail.includes("recepcion")) primaryRoleId = "13000000-0000-0000-0000-000000000003";
          else if (userEmail.includes("paciente")) primaryRoleId = "13000000-0000-0000-0000-000000000005";
          else primaryRoleId = "13000000-0000-0000-0000-000000000003";
        }

        const matchedRole = rolesData.find((r: any) => r.id === primaryRoleId);
        const preset = ROLE_PRESETS[primaryRoleId] || {
          name: matchedRole?.name || "Personal",
          code: matchedRole?.code || "USUARIO",
          modules: ["Pacientes", "Citas"],
          description: "Acceso básico asignado",
          permissions: {},
        };

        // Determine raw active status directly from API (F-20)
        let rawActive = u.isActive ?? u.activo ?? u.is_active;
        if (rawActive === undefined && u.status) {
          rawActive = !["inactivo", "inactive", "false", "0"].includes(String(u.status).toLowerCase());
        }
        if (rawActive === undefined && u.state) {
          rawActive = !["inactivo", "inactive", "false", "0"].includes(String(u.state).toLowerCase());
        }
        const isUserActive = rawActive !== undefined ? Boolean(rawActive) : true;

        return {
          id: u.id,
          personId: u.personId || u.id,
          name: fullName,
          email: userEmail,
          isActive: isUserActive,
          status: isUserActive ? "Activo" : "Inactivo",
          state: isUserActive ? "Activo" : "Inactivo",
          roleIds: [primaryRoleId],
          roleName: matchedRole?.name || preset.name,
          roleCode: matchedRole?.code || preset.code,
          permissionsCount: preset.modules.length,
          modulesList: preset.modules,
          permissions: preset.modules,
        };
      });

      // Inspección de usuarios cargados
      console.log("Usuarios cargados en frontend:", mappedUsuarios);

      try {
        localStorage.setItem("nexus_usuarios_cache", JSON.stringify(mappedUsuarios));
      } catch {}

      setUsuarios(mappedUsuarios);
    } catch (error) {
      console.error('Error fetching users from API:', error);
      try {
        const rawCached = localStorage.getItem("nexus_usuarios_cache");
        if (rawCached) setUsuarios(JSON.parse(rawCached));
        else setUsuarios([]);
      } catch {
        setUsuarios([]);
      }
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
      // 1. Filtro de Búsqueda por Texto
      const searchLower = (search || "").trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        usuario.name?.toLowerCase().includes(searchLower) ||
        usuario.email?.toLowerCase().includes(searchLower) ||
        usuario.roleName?.toLowerCase().includes(searchLower) ||
        usuario.roleCode?.toLowerCase().includes(searchLower);

      // 2. Filtro de Rol
      const matchesRole =
        rol === "Todos" ||
        rol === "ALL" ||
        !rol ||
        (usuario.roleIds && usuario.roleIds.some((rId: string) => rId === rol)) ||
        (usuario.roleName && usuario.roleName.toLowerCase() === rol.toLowerCase()) ||
        (usuario.roleCode && usuario.roleCode.toLowerCase() === rol.toLowerCase());

      // 3. Filtro de Estado (Activo / Inactivo) Robusto
      let matchesStatus = true;
      const rawActiveVal = usuario.isActive as any;
      const isUserInactive =
        rawActiveVal === false ||
        rawActiveVal === 0 ||
        rawActiveVal === "false" ||
        rawActiveVal === "0" ||
        usuario.status?.toLowerCase() === "inactivo" ||
        usuario.status?.toLowerCase() === "inactive" ||
        usuario.state?.toLowerCase() === "inactivo" ||
        usuario.state?.toLowerCase() === "inactive";
      const isUserActive = !isUserInactive;

      const estadoLower = (estado || "").trim().toLowerCase();
      if (estadoLower === "activo" || estadoLower === "active" || estadoLower === "true" || estadoLower === "1") {
        matchesStatus = isUserActive;
      } else if (estadoLower === "inactivo" || estadoLower === "inactive" || estadoLower === "false" || estadoLower === "0") {
        matchesStatus = isUserInactive;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usuarios, search, rol, estado]);

  const totalPages = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE));
  const usuariosPagina = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return usuariosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [usuariosFiltrados, currentPage]);

  const abrirModal = () => {
    setErrorForm("");
    setNuevoNombre("");
    setNuevoApellido("");
    setNuevoCorreo("");
    setNuevoPassword("");
    setNuevoDocumento("");
    setNuevoTelefono("");
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
  };

  // Abrir Modal de Permisos y Rol
  const handleOpenPermissionsModal = (usuario: Usuario) => {
    setSelectedUserForPermissions(usuario);
    setSelectedRoleIdForUser(usuario.roleIds[0] || "13000000-0000-0000-0000-000000000003");
  };

  // Guardar cambio de Rol y Permisos en el Backend
  const handleSaveUserRole = async () => {
    if (!selectedUserForPermissions || !selectedRoleIdForUser) return;

    try {
      setIsSavingRole(true);
      await userService.update(selectedUserForPermissions.id, {
        roleIds: [selectedRoleIdForUser],
      });

      const preset = ROLE_PRESETS[selectedRoleIdForUser];
      const roleFound = roles.find((r) => r.id === selectedRoleIdForUser);

      setUsuarios((prev) =>
        prev.map((u) => {
          if (u.id === selectedUserForPermissions.id) {
            return {
              ...u,
              roleIds: [selectedRoleIdForUser],
              roleName: roleFound?.name || preset?.name || u.roleName,
              roleCode: roleFound?.code || preset?.code || u.roleCode,
              permissionsCount: preset?.modules.length || u.permissionsCount,
              modulesList: preset?.modules || u.modulesList,
              permissions: preset?.modules || u.permissions,
            };
          }
          return u;
        })
      );

      showToast(`¡Rol y permisos actualizados para ${selectedUserForPermissions.name}!`, "success");
      setSelectedUserForPermissions(null);
    } catch (err) {
      console.warn("Could not persist role in backend:", err);
      showToast("No se pudo actualizar el rol en el servidor.", "error");
    } finally {
      setIsSavingRole(false);
    }
  };

  // Toggle de Estado Activo/Inactivo (Activar <-> Desactivar)
  const handleToggleStatus = async (usuario: Usuario) => {
    // Guard clause: Prevención de auto-desactivación de la cuenta propia (BUG-01)
    const isSelf = Boolean(
      (user?.id && areGuidsEqual(user.id, usuario.id)) ||
      (user?.personId && areGuidsEqual(user.personId, usuario.personId)) ||
      (user?.email && usuario.email && user.email.toLowerCase() === usuario.email.toLowerCase())
    );

    if (isSelf) {
      showToast("No puedes desactivar tu propia cuenta de administrador.", "error");
      return;
    }

    const newStatus = !usuario.isActive;
    const previousUsers = [...usuarios];

    // 1. Mutación optimista en memoria (SIN tocar localStorage)
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === usuario.id || (usuario.personId && u.personId === usuario.personId) || (usuario.email && u.email.toLowerCase() === usuario.email.toLowerCase())
          ? {
              ...u,
              isActive: newStatus,
              status: newStatus ? "Activo" : "Inactivo",
              state: newStatus ? "Activo" : "Inactivo",
            }
          : u
      )
    );

    try {
      await userService.update(usuario.id, { isActive: newStatus });
      showToast(`Usuario ${usuario.name} ${newStatus ? "reactivado" : "desactivado"} correctamente.`, "success");
    } catch (err: any) {
      // 2. Reversión inmediata ante error real de servidor (F-20)
      setUsuarios(previousUsers);
      console.error("Fallo al alternar estado en backend API:", err);
      showToast(err?.response?.data?.message || "No se pudo modificar el estado del usuario en el servidor.", "error");
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm("");

    if (!nuevoNombre.trim() || !nuevoApellido.trim() || !nuevoCorreo.trim() || !nuevoPassword.trim() || !nuevoDocumento.trim()) {
      setErrorForm("Por favor completa los campos obligatorios.");
      return;
    }

    try {
      setIsSubmitting(true);

      const personCreated = await personService.create({
        documentTypeId: nuevoTipoDocumento,
        documentNumber: nuevoDocumento.trim(),
        firstName: nuevoNombre.trim(),
        lastName: nuevoApellido.trim(),
        email: nuevoCorreo.trim(),
        phone: nuevoTelefono.trim() || "+573000000000",
      });

      const userCreated = await userService.create({
        personId: personCreated.id,
        password: nuevoPassword,
        roleId: nuevoRol,
      });

      const preset = ROLE_PRESETS[nuevoRol];
      const roleFound = roles.find((r) => r.id === nuevoRol);

      const nuevoUsuario: Usuario = {
        id: userCreated?.id || `user-${Date.now()}`,
        personId: personCreated.id,
        name: `${nuevoNombre.trim()} ${nuevoApellido.trim()}`,
        email: nuevoCorreo.trim(),
        roleIds: [nuevoRol],
        roleName: roleFound?.name || preset?.name || "Personal",
        roleCode: roleFound?.code || preset?.code || "USUARIO",
        permissionsCount: preset?.modules.length || 4,
        modulesList: preset?.modules || [],
        permissions: preset?.modules || [],
        isActive: true,
      };

      setUsuarios((prev) => {
        const updated = [nuevoUsuario, ...prev];
        try {
          localStorage.setItem("nexus_usuarios_cache", JSON.stringify(updated));
        } catch {}
        return updated;
      });
      cerrarModal();
      showToast("¡Usuario y credenciales creados exitosamente!", "success");
    } catch (err: any) {
      console.error("Error creating user:", err);
      setErrorForm(err.response?.data?.message || "No se pudo registrar el usuario en el backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePreset = ROLE_PRESETS[selectedRoleIdForUser] || ROLE_PRESETS["13000000-0000-0000-0000-000000000003"];

  return (
    <div className="space-y-6">
      {/* Toast Notification (BUG-06: Error vs Success styling & icon) */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl animate-slideUp backdrop-blur-xl ${
            toast.type === "error"
              ? "bg-rose-950/90 text-rose-100 border border-rose-500/50 shadow-rose-950/50"
              : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border border-cyan-500/30 shadow-cyan-950/50"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-cyan-400 dark:text-cyan-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideUp">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Directorio de Usuarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Gestión de cuentas, asignación de roles RBAC y control de permisos de acceso.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 animate-slideUp animate-stagger-1">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar usuario por nombre, correo o rol..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-cyan-500 transition-all backdrop-blur-xl shadow-md"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={rol}
            onChange={(e) => handleRolChange(e.target.value)}
            className="px-3.5 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-xl shadow-md cursor-pointer"
          >
            <option value="Todos">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
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

      {/* Tabla Principal de Usuarios */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md overflow-hidden animate-slideUp animate-stagger-2">
        <UsuariosTable
          usuarios={usuariosPagina}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          currentUser={user}
          onPageChange={setCurrentPage}
          onManagePermissions={handleOpenPermissionsModal}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* MODAL INTERACTIVO: GESTIÓN DE ROL Y PERMISOS DE USUARIO */}
      {selectedUserForPermissions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setSelectedUserForPermissions(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/20 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Permisos y Control de Acceso
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedUserForPermissions.name} • {selectedUserForPermissions.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForPermissions(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selector de Rol */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Rol del Usuario en el Sistema
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roles.map((r) => {
                  const isCurrentSelected = selectedRoleIdForUser === r.id;
                  const preset = ROLE_PRESETS[r.id];

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoleIdForUser(r.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isCurrentSelected
                          ? "bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-sm ring-2 ring-cyan-500/30"
                          : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{r.name}</span>
                        {isCurrentSelected && (
                          <Check size={16} className="text-cyan-600 dark:text-cyan-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {preset?.description || r.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matriz de Permisos Desglosada por Módulo */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Matriz de Permisos Otorgados por este Rol
                </span>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {activePreset?.modules.length || 0} módulos autorizados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs max-h-60 overflow-y-auto pr-1">
                {Object.entries(activePreset?.permissions || {}).map(([modulo, perms]) => (
                  <div
                    key={modulo}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{modulo}</span>
                      {perms.ver ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                          Autorizado
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                          Bloqueado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className={perms.ver ? "text-emerald-600 font-bold" : "opacity-40"}>Ver</span> •
                      <span className={perms.crear ? "text-cyan-600 font-bold" : "opacity-40"}>Crear</span> •
                      <span className={perms.editar ? "text-amber-600 font-bold" : "opacity-40"}>Editar</span> •
                      <span className={perms.eliminar ? "text-rose-600 font-bold" : "opacity-40"}>Eliminar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedUserForPermissions(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingRole}
                onClick={handleSaveUserRole}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSavingRole ? "Guardando..." : "Guardar Cambios de Rol"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-950 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn"
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
                    Registra un nuevo usuario con credenciales en el sistema.
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
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej. Carlos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="nuevo-apellido" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Apellido *
                  </label>
                  <input
                    id="nuevo-apellido"
                    type="text"
                    required
                    value={nuevoApellido}
                    onChange={(e) => setNuevoApellido(e.target.value)}
                    placeholder="Ej. Gómez"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nuevo-tipo-doc" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipo de Documento *
                  </label>
                  <select
                    id="nuevo-tipo-doc"
                    value={nuevoTipoDocumento}
                    onChange={(e) => setNuevoTipoDocumento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all cursor-pointer"
                  >
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.name || dt.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="nuevo-documento" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Número de Documento *
                  </label>
                  <input
                    id="nuevo-documento"
                    type="text"
                    required
                    value={nuevoDocumento}
                    onChange={(e) => setNuevoDocumento(e.target.value)}
                    placeholder="Ej. 1098765432"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nuevo-correo" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    id="nuevo-correo"
                    type="email"
                    required
                    value={nuevoCorreo}
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    placeholder="carlos@nexusodonto.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="nuevo-telefono" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teléfono Móvil
                  </label>
                  <input
                    id="nuevo-telefono"
                    type="tel"
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nuevo-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Contraseña Inicial *
                  </label>
                  <input
                    id="nuevo-password"
                    type="password"
                    required
                    value={nuevoPassword}
                    onChange={(e) => setNuevoPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="nuevo-rol" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rol Inicial *
                  </label>
                  <select
                    id="nuevo-rol"
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorForm && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {errorForm}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200/80 dark:border-white/15 bg-slate-50/50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCrearUsuario}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Registrando..." : "Crear Usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosView;
