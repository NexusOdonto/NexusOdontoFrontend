import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { hasRouteAccess, ROUTE_PERMISSIONS } from '../utils/routePermissions';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

export default function ProtectedRoute({ requiredRoles: _requiredRoles = [] }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // El dashboard y el perfil siempre son accesibles para cualquier usuario autenticado
  if (location.pathname === '/dashboard' || location.pathname === '/perfil') {
    return <Outlet />;
  }

  // Verificar si el usuario tiene acceso a la ruta según su rol
  if (!hasRouteAccess(user, location.pathname)) {
    const requiredPermission = ROUTE_PERMISSIONS[location.pathname] || 'Módulo clínico/administrativo';
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center p-8 max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold text-2xl">
            ⛔
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Acceso Restringido
          </h1>
          
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tu rol no cuenta con los permisos para acceder a esta sección protegida.
          </p>
          
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
            {requiredPermission}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all font-medium text-sm cursor-pointer shadow-sm active:scale-95"
            >
              Ir a mi Dashboard
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
