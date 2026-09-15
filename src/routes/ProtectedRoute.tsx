import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { hasRouteAccess, ROUTE_PERMISSIONS } from '../utils/routePermissions';
import { ErrorAccessPage } from '../features/auth/ErrorAccessPage';
import { DentistryReloadIcon } from '../components/common/DentistryReloadIcon';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export default function ProtectedRoute(_props: ProtectedRouteProps = {}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePopState = () => {
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        if (user?.mustChangePassword) {
          logout();
          navigate('/login', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, user?.mustChangePassword, navigate, logout]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/90 dark:bg-slate-950 transition-colors">
        <div className="text-center flex flex-col items-center">
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 dark:bg-cyan-500/25 blur-xl animate-pulse" />
            <DentistryReloadIcon size={64} loading className="relative z-10 drop-shadow-[0_4px_12px_rgba(6,182,212,0.4)]" />
          </div>
          <p className="text-sm text-slate-700 dark:text-cyan-300 font-semibold tracking-wide animate-pulse">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Redirección obligatoria al panel de cambio de contraseña en el primer inicio de sesión
  if (user?.mustChangePassword && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (location.pathname === '/dashboard' || location.pathname === '/perfil' || location.pathname === '/cambiar-password') {
    return <Outlet />;
  }

  if (!hasRouteAccess(user, location.pathname)) {
    const requiredPermission = ROUTE_PERMISSIONS[location.pathname] || 'Módulo clínico/administrativo';
    return (
      <ErrorAccessPage
        code={403}
        title="Acceso denegado al módulo"
        description="Tu rol de usuario actual no cuenta con los privilegios asignados para operar esta sección clínica o administrativa de NexusOdonto."
        requiredPermission={requiredPermission}
      />
    );
  }

  return <Outlet />;
}
