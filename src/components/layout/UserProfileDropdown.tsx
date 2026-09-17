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
import { UserAvatar } from "../common/UserAvatar";

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
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
        aria-label="Menú de perfil de usuario"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="relative shrink-0">
          <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
            <UserAvatar
              avatar={user.avatar}
              name={fullName}
              size="sm"
              animate="hover"
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full flex items-center justify-center font-bold text-xs"
            />
          </div>
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
        <div className="fixed top-16 right-2 left-2 sm:left-auto sm:right-0 sm:absolute sm:top-full z-50 mt-2.5 w-auto sm:w-72 max-w-xs ml-auto origin-top-right rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1117] p-2 shadow-2xl backdrop-blur-xl animate-scaleIn transition-all text-slate-900 dark:text-slate-100">
          
          {/* HEADER DEL PERFIL */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-cyan-500/80 shadow-md shrink-0 flex items-center justify-center">
                <UserAvatar
                  avatar={user.avatar}
                  name={fullName}
                  size="md"
                  animate="hover"
                  className="h-full w-full object-cover"
                  fallbackClassName="h-full w-full flex items-center justify-center font-bold text-sm"
                />
              </div>

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
          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              Rol de plataforma:
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{userRole}</span>
          </div>

          {/* CUENTA GOOGLE SSO */}
          <button
            type="button"
            onClick={() => handleNavigation("/perfil")}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer rounded-xl"
            title="Administrar vinculación de Google en tu perfil"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Acceso Google:</span>
            </span>
            <span className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
              {user?.googleLinked || (typeof window !== "undefined" && localStorage.getItem(`user_google_linked_${user?.id || user?.email}`) === "true")
                ? "Vinculada ✓"
                : "Vincular →"}
            </span>
          </button>

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