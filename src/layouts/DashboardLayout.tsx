import type { ReactNode } from "react";
import { useState, useEffect } from "react";

import { Sidebar } from "../components/layout/Sidebar.tsx";
import { PageHeader } from "../components/layout/PageHeader.tsx";
import ChatBotWidget from "../components/chatbot/ChatBotWidget.tsx";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../features/auth/AuthContext";

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
  const { user, isAuthenticated } = useAuth();

  // Bloqueo de retroceso fuera del Dashboard (Google Accounts / Login)
  useEffect(() => {
    if (!isAuthenticated) return;

    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isAuthenticated]);

  const backgroundImage =
    theme === "dark" ? fondoDark : fondoLight;

  const userName = user?.name || "Usuario";

  return (
    <div className="flex min-h-screen min-w-0 max-w-full overflow-x-hidden text-slate-900 dark:text-slate-100 relative">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <PageHeader
          userName={userName}
          mobileOpen={mobileOpen}
          onMenuClick={() =>
            setMobileOpen((prev) => !prev)
          }
        />

        <main
          className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-cover bg-center bg-no-repeat transition-all duration-300 relative"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >
          {/* Contenido principal fluido sin capas de opacamiento sobre el fondo */}
          <div className="relative z-10 w-full max-w-7xl mx-auto p-6 sm:p-8 md:p-10">
            {children}
          </div>
        </main>
      </div>

      {/* ASISTENTE VIRTUAL FLOTANTE */}
      <ChatBotWidget />
    </div>
  );
}