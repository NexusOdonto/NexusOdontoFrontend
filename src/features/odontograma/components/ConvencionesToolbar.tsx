import type { Diagnosis } from "../types";
import { DIAGNOSIS_LEGEND } from "../types";

interface ConvencionesToolbarProps {
  selectedDiagnosis: Diagnosis;
  onDiagnosisChange: (diagnosis: Diagnosis) => void;
  dentitionType: 'permanent' | 'temporary';
  onDentitionTypeChange: (type: 'permanent' | 'temporary') => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  isDarkMode: boolean;
}

export function ConvencionesToolbar({
  selectedDiagnosis = 'caries',
  onDiagnosisChange = () => {},
  dentitionType = 'permanent',
  onDentitionTypeChange = () => {},
  onClear = () => {},
  onExport = () => {},
  onImport = () => {},
  isDarkMode = false,
}: ConvencionesToolbarProps) {
  const safeLegend = DIAGNOSIS_LEGEND || [];

  return (
    <div
      className={`flex flex-col gap-4 p-4 rounded-xl border ${
        isDarkMode
          ? "bg-slate-800/50 border-slate-700"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      {/* Selector de Tipo de Dentición */}
      <div className="flex flex-col gap-2">
        <span
          className={`text-sm font-semibold ${
            isDarkMode ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Tipo de Dentición
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDentitionTypeChange("permanent")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dentitionType === "permanent"
                ? "bg-primary-500 text-white"
                : isDarkMode
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
            }`}
          >
            Permanente (32 dientes)
          </button>
          <button
            type="button"
            onClick={() => onDentitionTypeChange("temporary")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              dentitionType === "temporary"
                ? "bg-primary-500 text-white"
                : isDarkMode
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
            }`}
          >
            Temporal (20 dientes)
          </button>
        </div>
      </div>

      {/* Paleta de Diagnósticos */}
      <div className="flex flex-col gap-2">
        <span
          className={`text-sm font-semibold ${
            isDarkMode ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Diagnósticos
        </span>
        <div className="flex flex-wrap gap-2">
          {safeLegend.map(({ diagnosis, label, color }) => (
            <button
              key={diagnosis}
              type="button"
              onClick={() => onDiagnosisChange(diagnosis)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
                selectedDiagnosis === diagnosis
                  ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-900"
                  : "hover:scale-105"
              } ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
              style={{
                backgroundColor:
                  selectedDiagnosis === diagnosis
                    ? isDarkMode
                      ? color.replace('bg-', '').replace('500', '600')
                      : color
                    : isDarkMode
                      ? "rgba(30, 41, 59, 0.8)"
                      : "rgba(255, 255, 255, 0.9)",
              }}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 ${color}`}
                style={{
                  borderColor: isDarkMode ? "#475569" : "#94a3b8",
                }}
              />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Botón Limpiar */}
      <button
        type="button"
        onClick={onClear}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          isDarkMode
            ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/50"
            : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
        }`}
      >
        Limpiar Odontograma
      </button>

      {/* Botones Importar/Exportar */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onExport}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            isDarkMode
              ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/50"
              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
          }`}
        >
          Exportar Datos
        </button>
        <button
          type="button"
          onClick={onImport}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            isDarkMode
              ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/50"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
          }`}
        >
          Importar Datos
        </button>
      </div>
    </div>
  );
}
