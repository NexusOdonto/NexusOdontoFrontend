import React from 'react';
import type { ToothState, Surface } from './types';
import { DIAGNOSIS_COLORS } from './types';

interface ToothProps {
  id: number;
  tooth: ToothState;
  onSurfaceClick: (toothNumber: number, surface: Surface) => void;
  onToothClick?: (toothNumber: number) => void;
  isSelected?: boolean;
}

export const Tooth: React.FC<ToothProps> = ({ 
  id,
  tooth, 
  onSurfaceClick, 
  onToothClick,
  isSelected = false 
}) => {
  const { isAbsent, isExtracted, isUnerupted, isVisible, faces, condition } = tooth;

  if (!isVisible) return null;

  const getSurfaceColor = (surface: Surface): string => {
    const diagnosis = faces[surface].diagnosis;
    return DIAGNOSIS_COLORS[diagnosis];
  };

  const getSurfaceOpacity = (): number => {
    if (isAbsent || isExtracted) return 0.2;
    if (isUnerupted) return 0.4;
    return 1;
  };

  const handleSurfaceClick = (surface: Surface) => {
    if (!isAbsent && !isExtracted) {
      onSurfaceClick(id, surface);
    }
  };

  const handleToothClick = () => {
    if (onToothClick) {
      onToothClick(id);
    }
  };

  // Crown/prosthesis indicator
  const getCrownIndicator = () => {
    if (condition === 'implanted' || faces.vestibular.diagnosis === 'crown' || faces.vestibular.diagnosis === 'bridge') {
      return (
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          className="fill-none stroke-emerald-400 stroke-2 stroke-dasharray-4 opacity-70"
          rx="4"
        />
      );
    }
    return null;
  };

  // Endodontic indicator (vertical line in center)
  const getEndodonticIndicator = () => {
    if (faces.vestibular.diagnosis === 'endodontic' || 
        faces.palatino.diagnosis === 'endodontic' ||
        faces.mesial.diagnosis === 'endodontic' ||
        faces.distal.diagnosis === 'endodontic' ||
        faces.oclusal.diagnosis === 'endodontic') {
      return (
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="100"
          className="stroke-purple-400 stroke-2 opacity-70"
        />
      );
    }
    return null;
  };

  return (
    <div 
      className={`flex flex-col items-center gap-1 select-none transition-all duration-200 flex-shrink-0 w-12 sm:w-14 focus:outline-none focus:ring-0 ${
        isSelected ? 'scale-110' : 'hover:scale-105'
      } ${isAbsent || isExtracted ? 'opacity-50' : ''}`}
      onClick={handleToothClick}
      tabIndex={-1}
    >
      <span 
        className={`text-xs font-bold transition-colors ${
          isAbsent || isExtracted 
            ? 'text-slate-600 line-through' 
            : 'text-slate-300'
        }`}
      >
        {id}
      </span>
      
      <div className="relative">
        <svg 
          className="w-10 h-10 sm:w-12 sm:h-12 stroke-slate-400 stroke-[1.5] transition-all duration-200 focus:outline-none focus:ring-0"
          viewBox="0 0 100 100"
          style={{ opacity: getSurfaceOpacity() }}
        >
          {/* Vestibular/Bucal Surface (Top) */}
          <polygon
            points="0,0 100,0 75,25 25,25"
            className={`cursor-pointer transition-all duration-200 focus:outline-none focus:ring-0 ${
              getSurfaceColor('vestibular')
            } hover:brightness-110 hover:stroke-blue-400`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick('vestibular');
            }}
          />
          
          {/* Distal Surface (Right) */}
          <polygon
            points="100,0 100,100 75,75 75,25"
            className={`cursor-pointer transition-all duration-200 focus:outline-none focus:ring-0 ${
              getSurfaceColor('distal')
            } hover:brightness-110 hover:stroke-blue-400`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick('distal');
            }}
          />
          
          {/* Palatino/Lingual Surface (Bottom) */}
          <polygon
            points="0,100 100,100 75,75 25,75"
            className={`cursor-pointer transition-all duration-200 focus:outline-none focus:ring-0 ${
              getSurfaceColor('palatino')
            } hover:brightness-110 hover:stroke-blue-400`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick('palatino');
            }}
          />
          
          {/* Mesial Surface (Left) */}
          <polygon
            points="0,0 25,25 25,75 0,100"
            className={`cursor-pointer transition-all duration-200 focus:outline-none focus:ring-0 ${
              getSurfaceColor('mesial')
            } hover:brightness-110 hover:stroke-blue-400`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick('mesial');
            }}
          />
          
          {/* Oclusal/Incisal Surface (Center) */}
          <polygon
            points="25,25 75,25 75,75 25,75"
            className={`cursor-pointer transition-all duration-200 focus:outline-none focus:ring-0 ${
              getSurfaceColor('oclusal')
            } hover:brightness-110 hover:stroke-blue-400`}
            onClick={(e) => {
              e.stopPropagation();
              handleSurfaceClick('oclusal');
            }}
          />

          {/* Crown/prosthesis indicator */}
          {getCrownIndicator()}
          
          {/* Endodontic indicator */}
          {getEndodonticIndicator()}

          {/* Extraction Mark X */}
          {(isAbsent || isExtracted) && (
            <>
              <line
                x1="10"
                y1="10"
                x2="90"
                y2="90"
                className="stroke-red-600 stroke-2"
              />
              <line
                x1="90"
                y1="10"
                x2="10"
                y2="90"
                className="stroke-red-600 stroke-2"
              />
            </>
          )}

          {/* Unerupted Indicator */}
          {isUnerupted && (
            <circle
              cx="50"
              cy="50"
              r="8"
              className="fill-amber-400/30 stroke-amber-400 stroke-1"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
