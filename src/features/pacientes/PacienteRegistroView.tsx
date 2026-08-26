import { useNavigate } from "react-router-dom";

import { PacienteForm } from "./components/PacienteForm";

export function PacienteRegistroView() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <button
          type="button"
          className="mb-6 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          onClick={() => navigate("/pacientes")}
        >
          ← Volver a Pacientes
        </button>

        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Alta Rápida de Paciente
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Complete los datos fundamentales para registrar
            un nuevo paciente en el sistema.
          </p>
        </div>

        <PacienteForm />
      </div>
    </div>
  );
}