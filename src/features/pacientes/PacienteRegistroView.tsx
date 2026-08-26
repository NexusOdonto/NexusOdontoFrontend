import { useNavigate } from "react-router-dom";

import { PacienteForm } from "./components/PacienteForm";

export function PacienteRegistroView() {
  const navigate = useNavigate();

  return (
    <div className="patient-register-page">
      <div className="patient-register-content">
        <button
          type="button"
          className="patient-register-back"
          onClick={() => navigate("/pacientes")}
        >
          ← Volver a Pacientes
        </button>

        <div className="patient-register-card">
          <div className="patient-register-header">
            <h1>Alta Rápida de Paciente</h1>

            <p>
              Complete los datos fundamentales para registrar
              un nuevo paciente en el sistema.
            </p>
          </div>

          <PacienteForm />
        </div>
      </div>
    </div>
  );
}