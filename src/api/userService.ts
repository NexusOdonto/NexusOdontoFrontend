import axiosClient from './axiosClient';

export interface User {
  id: string;
  personId: string;
  name: string;
  email: string;
  roleIds: string[];
  permissions?: string[];
  isActive?: boolean;
}

export interface CreateUserRequest {
  personId: string;
  password: string;
  roleId: string;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await axiosClient.get('/v1/Users');
    return response.data;
  },
  
  getById: async (id: string): Promise<User> => {
    const response = await axiosClient.get(`/v1/Users/${id}`);
    return response.data;
  },
  
  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await axiosClient.post('/v1/Users', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axiosClient.put(`/v1/Users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Users/${id}`);
  }
};