import axiosClient from './axiosClient';

export interface ProfessionalResponseDto {
  id: string;
  personId: string;
  specialtyId: string;
  licenseNumber: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  // Campos enriquecidos
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  specialtyName?: string;
}

export interface CreateProfessionalDto {
  personId: string;
  specialtyId: string;
  licenseNumber: string;
  bio?: string;
  isActive?: boolean;
}

export interface UpdateProfessionalDto {
  personId: string;
  specialtyId: string;
  licenseNumber: string;
  bio?: string;
  isActive: boolean;
}

export const professionalService = {
  getAll: async (): Promise<ProfessionalResponseDto[]> => {
    const response = await axiosClient.get('/v1/Professionals');
    return response.data;
  },

  getById: async (id: string): Promise<ProfessionalResponseDto> => {
    const response = await axiosClient.get(`/v1/Professionals/${id}`);
    return response.data;
  },

  create: async (data: CreateProfessionalDto): Promise<ProfessionalResponseDto> => {
    const response = await axiosClient.post('/v1/Professionals', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProfessionalDto): Promise<ProfessionalResponseDto> => {
    const response = await axiosClient.put(`/v1/Professionals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Professionals/${id}`);
  },
};
