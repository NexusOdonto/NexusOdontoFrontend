import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "../components/ui/Sidebar.tsx";
import { PageHeader } from "../components/ui/PageHeader.tsx";

import "../layouts/DashboardLayout.css";

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