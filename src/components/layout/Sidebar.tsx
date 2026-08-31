import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Stethoscope,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  Smile,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { ROLE_PERMISSIONS, type Role } from "../../features/auth/mocks/users.mock";
import logo from "../../assets/nexus-odonto-logo.webp";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Citas",
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
      label: "Servicios",
      icon: FileText,
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
  ];

  // Filter menu items based on user's role permissions
  const filteredMenuItems = user 
    ? menuItems.filter(item => ROLE_PERMISSIONS[user.rol as Role].includes(item.path))
    : [];

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  const handleLogout = () => {
    logout();
    onMobileClose();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed lg:static z-50 h-screen bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden ${
          isCollapsed ? "w-16 lg:w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg w-8 h-8 flex items-center justify-center shadow-sm flex-shrink-0">
              <img
                src={logo}
                alt="NexusOdonto"
                className="w-6 h-6"
              />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-slate-800 dark:text-slate-100 whitespace-nowrap">
                NexusOdonto
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white rounded-lg p-1 transition-colors border-none outline-none focus:outline-none"
            title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors relative group ${
                  isCollapsed ? "justify-center" : ""
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                <Icon size={19} strokeWidth={1.8} className="flex-shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                )}
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <button
            type="button"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors relative group ${
              isCollapsed ? "justify-center" : ""
            }`}
            onClick={() =>
              handleNavigation("/configuracion")
            }
          >
            <Settings size={19} strokeWidth={1.8} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                Configuración
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                Configuración
              </div>
            )}
          </button>

          <button
            type="button"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors relative group ${
              isCollapsed ? "justify-center" : ""
            }`}
            onClick={handleLogout}
          >
            <LogOut size={19} strokeWidth={1.8} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="whitespace-nowrap">
                Cerrar sesión
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                Cerrar sesión
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}