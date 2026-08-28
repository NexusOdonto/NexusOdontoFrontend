import React, { useState } from 'react';
import { Key, X } from 'lucide-react';
import { LoginInput } from './components/LoginInput';
import { LoginButton } from './components/LoginButton';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from './AuthContext';
import fondoLoginLight from '../../assets/fondo-Login-ligh.webp';
import fondoLoginDark from '../../assets/fondoLogin.webp';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const { theme } = useTheme();
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    
    if (!success) {
      setError('Credenciales incorrectas. Por favor intenta nuevamente.');
    }
  };

  const backgroundImage = theme === 'dark' ? fondoLoginDark : fondoLoginLight;

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Container with interactive hover effect */}
      <div className="relative w-full max-w-md mx-4 group cursor-pointer transition-all duration-500 hover:-translate-y-1.5">
        
        {/* Capa Trasera 1 - Fondo lejano - Rotación Izquierda */}
        <div className="absolute -inset-4 rotate-[-4deg] rounded-3xl bg-teal-500/10 backdrop-blur-sm border border-teal-300/20 shadow-xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-7 group-hover:rotate-[-10deg] group-hover:scale-105 group-hover:bg-teal-500/20"></div>
        
        {/* Capa Trasera 2 - Capa media - Rotación Derecha */}
        <div className="absolute -inset-2 rotate-3deg rounded-3xl bg-slate-900/30 backdrop-blur-md border border-cyan-400/20 shadow-2xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-5 group-hover:rotate-[8deg] group-hover:scale-105 group-hover:bg-slate-900/60"></div>
        
        {/* Tarjeta Principal */}
        <div className="relative z-10 w-full p-8 md:p-10 rounded-3xl bg-slate-950/40 backdrop-blur-md border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out flex flex-col gap-6 group-hover:scale-[1.02] group-hover:-translate-y-1">
          
          {/* Title with gradient */}
          <h1 className="bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent font-extrabold text-4xl tracking-tight text-center transition-all duration-300 hover:scale-105 hover:tracking-normal cursor-default select-none">
            Bienvenido
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            {/* Email Input */}
            <LoginInput
              type="text"
              name="identifier"
              placeholder="Cédula o Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <button 
              type="button"
              className="text-xs text-slate-300 hover:text-teal-300 transition-colors text-right block w-full bg-transparent border-none"
            >
              ¿Olvidaste tu contraseña?
            </button>

            {/* Submit Button */}
            <LoginButton type="submit" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </LoginButton>
          </form>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-slate-300">
              ¿No tienes cuenta?{' '}
              <button 
                type="button"
                className="text-teal-300 hover:underline font-medium transition-colors bg-transparent border-none"
              >
                Regístrate
              </button>
            </p>
          </div>

          {/* Credentials Toggle Button */}
          <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className="mt-4 text-xs text-slate-400 hover:text-teal-300 transition-colors flex items-center justify-center gap-2 bg-transparent border-none w-full"
          >
            <Key size={14} />
            {showCredentials ? 'Ocultar credenciales de prueba' : 'Mostrar credenciales de prueba'}
          </button>

          {/* Credentials Panel */}
          {showCredentials && (
            <div className="mt-4 p-4 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-teal-300">Credenciales de Prueba</h3>
                <button
                  type="button"
                  onClick={() => setShowCredentials(false)}
                  className="text-slate-400 hover:text-white transition-colors bg-transparent border-none"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="p-2 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-300 font-medium">🔐 ADMINISTRADOR</div>
                  <div className="text-slate-400 mt-1">Email: admin@nexusodonto.com</div>
                  <div className="text-slate-400">Cédula: 123456789</div>
                  <div className="text-slate-400">Contraseña: admin123</div>
                </div>
                
                <div className="p-2 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-300 font-medium">👨‍⚕️ ODONTÓLOGO</div>
                  <div className="text-slate-400 mt-1">Email: doctor@nexusodonto.com</div>
                  <div className="text-slate-400">Cédula: 987654321</div>
                  <div className="text-slate-400">Contraseña: doctor123</div>
                </div>
                
                <div className="p-2 bg-slate-800/50 rounded-lg">
                  <div className="text-slate-300 font-medium">👩‍💼 RECEPCIONISTA</div>
                  <div className="text-slate-400 mt-1">Email: recepcion@nexusodonto.com</div>
                  <div className="text-slate-400">Cédula: 456789123</div>
                  <div className="text-slate-400">Contraseña: recepcion123</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
