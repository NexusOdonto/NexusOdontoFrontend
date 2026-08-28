import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { hasPermission } from '../features/auth/mocks/users.mock';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export default function ProtectedRoute({ requiredRoles = [] }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.rol)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            No tienes permisos para acceder a esta página.
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (user && !hasPermission(user.rol, location.pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Tu rol ({user.rol}) no tiene permiso para acceder a esta sección.
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}