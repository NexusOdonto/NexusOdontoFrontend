import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "../components/layout/Sidebar.tsx";
import { PageHeader } from "../components/layout/PageHeader.tsx";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      <PageHeader
        userName="Brayan"
        mobileOpen={mobileOpen}
        onMenuClick={() => setMobileOpen((prev) => !prev)}
      />

      <div className="app-body">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}