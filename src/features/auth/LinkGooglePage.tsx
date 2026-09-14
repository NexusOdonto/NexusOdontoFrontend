import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Link2 } from 'lucide-react';
import { LoginInput } from './components/LoginInput';
import { LoginButton } from './components/LoginButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from './AuthContext';
import { authService } from '../../api/authService';
import {
  isReservedServiceAccount,
  RESERVED_ACCOUNT_LOGIN_MESSAGE,
} from './reservedServiceAccounts';
import fondoLoginLight from '../../assets/fondo-Login-ligh.webp';
import fondoLoginDark from '../../assets/fondoLogin.webp';
import logoNexus from '../../assets/nexus-odonto-logo.webp';

export default function LinkGooglePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { loginWithGoogleCallback, isLoading, isAuthenticated } = useAuth();

  const linkToken = searchParams.get('linkToken')?.trim() || '';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAlreadyAuth = Boolean(isAuthenticated && !isLoading);

  useEffect(() => {
    if (isAlreadyAuth) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAlreadyAuth, navigate]);

  useEffect(() => {
    if (!linkToken) {
      setError('Falta el token de vinculación de Google. Vuelve a iniciar sesión con Google.');
    }

    const errorParam = searchParams.get('error');
    if (errorParam) {
      const decoded = decodeURIComponent(errorParam).trim();
      const key = decoded.toLowerCase();
      const messages: Record<string, string> = {
        access_denied: 'Cancelaste el acceso con Google o no se otorgaron permisos.',
        oauth_failed: 'No se pudo completar la vinculación con Google. Inténtalo de nuevo.',
        link_expired: 'El token de vinculación expiró. Vuelve a iniciar sesión con Google.',
        invalid_link_token: 'Token de vinculación inválido. Vuelve a iniciar sesión con Google.',
      };
      setError(
        messages[key] ||
          (decoded.includes(' ')
            ? decoded
            : `Error al vincular Google: ${decoded}. Inténtalo de nuevo desde el login.`)
      );
    }
  }, [linkToken, searchParams]);

  if (isAlreadyAuth) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!linkToken) {
      setError('Token de vinculación inválido o ausente.');
      return;
    }

    const loginId = identifier.trim();
    const cleanPassword = password.trim();

    if (!loginId || !cleanPassword) {
      setError('Ingresa tu cédula (o código de empleado) y tu contraseña.');
      return;
    }

    if (isReservedServiceAccount(loginId)) {
      setError(RESERVED_ACCOUNT_LOGIN_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.linkGoogleAccount({
        linkToken,
        loginId,
        password: cleanPassword,
      });

      if (!result?.token) {
        setError('No se pudo vincular la cuenta. Inténtalo de nuevo.');
        return;
      }

      const ok = await loginWithGoogleCallback(result.token, result.refreshToken);
      if (!ok) {
        setError('Cuenta vinculada, pero no se pudo iniciar sesión. Intenta entrar de nuevo.');
        navigate('/login', { replace: true });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message as string | undefined;

      if (status === 401) {
        setError('Credenciales incorrectas o token de vinculación inválido.');
      } else if (status === 409) {
        setError(
          apiMessage ||
            'Esta cuenta de Google ya está vinculada a otro usuario, o tu usuario ya tiene Google vinculado.',
        );
      } else {
        setError(apiMessage || 'No se pudo vincular Google. Inténtalo más tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950"
      role="main"
    >
      <img
        src={theme === 'dark' ? fondoLoginDark : fondoLoginLight}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/55 dark:bg-slate-950/70" />

      <button
        type="button"
        onClick={() => navigate('/login')}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-900/90 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 shadow"
      >
        <ArrowLeft size={16} />
        Volver al login
      </button>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-700/60 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <img src={logoNexus} alt="NexusOdonto" className="h-14 w-auto object-contain" />
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 px-3 py-1 text-xs font-semibold">
              <Link2 size={14} />
              Vincular cuenta Google
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Relaciona tu cuenta existente
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tu Google aún no está vinculado. Ingresa la cédula (o código de empleado) y la
              contraseña de tu usuario NexusOdonto para asociarlos.
            </p>
          </div>

          {error && (
            <div
              className="flex items-center gap-2.5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-700 dark:text-rose-200 text-xs sm:text-sm font-semibold"
              role="alert"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <LoginInput
              type="text"
              name="identifier"
              placeholder="Cédula o código de empleado"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <LoginInput
              type="password"
              name="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
            <LoginButton type="submit" disabled={isSubmitting || !linkToken}>
              {isSubmitting ? 'Vinculando...' : 'Vincular e iniciar sesión'}
            </LoginButton>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-teal-600 dark:text-teal-300 font-medium hover:underline bg-transparent border-none cursor-pointer"
            >
              Regístrate primero
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
