import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  CircleHelp,
  Menu,
  Bell,
  X,
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cerrar panel de notificaciones y ayuda al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelpModal(false);
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
    <header className="h-16 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shrink-0">
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
        {/* TEMA (BOTÓN TOGGLE DIENTE SANO / DIENTE CON CARIES LIMPIDO) */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`relative inline-flex h-8 w-16 items-center rounded-full p-1 transition-all duration-300 cursor-pointer overflow-hidden border shadow-inner ${
            theme === "dark"
              ? "bg-slate-950 border-rose-900/60 shadow-rose-950/30"
              : "bg-emerald-100/90 border-teal-300 shadow-teal-500/15"
          }`}
          aria-label="Cambiar tema"
          title={theme === "dark" ? "Modo Oscuro (Diente con Caries) -> Cambiar a Modo Claro (Diente Sano)" : "Modo Claro (Diente Sano) -> Cambiar a Modo Oscuro (Diente con Caries)"}
        >
          {/* ICONO LADO IZQUIERDO: DIENTE CON CARIES (VISIBLE SOLO EN MODO OSCURO) */}
          <div
            className={`absolute left-2 z-10 flex items-center justify-center transition-all duration-300 ${
              theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            }`}
          >
            <svg className="w-4 h-4 drop-shadow" viewBox="0 0 24 24">
              {/* Silueta Diente */}
              <path
                d="M7 2C4.8 2 3 3.8 3 6c0 3.2 1.2 7.5 2.5 11.5.7 2.1 2.2 2.5 3 1 .6-1.2 1.2-3 1.5-4.2.3 1.2.9 3 1.5 4.2.8 1.5 2.3 1.1 3-1C15.8 13.5 17 9.2 17 6c0-2.2-1.8-4-4-4-1.2 0-2.2.5-3 1.3C9.2 2.5 8.2 2 7 2z"
                fill="#cbd5e1"
                transform="translate(2, 1)"
              />
              {/* Mancha Caries roja/oscura */}
              <circle cx="10" cy="7" r="2.2" fill="#ef4444" />
              <circle cx="10" cy="7" r="1.2" fill="#7f1d1d" />
            </svg>
          </div>

          {/* ICONO LADO DERECHO: DIENTE SANO BRILANTE (VISIBLE SOLO EN MODO CLARO) */}
          <div
            className={`absolute right-2 z-10 flex items-center justify-center transition-all duration-300 ${
              theme === "dark" ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"
            }`}
          >
            <svg className="w-4 h-4 text-teal-600 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
              {/* Silueta Diente Sano */}
              <path
                d="M7 2C4.8 2 3 3.8 3 6c0 3.2 1.2 7.5 2.5 11.5.7 2.1 2.2 2.5 3 1 .6-1.2 1.2-3 1.5-4.2.3 1.2.9 3 1.5 4.2.8 1.5 2.3 1.1 3-1C15.8 13.5 17 9.2 17 6c0-2.2-1.8-4-4-4-1.2 0-2.2.5-3 1.3C9.2 2.5 8.2 2 7 2z"
                transform="translate(2, 1)"
              />
              {/* Destello Cyan */}
              <circle cx="15.5" cy="5" r="1.1" fill="#06b6d4" />
            </svg>
          </div>

          {/* PERILLA DESLIZANTE ELEGANTE */}
          <span
            className={`relative z-20 inline-block h-6 w-6 transform rounded-full shadow-md transition-transform duration-300 ease-in-out ${
              theme === "dark"
                ? "translate-x-8 bg-slate-900 border border-rose-900/80 shadow-rose-950"
                : "translate-x-0 bg-white border border-teal-200 shadow-teal-500/20"
            }`}
          />
        </button>

        {/* AYUDA / SOPORTE (BUG-18) */}
        <div className="relative" ref={helpRef}>
          <button
            type="button"
            onClick={() => setShowHelpModal(!showHelpModal)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 cursor-pointer"
            aria-label="Ayuda y Soporte"
            title="Centro de ayuda y soporte técnico"
          >
            <CircleHelp size={19} />
          </button>

          {showHelpModal && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 animate-scaleIn text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-sm text-teal-600 dark:text-teal-400">
                  <CircleHelp size={17} />
                  <span>Mesa de Ayuda NexusOdonto</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Para reportes de incidencias técnicas, gestión de licencias o dudas del sistema:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Contacto Técnico Oficial:</p>
                  <p className="font-mono font-bold text-teal-600 dark:text-teal-400 select-all">soporte@nexusodonto.local</p>
                  <p className="text-[10px] text-slate-400">Horario: Lun - Sáb (07:00 - 19:00)</p>
                </div>
              </div>
            </div>
          )}
        </div>

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
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse shadow-sm">
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
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
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