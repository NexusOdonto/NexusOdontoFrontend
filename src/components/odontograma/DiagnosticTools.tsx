import React from 'react';
import type { Diagnosis, Surface, ToothCondition } from './types';
import { DIAGNOSIS_COLORS, SURFACE_LABELS } from './types';

interface DiagnosticToolsProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: number;
  surface: Surface;
  currentDiagnosis: Diagnosis;
  onApplyDiagnosis: (diagnosis: Diagnosis) => void;
  onClear?: () => void;
}

const DIAGNOSIS_OPTIONS: { diagnosis: Diagnosis; label: string; description: string }[] = [
  { diagnosis: 'caries', label: 'Caries', description: 'Lesión cariosa' },
  { diagnosis: 'restoration', label: 'Obturación', description: 'Restauración/resina' },
  { diagnosis: 'sealant', label: 'Sellante', description: 'Sellante preventivo' },
  { diagnosis: 'endodontic', label: 'Endodoncia', description: 'Tratamiento de conducto' },
  { diagnosis: 'crown', label: 'Corona', description: 'Prótesis coronal' },
  { diagnosis: 'bridge', label: 'Puente', description: 'Prótesis fija' },
  { diagnosis: 'implant', label: 'Implante', description: 'Implante dental' },
  { diagnosis: 'extraction', label: 'Extracción', description: 'Extracción indicada' },
  { diagnosis: 'fracture', label: 'Fractura', description: 'Fractura dental' },
  { diagnosis: 'mobility', label: 'Movilidad', description: 'Movilidad dental' },
];

export const DiagnosticTools: React.FC<DiagnosticToolsProps> = ({
  isOpen,
  onClose,
  toothNumber,
  surface,
  currentDiagnosis,
  onApplyDiagnosis,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Diagnóstico Dental</h3>
              <p className="text-sm text-slate-400 mt-1">
                Diente {toothNumber} - Cara {SURFACE_LABELS[surface]}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg focus:outline-none focus:ring-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Diagnosis Options */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {DIAGNOSIS_OPTIONS.map(({ diagnosis, label, description }) => (
              <button
                key={diagnosis}
                onClick={() => onApplyDiagnosis(diagnosis)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none focus:ring-0 ${
                  currentDiagnosis === diagnosis
                    ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-4 h-4 rounded-full ${DIAGNOSIS_COLORS[diagnosis].split(' ')[0]}`}
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">{label}</div>
                    <div className="text-xs text-slate-400">{description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Clear Option */}
          {onClear && (
            <button
              onClick={() => onClear()}
              className="w-full p-3 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 focus:outline-none focus:ring-0"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm font-medium text-slate-300">Limpiar diagnóstico</span>
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-0"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

interface ToothStatusToolsProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: number;
  currentCondition: ToothCondition;
  isVisible: boolean;
  onConditionChange: (condition: ToothCondition) => void;
  onToggleVisible: () => void;
}

const CONDITION_OPTIONS: { value: ToothCondition; label: string; icon: string; color: string }[] = [
  { value: 'healthy', label: 'Sano', icon: '✓', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { value: 'extracted', label: 'Extraído', icon: '✕', color: 'bg-red-500/10 border-red-500/30 text-red-400' },
  { value: 'missing', label: 'Ausente', icon: '○', color: 'bg-slate-500/10 border-slate-500/30 text-slate-400' },
  { value: 'implanted', label: 'Implantado', icon: '⚙', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { value: 'unerupted', label: 'No erupcionado', icon: '◐', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
];

export const ToothStatusTools: React.FC<ToothStatusToolsProps> = ({
  isOpen,
  onClose,
  toothNumber,
  currentCondition,
  isVisible,
  onConditionChange,
  onToggleVisible,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full">
        {/* Header */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Estado del Diente</h3>
              <p className="text-sm text-slate-400 mt-1">Diente {toothNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg focus:outline-none focus:ring-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Status Options - Clean Cards */}
        <div className="p-5 space-y-4">
          {/* Condition Cards */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-3 block">Condición</label>
            <div className="grid grid-cols-1 gap-2">
              {CONDITION_OPTIONS.map(({ value, label, icon, color }) => (
                <button
                  key={value}
                  onClick={() => onConditionChange(value)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 focus:outline-none focus:ring-0 ${
                    currentCondition === value
                      ? `${color} ring-2 ring-blue-500/20`
                      : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-lg font-bold">{icon}</span>
                  <span className="font-medium text-white">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
              <span className="text-sm text-slate-300">Visible en odontograma</span>
              <button
                onClick={onToggleVisible}
                className={`w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-0 ${
                  isVisible ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isVisible ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
