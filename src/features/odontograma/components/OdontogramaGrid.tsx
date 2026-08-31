import type { ToothState, Surface, Quadrants } from "../types";
import { Tooth } from "./Tooth";

interface OdontogramaGridProps {
  teeth: Record<number, ToothState>;
  quadrants: Quadrants;
  onSurfaceClick: (toothNumber: number, surface: Surface) => void;
  onToothClick?: (toothNumber: number) => void;
  selectedTooth: number | null;
  isDarkMode: boolean;
}

export function OdontogramaGrid({
  teeth,
  quadrants,
  onSurfaceClick,
  onToothClick,
  selectedTooth,
  isDarkMode,
}: OdontogramaGridProps) {
  // Defensive fallbacks
  const safeTeeth = teeth || {};
  const safeQuadrants = quadrants || {
    topRight: [],
    topLeft: [],
    bottomRight: [],
    bottomLeft: [],
  };

  return (
    <div className="space-y-6 py-4">
      {/* Upper Arch */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 border-b border-slate-200 dark:border-slate-700/50 pb-6">
        <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
          {safeQuadrants.topRight
            .filter((id) => safeTeeth[id]?.isVisible)
            .map((id: number) => (
              <Tooth
                key={id}
                id={id}
                tooth={safeTeeth[id]}
                onSurfaceClick={onSurfaceClick}
                onToothClick={onToothClick}
                isSelected={selectedTooth === id}
                isDarkMode={isDarkMode}
              />
            ))}
        </div>

        <div className={`w-px h-12 lg:h-16 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'} flex-shrink-0`} />

        <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
          {safeQuadrants.topLeft
            .filter((id) => safeTeeth[id]?.isVisible)
            .map((id: number) => (
              <Tooth
                key={id}
                id={id}
                tooth={safeTeeth[id]}
                onSurfaceClick={onSurfaceClick}
                onToothClick={onToothClick}
                isSelected={selectedTooth === id}
                isDarkMode={isDarkMode}
              />
            ))}
        </div>
      </div>

      {/* Lower Arch */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
        <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
          {safeQuadrants.bottomRight
            .filter((id) => safeTeeth[id]?.isVisible)
            .map((id: number) => (
              <Tooth
                key={id}
                id={id}
                tooth={safeTeeth[id]}
                onSurfaceClick={onSurfaceClick}
                onToothClick={onToothClick}
                isSelected={selectedTooth === id}
                isDarkMode={isDarkMode}
              />
            ))}
        </div>

        <div className={`w-px h-12 lg:h-16 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'} flex-shrink-0`} />

        <div className="flex flex-nowrap items-center justify-center overflow-hidden w-full gap-1 sm:gap-2">
          {safeQuadrants.bottomLeft
            .filter((id) => safeTeeth[id]?.isVisible)
            .map((id: number) => (
              <Tooth
                key={id}
                id={id}
                tooth={safeTeeth[id]}
                onSurfaceClick={onSurfaceClick}
                onToothClick={onToothClick}
                isSelected={selectedTooth === id}
                isDarkMode={isDarkMode}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
