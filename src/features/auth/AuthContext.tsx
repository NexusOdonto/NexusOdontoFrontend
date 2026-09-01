import { createContext, useContext, useEffect, useState } from 'react';
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
  avatarUrl?: string;
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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

  const parseProfileToUser = (profile: any, fallbackPrev?: User | null): User => {
    const userObj = profile.user || profile;
    const perms = profile.permissions || userObj.permissions || fallbackPrev?.permissions || [];
    const uId = userObj.id || userObj.email || fallbackPrev?.id || '';
    const savedAvatar = uId ? localStorage.getItem(`user_avatar_${uId}`) : null;

    const firstName = userObj.firstName || userObj.nombre || fallbackPrev?.nombre || (userObj.name ? userObj.name.split(' ')[0] : '');
    const lastName = userObj.lastName || userObj.apellido || fallbackPrev?.apellido || (userObj.name ? userObj.name.split(' ').slice(1).join(' ') : '');
    const fullName = userObj.name || `${firstName} ${lastName}`.trim() || userObj.email || fallbackPrev?.name || 'Usuario';

    return {
      id: userObj.id || fallbackPrev?.id || '',
      personId: userObj.personId || fallbackPrev?.personId || '',
      name: fullName,
      nombre: firstName,
      apellido: lastName,
      email: userObj.email || fallbackPrev?.email || '',
      cedula: userObj.documentNumber || userObj.cedula || fallbackPrev?.cedula || '',
      telefono: userObj.phone || userObj.telefono || fallbackPrev?.telefono || '',
      direccion: userObj.address || userObj.direccion || fallbackPrev?.direccion || '',
      sexo: userObj.sexId || userObj.sexo || fallbackPrev?.sexo || '',
      tipoDocumento: userObj.documentTypeId || userObj.tipoDocumento || fallbackPrev?.tipoDocumento || '',
      fechaNacimiento: userObj.dateOfBirth || userObj.fechaNacimiento || fallbackPrev?.fechaNacimiento || '',
      roleIds: userObj.roleIds || fallbackPrev?.roleIds || [],
      permissions: perms,
      avatar: userObj.avatar || userObj.avatarUrl || savedAvatar || fallbackPrev?.avatar || '',
      avatarUrl: userObj.avatar || userObj.avatarUrl || savedAvatar || fallbackPrev?.avatar || '',
      rol: fallbackPrev?.rol || (userObj.roleIds && userObj.roleIds.length > 0 ? userObj.roleIds[0] : 'PACIENTE'),
    };
  };

  const loginWithGoogleCallback = async (token: string, refreshToken?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      localStorage.setItem('auth_token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      const profile = await authService.getProfile();
      if (profile) {
        const userData = parseProfileToUser(profile);
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
              const updated = parseProfileToUser(profile, prev);
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
      const uId = prev.id || prev.email;
      if (updatedData.avatar && uId) {
        localStorage.setItem(`user_avatar_${uId}`, updatedData.avatar);
      }
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
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // Obtener perfil completo con datos de persona
        let userData: User;
        try {
          const profile = await authService.getProfile();
          userData = parseProfileToUser(profile || { user: backendUser, permissions });
        } catch {
          userData = parseProfileToUser({ user: backendUser, permissions });
        }
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
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
            ? [
                "APPOINTMENTS:VIEW", "APPOINTMENTS:CREATE", "APPOINTMENTS:CANCEL", "APPOINTMENTS:ATTEND", "APPOINTMENTS:REASSIGN",
                "PATIENTS:VIEW", "PATIENTS:CREATE", "PATIENTS:UPDATE", "PATIENTS:DELETE",
                "EMPLOYEES:VIEW", "EMPLOYEES:CREATE", "EMPLOYEES:UPDATE", "EMPLOYEES:DELETE",
                "USERS:VIEW", "USERS:CREATE", "USERS:UPDATE", "USERS:DELETE", "USERS:RESET_PASSWORD",
                "SERVICES:VIEW", "SERVICES:CREATE", "SERVICES:UPDATE", "SERVICES:DELETE",
                "PEOPLE:VIEW", "PEOPLE:CREATE", "PEOPLE:UPDATE", "PEOPLE:DELETE",
                "ROLES:VIEW", "ROLES:UPDATE", "CATALOGS:VIEW", "AUDIT:VIEW", "CLINICAL_RECORDS:VIEW", "ODONTOGRAM:VIEW",
                "REPORTS:VIEW", "PROFILE:VIEW"
              ]
            : mock.rol === "ODONTOLOGO"
            ? ["APPOINTMENTS:VIEW", "APPOINTMENTS:ATTEND", "PATIENTS:VIEW", "PEOPLE:VIEW", "CATALOGS:VIEW", "CLINICAL_RECORDS:VIEW", "ODONTOGRAM:VIEW", "PROFILE:VIEW"]
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
