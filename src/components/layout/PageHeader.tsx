import type { ReactNode } from "react";
import {
  CircleHelp,
  Menu,
  Bell,
  UserCircle,
  X,
  Moon,
  Sun,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../features/auth/AuthContext";

interface PageHeaderProps {
  userName?: string;
  userImage?: string;
  onMenuClick?: () => void;
  mobileOpen?: boolean;
  children?: ReactNode;
}

export function PageHeader({
  userName = "Usuario",
  userImage,
  onMenuClick,
  mobileOpen = false,
}: PageHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const displayName = user ? `${user.nombre} ${user.apellido}` : userName;
  const displayImage = user?.avatar || userImage;

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
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

        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          NexusOdonto
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          aria-label="Ayuda"
        >
          <CircleHelp size={19} />
        </button>

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 relative"
          aria-label="Notificaciones"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <UserCircle size={22} />
            </div>
          )}

          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 hidden sm:block">
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}