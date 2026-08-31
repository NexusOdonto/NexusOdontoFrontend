import axiosClient from './axiosClient';

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export const roleService = {
  getAll: async (): Promise<Role[]> => {
    const response = await axiosClient.get('/api/v1/roles');
    return response.data;
  }
};