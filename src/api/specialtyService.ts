import axiosClient from './axiosClient';
import { getSpecialtyDisplayLabel } from '../utils/specialtyLabels';

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
    const raw = Array.isArray(response.data) ? response.data : [];
    return raw.map((s: SpecialtyDto) => ({
      ...s,
      name: getSpecialtyDisplayLabel(s.name || s.code),
    }));
  },

  getById: async (id: string): Promise<SpecialtyDto> => {
    const response = await axiosClient.get(`/v1/Specialties/${id}`);
    const s = response.data as SpecialtyDto;
    return {
      ...s,
      name: getSpecialtyDisplayLabel(s?.name || s?.code),
    };
  },
};
