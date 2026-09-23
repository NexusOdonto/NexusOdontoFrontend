import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Purga proactiva de datos mock y residuos en almacenamiento local
try {
  const staleStorageKeys = [
    "nexus_usuarios_cache",
    "nexus_pacientes",
    "nexus_pacientes_v1",
    "pacientes",
    "nexusodontopacientes",
    "mock_users",
    "mock_usuarios",
    "nexus_mock_users",
    "nexus_online_users",
  ];
  staleStorageKeys.forEach((key) => localStorage.removeItem(key));
} catch {}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);