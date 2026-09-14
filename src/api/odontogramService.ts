
export interface DentalFindingItemDto {
  findingTypeCode: string;
  surfaceCode?: string;
  severityCode?: string;
  description?: string;
}

export interface OdontogramToothItemDto {
  fdiNumber: number;
  stateCode: string;
  findings?: DentalFindingItemDto[];
}

export interface SaveFullOdontogramRequestDto {
  clinicalHistoryId?: string;
  patientId?: string;
  clinicalAttentionId?: string;
  professionalId?: string;
  notes?: string;
  teeth: OdontogramToothItemDto[];
}

export interface FullOdontogramResponseDto {
  id: string;
  clinicalHistoryId: string;
  clinicalAttentionId?: string;
  professionalId?: string;
  recordedAt: string;
  notes?: string;
  teeth: {
    id: string;
    fdiNumber: number;
    stateCode: string;
    findings: {
      id: string;
      findingTypeCode: string;
      surfaceCode?: string;
      description?: string;
    }[];
  }[];
}
import axiosClient from './axiosClient';

export interface OdontogramResponseDto {
  id: string;
  clinicalHistoryId?: string;
  clinicalAttentionId?: string;
  professionalId?: string;
  recordedAt?: string;
  notes?: string;
  createdAt: string;
  patientId?: string;
  dentitionTypeId?: string;
}

export interface CreateOdontogramRequestDto {
  clinicalHistoryId?: string;
  clinicalAttentionId?: string;
  professionalId?: string;
  notes?: string;
  patientId?: string;
  dentitionTypeId?: string;
}

export interface DentalFindingResponseDto {
  id: string;
  odontogramToothId: string;
  findingTypeId: string;
  dentalSurfaceId?: string;
  findingStatusId: string;
  description?: string;
  registeredByProfessionalId?: string;
  createdAt: string;
  toothNumber?: number;
  findingTypeName?: string;
  surfaceName?: string;
  statusName?: string;
}

export interface CreateDentalFindingRequestDto {
  odontogramToothId: string;
  findingTypeId: string;
  dentalSurfaceId?: string;
  findingStatusId: string;
  description?: string;
  registeredByProfessionalId?: string;
}

export interface ToothResponseDto {
  id: string;
  fdiNumber: number;
  universalNumber?: string;
  palmerNotation?: string;
  name: string;
  quadrant: number;
  dentitionTypeId: string;
}

export interface DentalSurfaceDto {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface FindingTypeDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  defaultColorHex?: string;
}

export interface FindingStatusDto {
  id: string;
  code: string;
  name: string;
}

const mapOdontogram = (item: any): OdontogramResponseDto => ({
  ...item,
  createdAt: item?.recordedAt || item?.createdAt || new Date().toISOString(),
  patientId: item?.patientId || item?.clinicalHistoryId,
});

export const odontogramService = {
  getAll: async (): Promise<OdontogramResponseDto[]> => {
    const response = await axiosClient.get('/v1/Odontograms');
    return (response.data || []).map(mapOdontogram);
  },

  getById: async (id: string): Promise<OdontogramResponseDto> => {
    const response = await axiosClient.get(`/v1/Odontograms/${id}`);
    return mapOdontogram(response.data);
  },

  create: async (data: CreateOdontogramRequestDto): Promise<OdontogramResponseDto> => {
    if (!data.clinicalHistoryId) {
      throw new Error("Se requiere la historia clínica del paciente para registrar el odontograma.");
    }
    if (!data.professionalId) {
      throw new Error("Se requiere el identificador del profesional para registrar el odontograma.");
    }
    const payload = {
      clinicalHistoryId: data.clinicalHistoryId,
      professionalId: data.professionalId,
      clinicalAttentionId: data.clinicalAttentionId || null,
      notes: data.notes || null,
    };
    const response = await axiosClient.post('/v1/Odontograms', payload);
    return mapOdontogram(response.data);
  },


    saveFull: async (data: SaveFullOdontogramRequestDto): Promise<FullOdontogramResponseDto> => {
    const response = await axiosClient.post('/v1/Odontograms/full', data);
    return response.data;
  },

  getLatestByPatient: async (patientId: string): Promise<FullOdontogramResponseDto> => {
    const response = await axiosClient.get(`/v1/Odontograms/patient/${patientId}/latest`);
    return response.data;
  },

  getFullById: async (id: string): Promise<FullOdontogramResponseDto> => {
    const response = await axiosClient.get(`/v1/Odontograms/${id}/full`);
    return response.data;
  },
  getFindings: async (): Promise<DentalFindingResponseDto[]> => {
    const response = await axiosClient.get('/v1/DentalFindings');
    return response.data;
  },

  createFinding: async (data: CreateDentalFindingRequestDto): Promise<DentalFindingResponseDto> => {
    const response = await axiosClient.post('/v1/DentalFindings', data);
    return response.data;
  },

  getTeeth: async (): Promise<ToothResponseDto[]> => {
    const response = await axiosClient.get('/v1/Teeth');
    return response.data;
  },

  getSurfaces: async (): Promise<DentalSurfaceDto[]> => {
    const response = await axiosClient.get('/v1/DentalSurfaces');
    return response.data;
  },

  getFindingTypes: async (): Promise<FindingTypeDto[]> => {
    const response = await axiosClient.get('/v1/FindingTypes');
    return response.data;
  },

  getFindingStatuses: async (): Promise<FindingStatusDto[]> => {
    const response = await axiosClient.get('/v1/FindingStatuses');
    return response.data;
  },
};
