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
  none: 'fill-white hover:fill-slate-100',
  caries: 'fill-red-500',
  restoration: 'fill-blue-500',
  sealant: 'fill-amber-500',
  endodontic: 'fill-purple-500',
  crown: 'fill-emerald-500',
  bridge: 'fill-cyan-500',
  implant: 'fill-teal-500',
  extraction: 'fill-slate-800',
  fracture: 'fill-orange-500',
  mobility: 'fill-yellow-500',
};

// Surface labels for clinical documentation
export const SURFACE_LABELS: Record<Surface, string> = {
  vestibular: 'V',
  palatino: 'P',
  mesial: 'M',
  distal: 'D',
  oclusal: 'O',
};

// Diagnosis legend for UI
export const DIAGNOSIS_LEGEND: { diagnosis: Diagnosis; label: string; color: string }[] = [
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
