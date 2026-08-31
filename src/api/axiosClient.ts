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

// Manejo centralizado de respuestas y errores
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/register');
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/login' || currentPath === '/register';

      // Solo redirigir forzosamente al login si:
      // 1. NO es una petición de autenticación (login/refresh/register)
      // 2. El usuario NO está actualmente en una ruta pública (/login, /register)
      // De esta forma, las vistas públicas manejan el error inline sin recargar la página.
      if (!isAuthEndpoint && !isPublicRoute) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;