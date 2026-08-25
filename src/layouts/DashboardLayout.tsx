import type { ReactNode } from "react";

import { Sidebar } from "../components/ui/Sidebar.tsx";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}