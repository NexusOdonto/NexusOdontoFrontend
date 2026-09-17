import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/authService';
import { formatRoleName } from '../../utils/roleUtils';
import {
  isBotServiceUser,
  RESERVED_ACCOUNT_LOGIN_MESSAGE,
} from './reservedServiceAccounts';

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
  mustChangePassword?: boolean;
  googleLinked?: boolean;
  googleEmail?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleCallback: (token: string, refreshToken?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  unlinkGoogle: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tiempo límite de inactividad: 20 minutos (1,200,000 ms)
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;

function isJwtExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    // Si faltan menos de 10 segundos o ya expiró
    return Date.now() >= decoded.exp * 1000 - 10000;
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      if (token && isJwtExpired(token)) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        return null;
      }
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
  const lastActivityRef = useRef<number>(Date.now());

  const clearSessionStorage = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('refresh_token');
  }, []);

  const handleSessionExpired = useCallback(
    (reason = 'token_expired') => {
      clearSessionStorage();
      setUser(null);
      navigate(`/login?sessionExpired=true&reason=${reason}`, {
        replace: true,
        state: { sessionExpired: true, reason },
      });
    },
    [clearSessionStorage, navigate]
  );

  // Monitor de inactividad del usuario y de expiración del token JWT
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) =>
      window.addEventListener(evt, handleUserActivity, { passive: true })
    );

    // Verificación periódica cada 15 segundos
    const interval = setInterval(() => {
      const token =
        localStorage.getItem('auth_token') || localStorage.getItem('nexus_token');
      if (!token) {
        handleSessionExpired('no_token');
        return;
      }

      // 1. Verificación de expiración de JWT
      if (isJwtExpired(token)) {
        console.warn('JWT expirado, cerrando sesión...');
        handleSessionExpired('token_expired');
        return;
      }

      // 2. Verificación de inactividad del usuario
      const inactiveDuration = Date.now() - lastActivityRef.current;
      if (inactiveDuration >= INACTIVITY_TIMEOUT_MS) {
        console.warn('Sesión cerrada por inactividad...');
        handleSessionExpired('inactivity');
        return;
      }
    }, 15000);

    // Evento emitido por el interceptor de Axios ante error 401
    const handleAuthExpiredEvent = (e: any) => {
      const detailReason = e?.detail?.reason || '401_unauthorized';
      handleSessionExpired(detailReason);
    };
    window.addEventListener('auth:expired', handleAuthExpiredEvent);

    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, handleUserActivity)
      );
      clearInterval(interval);
      window.removeEventListener('auth:expired', handleAuthExpiredEvent);
    };
  }, [user, handleSessionExpired]);

  const parseProfileToUser = (profile: any, fallbackPrev?: User | null): User => {
    const userObj = profile.user || profile;
    const perms = profile.permissions || userObj.permissions || fallbackPrev?.permissions || [];
    const uId = userObj.id || userObj.email || fallbackPrev?.id || '';
    const savedAvatar = uId ? localStorage.getItem(`user_avatar_${uId}`) : null;

    const firstName = userObj.firstName || userObj.nombre || fallbackPrev?.nombre || (userObj.name ? userObj.name.split(' ')[0] : '');
    const lastName = userObj.lastName || userObj.apellido || fallbackPrev?.apellido || (userObj.name ? userObj.name.split(' ').slice(1).join(' ') : '');
    const fullName = userObj.name || `${firstName} ${lastName}`.trim() || userObj.email || fallbackPrev?.email || 'Usuario';

    const mustChange = userObj.mustChangePassword ?? userObj.requiereCambioPassword ?? profile.mustChangePassword ?? fallbackPrev?.mustChangePassword ?? false;

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
      mustChangePassword: mustChange,
      googleLinked: Boolean(profile.googleLinked ?? profile.GoogleLinked),
      googleEmail: profile.googleEmail ?? profile.GoogleEmail ?? null,
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
        if (isBotServiceUser(userData)) {
          clearSessionStorage();
          setUser(null);
          navigate('/login', { replace: true });
          return false;
        }
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));

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
  }, [navigate, clearSessionStorage]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get('token');
    const googleRefreshToken = urlParams.get('refreshToken');

    if (googleToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      loginWithGoogleCallback(googleToken, googleRefreshToken || undefined);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      authService
        .getProfile()
        .then((profile) => {
          if (profile) {
            setUser((prev) => {
              const updated = parseProfileToUser(profile, prev);
              if (isBotServiceUser(updated)) {
                clearSessionStorage();
                navigate('/login', { replace: true });
                return null;
              }
              localStorage.setItem('auth_user', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch((err) => {
          console.warn('Sesión previa inválida o expirada:', err?.message || err);
          if (err?.response?.status === 401) {
            clearSessionStorage();
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
  }, [navigate, loginWithGoogleCallback, clearSessionStorage]);

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nombre = updatedData.nombre ?? prev.nombre;
      const apellido = updatedData.apellido ?? prev.apellido;
      const shouldRebuildName =
        updatedData.nombre !== undefined || updatedData.apellido !== undefined;
      const rebuiltName = `${nombre || ''} ${apellido || ''}`.trim();
      const updated: User = {
        ...prev,
        ...updatedData,
        ...(shouldRebuildName && rebuiltName
          ? { name: updatedData.name || rebuiltName, nombre, apellido }
          : {}),
      };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      const uId = prev.id || prev.email;
      if (updatedData.avatar && uId) {
        localStorage.setItem(`user_avatar_${uId}`, updatedData.avatar);
      }
      return updated;
    });
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.changePassword(newPassword);

      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, mustChangePassword: false };
        localStorage.setItem('auth_user', JSON.stringify(updated));
        return updated;
      });

      return { success: true };
    } catch (e: any) {
      console.error('Error al cambiar contraseña:', e);
      const serverMessage = e?.response?.data?.message || e?.message || 'Error al actualizar la contraseña en el servidor.';
      return { success: false, error: serverMessage };
    }
  };

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    try {
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

        let userData: User;
        try {
          const profile = await authService.getProfile();
          userData = parseProfileToUser(profile || { user: backendUser, permissions });
        if (!userData.cedula && /^\d+$/.test(cleanIdentifier)) { userData.cedula = cleanIdentifier; }
        } catch {
          userData = parseProfileToUser({ user: backendUser, permissions });
        }

        if (isBotServiceUser(userData)) {
          clearSessionStorage();
          setUser(null);
          return { success: false, error: RESERVED_ACCOUNT_LOGIN_MESSAGE };
        }

        // Si la contraseña ingresada es la misma cédula o la API retornó mustChangePassword
        const isFirstDefaultLogin = cleanPassword === cleanIdentifier || response.mustChangePassword || response.user?.mustChangePassword;
        if (isFirstDefaultLogin) {
          userData.mustChangePassword = true;
        }

        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));

        if (userData.mustChangePassword) {
          navigate('/cambiar-password', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
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

  const unlinkGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await authService.unlinkGoogle();
      const profile = await authService.getProfile();
      if (profile) {
        const updated = parseProfileToUser(profile, user ? { ...user, googleLinked: false, googleEmail: null } : null);
        setUser(updated);
        localStorage.setItem('auth_user', JSON.stringify(updated));
      } else {
        updateUser({ googleLinked: false, googleEmail: null });
      }
      return { success: true };
    } catch (e: any) {
      const serverMessage =
        e?.response?.data?.message ||
        e?.message ||
        'No se pudo desvincular Google.';
      return { success: false, error: serverMessage };
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
    
    clearSessionStorage();
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
        changePassword,
        unlinkGoogle,
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
