import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "../components/layout/Sidebar.tsx";
import { PageHeader } from "../components/layout/PageHeader.tsx";
import { useTheme } from "../hooks/useTheme";
import fondoLight from "../assets/fondo-ligh.jpg";
import fondoDark from "../assets/fondo-darck.jpg";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();

  const backgroundImage = theme === 'dark' ? fondoDark : fondoLight;

  return (
    <div className="flex min-h-screen text-slate-900 dark:text-slate-100">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <PageHeader
          userName="Brayan"
          mobileOpen={mobileOpen}
          onMenuClick={() => setMobileOpen((prev) => !prev)}
        />

        <main 
          className="flex-1 p-6 bg-cover bg-center bg-no-repeat transition-all duration-300"
          style={{ 
            backgroundImage: `url(${backgroundImage})` 
          }}
        >
          <div className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-xs p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}