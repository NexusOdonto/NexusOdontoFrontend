import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "../components/layout/Sidebar.tsx";
import { PageHeader } from "../components/layout/PageHeader.tsx";
import { useTheme } from "../context/ThemeContext";

import fondoLight from "../assets/fondo-ligh.webp";
import fondoDark from "../assets/fondo-darck.webp";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { theme } = useTheme();

  const backgroundImage =
    theme === "dark" ? fondoDark : fondoLight;

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
          onMenuClick={() =>
            setMobileOpen((prev) => !prev)
          }
        />

        <main
          className="
            flex-1
            min-w-0
            overflow-x-hidden
            bg-cover
            bg-center
            bg-no-repeat
            p-6
            sm:p-6
            md:p-6
            transition-all
            duration-300
          "
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >

          <div
            className="
              w-full
              min-h-full
              rounded-2xl
              border
              border-slate-200
              dark:border-slate-800
              bg-white
              dark:bg-slate-900
              p-6
              shadow-sm
              transition-colors
              duration-300
            "
          >
            {children}
          </div>

        </main>
      </div>
    </div>
  );
}