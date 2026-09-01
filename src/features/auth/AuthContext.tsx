import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/authService';
import { authenticateUser } from './mocks/users.mock';

export interface User {
  id: string;
  personId: string;
  name: string;
  email: string;
  roleIds: string[];
  permissions: string[];
  avatar?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  cedula?: string;
  rol?: string;
  direccion?: string;
  sexo?: string;
  tipoDocumento?: string;
  fechaNacimiento?: string;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleCallback: (token: string, refreshToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialización síncrona desde localStorage para evitar pérdida de sesión o parpadeos en F5
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    return Boolean(token && !savedUser);
  });

  const navigate = useNavigate();

  const loginWithGoogleCallback = async (token: string, refreshToken?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      localStorage.setItem('auth_token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      const profile = await authService.getProfile();
      if (profile) {
        const userData: User = {
          id: profile.id,
          personId: profile.personId,
          name: profile.name,
          email: profile.email,
          roleIds: profile.roleIds || [],
          permissions: profile.permissions || [],
          avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(profile.name || 'User')}`,
        };
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        navigate('/dashboard');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error logging in with Google token:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Detectar tokens provenientes del callback de Google en URL
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('token');
    const googleRefreshToken = urlParams.get('refreshToken');

    if (googleToken) {
      // Limpiar URL sin recargar para no exponer el token en la barra de direcciones
      window.history.replaceState({}, document.title, window.location.pathname);
      loginWithGoogleCallback(googleToken, googleRefreshToken || undefined);
      return;
    }

    // 2. Si hay token guardado previamente, sincronizar sesión silenciosamente
    const token = localStorage.getItem('auth_token');
    if (token && token !== 'mock_dev_token') {
      authService
        .getProfile()
        .then((profile) => {
          if (profile) {
            setUser((prev) => {
              const updated: User = {
                id: profile.id || prev?.id || '',
                personId: profile.personId || prev?.personId || '',
                name: profile.name || prev?.name || '',
                email: profile.email || prev?.email || '',
                roleIds: profile.roleIds || prev?.roleIds || [],
                permissions: profile.permissions || prev?.permissions || [],
                avatar: prev?.avatar || `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(profile.name || 'User')}`,
                nombre: prev?.nombre || profile.name?.split(' ')[0],
                apellido: prev?.apellido || profile.name?.split(' ').slice(1).join(' '),
                telefono: prev?.telefono,
                cedula: prev?.cedula,
                rol: prev?.rol,
                direccion: prev?.direccion,
                sexo: prev?.sexo,
                tipoDocumento: prev?.tipoDocumento,
                fechaNacimiento: prev?.fechaNacimiento,
              };
              localStorage.setItem('auth_user', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch((err) => {
          console.warn('Silent session validation in background:', err?.message || err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return updated;
    });
  };

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();
    
    try {
      // 1. Autenticación directa contra el endpoint REST del backend .NET (/api/auth/login)
      const response = await authService.login({
        login: cleanIdentifier,
        password: cleanPassword
      });
      
      if (response && response.token) {
        const { token, refreshToken, user: backendUser, permissions } = response;
        
        const userData: User = {
          id: backendUser.id,
          personId: backendUser.personId,
          name: backendUser.name,
          email: backendUser.email,
          roleIds: backendUser.roleIds || [],
          permissions: permissions || [],
          avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(backendUser.name || 'User')}`,
        };
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        navigate('/dashboard');
        return { success: true };
      }
      
      return { success: false, error: 'Error al procesar la autenticación.' };
    } catch (error: any) {
      console.warn('Backend login attempt returned error, verifying demo credentials...', error);

      // 2. Fallback de soporte para desarrollo con roles
      const mock = authenticateUser(cleanIdentifier, cleanPassword);
      if (mock) {
        const mockPermissions =
          mock.rol === "ADMINISTRADOR"
            ? ["USERS:VIEW", "APPOINTMENTS:VIEW", "PATIENTS:VIEW", "PATIENTS:CREATE", "PEOPLE:VIEW", "CATALOGS:VIEW", "CLINICAL:VIEW", "ODONTOGRAM:VIEW", "ROLES:VIEW", "PROFILE:VIEW"]
            : mock.rol === "ODONTOLOGO"
            ? ["APPOINTMENTS:VIEW", "PATIENTS:VIEW", "CLINICAL:VIEW", "ODONTOGRAM:VIEW", "PROFILE:VIEW"]
            : mock.rol === "RECEPCIONISTA"
            ? ["APPOINTMENTS:VIEW", "PATIENTS:VIEW", "PATIENTS:CREATE", "PEOPLE:VIEW", "CATALOGS:VIEW", "PROFILE:VIEW"]
            : ["APPOINTMENTS:VIEW", "PROFILE:VIEW"];

        const userData: User = {
          id: String(mock.id),
          personId: `person-${mock.id}`,
          name: `${mock.nombre} ${mock.apellido}`,
          nombre: mock.nombre,
          apellido: mock.apellido,
          email: mock.email,
          cedula: mock.cedula,
          telefono: mock.telefono,
          direccion: mock.direccion,
          sexo: mock.sexo,
          rol: mock.rol,
          roleIds: [mock.rol],
          permissions: mockPermissions,
          avatar: mock.avatar,
        };
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('auth_token', 'mock_dev_token');
        navigate('/dashboard');
        return { success: true };
      }

      const errorMessage =
        error.response?.data?.message === 'Invalid email or password.'
          ? 'Usuario o contraseña incorrectos. Verifica tu cédula o correo.'
          : error.response?.data?.message || 'Usuario o contraseña incorrectos. Verifica tus credenciales.';

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogleCallback,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
