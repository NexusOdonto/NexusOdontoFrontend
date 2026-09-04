import axiosClient from './axiosClient';

export interface SpecialtyDto {
  id: string;
  code?: string;
  name?: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
}

export const specialtyService = {
  getAll: async (): Promise<SpecialtyDto[]> => {
    const response = await axiosClient.get('/v1/Specialties');
    return response.data;
  },

  getById: async (id: string): Promise<SpecialtyDto> => {
    const response = await axiosClient.get(`/v1/Specialties/${id}`);
    return response.data;
  },
};
