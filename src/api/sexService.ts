import axiosClient from './axiosClient';

export interface Sex {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export const sexService = {
  getAll: async (): Promise<Sex[]> => {
    const response = await axiosClient.get('/v1/Sexes');
    return response.data;
  }
};
