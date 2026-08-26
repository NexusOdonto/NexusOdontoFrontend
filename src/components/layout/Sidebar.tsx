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
        className={`fixed lg:static z-50 h-full w-64 bg-[var(--bg-surface)] border-r border-[var(--border-color)] overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition-colors"
                onClick={() => handleNavigation(item.path)}
              >
                <Icon size={19} strokeWidth={1.8} />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-[var(--border-color)] flex flex-col gap-1">
          <button
            type="button"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition-colors"
            onClick={() =>
              handleNavigation("/configuracion")
            }
          >
            <Settings size={19} strokeWidth={1.8} />
            <span>Configuración</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-subtle)] hover:text-[var(--text-main)] transition-colors"
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