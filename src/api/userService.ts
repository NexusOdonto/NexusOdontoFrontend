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
    const response = await axiosClient.get('/api/v1/users');
    return response.data;
  },
  
  getById: async (id: string): Promise<User> => {
    const response = await axiosClient.get(`/api/v1/users/${id}`);
    return response.data;
  },
  
  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await axiosClient.post('/api/v1/users', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axiosClient.put(`/api/v1/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/api/v1/users/${id}`);
  }
};