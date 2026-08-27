import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginInput } from './components/LoginInput';
import { LoginButton } from './components/LoginButton';
import { useTheme } from '../../context/ThemeContext';
import fondoLoginLight from '../../assets/fondo-Login-ligh.jpg';
import fondoLoginDark from '../../assets/fondoLogin.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
    // Aquí iría la lógica de autenticación
    // Simulamos inicio de sesión exitoso y redirigimos al Dashboard
    navigate('/dashboard');
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
            {/* Email Input */}
            <LoginInput
              type="email"
              name="email"
              placeholder="Correo electrónico"
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
            <LoginButton type="submit">
              Iniciar Sesión
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
        </div>
      </div>
    </div>
  );
}
