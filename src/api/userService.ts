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
  roleId?: string;
  roleIds?: string[];
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
    const payload = {
      personId: data.personId,
      password: data.password,
      roleId: data.roleId,
      roleIds: data.roleIds || (data.roleId ? [data.roleId] : []),
    };
    const response = await axiosClient.post('/v1/Users', payload);
    const user = response.data;
    if (data.roleId && (!user.roleIds || user.roleIds.length === 0)) {
      try {
        await axiosClient.post(`/v1/UserRoles/users/${user.id}/roles/${data.roleId}`);
        user.roleIds = [data.roleId];
      } catch (err) {
        console.warn('Fallback UserRoles assignment:', err);
      }
    }
    return user;
  },
  
  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await axiosClient.put(`/v1/Users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Users/${id}`);
  }
};