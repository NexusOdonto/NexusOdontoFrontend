import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5170/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Public auth routes must not send a stale JWT (can cause 401 on anonymous endpoints). */
const isPublicAuthRequest = (url?: string): boolean => {
  if (!url) return false;
  const path = url.split('?')[0].toLowerCase();
  return (
    path.includes('/auth/login') ||
    path.includes('/auth/register-options') ||
    path.includes('/auth/register-google') ||
    path.includes('/auth/register') ||
    path.includes('/auth/google/')
  );
};

// Adjunta el token JWT en el header Authorization si existe (excepto rutas públicas de auth)
axiosClient.interceptors.request.use(
  (config) => {
    if (isPublicAuthRequest(config.url)) {
      if (config.headers) {
        delete config.headers.Authorization;
      }
      return config;
    }

    const token = localStorage.getItem('auth_token') || localStorage.getItem('nexus_token');
    if (token && token !== 'mock_dev_token') {
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