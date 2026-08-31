import { useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { OdontogramaGrid } from "./components/OdontogramaGrid";
import { ConvencionesToolbar } from "./components/ConvencionesToolbar";
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

function OdontogramaUI() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [state, setState] = useState(cargarOdontograma);
  const [selectedSurface, setSelectedSurface] = useState<{
    toothNumber: number;
    surface: Surface;
  } | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentQuadrants = (): Quadrants => {
    if (state.dentitionType === "permanent") {
      return FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
    }
    return FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
  };

  const handleDentitionTypeChange = (type: 'permanent' | 'temporary') => {
    if (!setState) return;
    setState((prevState) => {
      if (!prevState) return prevState;
      const updatedTeeth = { ...prevState.teeth };

      // Permanent teeth visibility
      const permQuads = FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
      Object.values(permQuads).flat().forEach((toothNumber) => {
        if (!updatedTeeth[toothNumber]) {
          // Create permanent tooth if it doesn't exist
          updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
        }
        updatedTeeth[toothNumber].isVisible = type === "permanent";
      });

      // Temporary teeth visibility
      const tempQuads = FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
      Object.values(tempQuads).flat().forEach((toothNumber) => {
        if (!updatedTeeth[toothNumber]) {
          // Create temporary tooth if it doesn't exist
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
    if (setSelectedSurface) {
      setSelectedSurface({ toothNumber, surface });
      if (setSelectedTooth) setSelectedTooth(null);
    }
  };

  const handleToothClick = (toothNumber: number) => {
    if (setSelectedTooth) {
      setSelectedTooth(toothNumber);
      if (setSelectedSurface) setSelectedSurface(null);
    }
  };

  const applyDiagnosis = (diagnosis: Diagnosis) => {
    if (!selectedSurface || !setState) return;
    const { toothNumber, surface } = selectedSurface;

    setState((prevState) => {
      if (!prevState) return prevState;
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

    if (setSelectedSurface) setSelectedSurface(null);
  };

  const handleDiagnosisChange = (diagnosis: Diagnosis) => {
    if (setState) {
      setState((prevState) => {
        if (!prevState) return prevState;
        return {
          ...prevState,
          selectedDiagnosis: diagnosis,
        };
      });
    }
  };

  const handleLimpiar = () => {
    if (!setState) return;
    setState((prevState) => {
      if (!prevState) return prevState;
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
  };

  const handleExport = () => {
    const data = {
      dentitionType: state.dentitionType,
      teeth: state.teeth,
      selectedDiagnosis: state.selectedDiagnosis,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `odontograma_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !setState) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the imported data structure
        if (data.dentitionType && data.teeth) {
          // Ensure all teeth exist for the dentition type
          const updatedTeeth = { ...data.teeth };
          const quadrants = data.dentitionType === "permanent"
            ? (FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS)
            : (FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS);

          Object.values(quadrants).flat().forEach((toothNumber) => {
            if (!updatedTeeth[toothNumber]) {
              updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
            }
            // Ensure visibility matches dentition type
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
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        alert('Error al importar el archivo. Asegúrate de que sea un JSON válido.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const currentQuadrants = getCurrentQuadrants();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold ${
            isDarkMode ? "text-slate-100" : "text-slate-900"
          }`}
        >
          Odontograma Interactivo
        </h1>
        <p
          className={`mt-1 text-sm ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Sistema de Registro Clínico Dental - FDI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Herramientas */}
        <div className="lg:col-span-1">
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

        {/* Grid del Odontograma */}
        <div className="lg:col-span-3">
          <div
            className={`p-6 rounded-xl border overflow-x-auto ${
              isDarkMode
                ? "bg-slate-800/50 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <OdontogramaGrid
              teeth={state.teeth}
              quadrants={currentQuadrants}
              onSurfaceClick={handleSurfaceClick}
              onToothClick={handleToothClick}
              selectedTooth={selectedTooth}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>

      {/* Modal de diagnóstico cuando se selecciona una cara */}
      {selectedSurface && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className={`rounded-2xl shadow-2xl max-w-md w-full p-6 ${
              isDarkMode
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Aplicar Diagnóstico
                </h3>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Diente {selectedSurface.toothNumber} - Cara{" "}
                  {selectedSurface.surface}
                </p>
              </div>
              <button
                onClick={() => setSelectedSurface(null)}
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyDiagnosis(state.selectedDiagnosis)}
                className={`p-3 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-primary-500 text-white hover:bg-primary-600"
                }`}
              >
                Aplicar {state.selectedDiagnosis}
              </button>
              <button
                onClick={() => applyDiagnosis("none")}
                className={`p-3 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OdontogramaUI;
