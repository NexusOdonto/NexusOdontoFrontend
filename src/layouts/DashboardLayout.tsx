import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "../components/layout/Sidebar.tsx";
import { PageHeader } from "../components/layout/PageHeader.tsx";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../features/auth/AuthContext";
import { RoleSwitcher } from "../features/auth/components/RoleSwitcher";

import fondoLight from "../assets/fondo-ligh.webp";
import fondoDark from "../assets/fondo-darck.webp";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { theme } = useTheme();
  const { user } = useAuth();

  const backgroundImage = theme === "dark" ? fondoDark : fondoLight;
  const userName = user ? `${user.nombre} ${user.apellido}` : "Usuario";

  return (
    <div className="flex min-h-screen min-w-0 max-w-full overflow-x-hidden text-slate-900 dark:text-slate-100">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <PageHeader
          userName={userName}
          mobileOpen={mobileOpen}
          onMenuClick={() => setMobileOpen((prev) => !prev)}
        />

        <main
          className="min-w-0 flex-1 overflow-x-hidden bg-cover bg-center bg-no-repeat p-3 transition-all duration-300 sm:p-4 md:p-6"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >
          <div className="box-border min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-colors duration-300 sm:p-4 md:p-6 dark:border-slate-800 dark:bg-slate-900">
            {children}
          </div>
        </main>
      </div>

      <RoleSwitcher />
    </div>
  );
}