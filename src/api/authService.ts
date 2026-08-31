import axiosClient from './axiosClient';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  documentTypeId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  sexId?: string;
  address?: string;
  password: string;
  roleId?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresAtUtc?: string;
  user: {
    id: string;
    personId: string;
    name: string;
    email: string;
    roleIds: string[];
  };
  permissions: string[];
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<any> => {
    // Petición al endpoint público de autenticación
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    if (refreshToken) {
      await axiosClient.post('/auth/logout', { refreshToken });
    }
  },

  getProfile: async (): Promise<any> => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },
};
