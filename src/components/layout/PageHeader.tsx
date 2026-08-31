import type { ReactNode } from "react";

import {
  CircleHelp,
  Menu,
  Bell,
  X,
  Moon,
  Sun,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import UserProfileDropdown from "./UserProfileDropdown";

interface PageHeaderProps {
  userName?: string;

  userImage?: string;

  onMenuClick?: () => void;

  mobileOpen?: boolean;

  children?: ReactNode;
}

export function PageHeader({
  onMenuClick,
  mobileOpen = false,
}: PageHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const displayName = user?.name || userName;
  const displayImage = user?.avatar || userImage;

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* MENÚ MÓVIL */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={onMenuClick}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </div>

      {/* ACCIONES */}
      <div className="flex items-center gap-2">
        {/* TEMA */}
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

        {/* AYUDA */}
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          aria-label="Ayuda"
        >
          <CircleHelp size={19} />
        </button>

        {/* NOTIFICACIONES */}
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 relative"
          aria-label="Notificaciones"
        >
          <Bell size={19} />

          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* PERFIL */}
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}