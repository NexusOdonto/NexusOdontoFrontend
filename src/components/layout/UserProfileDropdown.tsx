import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

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
          gap-3
          rounded-xl
          px-2
          py-1
          transition-colors
          hover:bg-slate-100
          dark:hover:bg-slate-800
          cursor-pointer
        "
        aria-label="Abrir menú de usuario"
        aria-expanded={isOpen}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={fullName}
            className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <UserCircle size={22} />
          </div>
        )}

        <span className="hidden text-sm font-medium text-slate-800 dark:text-slate-100 sm:block max-w-[150px] truncate">
          {fullName}
        </span>

        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* VIÑETA / DROPDOWN */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-fadeIn">
          {/* INFORMACIÓN DEL USUARIO */}
          <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-700">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={fullName}
                className="h-14 w-14 rounded-full object-cover border-2 border-cyan-500"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <UserCircle size={30} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-slate-900 dark:text-white text-sm">
                {fullName}
              </h3>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>

              <span className="mt-1.5 inline-block rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                {userRole}
              </span>
            </div>
          </div>

          {/* OPCIONES */}
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={handleAccount}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Settings size={18} className="text-cyan-500" />
              <span>Mi Perfil</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}