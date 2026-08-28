import { Suspense, lazy } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

const LoginPage = lazy(() =>
  import("../features/auth/LoginPage").then(
    (module) => ({
      default: module.default,
    }),
  ),
);

const DashboardLayout = lazy(() =>
  import("../layouts/DashboardLayout").then(
    (module) => ({
      default: module.DashboardLayout,
    }),
  ),
);

const PacientesView = lazy(() =>
  import("../features/pacientes/PacientesView").then(
    (module) => ({
      default: module.PacientesView,
    }),
  ),
);

const PacienteRegistroView = lazy(() =>
  import(
    "../features/pacientes/PacienteRegistroView"
  ).then((module) => ({
    default: module.PacienteRegistroView,
  })),
);

const ServiciosView = lazy(() =>
  import("../features/servicios/ServiciosView").then(
    (module) => ({
      default: module.ServiciosView,
    }),
  ),
);

const CitasView = lazy(() =>
  import("../features/citas/CitasView.tsx").then(
    (module) => ({
      default: module.CitasView,
    }),
  ),
);

const UsuariosView = lazy(() =>
  import("../features/usuarios/UsuariosView").then(
    (module) => ({
      default: module.UsuariosView,
    }),
  ),
);

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

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />

        <p className="text-sm text-slate-600 dark:text-slate-400">
          Cargando...
        </p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route element={<ProtectedRoute />}>
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
            path="/citas"
            element={
              <DashboardLayout>
                <CitasView />
              </DashboardLayout>
            }
          />

          <Route
            path="/usuarios"
            element={
              <DashboardLayout>
                <UsuariosView />
              </DashboardLayout>
            }
          />
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
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
  );
}