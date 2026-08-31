import axiosClient from './axiosClient';

export interface ServiceResponseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
}

export interface CreateServiceRequestDto {
  code: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  isActive: boolean;
  sortOrder?: number;
}

export interface UpdateServiceRequestDto {
  code: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  isActive: boolean;
  sortOrder?: number;
}

export const serviceCatalogService = {
  getAll: async (): Promise<ServiceResponseDto[]> => {
    const response = await axiosClient.get('/v1/Services');
    return response.data;
  },

  getById: async (id: string): Promise<ServiceResponseDto> => {
    const response = await axiosClient.get(`/v1/Services/${id}`);
    return response.data;
  },

  create: async (data: CreateServiceRequestDto): Promise<ServiceResponseDto> => {
    const response = await axiosClient.post('/v1/Services', data);
    return response.data;
  },

  update: async (id: string, data: UpdateServiceRequestDto): Promise<ServiceResponseDto> => {
    const response = await axiosClient.put(`/v1/Services/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Services/${id}`);
  },
};
