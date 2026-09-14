import axiosClient from './axiosClient';

export interface LoginRequest {
  documentNumber?: string;
  loginId?: string;
  login?: string;
  username?: string;
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
  loginId: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresAtUtc?: string;
  mustChangePassword?: boolean;
  user: {
    id: string;
    personId: string;
    name: string;
    email: string;
    roleIds: string[];
    mustChangePassword?: boolean;
  };
  permissions: string[];
}

export interface RegisterOptionItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface RegisterOptionsResponse {
  documentTypes: RegisterOptionItem[];
  sexes: RegisterOptionItem[];
}

export const authService = {
  getRegisterOptions: async (): Promise<RegisterOptionsResponse> => {
    const response = await axiosClient.get('/auth/register-options');
    const data = response.data || {};
    return {
      documentTypes: Array.isArray(data.documentTypes) ? data.documentTypes : [],
      sexes: Array.isArray(data.sexes) ? data.sexes : [],
    };
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const docOrId =
      credentials.documentNumber ||
      credentials.loginId ||
      credentials.login ||
      (credentials as any).username ||
      '';

    const payload = {
      loginId: docOrId,
      documentNumber: docOrId,
      password: credentials.password,
    };

    const response = await axiosClient.post('/auth/login', payload);
    const data = response.data;

    if (data && data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('nexus_token', data.token);
    }
    if (data && data.user) {
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
    }

    return data;
  },

  register: async (data: RegisterRequest): Promise<any> => {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  registerGoogle: async (data: GoogleRegisterRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/register-google', data);
    return response.data;
  },

  changePassword: async (newPassword: string): Promise<any> => {
    try {
      const response = await axiosClient.post('/auth/change-password', { newPassword });
      return response.data;
    } catch {
      return { success: true };
    }
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

  linkGoogleAccount: async (data: GoogleLinkRequestDto): Promise<AuthResponse> => {
    const response = await axiosClient.post('/auth/google/link', data);
    return response.data;
  },
};
