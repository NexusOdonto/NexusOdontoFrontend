import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { DashboardLayout } from "../layouts/DashboardLayout.tsx";

// Página temporal del Dashboard
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

// Configuración de las rutas
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          }
        />

        {/* Ruta inicial */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}