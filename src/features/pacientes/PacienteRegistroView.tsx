import { useNavigate } from "react-router-dom";

import { PacienteForm } from "./components/PacienteForm";

export function PacienteRegistroView() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] p-6">
        <button
          type="button"
          className="mb-6 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          onClick={() => navigate("/pacientes")}
        >
          ← Volver a Pacientes
        </button>

        <div className="border-b border-[var(--border-color)] pb-6 mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            Alta Rápida de Paciente
          </h1>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Complete los datos fundamentales para registrar
            un nuevo paciente en el sistema.
          </p>
        </div>

        <PacienteForm />
      </div>
    </div>
  );
}