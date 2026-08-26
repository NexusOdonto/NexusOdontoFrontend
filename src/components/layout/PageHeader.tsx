import type { ReactNode } from "react";
import {
  CircleHelp,
  Menu,
  Bell,
  UserCircle,
  X,
} from "lucide-react";

import logo from "../../assets/nexus-odonto-logo.png";

interface PageHeaderProps {
  userName?: string;
  userImage?: string;
  onMenuClick?: () => void;
  mobileOpen?: boolean;
  children?: ReactNode;
}

export function PageHeader({
  userName = "Usuario",
  userImage,
  onMenuClick,
  mobileOpen = false,
}: PageHeaderProps) {
  return (
    <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] transition-colors"
          onClick={onMenuClick}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="NexusOdonto"
            className="h-8 w-auto"
          />

          <span className="text-lg font-semibold text-[var(--text-main)]">
            NexusOdonto
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] transition-colors text-[var(--text-muted)]"
          aria-label="Ayuda"
        >
          <CircleHelp size={19} />
        </button>

        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] transition-colors text-[var(--text-muted)] relative"
          aria-label="Notificaciones"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-color)]">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <UserCircle size={22} />
            </div>
          )}

          <span className="text-sm font-medium text-[var(--text-main)] hidden sm:block">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}