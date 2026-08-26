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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
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

        <main className="flex-1 p-6 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}