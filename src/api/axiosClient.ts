import axios from 'axios';

/**
 * 🤖 [AI ASSISTANT GUIDE - CLIENTE HTTP Y SEGURIDAD REST]:
 * -------------------------------------------------------------------------------------------------
 * 📌 PROPÓSITO:
 *    Instancia centralizada de Axios que orquesta todas las peticiones hacia la API .NET y Oracle.
 * 
 * 🔍 PATRONES DE INTERCEPCIÓN IMPLEMENTADOS:
 *    1. Interceptor de Petición (Request Interceptor):
 *       • Discrimina rutas anónimas públicas (/auth/login, /auth/register) para no enviar tokens obsoletos.
 *       • En cualquier otra ruta protegida, extrae el JWT de localStorage y lo inyecta como:
 *         `Authorization: Bearer <token>`
 *    2. Interceptor de Respuesta (Response Interceptor):
 *       • Captura respuestas 401 Unauthorized emitidas por el backend.
 *       • Si la sesión expiró o fue revocada, limpia el almacenamiento y emite el evento global `auth:expired`.
 *       • AuthContext escucha este evento y cierra la sesión reactivamente sin recargar la página.
 * 
 * 💡 TIPS PARA LA SUSTENTACIÓN:
 *    "La autenticación es completamente stateless vía JWT. El cliente frontend no almacena contraseñas,
 *    únicamente el token de acceso firmado con expiración controlada."
 * -------------------------------------------------------------------------------------------------
 */
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
    (path.includes('/auth/google/') && !path.includes('/auth/google/unlink'))
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
      // No auto-expirar en intentos fallidos del formulario de login
      if (!isPublicAuthRequest(url)) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('nexus_user');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('auth:expired', {
              detail: { reason: '401_unauthorized' },
            })
          );
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;