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
} from "lucide-react";

// Importamos el logo desde src/assets
import logo from "../../assets/nexus-odonto-logo.png";

import { Button } from "./Button";
import { cn } from "../../utils/cn.ts";

// Opciones principales del menú
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

export function Sidebar() {
  // Controla si el contenido del menú está contraído
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="h-screen w-[216px] shrink-0 bg-white border-r border-[#E5EAF0] flex flex-col">

      <div className="h-[88px] shrink-0 border-b border-[#E5EAF0]">

        <div className="h-full flex items-center justify-between px-4">

          {/* Logo fijo */}
          <div className="w-[80px] flex items-center justify-center">
            <img
              src={logo}
              alt="NexusOdonto"
              className="w-[58px] h-auto object-contain"
            />
          </div>

          {/* Botón de las tres rayas fijo */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCollapsed((prev) => !prev)}
            className="w-9 h-9 p-0 rounded-md"
            aria-label="Mostrar u ocultar menú"
          >
            <Menu size={21} strokeWidth={2} />
          </Button>

        </div>
      </div>

      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-200",
          collapsed ? "w-[68px]" : "w-[216px]"
        )}
      >

        {/* Menú principal */}
        <nav className="flex-1 px-2 pt-4">

          <div className="flex flex-col gap-1">

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Button
                  key={item.path}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-10 w-full justify-start px-3 gap-3 rounded-lg",
                    collapsed && "justify-center px-0"
                  )}
                >
                  {/* Icono del elemento */}
                  <Icon
                    size={18}
                    strokeWidth={2}
                    className="shrink-0"
                  />

                  {/* Texto del elemento */}
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Button>
              );
            })}

          </div>

        </nav>

        <div className="border-t border-[#E5EAF0] p-2">

          {/* Configuración */}
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-10 w-full justify-start px-3 gap-3 rounded-lg",
              collapsed && "justify-center px-0"
            )}
          >
            <Settings
              size={18}
              strokeWidth={2}
              className="shrink-0"
            />

            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">
                Configuración
              </span>
            )}
          </Button>

          {/* Cerrar sesión */}
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-10 w-full justify-start px-3 gap-3 rounded-lg",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut
              size={18}
              strokeWidth={2}
              className="shrink-0"
            />

            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">
                Cerrar sesión
              </span>
            )}
          </Button>

        </div>

      </div>

    </aside>
  );
}