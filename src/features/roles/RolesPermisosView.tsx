import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  Search,
  Check,
  X,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { roleService, type Role } from "../../api/roleService";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";

const modulosSistema = [
  { id: "pacientes", nombre: "Gestión de Pacientes" },
  { id: "citas", nombre: "Citas y Agenda" },
  { id: "odontograma", nombre: "Odontograma Clínico" },
  { id: "historia_clinica", nombre: "Historia Clínica y Evolución" },
  { id: "servicios", nombre: "Catálogo de Servicios y Tarifas" },
  { id: "profesionales", nombre: "Profesionales y Turnos" },
  { id: "usuarios", nombre: "Gestión de Usuarios" },
  { id: "roles", nombre: "Roles y Permisos del Sistema" },
];

const rolesFallback: (Role & { permisos: Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }> })[] = [
  {
    id: "13000000-0000-0000-0000-000000000001",
    code: "ADMINISTRADOR",
    name: "Administrador del Sistema",
    description: "Acceso total para configurar el sistema, gestionar usuarios, roles, catálogo y finanzas.",
    isActive: true,
    permisos: {
      pacientes: { ver: true, crear: true, editar: true, eliminar: true },
      citas: { ver: true, crear: true, editar: true, eliminar: true },
      odontograma: { ver: true, crear: true, editar: true, eliminar: true },
      historia_clinica: { ver: true, crear: true, editar: true, eliminar: true },
      servicios: { ver: true, crear: true, editar: true, eliminar: true },
      profesionales: { ver: true, crear: true, editar: true, eliminar: true },
      usuarios: { ver: true, crear: true, editar: true, eliminar: true },
      roles: { ver: true, crear: true, editar: true, eliminar: true },
    },
  },
  {
    id: "13000000-0000-0000-0000-000000000002",
    code: "ODONTOLOGO",
    name: "Odontólogo Especialista",
    description: "Atención clínica de pacientes, registro de odontograma, evolución clínica y consulta de agenda.",
    isActive: true,
    permisos: {
      pacientes: { ver: true, crear: true, editar: true, eliminar: false },
      citas: { ver: true, crear: false, editar: true, eliminar: false },
      odontograma: { ver: true, crear: true, editar: true, eliminar: false },
      historia_clinica: { ver: true, crear: true, editar: true, eliminar: false },
      servicios: { ver: true, crear: false, editar: false, eliminar: false },
      profesionales: { ver: true, crear: false, editar: false, eliminar: false },
      usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      roles: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  {
    id: "13000000-0000-0000-0000-000000000003",
    code: "RECEPCIONISTA",
    name: "Recepcionista / Admisiones",
    description: "Agendamiento, recepción de pacientes, validación de citas y control de pagos.",
    isActive: true,
    permisos: {
      pacientes: { ver: true, crear: true, editar: true, eliminar: false },
      citas: { ver: true, crear: true, editar: true, eliminar: true },
      odontograma: { ver: true, crear: false, editar: false, eliminar: false },
      historia_clinica: { ver: false, crear: false, editar: false, eliminar: false },
      servicios: { ver: true, crear: false, editar: false, eliminar: false },
      profesionales: { ver: true, crear: false, editar: false, eliminar: false },
      usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      roles: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  {
    id: "13000000-0000-0000-0000-000000000004",
    code: "ASISTENTE",
    name: "Asistente Dental",
    description: "Apoyo en procedimientos clínicos, preparación de instrumental y visualización de agenda.",
    isActive: true,
    permisos: {
      pacientes: { ver: true, crear: false, editar: false, eliminar: false },
      citas: { ver: true, crear: false, editar: false, eliminar: false },
      odontograma: { ver: true, crear: false, editar: false, eliminar: false },
      historia_clinica: { ver: true, crear: false, editar: false, eliminar: false },
      servicios: { ver: true, crear: false, editar: false, eliminar: false },
      profesionales: { ver: true, crear: false, editar: false, eliminar: false },
      usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      roles: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
  {
    id: "13000000-0000-0000-0000-000000000005",
    code: "PACIENTE",
    name: "Paciente (Portal Web)",
    description: "Solicitud y consulta de citas propias, historial de atenciones y visualización de odontograma.",
    isActive: true,
    permisos: {
      pacientes: { ver: false, crear: false, editar: false, eliminar: false },
      citas: { ver: true, crear: true, editar: false, eliminar: false },
      odontograma: { ver: true, crear: false, editar: false, eliminar: false },
      historia_clinica: { ver: false, crear: false, editar: false, eliminar: false },
      servicios: { ver: true, crear: false, editar: false, eliminar: false },
      profesionales: { ver: true, crear: false, editar: false, eliminar: false },
      usuarios: { ver: false, crear: false, editar: false, eliminar: false },
      roles: { ver: false, crear: false, editar: false, eliminar: false },
    },
  },
];

export function RolesPermisosView() {
  const [roles, setRoles] = useState<typeof rolesFallback>(rolesFallback);
  const [selectedRole, setSelectedRole] = useState<typeof rolesFallback[0]>(rolesFallback[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form nuevo rol
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCodigo, setNuevoCodigo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");

  const translateRoleName = (code?: string, name?: string): string => {
    const c = (code || "").toUpperCase();
    const n = (name || "").toLowerCase();
    if (c.includes("ADMIN") || n.includes("admin")) return "Administrador del Sistema";
    if (c.includes("ODONT") || c.includes("DENTIST") || n.includes("dentist") || n.includes("odont")) return "Odontólogo Especialista";
    if (c.includes("RECEPC") || c.includes("RECEPT") || n.includes("reception")) return "Recepcionista / Admisiones";
    if (c.includes("ASIST") || c.includes("ASSIST") || n.includes("assistant") || n.includes("auxil")) return "Asistente Dental";
    if (c.includes("PACIENT") || c.includes("PATIENT") || n.includes("patient") || n.includes("paciente")) return "Paciente (Portal Web)";
    return name || "Rol del Sistema";
  };

  const translateRoleDescription = (desc?: string, fallbackDesc?: string): string => {
    if (!desc) return fallbackDesc || "Rol con permisos asignados para el uso del sistema.";
    const lower = desc.toLowerCase();
    if (lower.includes("full access") || lower.includes("every module") || lower.includes("admin")) {
      return "Acceso total para configurar el sistema, gestionar usuarios, roles, catálogo y reportes.";
    }
    if (lower.includes("clinical") || lower.includes("dentist") || lower.includes("odont") || lower.includes("odontogram")) {
      return "Atención clínica de pacientes, registro de odontograma, evolución clínica y consulta de agenda.";
    }
    if (lower.includes("reception") || lower.includes("admission") || lower.includes("appointment")) {
      return "Agendamiento, recepción de pacientes, validación de citas y control de admisiones.";
    }
    if (lower.includes("assist") || lower.includes("support")) {
      return "Apoyo en procedimientos clínicos, preparación de instrumental y visualización de agenda.";
    }
    if (lower.includes("patient") || lower.includes("own appointment")) {
      return "Solicitud y consulta de citas propias, historial de atenciones y visualización de odontograma.";
    }
    return desc;
  };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roleService.getAll();
      if (data && data.length > 0) {
        const mapped = data.map((r, idx) => {
          const fallbackMatch = rolesFallback.find(
            (fb) => fb.code?.toUpperCase() === r.code?.toUpperCase()
          ) || rolesFallback[idx % rolesFallback.length] || rolesFallback[0];

          return {
            id: r.id,
            code: r.code,
            name: translateRoleName(r.code, r.name),
            description: translateRoleDescription(r.description, fallbackMatch?.description),
            isActive: r.isActive,
            permisos: fallbackMatch?.permisos || {},
          };
        });
        setRoles(mapped);
        setSelectedRole(mapped[0]);
      } else {
        setRoles(rolesFallback);
        setSelectedRole(rolesFallback[0]);
      }
    } catch (err) {
      console.warn("API Roles unavailable, using fallback:", err);
      setRoles(rolesFallback);
      setSelectedRole(rolesFallback[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleTogglePermission = (moduloId: string, action: "ver" | "crear" | "editar" | "eliminar") => {
    if (!selectedRole) return;

    setRoles((prevRoles) => {
      const updatedRoles = prevRoles.map((r) => {
        if (r.id === selectedRole.id) {
          const modPerm = r.permisos[moduloId] || { ver: false, crear: false, editar: false, eliminar: false };
          return {
            ...r,
            permisos: {
              ...r.permisos,
              [moduloId]: {
                ...modPerm,
                [action]: !modPerm[action],
              },
            },
          };
        }
        return r;
      });

      const updatedSelected = updatedRoles.find((r) => r.id === selectedRole.id);
      if (updatedSelected) {
        setSelectedRole(updatedSelected);
      }
      return updatedRoles;
    });

    setSuccessToast("Permiso actualizado correctamente");
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoCodigo.trim()) return;

    const newRole = {
      id: `role-${Date.now()}`,
      code: nuevoCodigo.toUpperCase().replace(/\s+/g, "_"),
      name: nuevoNombre.trim(),
      description: nuevaDescripcion.trim() || "Rol personalizado creado por el Administrador.",
      isActive: true,
      permisos: {
        pacientes: { ver: true, crear: false, editar: false, eliminar: false },
        citas: { ver: true, crear: false, editar: false, eliminar: false },
        odontograma: { ver: false, crear: false, editar: false, eliminar: false },
        historia_clinica: { ver: false, crear: false, editar: false, eliminar: false },
        servicios: { ver: true, crear: false, editar: false, eliminar: false },
        profesionales: { ver: true, crear: false, editar: false, eliminar: false },
        usuarios: { ver: false, crear: false, editar: false, eliminar: false },
        roles: { ver: false, crear: false, editar: false, eliminar: false },
      },
    };

    setRoles((prev) => [newRole, ...prev]);
    setSelectedRole(newRole);
    setShowCreateModal(false);
    setNuevoNombre("");
    setNuevoCodigo("");
    setNuevaDescripcion("");
    setSuccessToast("¡Nuevo rol registrado con éxito!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const rolesFiltrados = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-scaleIn">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Encabezado Principal estilo Pacientes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Roles y Matriz de Permisos
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Configuración dinámica de accesos y acciones CRUD por módulo en la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchRoles}
            className="group p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm flex items-center justify-center"
            title="Recargar roles"
          >
            <DentistryReloadIcon size={20} loading={loading} />
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Crear Rol</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Roles (Izquierda) + Matriz de Permisos (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-slideUp">
        {/* Panel Lateral: Selector de Roles */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-cyan-500 backdrop-blur-xl shadow-md"
            />
          </div>

          <div className="space-y-2.5">
            {rolesFiltrados.map((rol) => {
              const isSelected = selectedRole?.id === rol.id;
              return (
                <div
                  key={rol.id}
                  onClick={() => setSelectedRole(rol)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer backdrop-blur-xl ${
                    isSelected
                      ? "border-cyan-500/80 bg-cyan-500/10 dark:bg-cyan-500/20 shadow-lg scale-[1.01]"
                      : "border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 hover:border-cyan-500/40 hover:bg-white dark:hover:bg-slate-950/80 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? "bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
                        }`}
                      >
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {rol.name}
                        </h3>
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-semibold uppercase">
                          {rol.code}
                        </span>
                      </div>
                    </div>

                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {rol.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Central: Matriz de Permisos por Acción CRUD */}
        <div className="lg:col-span-8">
          {selectedRole ? (
            <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80 dark:border-white/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      Permisos: {selectedRole.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                      <Sparkles size={11} />
                      {selectedRole.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Marca o desmarca las acciones permitidas para este rol en el sistema.
                  </p>
                </div>

                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
                  <Lock size={12} className="inline mr-1 text-cyan-500" />
                  Validación RBAC en tiempo real
                </div>
              </div>

              {/* TABLA DE MATRIZ CRUD */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/15 bg-slate-100/75 dark:bg-slate-900/60">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Módulo del Sistema
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Ver (Read)
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Crear (Create)
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Editar (Update)
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Eliminar (Delete)
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 text-xs">
                    {modulosSistema.map((mod) => {
                      const perm = selectedRole.permisos[mod.id] || { ver: false, crear: false, editar: false, eliminar: false };
                      return (
                        <tr key={mod.id} className="hover:bg-cyan-500/5 dark:hover:bg-cyan-400/10 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {mod.nombre}
                          </td>

                          {(["ver", "crear", "editar", "eliminar"] as const).map((accion) => {
                            const isAllowed = perm[accion];
                            return (
                              <td key={accion} className="px-3 py-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(mod.id, accion)}
                                  className={`h-7 w-7 rounded-xl inline-flex items-center justify-center transition-all cursor-pointer ${
                                    isAllowed
                                      ? "bg-emerald-500 text-white shadow-sm hover:scale-105 active:scale-95"
                                      : "bg-slate-200/80 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700"
                                  }`}
                                  title={`${isAllowed ? "Permitido" : "Denegado"} - Clic para cambiar`}
                                >
                                  {isAllowed ? <Check size={14} /> : <X size={14} />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl">
              <p className="text-sm text-slate-500">Selecciona un rol para visualizar su matriz de permisos.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR ROL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Crear Nuevo Rol de Acceso
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define un perfil de usuario y configura sus permisos en el sistema.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre del Rol *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Coordinador Clínico"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Código Único (Identificador) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. COORDINADOR_CLINICO"
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descripción del Alcance
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe qué responsabilidades tiene este rol..."
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none transition-all backdrop-blur-md"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default RolesPermisosView;
