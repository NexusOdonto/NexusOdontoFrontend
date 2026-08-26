import type { ReactNode } from "react";
import {
  CircleHelp,
  Menu,
  Bell,
  UserCircle,
  X,
} from "lucide-react";

import logo from "../../assets/nexus-odonto-logo.png";
import "../ui/styles/PageHeader.css";

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
    <header className="page-header">
      <div className="page-header-left">
        <button
          type="button"
          className="page-header-menu"
          onClick={onMenuClick}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

        <div className="page-header-brand">
          <img
            src={logo}
            alt="NexusOdonto"
            className="page-header-logo"
          />

          <span className="page-header-brand-name">
            NexusOdonto
          </span>
        </div>
      </div>

      <div className="page-header-right">
        <button
          type="button"
          className="page-header-icon"
          aria-label="Ayuda"
        >
          <CircleHelp size={19} />
        </button>

        <button
          type="button"
          className="page-header-icon page-header-notification"
          aria-label="Notificaciones"
        >
          <Bell size={19} />
          <span className="page-header-notification-dot" />
        </button>

        <div className="page-header-user">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="page-header-user-image"
            />
          ) : (
            <div className="page-header-user-placeholder">
              <UserCircle size={22} />
            </div>
          )}

          <span className="page-header-user-name">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}