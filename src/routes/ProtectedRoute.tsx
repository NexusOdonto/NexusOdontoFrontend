import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { hasRouteAccess, ROUTE_PERMISSIONS } from '../utils/routePermissions';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export default function ProtectedRoute({ requiredRoles: _requiredRoles = [] }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // El dashboard siempre es accesible para cualquier usuario autenticado
  if (location.pathname === '/dashboard') {
    return <Outlet />;
  }

  // Verificar si el usuario tiene acceso a la ruta por rol o permiso
  if (!hasRouteAccess(user, location.pathname)) {
    const requiredPermission = ROUTE_PERMISSIONS[location.pathname] || 'Permiso restringido';
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Tu rol no cuenta con los permisos requeridos para acceder a esta sección.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 bg-slate-100 dark:bg-slate-900 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800">
            Módulo: {requiredPermission}
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-5 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium cursor-pointer"
          >
            Volver a la página anterior
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
