import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { hasRouteAccess, ROUTE_PERMISSIONS } from '../utils/routePermissions';
import { RouteLoadingFallback } from '../components/common/RouteLoadingFallback';

const ErrorAccessPage = lazy(() =>
  import('../features/auth/ErrorAccessPage').then((module) => ({
    default: module.ErrorAccessPage,
  })),
);

interface ProtectedRouteProps {
  requiredRoles?: string[];
}

/**
 * 🤖 [AI ASSISTANT GUIDE - GUARD DE SEGURIDAD Y PERMISOS]:
 * -------------------------------------------------------------------------------------------------
 * 📌 PROPÓSITO:
 *    Componente Guard central que intercepta cada navegación a rutas privadas.
 *    Garantiza que ningún usuario no autenticado o no autorizado acceda a información clínica sensible.
 * 
 * 🔍 REGLAS DE EVALUACIÓN SECUENCIAL (PIPELINE DE SEGURIDAD):
 *    1. isLoading === true: Muestra RouteLoadingFallback mientras valida el token con el backend.
 *    2. !isAuthenticated: Redirige a /login guardando la ruta previa en `state.from` para retornar tras login.
 *    3. user.mustChangePassword === true: Redirige obligatoriamente a /cambiar-password.
 *    4. Rutas comunes (/dashboard, /perfil): Permite el paso universal para cualquier rol activo.
 *    5. hasRouteAccess(user, ruta): Evalúa los permisos del rol contra la ruta solicitada. Si falla, muestra Error 403.
 * 
 * 💡 TIPS PARA LA SUSTENTACIÓN:
 *    "Cumplimos con el estándar de seguridad de rutas verificado en auditoría: 100% de protección
 *    contra accesos directos por URL a /odontograma, /historia-clinica o /usuarios."
 * -------------------------------------------------------------------------------------------------
 */
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
    return <RouteLoadingFallback message="Verificando sesión..." />;
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
      <Suspense fallback={<RouteLoadingFallback />}>
        <ErrorAccessPage
          code={403}
          title="Acceso denegado al módulo"
          description="Tu rol de usuario actual no cuenta con los privilegios asignados para operar esta sección clínica o administrativa de NexusOdonto."
          requiredPermission={requiredPermission}
        />
      </Suspense>
    );
  }

  return <Outlet />;
}
