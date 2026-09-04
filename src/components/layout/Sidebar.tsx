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
  ChevronRight,
  UserCircle,
  Sparkles,
  Settings,
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

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed lg:sticky lg:top-0 z-30 h-screen bg-white/90 dark:bg-slate-950/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden ${
          isCollapsed ? "w-16 lg:w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        {/* Header del Sidebar */}
        <div
          className={`flex items-center px-3 py-4 border-b border-slate-200/80 dark:border-white/10 transition-all duration-300 ${
            isCollapsed ? "flex-col gap-3 justify-center" : "justify-between gap-2"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={nexusLogoIcon}
              alt="NexusOdonto"
              className="h-8 w-8 min-h-[32px] min-w-[32px] flex-shrink-0 object-contain"
            />

            {!isCollapsed && (
              <span className="text-xl font-serif font-bold tracking-tight whitespace-nowrap overflow-hidden">
                <span className="text-slate-900 dark:text-white">Nexus</span>
                <span className="text-teal-700 dark:text-teal-400">Odonto</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
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
                  `w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all duration-150 text-left cursor-pointer ${
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
                      size={17}
                      strokeWidth={1.25}
                      className={isActive ? "text-cyan-600 dark:text-cyan-400 flex-shrink-0" : "text-slate-500 dark:text-slate-400 flex-shrink-0"}
                    />
                    {!isCollapsed && (
                      <span className="truncate tracking-wide">{item.label}</span>
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