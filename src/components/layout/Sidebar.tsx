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
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import logo from "../../assets/nexus-odonto-logo.png";

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Agenda",
      icon: CalendarDays,
      path: "/agenda",
    },
    {
      label: "Citas",
      icon: ClipboardList,
      path: "/citas",
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
      icon: Stethoscope,
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

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose();
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
        className={`fixed lg:static z-50 h-screen w-64 bg-white/80 dark:bg-slate-950/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg w-8 h-8 flex items-center justify-center shadow-sm">
              <img
                src={logo}
                alt="NexusOdonto"
                className="w-6 h-6"
              />
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-slate-100">
              NexusOdonto
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors"
                onClick={() => handleNavigation(item.path)}
              >
                <Icon size={19} strokeWidth={1.8} />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <button
            type="button"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors"
            onClick={() =>
              handleNavigation("/configuracion")
            }
          >
            <Settings size={19} strokeWidth={1.8} />
            <span>Configuración</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white transition-colors"
            onClick={() =>
              handleNavigation("/login")
            }
          >
            <LogOut size={19} strokeWidth={1.8} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}