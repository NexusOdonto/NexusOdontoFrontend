import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Stethoscope,
  FileText,
  ShieldCheck,
  Smile,
  ChevronLeft,
  UserCircle,
  Sparkles,
  Settings,
  MessageSquare,
  X,
} from "lucide-react";

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { hasRouteAccess, getUserRole } from "../../utils/routePermissions";
import nexusLogoIcon from "../../assets/nexus-odonto-logo.webp";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const role = getUserRole(user);
  const isPaciente = role === "PACIENTE";

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: isPaciente ? "Mis Citas" : "Citas",
      icon: CalendarDays,
      path: "/citas",
    },
    {
      label: "Agenda",
      icon: ClipboardList,
      path: "/agenda",
    },
    {
      label: "Atención WhatsApp",
      icon: MessageSquare,
      path: "/atencion-chat",
    },
    {
      label: "Pacientes",
      icon: Users,
      path: "/pacientes",
    },
    {
      label: "Profesionales",
      icon: Stethoscope,
      path: "/profesionales",
    },
    {
      label: "Catálogo de servicios",
      icon: Sparkles,
      path: "/servicios",
    },
    {
      label: "Historia clínica",
      icon: FileText,
      path: "/historia-clinica",
    },
    {
      label: "Odontograma",
      icon: Smile,
      path: "/odontograma",
    },
    {
      label: "Usuarios",
      icon: Users,
      path: "/usuarios",
    },
    {
      label: "Roles y permisos",
      icon: ShieldCheck,
      path: "/roles-permisos",
    },
    {
      label: "Configuración",
      icon: Settings,
      path: "/configuracion",
    },
    {
      label: "Mi Perfil",
      icon: UserCircle,
      path: "/perfil",
    },
  ];

  // Filtrar estrictamente los elementos del menú según el rol del usuario
  const filteredMenuItems = user 
    ? menuItems.filter(item => hasRouteAccess(user, item.path))
    : [];

  return (
    <>
      {/* 1. BACKDROP / OVERLAY MÓVIL (z-40) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* 2. PANEL LATERAL / DRAWER MÓVIL & DESKTOP (z-50 en móvil, lg:z-30) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 flex flex-col shadow-2xl transition-all duration-300 ease-in-out lg:shadow-none lg:sticky lg:top-0 lg:z-30 ${
          isCollapsed ? "w-72 lg:w-20" : "w-72 lg:w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Cabecera del Sidebar */}
        <div
          className={`flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 justify-between ${
            isCollapsed ? "lg:justify-center lg:px-2" : "justify-between"
          }`}
        >
          {/* Logo + Título */}
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <img
              src={nexusLogoIcon}
              alt="NexusOdonto"
              style={{ width: '38px', height: '38px', minWidth: '38px', minHeight: '38px' }}
              className="object-contain flex-shrink-0 transition-transform hover:scale-105 cursor-pointer drop-shadow-sm"
              onClick={() => isCollapsed && setIsCollapsed(false)}
            />
            <span
              className={`text-xl font-serif font-bold tracking-tight whitespace-nowrap select-none ${
                isCollapsed ? "lg:hidden block" : "block"
              }`}
            >
              <span className="text-slate-900 dark:text-white">Nexus</span>
              <span className="text-teal-700 dark:text-teal-400">Odonto</span>
            </span>
          </div>

          {/* Botón de cerrar para vista móvil */}
          <button
            type="button"
            onClick={onMobileClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Botón de colapsar en Desktop - Solo visible cuando el sidebar está desplegado */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer hidden lg:flex items-center justify-center shrink-0"
              title="Colapsar menú"
              aria-label="Colapsar menú"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section con acento lateral en la ruta activa */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `group w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-all duration-200 text-left cursor-pointer rounded-xl ${
                    isActive
                      ? "border-l-2 border-cyan-600 dark:border-cyan-400 text-cyan-900 dark:text-cyan-200 font-bold bg-cyan-500/15 dark:bg-cyan-400/10 -ml-[1px]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/5"
                  } ${isCollapsed ? "lg:justify-center justify-start" : "justify-start"}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      className={`flex-shrink-0 transition-all duration-300 ${
                        isActive
                          ? "text-cyan-600 dark:text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-icon-pulse"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:scale-125 group-hover:rotate-6 group-hover:-translate-y-0.5"
                      }`}
                    />
                    <span
                      className={`truncate tracking-wide group-hover:translate-x-0.5 transition-transform duration-200 ${
                        isCollapsed ? "lg:hidden block font-medium" : "block"
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}