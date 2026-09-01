import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  CircleHelp,
  Menu,
  Bell,
  X,
  Moon,
  Sun,
  CalendarDays,
  CheckCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
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
  const { notifications, unreadCount, pendingAppointmentsCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cerrar panel de notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (link?: string, id?: string) => {
    if (id) markAsRead(id);
    setShowNotifications(false);
    if (link) {
      navigate(link);
    }
  };

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
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ACCIONES */}
      <div className="flex items-center gap-2">
        {/* TEMA */}
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* AYUDA */}
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
          aria-label="Ayuda"
        >
          <CircleHelp size={19} />
        </button>

        {/* NOTIFICACIONES CON INDICADOR Y PANEL DESPLEGABLE */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 relative cursor-pointer"
            aria-label="Notificaciones"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
                {pendingAppointmentsCount || unreadCount}
              </span>
            )}
          </button>

          {/* Panel Desplegable de Notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-scaleIn">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Notificaciones
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <CheckCheck size={14} />
                    <span>Marcar leídas</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                    No tienes notificaciones pendientes.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.link, n.id)}
                      className={`p-3 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${
                        n.read
                          ? "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                          : "bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/20 text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                        <CalendarDays size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        {n.link && (
                          <span className="inline-block mt-1.5 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                            Ver solicitudes pendientes →
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* PERFIL */}
        <div className="pl-4 border-l border-slate-200 dark:border-slate-800">
          <UserProfileDropdown />
        </div>
      </div>
    </header>
  );
}