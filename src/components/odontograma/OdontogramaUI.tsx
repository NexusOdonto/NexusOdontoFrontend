import { useState } from 'react';
import { Tooth } from './Tooth';
import { DiagnosticTools, ToothStatusTools } from './DiagnosticTools';
import { ColorLegend } from './ColorLegend';
import type { 
  ToothState, 
  Surface, 
  Diagnosis, 
  ToothCondition, 
  OdontogramData,
  Quadrants 
} from './types';
import { 
  FDI_PERMANENT_QUADRANTS, 
  FDI_TEMPORARY_QUADRANTS,
  createDefaultToothState 
} from './types';

export default function OdontogramaUI() {
  const [dentitionType, setDentitionType] = useState<'permanent' | 'temporary' | 'mixed'>('permanent');
  const [selectedSurface, setSelectedSurface] = useState<{ toothNumber: number; surface: Surface } | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [teeth, setTeeth] = useState<Record<number, ToothState>>(() => {
    // Initialize all permanent teeth
    const initialTeeth: Record<number, ToothState> = {};
    Object.values(FDI_PERMANENT_QUADRANTS).flat().forEach(toothNumber => {
      initialTeeth[toothNumber] = createDefaultToothState(toothNumber);
    });
    // Initialize all temporary teeth
    Object.values(FDI_TEMPORARY_QUADRANTS).flat().forEach(toothNumber => {
      initialTeeth[toothNumber] = createDefaultToothState(toothNumber);
      // Hide temporary teeth by default in permanent mode
      initialTeeth[toothNumber].isVisible = false;
    });
    return initialTeeth;
  });



  // Get current quadrants based on dentition type
  const getCurrentQuadrants = (): Quadrants => {
    switch (dentitionType) {
      case 'permanent':
        return FDI_PERMANENT_QUADRANTS;
      case 'temporary':
        return FDI_TEMPORARY_QUADRANTS;
      case 'mixed':
        // In mixed mode, show both permanent and visible temporary teeth
        return {
          topRight: [...FDI_PERMANENT_QUADRANTS.topRight, ...FDI_TEMPORARY_QUADRANTS.topRight],
          topLeft: [...FDI_PERMANENT_QUADRANTS.topLeft, ...FDI_TEMPORARY_QUADRANTS.topLeft],
          bottomRight: [...FDI_PERMANENT_QUADRANTS.bottomRight, ...FDI_TEMPORARY_QUADRANTS.bottomRight],
          bottomLeft: [...FDI_PERMANENT_QUADRANTS.bottomLeft, ...FDI_TEMPORARY_QUADRANTS.bottomLeft],
        };
      default:
        return FDI_PERMANENT_QUADRANTS;
    }
  };

  // Handle dentition type change
  const handleDentitionTypeChange = (type: 'permanent' | 'temporary' | 'mixed') => {
    setDentitionType(type);
    
    // Update visibility based on dentition type
    setTeeth(prev => {
      const updated = { ...prev };
      
      // Permanent teeth visibility
      Object.values(FDI_PERMANENT_QUADRANTS).flat().forEach(toothNumber => {
        updated[toothNumber].isVisible = type !== 'temporary';
      });
      
      // Temporary teeth visibility
      Object.values(FDI_TEMPORARY_QUADRANTS).flat().forEach(toothNumber => {
        updated[toothNumber].isVisible = type === 'temporary' || (type === 'mixed' && updated[toothNumber].isVisible);
      });
      
      return updated;
    });
  };

  // Handle surface click for diagnosis
  const handleSurfaceClick = (toothNumber: number, surface: Surface) => {
    setSelectedSurface({ toothNumber, surface });
    setSelectedTooth(null);
  };

  // Handle tooth click for status management
  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setSelectedSurface(null);
  };

  // Apply diagnosis to surface
  const applyDiagnosis = (diagnosis: Diagnosis) => {
    if (!selectedSurface) return;
    const { toothNumber, surface } = selectedSurface;

    setTeeth(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        faces: {
          ...prev[toothNumber].faces,
          [surface]: { diagnosis },
        },
      },
    }));
    setSelectedSurface(null);
  };

  // Clear diagnosis from surface
  const clearDiagnosis = () => {
    if (!selectedSurface) return;
    const { toothNumber, surface } = selectedSurface;

    setTeeth(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        faces: {
          ...prev[toothNumber].faces,
          [surface]: { diagnosis: 'none' },
        },
      },
    }));
    setSelectedSurface(null);
  };

  // Handle tooth condition change - automatically sets related flags
  const handleConditionChange = (toothNumber: number, condition: ToothCondition) => {
    setTeeth(prev => {
      const updated = { ...prev };
      updated[toothNumber] = {
        ...updated[toothNumber],
        condition,
        // Auto-set boolean flags based on condition
        isAbsent: condition === 'missing',
        isExtracted: condition === 'extracted',
        isUnerupted: condition === 'unerupted',
      };
      return updated;
    });
  };

  // Toggle tooth visibility only
  const toggleToothVisibility = (toothNumber: number) => {
    setTeeth(prev => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        isVisible: !prev[toothNumber].isVisible,
      },
    }));
  };

  // Export odontogram data
  const exportData = (): OdontogramData => {
    return {
      dentitionType,
      teeth,
      lastUpdated: new Date().toISOString(),
    };
  };

  // Import odontogram data (reserved for future integration)
  // const importData = (data: OdontogramData) => {
  //   setDentitionType(data.dentitionType);
  //   setTeeth(data.teeth);
  // };

  const currentQuadrants = getCurrentQuadrants();

  return (
    <div className="p-4 md:p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Odontograma Interactivo</h2>
          <p className="text-sm text-slate-400 mt-1">Sistema de Registro Clínico Dental - FDI</p>
        </div>
        
        {/* Dentition Type Controls */}
        <div className="flex flex-wrap gap-2 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => handleDentitionTypeChange('permanent')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition focus:outline-none focus:ring-0 ${
              dentitionType === 'permanent' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Permanente
          </button>
          <button
            onClick={() => handleDentitionTypeChange('temporary')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition focus:outline-none focus:ring-0 ${
              dentitionType === 'temporary' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Temporal
          </button>
          <button
            onClick={() => handleDentitionTypeChange('mixed')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition focus:outline-none focus:ring-0 ${
              dentitionType === 'mixed' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Mixta
          </button>
        </div>
      </div>

      {/* Floating Color Legend */}
      <div className="flex justify-center">
        <ColorLegend className="w-full max-w-4xl" />
      </div>

      {/* Original Geometric Grid Layout */}
      <div className="space-y-6 py-4">
        {/* Upper Arch */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 border-b border-slate-800/50 pb-6">
          <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
            {currentQuadrants.topRight
              .filter(id => teeth[id]?.isVisible)
              .map((id: number) => (
              <Tooth 
                key={id} 
                id={id}
                tooth={teeth[id]} 
                onSurfaceClick={handleSurfaceClick}
                onToothClick={handleToothClick}
                isSelected={selectedTooth === id}
              />
            ))}
          </div>
          
          <div className="w-px h-12 lg:h-16 bg-slate-700 flex-shrink-0" />
          
          <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
            {currentQuadrants.topLeft
              .filter(id => teeth[id]?.isVisible)
              .map((id: number) => (
              <Tooth 
                key={id} 
                id={id}
                tooth={teeth[id]} 
                onSurfaceClick={handleSurfaceClick}
                onToothClick={handleToothClick}
                isSelected={selectedTooth === id}
              />
            ))}
          </div>
        </div>

        {/* Lower Arch */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
          <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
            {currentQuadrants.bottomRight
              .filter(id => teeth[id]?.isVisible)
              .map((id: number) => (
              <Tooth 
                key={id} 
                id={id}
                tooth={teeth[id]} 
                onSurfaceClick={handleSurfaceClick}
                onToothClick={handleToothClick}
                isSelected={selectedTooth === id}
              />
            ))}
          </div>
          
          <div className="w-px h-12 lg:h-16 bg-slate-700 flex-shrink-0" />
          
          <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
            {currentQuadrants.bottomLeft
              .filter(id => teeth[id]?.isVisible)
              .map((id: number) => (
              <Tooth 
                key={id} 
                id={id}
                tooth={teeth[id]} 
                onSurfaceClick={handleSurfaceClick}
                onToothClick={handleToothClick}
                isSelected={selectedTooth === id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Data Export/Import Controls */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
        <button
          onClick={() => {
            const data = exportData();
            console.log('Odontogram Data:', data);
            alert('Datos exportados a consola (listo para integración con backend)');
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-0"
        >
          Exportar Datos
        </button>
        <button
          onClick={() => {
            alert('Función de importación lista para integración con backend');
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-0"
        >
          Importar Datos
        </button>
        <button
          onClick={() => {
            setTeeth(prev => {
              const reset: Record<number, ToothState> = {};
              Object.keys(prev).forEach(key => {
                const num = parseInt(key);
                reset[num] = createDefaultToothState(num);
                reset[num].isVisible = dentitionType !== 'temporary' || (num >= 51 && num <= 85);
              });
              return reset;
            });
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-0"
        >
          Limpiar Todo
        </button>
      </div>

      {/* Diagnostic Tools Modal */}
      {selectedSurface && (
        <DiagnosticTools
          isOpen={!!selectedSurface}
          onClose={() => setSelectedSurface(null)}
          toothNumber={selectedSurface.toothNumber}
          surface={selectedSurface.surface}
          currentDiagnosis={teeth[selectedSurface.toothNumber]?.faces[selectedSurface.surface]?.diagnosis || 'none'}
          onApplyDiagnosis={applyDiagnosis}
          onClear={clearDiagnosis}
        />
      )}

      {/* Tooth Status Tools Modal */}
      {selectedTooth && (
        <ToothStatusTools
          isOpen={!!selectedTooth}
          onClose={() => setSelectedTooth(null)}
          toothNumber={selectedTooth}
          currentCondition={teeth[selectedTooth]?.condition || 'healthy'}
          isVisible={teeth[selectedTooth]?.isVisible || false}
          onConditionChange={(condition) => handleConditionChange(selectedTooth, condition)}
          onToggleVisible={() => toggleToothVisibility(selectedTooth)}
        />
      )}
    </div>
  );
}
