import axiosClient from './axiosClient';

export interface OdontogramResponseDto {
  id: string;
  patientId: string;
  dentitionTypeId: string;
  notes?: string;
  createdAt: string;
}

export interface CreateOdontogramRequestDto {
  patientId: string;
  dentitionTypeId: string;
  notes?: string;
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

export const odontogramService = {
  getAll: async (): Promise<OdontogramResponseDto[]> => {
    const response = await axiosClient.get('/v1/Odontograms');
    return response.data;
  },

  getById: async (id: string): Promise<OdontogramResponseDto> => {
    const response = await axiosClient.get(`/v1/Odontograms/${id}`);
    return response.data;
  },

  create: async (data: CreateOdontogramRequestDto): Promise<OdontogramResponseDto> => {
    const response = await axiosClient.post('/v1/Odontograms', data);
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
