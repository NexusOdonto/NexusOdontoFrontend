import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

const LoginPage = lazy(() =>
  import("../features/auth/LoginPage").then((module) => ({
    default: module.default,
  })),
);

const RegisterPage = lazy(() =>
  import("../features/auth/RegisterPage").then((module) => ({
    default: module.default,
  })),
);

const AuthCallback = lazy(() =>
  import("../features/auth/AuthCallback").then((module) => ({
    default: module.default,
  })),
);

const DashboardLayout = lazy(() =>
  import("../layouts/DashboardLayout").then((module) => ({
    default: module.DashboardLayout,
  })),
);

const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((module) => ({
    default: module.default,
  })),
);

const PacientesView = lazy(() =>
  import("../features/pacientes/PacientesView").then((module) => ({
    default: module.PacientesView,
  })),
);

const PacienteRegistroView = lazy(() =>
  import("../features/pacientes/PacienteRegistroView").then((module) => ({
    default: module.PacienteRegistroView,
  })),
);

const CitasView = lazy(() =>
  import("../features/citas/CitasView").then((module) => ({
    default: module.CitasView,
  })),
);

const AgendaView = lazy(() =>
  import("../features/agenda/AgendaView").then((module) => ({
    default: module.AgendaView,
  })),
);

const ProfesionalesView = lazy(() =>
  import("../features/profesionales/ProfesionalesView").then((module) => ({
    default: module.ProfesionalesView,
  })),
);

const ServiciosView = lazy(() =>
  import("../features/servicios/ServiciosView").then((module) => ({
    default: module.ServiciosView,
  })),
);

const HistoriaClinicaView = lazy(() =>
  import("../features/historiaClinica/HistoriaClinicaView").then((module) => ({
    default: module.HistoriaClinicaView,
  })),
);

const OdontogramaUI = lazy(() =>
  import("../features/odontograma/OdontogramaUI").then((module) => ({
    default: module.default,
  })),
);

const UsuariosView = lazy(() =>
  import("../features/usuarios/UsuariosView").then((module) => ({
    default: module.UsuariosView,
  })),
);

const RolesPermisosView = lazy(() =>
  import("../features/roles/RolesPermisosView").then((module) => ({
    default: module.RolesPermisosView,
  })),
);

const PerfilView = lazy(() =>
  import("../features/perfil/PerfilView").then((module) => ({
    default: module.default,
  })),
);

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          Cargando NexusOdonto...
        </p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Callback OAuth público */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Rutas Públicas Exclusivas (si ya tiene sesión activa, redirige a /dashboard) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Rutas Protegidas por RBAC */}
        <Route element={<ProtectedRoute />}>
          {/* M11: Dashboard */}
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />

          {/* M8: Citas */}
          <Route
            path="/citas"
            element={
              <DashboardLayout>
                <CitasView />
              </DashboardLayout>
            }
          />

          {/* M7: Agenda y Calendario */}
          <Route
            path="/agenda"
            element={
              <DashboardLayout>
                <AgendaView />
              </DashboardLayout>
            }
          />

          {/* M4: Pacientes */}
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

          {/* M6: Profesionales y Disponibilidad */}
          <Route
            path="/profesionales"
            element={
              <DashboardLayout>
                <ProfesionalesView />
              </DashboardLayout>
            }
          />

          {/* M5: Catálogo de Servicios */}
          <Route
            path="/servicios"
            element={
              <DashboardLayout>
                <ServiciosView />
              </DashboardLayout>
            }
          />

          {/* M9: Historia Clínica y Odontograma */}
          <Route
            path="/historia-clinica"
            element={
              <DashboardLayout>
                <HistoriaClinicaView />
              </DashboardLayout>
            }
          />

          <Route
            path="/odontograma"
            element={
              <DashboardLayout>
                <OdontogramaUI />
              </DashboardLayout>
            }
          />

          {/* M2: Gestión de Usuarios */}
          <Route
            path="/usuarios"
            element={
              <DashboardLayout>
                <UsuariosView />
              </DashboardLayout>
            }
          />

          {/* M3: Roles y Permisos Configurables */}
          <Route
            path="/roles-permisos"
            element={
              <DashboardLayout>
                <RolesPermisosView />
              </DashboardLayout>
            }
          />

          {/* Configuración y Perfil */}
          <Route
            path="/configuracion"
            element={
              <DashboardLayout>
                <ServiciosView />
              </DashboardLayout>
            }
          />

          <Route
            path="/perfil"
            element={
              <DashboardLayout>
                <PerfilView />
              </DashboardLayout>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}