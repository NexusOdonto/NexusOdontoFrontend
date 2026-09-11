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
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 z-30 h-screen bg-white/90 dark:bg-slate-950/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        {/* Cabecera del Sidebar */}
        <div className={`flex items-center h-16 px-3 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${isCollapsed ? 'justify-center relative' : 'justify-between'}`}>
          {/* Logo + Título */}
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <img
              src={nexusLogoIcon}
              alt="NexusOdonto"
              style={{ width: '38px', height: '38px', minWidth: '38px', minHeight: '38px' }}
              className="object-contain flex-shrink-0 transition-transform hover:scale-105 cursor-pointer drop-shadow-sm"
              onClick={() => isCollapsed && setIsCollapsed(false)}
            />
            {!isCollapsed && (
              <span className="text-xl font-serif font-bold tracking-tight whitespace-nowrap select-none">
                <span className="text-slate-900 dark:text-white">Nexus</span>
                <span className="text-teal-700 dark:text-teal-400">Odonto</span>
              </span>
            )}
          </div>

          {/* Botón de alternar / colapsar */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
              isCollapsed ? 'hidden' : 'block'
            }`}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
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
                  `group w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-200 text-left cursor-pointer rounded-lg ${
                    isActive
                      ? "border-l-2 border-cyan-600 dark:border-cyan-400 text-cyan-900 dark:text-cyan-200 font-bold bg-cyan-500/15 dark:bg-cyan-400/10 -ml-[1px]"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/5"
                  } ${isCollapsed ? "justify-center" : ""}`
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
                    {!isCollapsed && (
                      <span className="truncate tracking-wide group-hover:translate-x-0.5 transition-transform duration-200">{item.label}</span>
                    )}
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