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
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
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
      document.removeEventListener(
        "keydown",
        handleEscape
      );
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
    `${user.nombre} ${user.apellido}`.trim();

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      {/* BOTÓN DEL USUARIO */}
      <button
        type="button"
        onClick={() =>
          setIsOpen((previous) => !previous)
        }
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
        "
        aria-label="Abrir menú de usuario"
        aria-expanded={isOpen}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={fullName}
            className="
              h-8
              w-8
              rounded-full
              object-cover
            "
          />
        ) : (
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-slate-100
              text-slate-600
              dark:bg-slate-800
              dark:text-slate-400
            "
          >
            <UserCircle size={22} />
          </div>
        )}

        <span
          className="
            hidden
            text-sm
            font-medium
            text-slate-800
            dark:text-slate-100
            sm:block
          "
        >
          {fullName}
        </span>

        <ChevronDown
          size={18}
          className={`
            text-slate-500
            transition-transform
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* VIÑETA */}
      {isOpen && (
        <div
          className="
            absolute
            right-0
            top-full
            z-50
            mt-3
            w-72
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-2xl
            dark:border-slate-700
            dark:bg-slate-900
          "
        >
          {/* INFORMACIÓN DEL USUARIO */}
          <div
            className="
              flex
              items-center
              gap-3
              border-b
              border-slate-200
              p-5
              dark:border-slate-700
            "
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={fullName}
                className="
                  h-14
                  w-14
                  rounded-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-100
                  text-slate-600
                  dark:bg-slate-800
                  dark:text-slate-400
                "
              >
                <UserCircle size={30} />
              </div>
            )}

            <div className="min-w-0">
              <h3
                className="
                  truncate
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {fullName}
              </h3>

              <p
                className="
                  truncate
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {user.email}
              </p>

              <span
                className="
                  mt-2
                  inline-block
                  rounded-full
                  bg-cyan-500/10
                  px-3
                  py-1
                  text-xs
                  font-medium
                  text-cyan-600
                  dark:text-cyan-400
                "
              >
                {user.rol}
              </span>
            </div>
          </div>

          {/* OPCIONES */}
          <div className="p-2">
            <button
              type="button"
              onClick={handleAccount}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                text-left
                text-slate-700
                transition-colors
                hover:bg-slate-100
                dark:text-slate-300
                dark:hover:bg-slate-800
              "
            >
              <Settings size={18} />

              <span>
                Gestionar tu cuenta
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                px-4
                py-3
                text-left
                text-red-500
                transition-colors
                hover:bg-red-500/10
              "
            >
              <LogOut size={18} />

              <span>
                Cerrar sesión
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}