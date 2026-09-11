import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

const LandingPage = lazy(() =>
  import("../features/landing/LandingPage").then((module) => ({
    default: module.default,
  })),
);

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

const ChangePasswordPage = lazy(() =>
  import("../features/auth/ChangePasswordPage").then((module) => ({
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

const AtencionAsesorView = lazy(() =>
  import("../features/chat-asesor/AtencionAsesorView").then((module) => ({
    default: module.AtencionAsesorView,
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
  import("../features/historia-clinica/HistoriaClinicaView").then((module) => ({
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

const ConfiguracionView = lazy(() =>
  import("../features/configuracion/ConfiguracionView").then((module) => ({
    default: module.default,
  })),
);

import { ErrorAccessPage } from "../features/auth/ErrorAccessPage";

const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/401" element={<ErrorAccessPage code={401} />} />
        <Route path="/403" element={<ErrorAccessPage code={403} />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/unauthorized" element={<ErrorAccessPage code={401} />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/cambiar-password" element={<ChangePasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <DashboardPage />
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
            path="/agenda"
            element={
              <DashboardLayout>
                <AgendaView />
              </DashboardLayout>
            }
          />
          <Route
            path="/atencion-chat"
            element={
              <DashboardLayout>
                <AtencionAsesorView />
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
            path="/profesionales"
            element={
              <DashboardLayout>
                <ProfesionalesView />
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
          <Route
            path="/usuarios"
            element={
              <DashboardLayout>
                <UsuariosView />
              </DashboardLayout>
            }
          />
          <Route
            path="/roles-permisos"
            element={
              <DashboardLayout>
                <RolesPermisosView />
              </DashboardLayout>
            }
          />
          <Route
            path="/configuracion"
            element={
              <DashboardLayout>
                <ConfiguracionView />
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

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
