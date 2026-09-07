import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  User,
  Smile,
  ShieldCheck,
  Calendar,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { formatRoleName } from "../../utils/roleUtils";
import { getUserRole } from "../../utils/routePermissions";

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cerrar con la tecla ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!user) {
    return null;
  }

  const fullName =
    user.name ||
    `${user.nombre || ""} ${user.apellido || ""}`.trim() ||
    user.email.split("@")[0] ||
    "Usuario";

  const userRole = formatRoleName(
    user.rol || (user.roleIds && user.roleIds.length > 0 ? user.roleIds[0] : getUserRole(user))
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* BOTÓN DEL USUARIO (TIPO GITHUB HEADER CON ESTADO EN VERDE) */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60"
        aria-label="Abrir menú de usuario"
        aria-expanded={isOpen}
      >
        <div className="relative shrink-0">
          {user.avatar && !imageError ? (
            <img
              src={user.avatar}
              alt={fullName}
              onError={() => setImageError(true)}
              className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-teal-500 text-white font-bold text-xs shadow-sm">
              {getInitials(fullName)}
            </div>
          )}
          {/* Indicador de estado activo en verde */}
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-sm" />
        </div>

        <span className="hidden text-sm font-semibold text-slate-800 dark:text-slate-100 sm:block max-w-35 truncate">
          {fullName}
        </span>

        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-cyan-500" : ""
          }`}
        />
      </button>

      {/* DROPDOWN FLOTANTE ESTILO GITHUB CON ANIMACIÓN SUAVE */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2.5 w-72 origin-top-right rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-2 shadow-2xl backdrop-blur-xl animate-scaleIn transition-all text-slate-900 dark:text-slate-100">
          
          {/* HEADER DEL PERFIL */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              {user.avatar && !imageError ? (
                <img
                  src={user.avatar}
                  alt={fullName}
                  onError={() => setImageError(true)}
                  className="h-10 w-10 rounded-full object-cover border-2 border-cyan-500/80 shadow-md shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-teal-500 text-white font-bold text-sm shadow-md shrink-0">
                  {getInitials(fullName)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {fullName}
                </h3>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20 dark:border-teal-400/30 uppercase tracking-wider truncate max-w-full" title={userRole}>
                    {userRole}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleNavigation("/perfil")}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title="Cambiar perfil / Ajustes"
            >
              <ArrowLeftRight size={15} />
            </button>
          </div>

          {/* ESTABLECER ESTADO (SOLO PACIENTES) */}
          {getUserRole(user) === "PACIENTE" && (
            <>
              <button
                type="button"
                onClick={() => handleNavigation("/perfil")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer mb-1 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
              >
                <Smile size={16} className="text-amber-500" />
                <span>Establecer estado clínico...</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
            </>
          )}

          {/* SECCIÓN DE NAVEGACIÓN Y ACCIONES */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleNavigation("/perfil")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
            >
              <User size={16} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
              <span>Mi Perfil</span>
            </button>

            {getUserRole(user) !== "PACIENTE" ? (
              <button
                type="button"
                onClick={() => handleNavigation("/pacientes")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
              >
                <Users size={16} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                <span>Directorio de Pacientes</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigation("/citas")}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
              >
                <Calendar size={16} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                <span>Mis Citas</span>
              </button>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

          {/* PERMISOS Y ROL DE ACCESO */}
          <div className="px-3 py-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              Rol de plataforma:
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{userRole}</span>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

          {/* CERRAR SESIÓN */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-500 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}