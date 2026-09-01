import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PacienteForm } from "./components/PacienteForm";

export function PacienteRegistroView() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* BOTÓN VOLVER Y TÍTULO */}
      <div className="space-y-3 animate-slideDown">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-sm"
          onClick={() => navigate("/pacientes")}
        >
          <ArrowLeft size={15} className="text-cyan-600 dark:text-cyan-400" />
          <span>Volver a Pacientes</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
              Alta Rápida de Paciente
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
              Complete los datos fundamentales para registrar un nuevo expediente en la plataforma.
            </p>
          </div>
        </div>
      </div>

      <PacienteForm />
    </div>
  );
}