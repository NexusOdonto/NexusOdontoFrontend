import type { ReactNode } from "react";

import { Sidebar } from "../components/ui/Sidebar.tsx";

// Props del layout principal
interface DashboardLayoutProps {
  children: ReactNode;
}

// Layout general de la aplicación
export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar de navegación */}
      <Sidebar />

      {/* =====================================================
          CONTENIDO PRINCIPAL
          El contenido queda al lado del Sidebar.
          ===================================================== */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}