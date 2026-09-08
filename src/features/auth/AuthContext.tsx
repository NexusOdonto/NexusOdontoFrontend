import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/authService';
import { formatRoleName } from '../../utils/roleUtils';

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
      rol: formatRoleName(userObj.rol || userObj.role || fallbackPrev?.rol || (userObj.roleIds && userObj.roleIds.length > 0 ? userObj.roleIds[0] : 'PACIENTE')),
    };
  };

  const loginWithGoogleCallback = useCallback(async (token: string, refreshToken?: string): Promise<boolean> => {
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

        // Sincronizar automáticamente en el directorio de pacientes
        const fullName = `${userData.nombre || ''} ${userData.apellido || ''}`.trim() || userData.name;
        if (fullName) {
          const patientEntry = {
            id: userData.id || Date.now(),
            nombre: fullName,
            documento: userData.cedula || '',
            telefono: userData.telefono || '',
            estado: 'Activo',
            correo: userData.email || '',
            fechaNacimiento: userData.fechaNacimiento || '',
            direccion: userData.direccion || '',
            rol: 'PACIENTE',
          };
          
          try {
            const raw = localStorage.getItem('nexusodontopacientes');
            const list = raw ? JSON.parse(raw) : [];
            const filtered = Array.isArray(list) ? list.filter((p: any) => p.documento !== userData.cedula && p.correo !== userData.email) : [];
            filtered.unshift(patientEntry);
            localStorage.setItem('nexusodontopacientes', JSON.stringify(filtered));
          } catch {
            // Ignore
          }
        }

        navigate('/dashboard', { replace: true });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error logging in with Google token:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

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
    if (token) {
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
          console.warn('Sesión previa inválida o expirada:', err?.message || err);
          if (err?.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('nexus_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('nexus_user');
            setUser(null);
            navigate('/login', { replace: true });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [navigate, loginWithGoogleCallback]);

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
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    try {
      // 1. Autenticación directa contra el endpoint REST del backend .NET (/api/auth/login)
      const response = await authService.login({
        loginId: cleanIdentifier,
        password: cleanPassword
      });
      
      if (response && response.token) {
        const { token, refreshToken, user: backendUser, permissions } = response;
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }

        // Obtener perfil completo con datos de persona desde el backend
        let userData: User;
        try {
          const profile = await authService.getProfile();
          userData = parseProfileToUser(profile || { user: backendUser, permissions });
        } catch {
          userData = parseProfileToUser({ user: backendUser, permissions });
        }
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        navigate('/dashboard', { replace: true });
        return { success: true };
      }
      
      return { success: false, error: 'Error al procesar la autenticación.' };
    } catch (error: any) {
      console.error('Error al autenticar contra Backend API .NET:', error);

      const status = error.response?.status;
      let errorMessage = 'Error de conexión con el servidor. Inténtalo más tarde.';

      if (status === 401) {
        if (cleanIdentifier.includes('@')) {
          errorMessage = 'Credenciales incorrectas. Si estás ingresando con correo, intenta con tu número de cédula/documento.';
        } else {
          errorMessage = 'Credenciales incorrectas. Verifica tu número de documento y contraseña.';
        }
      } else if (status === 403) {
        errorMessage = 'Esta cuenta se encuentra desactivada. Contacta al soporte o administrador.';
      } else if (error.response?.data?.message) {
        if (error.response.data.message === 'Invalid email or password.' || error.response.data.message === 'Invalid login ID or password.') {
          if (cleanIdentifier.includes('@')) {
            errorMessage = 'Credenciales incorrectas. Si estás ingresando con correo, intenta con tu número de cédula/documento.';
          } else {
            errorMessage = 'Credenciales incorrectas. Verifica tu usuario y contraseña.';
          }
        } else {
          errorMessage = error.response.data.message;
        }
      }

      return { success: false, error: errorMessage };
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
    navigate('/login', { replace: true });
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
