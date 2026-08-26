import React from 'react';
import type { Diagnosis } from './types';

interface ColorLegendProps {
  className?: string;
}

const DIAGNOSIS_LEGEND: { diagnosis: Diagnosis; label: string; color: string }[] = [
  { diagnosis: 'caries', label: 'Caries', color: 'bg-red-500' },
  { diagnosis: 'restoration', label: 'Obturación', color: 'bg-blue-500' },
  { diagnosis: 'sealant', label: 'Sellante', color: 'bg-amber-500' },
  { diagnosis: 'endodontic', label: 'Endodoncia', color: 'bg-purple-500' },
  { diagnosis: 'crown', label: 'Corona', color: 'bg-emerald-500' },
  { diagnosis: 'bridge', label: 'Puente', color: 'bg-cyan-500' },
  { diagnosis: 'implant', label: 'Implante', color: 'bg-teal-500' },
  { diagnosis: 'extraction', label: 'Extracción', color: 'bg-slate-800' },
  { diagnosis: 'fracture', label: 'Fractura', color: 'bg-orange-500' },
  { diagnosis: 'mobility', label: 'Movilidad', color: 'bg-yellow-500' },
];

export const ColorLegend: React.FC<ColorLegendProps> = ({ className = '' }) => {
  return (
    <div className={`bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 shadow-lg ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {DIAGNOSIS_LEGEND.map(({ diagnosis, label, color }) => (
          <div key={diagnosis} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
        
        {/* Special indicators */}
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-700">
          <div className="w-2 h-2 rounded-full bg-slate-200 opacity-20" />
          <span className="text-xs text-slate-400">Ausente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400/30 border border-amber-400" />
          <span className="text-xs text-slate-400">No erupc.</span>
        </div>
      </div>
    </div>
  );
};

export default ColorLegend;
