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
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar sesión desde localStorage al montar
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing auth_user from localStorage', e);
      }
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
      // 1. Intentar autenticación con el backend (envía { login, password })
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
      
      return { success: false, error: 'Error desconocido al iniciar sesión' };
    } catch (error: any) {
      console.warn('Backend login returned error, checking mock fallback for dual auth...', error);

      // 2. Fallback resiliente: Si el backend no tiene el usuario/cédula registrado en BD o está en desarrollo,
      // verificar en la base de usuarios de prueba (soporta Cédula o Correo para todos los 4 roles)
      const mock = authenticateUser(cleanIdentifier, cleanPassword);
      if (mock) {
        const mockPermissions =
          mock.rol === "ADMINISTRADOR"
            ? ["USERS:VIEW", "APPOINTMENTS:VIEW", "PATIENTS:VIEW", "PATIENTS:CREATE", "PEOPLE:VIEW", "CATALOGS:VIEW", "CLINICAL:VIEW", "ODONTOGRAM:VIEW", "ROLES:VIEW"]
            : mock.rol === "ODONTOLOGO"
            ? ["APPOINTMENTS:VIEW", "PATIENTS:VIEW", "CLINICAL:VIEW", "ODONTOGRAM:VIEW"]
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

      // Si no coincide ni en backend ni en mocks
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
