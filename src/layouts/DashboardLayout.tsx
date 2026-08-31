import type { ReactNode } from "react";
import { useState } from "react";

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
  const { user } = useAuth();

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
          className="flex min-w-0 flex-1 justify-center overflow-x-hidden bg-cover bg-center bg-no-repeat p-4 transition-all duration-300 sm:p-6 md:p-8"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
        >
          <div className="h-fit w-full max-w-5xl rounded-3xl border border-white/20 bg-slate-950/75 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-8 md:p-10 dark:border-cyan-400/20 dark:bg-slate-950/75">
            {children}
          </div>
        </main>
      </div>

      {/* ASISTENTE VIRTUAL FLOTANTE */}
      <ChatBotWidget />
    </div>
  );
}