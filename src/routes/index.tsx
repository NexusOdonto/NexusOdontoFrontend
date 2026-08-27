import { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// Helper function para lazy loading de named exports
const lazyImport = <T extends Record<string, any>, K extends keyof T>(
  factory: () => Promise<T>,
  key: K
) =>
  lazy(() =>
    factory().then((module) => ({
      default: module[key],
    }))
  );

const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const DashboardLayout = lazyImport(() => import("../layouts/DashboardLayout"), "DashboardLayout");
const PacientesView = lazyImport(() => import("../features/pacientes/PacientesView"), "PacientesView");
const PacienteRegistroView = lazyImport(() => import("../features/pacientes/PacienteRegistroView"), "PacienteRegistroView");
const ServiciosView = lazyImport(() => import("../features/servicios/ServiciosView"), "ServiciosView");

function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Dashboard
      </h1>

      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Vista de prueba del Dashboard.
      </p>
    </div>
  );
}

// Componente de carga para Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Cargando...</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />

          <Route
            path="/pacientes"
            element={
              <DashboardLayout>
                <PacientesView />
              </DashboardLayout>
            }
          />

          <Route
            path="/pacientes/nuevo"
            element={
              <DashboardLayout>
                <PacienteRegistroView />
              </DashboardLayout>
            }
          />

          <Route
            path="/servicios"
            element={
              <DashboardLayout>
                <ServiciosView />
              </DashboardLayout>
            }
          />

          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}