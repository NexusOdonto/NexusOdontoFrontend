import { useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { OdontogramaGrid } from "./components/OdontogramaGrid";
import { ConvencionesToolbar } from "./components/ConvencionesToolbar";
import {
  User,
  X,
  FileText,
  Save,
  CheckCircle2,
} from "lucide-react";
import type {
  ToothState,
  Surface,
  Diagnosis,
  Quadrants,
} from "./types";
import {
  FDI_PERMANENT_QUADRANTS,
  FDI_TEMPORARY_QUADRANTS,
  createDefaultToothState,
} from "./types";

const ODONTOGRAMA_STORAGE_KEY = "nexus_odonto_odontograma";

// Fallback quadrants defined locally to ensure teeth always render
const FALLBACK_PERMANENT_QUADRANTS: Quadrants = {
  topRight: [18, 17, 16, 15, 14, 13, 12, 11],
  topLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  bottomRight: [48, 47, 46, 45, 44, 43, 42, 41],
  bottomLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

const FALLBACK_TEMPORARY_QUADRANTS: Quadrants = {
  topRight: [55, 54, 53, 52, 51],
  topLeft: [61, 62, 63, 64, 65],
  bottomRight: [85, 84, 83, 82, 81],
  bottomLeft: [71, 72, 73, 74, 75],
};

// Fallback tooth state creator
const createFallbackToothState = (toothNumber: number): ToothState => ({
  toothNumber,
  isAbsent: false,
  isExtracted: false,
  isUnerupted: false,
  isVisible: true,
  condition: 'healthy',
  faces: {
    vestibular: { diagnosis: 'none' },
    palatino: { diagnosis: 'none' },
    mesial: { diagnosis: 'none' },
    distal: { diagnosis: 'none' },
    oclusal: { diagnosis: 'none' },
  },
});

function cargarOdontograma(): {
  dentitionType: 'permanent' | 'temporary';
  teeth: Record<number, ToothState>;
  selectedDiagnosis: Diagnosis;
} {
  const guardado = localStorage.getItem(ODONTOGRAMA_STORAGE_KEY);
  if (guardado) {
    try {
      const data = JSON.parse(guardado);
      return data;
    } catch {
      // Si falla, retornar estado inicial
    }
  }

  // Estado inicial con fallback local
  const teeth: Record<number, ToothState> = {};
  const quadrants = FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
  Object.values(quadrants).flat().forEach((toothNumber) => {
    teeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
    teeth[toothNumber].isVisible = true; // Permanent teeth visible by default
  });
  const tempQuadrants = FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
  Object.values(tempQuadrants).flat().forEach((toothNumber) => {
    teeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
    teeth[toothNumber].isVisible = false; // Temporary teeth hidden by default
  });

  return {
    dentitionType: "permanent",
    teeth,
    selectedDiagnosis: "caries",
  };
}

function guardarOdontograma(data: {
  dentitionType: 'permanent' | 'temporary';
  teeth: Record<number, ToothState>;
  selectedDiagnosis: Diagnosis;
}) {
  localStorage.setItem(ODONTOGRAMA_STORAGE_KEY, JSON.stringify(data));
}

const pacientesList = [
  { id: "1", nombre: "Andrés Pérez", cedula: "1076543210" },
  { id: "2", nombre: "María Fernanda López", cedula: "1087654321" },
  { id: "3", nombre: "Carlos Andrés Pérez", cedula: "1098761234" },
];

function OdontogramaUI() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [state, setState] = useState(cargarOdontograma);
  const [selectedSurface, setSelectedSurface] = useState<{
    toothNumber: number;
    surface: Surface;
  } | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState(pacientesList[0]);
  const [notasClinicas, setNotasClinicas] = useState(
    "Paciente presenta buena higiene bucal. Se detecta lesión cariosa inicial en cara oclusal de pieza #16 y cálculo supragingival leve en sector anteroinferior."
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentQuadrants = (): Quadrants => {
    if (state.dentitionType === "permanent") {
      return FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
    }
    return FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
  };

  const handleDentitionTypeChange = (type: 'permanent' | 'temporary') => {
    setState((prevState) => {
      const updatedTeeth = { ...prevState.teeth };

      // Permanent teeth visibility
      const permQuads = FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
      Object.values(permQuads).flat().forEach((toothNumber) => {
        if (!updatedTeeth[toothNumber]) {
          updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
        }
        updatedTeeth[toothNumber].isVisible = type === "permanent";
      });

      // Temporary teeth visibility
      const tempQuads = FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
      Object.values(tempQuads).flat().forEach((toothNumber) => {
        if (!updatedTeeth[toothNumber]) {
          updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
        }
        updatedTeeth[toothNumber].isVisible = type === "temporary";
      });

      const newState = {
        ...prevState,
        dentitionType: type,
        teeth: updatedTeeth,
      };

      guardarOdontograma(newState);
      return newState;
    });
  };

  const handleSurfaceClick = (toothNumber: number, surface: Surface) => {
    setSelectedSurface({ toothNumber, surface });
    setSelectedTooth(null);
  };

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setSelectedSurface(null);
  };

  const applyDiagnosis = (diagnosis: Diagnosis) => {
    if (!selectedSurface) return;
    const { toothNumber, surface } = selectedSurface;

    setState((prevState) => {
      const updatedTeeth = { ...prevState.teeth };
      if (updatedTeeth[toothNumber]) {
        updatedTeeth[toothNumber] = {
          ...updatedTeeth[toothNumber],
          faces: {
            ...updatedTeeth[toothNumber].faces,
            [surface]: { diagnosis },
          },
        };
      }

      const newState = {
        ...prevState,
        teeth: updatedTeeth,
      };

      guardarOdontograma(newState);
      return newState;
    });

    setSelectedSurface(null);
  };

  const handleDiagnosisChange = (diagnosis: Diagnosis) => {
    setState((prevState) => ({
      ...prevState,
      selectedDiagnosis: diagnosis,
    }));
  };

  const handleLimpiar = () => {
    setState((prevState) => {
      const resetTeeth: Record<number, ToothState> = {};
      const quadrants =
        prevState.dentitionType === "permanent"
          ? (FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS)
          : (FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS);

      Object.values(quadrants).flat().forEach((toothNumber) => {
        resetTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
        resetTeeth[toothNumber].isVisible = prevState.teeth[toothNumber]?.isVisible ?? true;
      });

      const newState = {
        ...prevState,
        teeth: resetTeeth,
      };

      guardarOdontograma(newState);
      return newState;
    });
    setSuccessToast("Odontograma restablecido.");
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleExport = () => {
    const data = {
      paciente: selectedPaciente,
      dentitionType: state.dentitionType,
      teeth: state.teeth,
      selectedDiagnosis: state.selectedDiagnosis,
      notasClinicas,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `odontograma_${selectedPaciente.cedula}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessToast("Odontograma exportado en formato JSON.");
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.dentitionType && data.teeth) {
          const updatedTeeth = { ...data.teeth };
          const quadrants = data.dentitionType === "permanent"
            ? (FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS)
            : (FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS);

          Object.values(quadrants).flat().forEach((toothNumber) => {
            if (!updatedTeeth[toothNumber]) {
              updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
            }
            updatedTeeth[toothNumber].isVisible = true;
          });

          setState({
            dentitionType: data.dentitionType,
            teeth: updatedTeeth,
            selectedDiagnosis: data.selectedDiagnosis || 'caries',
          });
          guardarOdontograma({
            dentitionType: data.dentitionType,
            teeth: updatedTeeth,
            selectedDiagnosis: data.selectedDiagnosis || 'caries',
          });
          if (data.notasClinicas) setNotasClinicas(data.notasClinicas);
          setSuccessToast("Odontograma importado correctamente.");
          setTimeout(() => setSuccessToast(null), 2500);
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const handleSaveNotes = () => {
    guardarOdontograma(state);
    setSuccessToast("¡Odontograma y notas clínicas guardadas con éxito!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const currentQuadrants = getCurrentQuadrants();

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-scaleIn">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Encabezado Principal estilo Pacientes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Odontograma Interactivo FDI
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Registro visual anatómico de patologías, tratamientos y estado dental por superficie.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl backdrop-blur-xl shadow-md text-xs font-semibold">
            <User size={15} className="text-cyan-600 dark:text-cyan-400" />
            <select
              value={selectedPaciente.id}
              onChange={(e) => {
                const found = pacientesList.find((p) => p.id === e.target.value);
                if (found) setSelectedPaciente(found);
              }}
              className="bg-transparent outline-none font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {pacientesList.map((pac) => (
                <option key={pac.id} value={pac.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {pac.nombre} (CC: {pac.cedula})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSaveNotes}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Save size={16} />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* Grid del Odontograma y Herramientas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2 animate-slideUp">
        {/* Panel de Herramientas (Izquierda) */}
        <div className="lg:col-span-1 space-y-4">
          <ConvencionesToolbar
            selectedDiagnosis={state.selectedDiagnosis}
            onDiagnosisChange={handleDiagnosisChange}
            dentitionType={state.dentitionType}
            onDentitionTypeChange={handleDentitionTypeChange}
            onClear={handleLimpiar}
            onExport={handleExport}
            onImport={handleImport}
            isDarkMode={isDarkMode}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Grid de Piezas Dentales FDI (Derecha) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md overflow-x-auto">
            <OdontogramaGrid
              teeth={state.teeth}
              quadrants={currentQuadrants}
              onSurfaceClick={handleSurfaceClick}
              onToothClick={handleToothClick}
              selectedTooth={selectedTooth}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Panel de Notas Clínicas y Diagnóstico Integral */}
          <div className="p-6 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-cyan-500" />
                <span>Observaciones del Odontograma y Plan de Tratamiento</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Paciente: {selectedPaciente.nombre}
              </span>
            </div>

            <textarea
              rows={3}
              value={notasClinicas}
              onChange={(e) => setNotasClinicas(e.target.value)}
              placeholder="Escribe aquí las observaciones clínicas detalladas por cuadrante o pieza..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none transition-all backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      {/* Modal de diagnóstico rápido al tocar una cara */}
      {selectedSurface && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/15 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Aplicar Diagnóstico
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Diente <strong className="text-cyan-600 dark:text-cyan-400">{selectedSurface.toothNumber}</strong> • Cara <strong className="text-cyan-600 dark:text-cyan-400 uppercase">{selectedSurface.surface}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedSurface(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => applyDiagnosis(state.selectedDiagnosis)}
                className="p-3 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer capitalize"
              >
                Aplicar {state.selectedDiagnosis}
              </button>
              <button
                type="button"
                onClick={() => applyDiagnosis("none")}
                className="p-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Limpiar Cara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OdontogramaUI;
