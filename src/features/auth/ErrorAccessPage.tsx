import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  LogIn,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import BrandLogo from "../../components/common/BrandLogo";
import error403Light from "../../assets/error_403_light.webp";
import error403Dark from "../../assets/error_403_darck.webp";

export interface ErrorAccessPageProps {
  code?: 401 | 403;
  title?: string;
  description?: string;
  requiredPermission?: string;
}

export const ErrorAccessPage: React.FC<ErrorAccessPageProps> = ({
  code = 403,
  title,
  description,
  requiredPermission,
}) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Fondo dinámico según el tema activo
  const backgroundImage = isDarkMode ? error403Dark : error403Light;

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-500 font-sans flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-14 select-none"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* 1. DEGRADADO HORIZONTAL ASIMÉTRICO DE PROFUNDIDAD */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isDarkMode
            ? "bg-gradient-to-r from-slate-950/95 via-slate-950/70 via-45% to-transparent"
            : "bg-gradient-to-r from-slate-950/90 via-slate-950/60 via-45% to-transparent"
        }`}
      />

      {/* 2. LÍNEAS AMBIENTALES VECTORIALES CON BRILLO CIAN */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-40 dark:opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <path
          d="M-50,60 Q350,-40 850,90"
          stroke="rgba(56, 189, 248, 0.4)"
          strokeWidth="1.2"
          className="drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
        />
        <path
          d="M-40,420 Q220,540 380,850"
          stroke="rgba(56, 189, 248, 0.3)"
          strokeWidth="1.2"
          className="drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]"
        />
      </svg>

      {/* LÍNEA GUÍA VERTICAL LATERAL IZQUIERDA */}
      <div className="hidden lg:block absolute left-8 top-28 bottom-28 w-px bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent pointer-events-none z-10">
        <div className="absolute top-1/4 -left-1 w-2 h-px bg-cyan-400/40" />
        <div className="absolute top-2/4 -left-1 w-2 h-px bg-cyan-400/40" />
      </div>

      {/* 3. CABECERA: LOGO OFICIAL (SIN CONTROLES FLOTANTES) */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto">
        <div
          onClick={() => navigate("/")}
          className="cursor-pointer group transition-transform active:scale-95"
        >
          <BrandLogo />
        </div>
      </header>

      {/* 4. CONTENIDO PRINCIPAL: TIPOGRAFÍA EDITORIAL PARA 401 Y 403 */}
      <section className="relative z-20 w-full max-w-7xl mx-auto my-auto py-6 px-2 sm:px-6 md:px-8 flex flex-col items-start text-left">
        <div className="max-w-xl animate-fadeIn">
          
          {/* NÚMERO (401 / 403) CON TIPOGRAFÍA SERIF Y REFLEJO CRISTAL/METÁLICO */}
          <div className="relative select-none mb-3 sm:mb-4">
            <h1 className="font-['Playfair_Display',_Georgia,_serif] text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-bold tracking-tight leading-none bg-gradient-to-b from-white via-[#c7e9f7] via-45% to-[#5a93aa] bg-clip-text text-transparent drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] pb-1">
              {code}
            </h1>
          </div>

          {/* TITULAR DOS TONOS (BLANCO + CIAN) */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            {title ? (
              <span className="text-white">{title}</span>
            ) : code === 401 ? (
              <>
                <span className="text-white">Sesión </span>
                <span className="text-cyan-400 drop-shadow-[0_0_16px_rgba(56,189,248,0.4)]">
                  expirada
                </span>
              </>
            ) : (
              <>
                <span className="text-white">Acceso </span>
                <span className="text-cyan-400 drop-shadow-[0_0_16px_rgba(56,189,248,0.4)]">
                  denegado
                </span>
              </>
            )}
          </h2>

          {/* SUBTEXTO EXPLICATIVO ELEGANTE Y ADAPTADO */}
          <div className="space-y-1.5 max-w-sm text-slate-300/90 text-sm sm:text-base font-normal leading-relaxed mb-6">
            {description ? (
              <p>{description}</p>
            ) : code === 401 ? (
              <>
                <p>Tu sesión ha caducado o no cuentas con credenciales activas.</p>
                <p className="text-slate-400/80 text-xs sm:text-sm">
                  Por favor, ingresa con tus credenciales para continuar gestionando la clínica.
                </p>
              </>
            ) : (
              <>
                <p>No tienes permisos para acceder a esta sección.</p>
                <p className="text-slate-400/80 text-xs sm:text-sm">
                  Si crees que esto es un error, contacta al administrador del sistema.
                </p>
              </>
            )}

            {/* Permiso de seguridad discreto si está disponible (403) */}
            {requiredPermission && (
              <p className="text-[11px] text-slate-400/70 pt-1.5 flex items-center gap-1.5 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>
                  Permiso: <span className="text-cyan-300 font-semibold">{requiredPermission}</span>
                </span>
              </p>
            )}
          </div>

          {/* 5. BOTONES DE ACCIÓN (401 -> Iniciar sesión / 403 -> Volver al inicio) */}
          <div className="flex flex-wrap items-center gap-3.5 mb-8">
            {code === 401 ? (
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm shadow-[0_4px_20px_rgba(56,189,248,0.35)] active:scale-95 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
              >
                <LogIn size={16} strokeWidth={2.4} />
                <span>Iniciar sesión</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/dashboard", { replace: true })}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm shadow-[0_4px_20px_rgba(56,189,248,0.35)] active:scale-95 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Home size={16} strokeWidth={2.4} />
                <span>Volver al inicio</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900/40 border border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/60 text-slate-200 font-medium text-sm backdrop-blur-sm active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Ir atrás</span>
            </button>
          </div>

          {/* CLAIM INFERIOR DISCRETO */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-0.5 bg-cyan-400/80 rounded-full" />
            <div className="flex flex-col text-[9px] sm:text-[10px] tracking-[0.2em] font-semibold text-slate-400 uppercase leading-tight">
              <span>Tu gestión,</span>
              <span className="text-slate-300">en buenas manos.</span>
            </div>
          </div>
        </div>
      </section>

      {/* PIE DE PÁGINA */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto pt-2">
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-medium text-slate-500">
          <span>© {new Date().getFullYear()} NexusOdonto.</span>
          <span className="tracking-widest uppercase text-cyan-400/60 text-[10px]">
            NexusOdonto Cloud
          </span>
        </div>
      </footer>
    </main>
  );
};

export default ErrorAccessPage;
