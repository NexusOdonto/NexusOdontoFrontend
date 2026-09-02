/**
 * Professional Dental Data Model for Clinical Odontogram
 * Follows FDI (Fédération Dentaire Internationale) standards
 */

export type Surface = 'vestibular' | 'palatino' | 'mesial' | 'distal' | 'oclusal';

export type ToothCondition = 'healthy' | 'extracted' | 'missing' | 'implanted' | 'unerupted';

export type Diagnosis = 
  | 'caries' 
  | 'restoration' 
  | 'sealant' 
  | 'endodontic' 
  | 'crown' 
  | 'bridge' 
  | 'implant' 
  | 'extraction' 
  | 'fracture' 
  | 'mobility'
  | 'none';

export interface FaceState {
  diagnosis: Diagnosis;
  notes?: string;
}

export interface ToothState {
  toothNumber: number; // FDI numbering: 11-48 (permanent), 51-85 (temporary)
  isAbsent: boolean; // Tooth is missing/extracted
  isExtracted: boolean; // Tooth was extracted
  isUnerupted: boolean; // Tooth has not erupted yet
  isVisible: boolean; // For mixed dentition control
  condition: ToothCondition;
  faces: {
    vestibular: FaceState;
    palatino: FaceState;
    mesial: FaceState;
    distal: FaceState;
    oclusal: FaceState;
  };
  notes?: string;
}

export interface OdontogramData {
  dentitionType: 'permanent' | 'temporary' | 'mixed';
  teeth: Record<number, ToothState>;
  lastUpdated: string;
}

export interface Quadrants {
  topRight: number[];
  topLeft: number[];
  bottomRight: number[];
  bottomLeft: number[];
}

export const FDI_PERMANENT_QUADRANTS: Quadrants = {
  topRight: [18, 17, 16, 15, 14, 13, 12, 11],
  topLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  bottomRight: [48, 47, 46, 45, 44, 43, 42, 41],
  bottomLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

export const FDI_TEMPORARY_QUADRANTS: Quadrants = {
  topRight: [55, 54, 53, 52, 51],
  topLeft: [61, 62, 63, 64, 65],
  bottomRight: [85, 84, 83, 82, 81],
  bottomLeft: [71, 72, 73, 74, 75],
};

// Default healthy tooth state
export const createDefaultToothState = (toothNumber: number): ToothState => ({
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

// Diagnosis color mapping for clinical visualization
export const DIAGNOSIS_COLORS: Record<Diagnosis, string> = {
  none: 'fill-slate-100/90 dark:fill-white/90 hover:fill-white dark:hover:fill-slate-100',
  caries: 'fill-red-500',
  restoration: 'fill-blue-500',
  sealant: 'fill-amber-500',
  endodontic: 'fill-purple-500',
  crown: 'fill-emerald-500',
  bridge: 'fill-cyan-500',
  implant: 'fill-teal-500',
  extraction: 'fill-slate-800',
  fracture: 'fill-orange-500',
  mobility: 'fill-yellow-400',
};

// Surface labels for clinical documentation
export const SURFACE_LABELS: Record<Surface, string> = {
  vestibular: 'V',
  palatino: 'P',
  mesial: 'M',
  distal: 'D',
  oclusal: 'O',
};

// Clinical Diagnosis definition with visual halo styling
export interface DiagnosisLegendItem {
  diagnosis: Diagnosis;
  label: string;
  color: string;
  hex: string;
  glow: string;
  ring: string;
  badgeBg: string;
  badgeBorder: string;
}

// Diagnosis legend for UI
export const DIAGNOSIS_LEGEND: DiagnosisLegendItem[] = [
  {
    diagnosis: 'caries',
    label: 'Caries',
    color: 'bg-red-500',
    hex: '#EF4444',
    glow: 'shadow-[0_0_16px_rgba(239,68,68,0.45)]',
    ring: 'ring-red-400',
    badgeBg: 'bg-red-500/20 text-red-700 dark:text-red-200',
    badgeBorder: 'border-red-500/40',
  },
  {
    diagnosis: 'restoration',
    label: 'Obturación',
    color: 'bg-blue-500',
    hex: '#3B82F6',
    glow: 'shadow-[0_0_16px_rgba(59,130,246,0.45)]',
    ring: 'ring-blue-400',
    badgeBg: 'bg-blue-500/20 text-blue-700 dark:text-blue-200',
    badgeBorder: 'border-blue-500/40',
  },
  {
    diagnosis: 'sealant',
    label: 'Sellante',
    color: 'bg-amber-500',
    hex: '#F59E0B',
    glow: 'shadow-[0_0_16px_rgba(245,158,11,0.45)]',
    ring: 'ring-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-200',
    badgeBorder: 'border-amber-500/40',
  },
  {
    diagnosis: 'endodontic',
    label: 'Endodoncia',
    color: 'bg-purple-500',
    hex: '#A855F7',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.45)]',
    ring: 'ring-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-700 dark:text-purple-200',
    badgeBorder: 'border-purple-500/40',
  },
  {
    diagnosis: 'crown',
    label: 'Corona',
    color: 'bg-emerald-500',
    hex: '#10B981',
    glow: 'shadow-[0_0_16px_rgba(16,185,129,0.45)]',
    ring: 'ring-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200',
    badgeBorder: 'border-emerald-500/40',
  },
  {
    diagnosis: 'bridge',
    label: 'Puente',
    color: 'bg-cyan-500',
    hex: '#06B6D4',
    glow: 'shadow-[0_0_16px_rgba(6,182,212,0.45)]',
    ring: 'ring-cyan-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-200',
    badgeBorder: 'border-cyan-500/40',
  },
  {
    diagnosis: 'implant',
    label: 'Implante',
    color: 'bg-teal-500',
    hex: '#14B8A6',
    glow: 'shadow-[0_0_16px_rgba(20,184,166,0.45)]',
    ring: 'ring-teal-400',
    badgeBg: 'bg-teal-500/20 text-teal-700 dark:text-teal-200',
    badgeBorder: 'border-teal-500/40',
  },
  {
    diagnosis: 'extraction',
    label: 'Extracción',
    color: 'bg-slate-700',
    hex: '#475569',
    glow: 'shadow-[0_0_16px_rgba(71,85,105,0.45)]',
    ring: 'ring-slate-400',
    badgeBg: 'bg-slate-500/20 text-slate-700 dark:text-slate-200',
    badgeBorder: 'border-slate-500/40',
  },
  {
    diagnosis: 'fracture',
    label: 'Fractura',
    color: 'bg-orange-500',
    hex: '#F97316',
    glow: 'shadow-[0_0_16px_rgba(249,115,22,0.45)]',
    ring: 'ring-orange-400',
    badgeBg: 'bg-orange-500/20 text-orange-700 dark:text-orange-200',
    badgeBorder: 'border-orange-500/40',
  },
  {
    diagnosis: 'mobility',
    label: 'Movilidad',
    color: 'bg-yellow-400',
    hex: '#FACC15',
    glow: 'shadow-[0_0_16px_rgba(250,204,21,0.45)]',
    ring: 'ring-yellow-300',
    badgeBg: 'bg-yellow-400/20 text-yellow-800 dark:text-yellow-200',
    badgeBorder: 'border-yellow-400/40',
  },
];
