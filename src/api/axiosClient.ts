import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5170/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjunta el token JWT en el header Authorization si existe
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta resiliente
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Si la verificación de perfil o me da 401, el token ha expirado
      if (url.includes('/auth/me') || url.includes('/auth/profile')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('nexus_user');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;