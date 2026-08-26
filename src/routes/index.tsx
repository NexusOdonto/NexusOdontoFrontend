import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { DashboardLayout } from "../layouts/DashboardLayout.tsx";
import { PacientesView } from "../pages/PacientesView.tsx";
import { PacienteRegistroView } from "../pages/PacienteRegistroView.tsx";

function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#1A3644]">
        Dashboard
      </h1>

      <p className="mt-2 text-[#6B7C8A]">
        Vista de prueba del Dashboard.
      </p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
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
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}