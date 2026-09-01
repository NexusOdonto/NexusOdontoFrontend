import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { UserAvatar } from "../common/UserAvatar";
import { formatRoleName } from "../../utils/roleUtils";

export default function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Cerrar la viñeta al hacer clic fuera
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cerrar con la tecla ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleAccount = () => {
    setIsOpen(false);
    navigate("/perfil");
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  if (!user) {
    return null;
  }

  const fullName =
    user.name ||
    `${user.nombre || ""} ${user.apellido || ""}`.trim() ||
    user.email.split("@")[0] ||
    "Usuario";

  const userRole =
    user.rol ||
    (user.roleIds && user.roleIds.length > 0 ? user.roleIds[0] : "USUARIO");

  return (
    <div ref={dropdownRef} className="relative">
      {/* BOTÓN DEL USUARIO */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="
          flex
          items-center
          gap-2.5
          rounded-2xl
          px-2
          py-1.5
          transition-all
          hover:bg-slate-100
          dark:hover:bg-slate-800/80
          cursor-pointer
        "
        aria-label="Abrir menú de usuario"
        aria-expanded={isOpen}
      >
        <div className="h-8 w-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-750">
          <UserAvatar
            avatar={user.avatar || user.avatarUrl}
            name={fullName}
            size="sm"
            className="w-full h-full object-cover rounded-xl"
            fallbackClassName="w-full h-full flex items-center justify-center font-bold text-[11px] text-teal-700 dark:text-teal-300 bg-teal-500/20"
          />
        </div>

        <span className="hidden text-xs font-semibold text-slate-800 dark:text-slate-100 sm:block max-w-[150px] truncate">
          {fullName}
        </span>

        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* VIÑETA / DROPDOWN */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-fadeIn">
          {/* INFORMACIÓN DEL USUARIO */}
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 p-4">
            <div className="h-12 w-12 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner ring-2 ring-teal-500/30">
              <UserAvatar
                avatar={user.avatar || user.avatarUrl}
                name={fullName}
                size="md"
                className="w-full h-full object-cover rounded-2xl"
                fallbackClassName="w-full h-full flex items-center justify-center font-bold text-sm text-teal-700 dark:text-teal-300 bg-teal-500/20"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-bold text-slate-900 dark:text-white text-sm">
                {fullName}
              </h3>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>

              <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-950/60 text-teal-400 border border-teal-500/30 uppercase tracking-wider">
                {formatRoleName(userRole)}
              </span>
            </div>
          </div>

          {/* OPCIONES */}
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={handleAccount}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Settings size={16} className="text-teal-500" />
              <span>Mi Perfil</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2 text-left text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}