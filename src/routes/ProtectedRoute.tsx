import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

// Mapeo de rutas a permisos requeridos
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'USERS:VIEW',
  '/citas': 'APPOINTMENTS:VIEW',
  '/agenda': 'APPOINTMENTS:VIEW',
  '/pacientes': 'PATIENTS:VIEW',
  '/pacientes/nuevo': 'PATIENTS:CREATE',
  '/profesionales': 'PEOPLE:VIEW',
  '/servicios': 'CATALOGS:VIEW',
  '/historia-clinica': 'CLINICAL:VIEW',
  '/usuarios': 'USERS:VIEW',
  '/odontograma': 'ODONTOGRAM:VIEW',
  '/roles-permisos': 'ROLES:VIEW',
  '/configuracion': 'CATALOGS:VIEW',
};

export default function ProtectedRoute({ requiredRoles: _requiredRoles = [] }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Obtener el permiso requerido para la ruta actual
  const requiredPermission = ROUTE_PERMISSIONS[location.pathname];

  // Si la ruta no tiene permiso espec�fico definido, permitir acceso
  if (!requiredPermission) {
    return <Outlet />;
  }

  // Verificar si el usuario tiene el permiso requerido
  if (user && !user.permissions.includes(requiredPermission)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            No tienes los permisos necesarios para acceder a esta p�gina.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
            Permiso requerido: {requiredPermission}
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
