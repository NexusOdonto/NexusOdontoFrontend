import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { LoginInput } from './components/LoginInput';
import { LoginButton } from './components/LoginButton';
import { GoogleAuthButton } from './components/GoogleAuthButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from './AuthContext';
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
  const { theme } = useTheme();
  const { login, isLoading, isAuthenticated } = useAuth();

  const isAlreadyAuth = Boolean(isAuthenticated && !isLoading);

  // Redirección inmediata si ya hay sesión activa
  useEffect(() => {
    if (isAlreadyAuth) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAlreadyAuth, navigate]);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Si ya tiene sesión activa validada, no renderizar el formulario
  if (isAlreadyAuth) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Por favor ingresa tu cédula o correo y tu contraseña.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await login(cleanIdentifier, cleanPassword);
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Credenciales incorrectas. Por favor intenta nuevamente.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundImage = theme === 'dark' ? fondoLoginDark : fondoLoginLight;

  return (
    <main 
      role="main"
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Botón flotante para regresar a la Landing Page */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 dark:bg-slate-950/70 dark:hover:bg-slate-900/90 dark:text-slate-200 dark:hover:text-white dark:border-white/15 backdrop-blur-xl shadow-lg text-xs font-bold transition-all hover:-translate-x-1 active:scale-95 cursor-pointer"
      >
        <ArrowLeft size={16} className="text-teal-600 dark:text-teal-400" />
        <span>Volver a la Página Principal</span>
      </button>

      {/* Container with interactive hover effect */}
      <div className="relative w-full max-w-md mx-auto group transition-all duration-500 hover:-translate-y-1.5">
        
        {/* Capa Trasera 1 - Fondo lejano */}
        <div className="absolute -inset-4 rotate-[-4deg] rounded-3xl bg-teal-500/10 backdrop-blur-sm border border-teal-400/20 shadow-xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-7 group-hover:rotate-[-10deg] group-hover:scale-105 group-hover:bg-teal-500/20" />
        
        {/* Capa Trasera 2 - Capa media */}
        <div className="absolute -inset-2 rotate-3deg rounded-3xl bg-slate-200/40 dark:bg-slate-900/30 backdrop-blur-md border border-cyan-400/20 shadow-2xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-5 group-hover:rotate-[8deg] group-hover:scale-105 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-900/60" />
        
        {/* Tarjeta Principal */}
        <div className="relative z-10 w-full p-8 md:p-10 rounded-3xl backdrop-blur-xl border transition-all duration-500 ease-out flex flex-col gap-6 group-hover:scale-[1.02] group-hover:-translate-y-1 bg-white/85 border-slate-200/80 text-slate-800 shadow-2xl dark:bg-slate-900/80 dark:border-slate-800/80 dark:text-white">
          
          {/* Logo oficial corporativo */}
          <div className="flex justify-center select-none -mb-2">
            <img
              src={logoNexus}
              alt="NexusOdonto"
              className="h-12 w-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Title with gradient */}
          <h1 className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-600 dark:from-white dark:via-slate-100 dark:to-teal-300 bg-clip-text text-transparent font-extrabold text-3xl tracking-tight text-center transition-all duration-300 hover:scale-105 cursor-default select-none">
            Bienvenido
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-rose-700 dark:text-rose-200 text-xs sm:text-sm font-semibold animate-fadeIn shadow-lg shadow-rose-950/10" role="alert">
                <AlertCircle size={18} className="text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email or Document Input */}
            <LoginInput
              type="text"
              name="identifier"
              placeholder="Cédula o Correo Electrónico"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            {/* Password Input with visibility toggle */}
            <LoginInput
              type="password"
              name="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <button 
                type="button"
                className="text-xs text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-300 transition-colors py-1 px-1 inline-block bg-transparent border-none cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <LoginButton type="submit" disabled={isSubmitting}>
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

          {/* Separador Visual */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 dark:border-slate-700/80 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">
              O continúa con
            </span>
            <div className="border-t border-slate-200 dark:border-slate-700/80 w-full" />
          </div>

          {/* Botón de Google OAuth */}
          <GoogleAuthButton 
            text="Continuar con Google" 
            onError={(msg) => setError(msg)} 
          />

          {/* Sign up link */}
          <div className="text-center pt-1">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              ¿No tienes cuenta?{' '}
              <button 
                type="button"
                onClick={() => navigate('/register')}
                className="text-teal-600 hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200 hover:underline font-medium transition-colors py-1 px-1 bg-transparent border-none cursor-pointer inline-block"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
