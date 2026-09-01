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

export interface GoogleRegisterRequest {
  documentTypeId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  sexId?: string;
  address?: string;
  googleSub: string;
  password?: string;
}

export interface GoogleLinkRequestDto {
  linkToken: string;
  documentNumber: string;
  password: string;
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
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  registerGoogle: async (data: GoogleRegisterRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/register-google', data);
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

  /**
   * Inicia el flujo OAuth 2.0 redirigiendo al backend .NET con el origen dinámico del frontend
   */
  initiateGoogleLogin: () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5170/api';
    const origin = window.location.origin;
    window.location.href = `${baseUrl}/auth/google/login?frontendOrigin=${encodeURIComponent(origin)}`;
  },

  googleLogin: () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5170/api';
    const origin = window.location.origin;
    window.location.href = `${baseUrl}/auth/google/login?frontendOrigin=${encodeURIComponent(origin)}`;
  },

  /**
   * Vincula una cuenta Google usando el linkToken devuelto por el callback
   */
  linkGoogleAccount: async (data: GoogleLinkRequestDto): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/google/link', data);
    return response.data;
  },
};
