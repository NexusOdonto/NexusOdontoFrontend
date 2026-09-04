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
    const token = localStorage.getItem('auth_token') || localStorage.getItem('nexus_token');
    if (token && token !== 'mock_dev_token') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta resiliente: NO expulsa al usuario al login por 401/403 en endpoints de recursos
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si un recurso específico responde 401/403 por falta de permisos de rol,
    // se propaga el error al componente que hizo la llamada para que muestre su estado
    // sin destruir la sesión activa del usuario ni forzar recargas a /login.
    return Promise.reject(error);
  }
);

export default axiosClient;