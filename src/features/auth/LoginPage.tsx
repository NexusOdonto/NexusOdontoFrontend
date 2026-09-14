import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { LoginInput } from './components/LoginInput';
import { LoginButton } from './components/LoginButton';
import { GoogleAuthButton } from './components/GoogleAuthButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from './AuthContext';
import {
  isReservedServiceAccount,
  RESERVED_ACCOUNT_LOGIN_MESSAGE,
} from './reservedServiceAccounts';
import fondoLoginLight from '../../assets/fondo-Login-ligh.webp';
import fondoLoginDark from '../../assets/fondoLogin.webp';
import logoNexus from '../../assets/nexus-odonto-logo.webp';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const { theme } = useTheme();
  const { login, isLoading, isAuthenticated } = useAuth();

  const isAlreadyAuth = Boolean(isAuthenticated && !isLoading);

  useEffect(() => {
    if (isAlreadyAuth) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAlreadyAuth, navigate]);

  useEffect(() => {
    const errorParam = searchParams.get('error');

    if (!errorParam) return;

    const decoded = decodeURIComponent(errorParam).trim();
    const key = decoded.toLowerCase();

    const oauthMessages: Record<string, string> = {
      no_token_provided:
        'Google no devolvió una sesión válida. Intenta iniciar sesión con Google de nuevo.',
      session_init_failed:
        'Se recibió la respuesta de Google, pero no se pudo iniciar la sesión en NexusOdonto. Inténtalo de nuevo.',
      auth_callback_failed:
        'Falló el retorno desde Google. Cierra la ventana emergente si quedó abierta e inténtalo otra vez.',
      access_denied:
        'Cancelaste el acceso con Google o no se otorgaron permisos.',
      oauth_failed:
        'No se pudo completar el inicio de sesión con Google. Inténtalo más tarde.',
      link_required:
        'Tu cuenta de Google aún no está vinculada. Usa “Continuar con Google” y vincula tu cédula cuando se solicite.',
    };

    setError(
      oauthMessages[key] ||
        (decoded.includes(' ')
          ? decoded
          : `Error de Google: ${decoded}. Intenta de nuevo o inicia sesión con tu cédula.`)
    );
  }, [searchParams]);

  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflowX = document.documentElement.style.overflowX;
    const originalBodyOverflowX = document.body.style.overflowX;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflowX = originalHtmlOverflowX;
      document.body.style.overflowX = originalBodyOverflowX;
    };
  }, []);

  if (isAlreadyAuth) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Por favor ingresa tu cédula (o código de empleado) y tu contraseña.');
      return;
    }

    if (isReservedServiceAccount(cleanIdentifier)) {
      setError(RESERVED_ACCOUNT_LOGIN_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(cleanIdentifier, cleanPassword);

      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(
          result.error ||
            'Credenciales incorrectas. Por favor intenta nuevamente.'
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Error inesperado al conectar con el servidor.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundImage =
    theme === 'dark' ? fondoLoginDark : fondoLoginLight;

  return (
    <main
      role="main"
      className="relative w-full h-screen max-h-screen min-h-0 flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden p-4 max-md:h-dvh max-md:max-h-dvh max-md:min-h-0"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 dark:bg-slate-950/70 dark:hover:bg-slate-900/90 dark:text-slate-200 dark:hover:text-white dark:border-white/15 backdrop-blur-xl shadow-lg text-xs font-bold transition-all hover:-translate-x-1 active:scale-95 cursor-pointer"
      >
        <ArrowLeft size={16} className="text-teal-600 dark:text-teal-400" />
        <span>Volver a la Página Principal</span>
      </button>

      <div className="relative w-full max-w-md mx-auto group transition-all duration-500 hover:-translate-y-1.5">
        <div className="absolute -inset-4 rotate-[-4deg] rounded-3xl bg-teal-500/10 backdrop-blur-sm border border-teal-400/20 shadow-xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-7 group-hover:rotate-[-10deg] group-hover:scale-105 group-hover:bg-teal-500/20" />

        <div className="absolute -inset-2 rotate-3deg rounded-3xl bg-slate-200/40 dark:bg-slate-900/30 backdrop-blur-md border border-cyan-400/20 shadow-2xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-5 group-hover:rotate-[8deg] group-hover:scale-105 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-900/60" />

        <div className="relative z-10 w-full p-8 md:p-10 rounded-3xl backdrop-blur-xl border transition-all duration-500 ease-out flex flex-col gap-6 group-hover:scale-[1.02] group-hover:-translate-y-1 bg-white/85 border-slate-200/80 text-slate-800 shadow-2xl dark:bg-slate-900/80 dark:border-slate-800/80 dark:text-white">
          <div className="flex justify-center select-none -mb-2">
            <img
              src={logoNexus}
              alt="NexusOdonto"
              className="h-12 w-auto object-contain drop-shadow-md"
            />
          </div>

          <h1 className="font-prata bg-gradient-to-r from-slate-900 via-slate-800 to-teal-600 dark:from-white dark:via-slate-100 dark:to-teal-300 bg-clip-text text-transparent font-bold text-3xl sm:text-4xl tracking-tight text-center transition-all duration-300 hover:scale-105 cursor-default select-none">
            Bienvenido
          </h1>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4 font-instrument"
          >
            {error && (
              <div
                className="flex items-center gap-2.5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-700 dark:text-rose-200 text-xs sm:text-sm font-semibold animate-fadeIn shadow-lg shadow-rose-950/10"
                role="alert"
              >
                <AlertCircle
                  size={18}
                  className="text-rose-500 dark:text-rose-400 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

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
              onTogglePassword={() =>
                setShowPassword(!showPassword)
              }
            />

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-xs text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 transition-colors py-1 px-1 inline-block bg-transparent border-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <LoginButton
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Iniciando sesión...</span>
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </LoginButton>
          </form>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 dark:border-slate-700/80 w-full" />

            <span className="font-oswald bg-white dark:bg-slate-900 px-3 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">
              O continúa con
            </span>

            <div className="border-t border-slate-200 dark:border-slate-700/80 w-full" />
          </div>

          <GoogleAuthButton
            text="Continuar con Google"
            onError={(msg) => setError(msg)}
          />

          <div className="text-center pt-1 font-instrument">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-teal-600 hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200 hover:underline font-semibold transition-colors py-1 px-1 bg-transparent border-none cursor-pointer inline-block"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>

      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl animate-scaleIn space-y-5 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-prata font-bold text-base sm:text-lg">
                Recuperar Acceso a tu Cuenta
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowForgotPasswordModal(false)
                }
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-instrument">
              <p className="leading-relaxed">
                Por políticas de seguridad clínica y protección de
                datos médicos, el restablecimiento de contraseñas se
                gestiona a través del administrador del sistema o
                recepción.
              </p>

              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 space-y-2">
                <p className="font-semibold text-teal-800 dark:text-teal-200">
                  Canales de Atención:
                </p>

                <p className="text-xs">
                  📧 Correo:{' '}
                  <span className="font-spacemono font-bold text-teal-700 dark:text-teal-300">
                    soporte@nexusodonto.com
                  </span>
                </p>

                <p className="text-xs">
                  📞 Teléfono:{' '}
                  <span className="font-spacemono font-semibold text-teal-700 dark:text-teal-300">
                    +57 (601) 745-9000
                  </span>
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Horario: Lunes a Sábado de 08:00 AM a 06:00 PM.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowForgotPasswordModal(false)
                }
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}