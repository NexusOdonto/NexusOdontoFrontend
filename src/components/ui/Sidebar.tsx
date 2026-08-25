import { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Stethoscope,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import logo from "../../assets/nexus-odonto-logo.png";
import "./Sidebar.css";

interface SidebarProps {
  onNavigate?: (path: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "../../dashboard",
    },
    {
      label: "Agenda",
      icon: CalendarDays,
      path: "../../agenda",
    },
    {
      label: "Citas",
      icon: ClipboardList,
      path: "../../citas",
    },
    {
      label: "Pacientes",
      icon: Users,
      path: "../../pacientes",
    },
    {
      label: "Profesionales",
      icon: Stethoscope,
      path: "../../profesionales",
    },
    {
      label: "Servicios",
      icon: FileText,
      path: "../../servicios",
    },
    {
      label: "Historia clínica",
      icon: FileText,
      path: "../../historia-clinica",
    },
    {
      label: "Odontograma",
      icon: Stethoscope,
      path: "../../odontograma",
    },
    {
      label: "Usuarios",
      icon: Users,
      path: "../../usuarios",
    },
    {
      label: "Roles y permisos",
      icon: ShieldCheck,
      path: "../../roles-permisos",
    },
  ];

  const handleNavigation = (path: string) => {
    onNavigate?.(path);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="mobile-header">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-brand">
          <img
            src={logo}
            alt="NexusOdonto"
            className="mobile-logo"
          />

          <span className="mobile-brand-name">
            NexusOdonto
          </span>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <img
            src={logo}
            alt="NexusOdonto"
            className="sidebar-logo"
          />

          <span className="sidebar-brand-name">
            NexusOdonto
          </span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                className="sidebar-item"
                onClick={() => handleNavigation(item.path)}
              >
                <Icon size={19} strokeWidth={1.8} />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-item"
            onClick={() => handleNavigation("/configuracion")}
          >
            <Settings size={19} strokeWidth={1.8} />
            <span>Configuración</span>
          </button>

          <button
            type="button"
            className="sidebar-item"
            onClick={() => handleNavigation("/login")}
          >
            <LogOut size={19} strokeWidth={1.8} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}