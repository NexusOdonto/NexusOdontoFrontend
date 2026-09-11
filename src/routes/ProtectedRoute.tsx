import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { hasRouteAccess, ROUTE_PERMISSIONS } from '../utils/routePermissions';

import { ErrorAccessPage } from '../features/auth/ErrorAccessPage';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export default function ProtectedRoute(_props: ProtectedRouteProps = {}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePopState = () => {
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        if (user?.mustChangePassword) {
          navigate('/cambiar-password', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, user?.mustChangePassword, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
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
