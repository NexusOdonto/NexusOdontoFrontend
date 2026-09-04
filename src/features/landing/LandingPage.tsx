import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Stethoscope,
  Smile,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Award,
  Calendar,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import BrandLogo from "../../components/common/BrandLogo";
import fondoLight from "../../assets/fondo-ligh.webp";
import fondoDark from "../../assets/fondo-darck.webp";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const backgroundImage = isDark ? fondoDark : fondoLight;

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 selection:bg-teal-500 selection:text-white flex flex-col justify-between overflow-x-hidden">
      
      {/* FONDO REAL CON PATRÓN SUTIL Y GRADIENTES ANIMADOS */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-25 dark:opacity-15 transition-opacity duration-700"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Luces difusas de fondo */}
      <div className="fixed -top-32 left-1/4 w-[500px] h-[500px] bg-teal-500/15 dark:bg-teal-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
      <div className="fixed top-1/3 -right-20 w-[450px] h-[450px] bg-cyan-500/15 dark:bg-cyan-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed -bottom-20 left-1/3 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-[130px] pointer-events-none" />

      {/* 1. NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo con microinteracción */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer group select-none transition-transform active:scale-95"
          >
            <BrandLogo />
          </div>

          {/* Enlaces de Navegación */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#servicios" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Tratamientos
            </a>
            <a href="#compromiso" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
              Nuestra Clínica
            </a>
            <a href="#profesionales" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Especialistas
            </a>
            <a href="#contacto" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Ubicación & Contacto
            </a>
          </nav>

          {/* Acciones: Toggle Tema y Botón Iniciar Sesión */}
          <div className="flex items-center gap-3">
            {/* Switch de Tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-16 items-center rounded-full p-1 transition-all duration-300 cursor-pointer overflow-hidden border shadow-inner ${
                theme === "dark"
                  ? "bg-slate-900 border-rose-900/60 shadow-rose-950/30"
                  : "bg-emerald-100/90 border-teal-300 shadow-teal-500/15"
              }`}
              title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              aria-label="Cambiar tema"
            >
              <div
                className={`absolute left-2 z-10 flex items-center justify-center transition-all duration-300 ${
                  theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                }`}
              >
                <svg className="w-4 h-4 drop-shadow" viewBox="0 0 24 24">
                  <path
                    d="M7 2C4.8 2 3 3.8 3 6c0 3.2 1.2 7.5 2.5 11.5.7 2.1 2.2 2.5 3 1 .6-1.2 1.2-3 1.5-4.2.3 1.2.9 3 1.5 4.2.8 1.5 2.3 1.1 3-1C15.8 13.5 17 9.2 17 6c0-2.2-1.8-4-4-4-1.2 0-2.2.5-3 1.3C9.2 2.5 8.2 2 7 2z"
                    fill="#cbd5e1"
                    transform="translate(2, 1)"
                  />
                  <circle cx="10" cy="7" r="2.2" fill="#ef4444" />
                </svg>
              </div>

              <div
                className={`absolute right-2 z-10 flex items-center justify-center transition-all duration-300 ${
                  theme === "dark" ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"
                }`}
              >
                <svg className="w-4 h-4 text-teal-600 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M7 2C4.8 2 3 3.8 3 6c0 3.2 1.2 7.5 2.5 11.5.7 2.1 2.2 2.5 3 1 .6-1.2 1.2-3 1.5-4.2.3 1.2.9 3 1.5 4.2.8 1.5 2.3 1.1 3-1C15.8 13.5 17 9.2 17 6c0-2.2-1.8-4-4-4-1.2 0-2.2.5-3 1.3C9.2 2.5 8.2 2 7 2z"
                    transform="translate(2, 1)"
                  />
                  <circle cx="15.5" cy="5" r="1.1" fill="#06b6d4" />
                </svg>
              </div>

              <span
                className={`relative z-20 inline-block h-6 w-6 transform rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                  theme === "dark"
                    ? "translate-x-8 bg-slate-800 border border-rose-900/80 shadow-rose-950"
                    : "translate-x-0 bg-white border border-teal-200 shadow-teal-500/20"
                }`}
              />
            </button>

            {/* BOTÓN PRINCIPAL DE INICIAR SESIÓN */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION CON ESTILO HUMANO, CÁLIDO Y ANIMADO */}
      <section className="relative z-10 py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          {/* Título Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] drop-shadow-sm">
            Tu sonrisa en manos de{" "}
            <span className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              especialistas dedicados
            </span>
          </h1>

          {/* Subtítulo Humano y Clínico */}
          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
            Diagnósticos precisos, odontología sin dolor y tratamientos diseñados para cuidar tu salud bucal. Consulta tu historial médico digital y programa tu atención con total tranquilidad.
          </p>

          {/* BOTONES DE ACCIÓN RÁPIDA (CTA) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-9 py-4 text-base font-extrabold text-white dark:text-slate-950 shadow-xl hover:shadow-cyan-500/25 dark:shadow-[0_0_35px_rgba(34,211,238,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
            >
              <span>Acceder al Portal Clínico</span>
              <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-white/20 bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-white/10 px-8 py-4 text-base font-bold text-slate-800 dark:text-slate-100 shadow-md backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <UserCheck size={18} className="text-cyan-600 dark:text-cyan-400" />
              <span>Crear Cuenta de Paciente</span>
            </button>
          </div>

          {/* 4 Métricas de Confianza Clínica */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 text-left">
            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/70 backdrop-blur-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 w-fit mb-2">
                <Smile size={20} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">+1,200</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Pacientes Atendidos</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/70 backdrop-blur-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 w-fit mb-2">
                <Activity size={20} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">100%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Historial Digital Seguro</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/70 backdrop-blur-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit mb-2">
                <Calendar size={20} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">En Línea</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Agenda en Tiempo Real</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/70 backdrop-blur-xl shadow-sm hover:-translate-y-1 transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 w-fit mb-2">
                <ShieldCheck size={20} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">Certificado</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Especialistas Acreditados</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRATAMIENTOS Y SERVICIOS */}
      <section id="servicios" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Nuestros Servicios
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Tratamientos Odontológicos Integrales
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Procedimientos clínicos avanzados con equipos de última generación para el bienestar de tu salud bucal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group p-6 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:border-teal-500/50 hover:-translate-y-2 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Activity size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Valoración & Limpieza Profunda
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Eliminación de placa bacteriana y sarro con ultrasonido, pulido coronal y diagnóstico preventivo integral.
            </p>
            <div className="pt-2 text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <span>Sesión clínica: 30 - 45 min</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group p-6 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:border-cyan-500/50 hover:-translate-y-2 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Smile size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Ortodoncia & Alineación
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Corrección de mordida y alineación estética mediante brackets metálicos, estéticos o alineadores transparentes.
            </p>
            <div className="pt-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
              <span>Seguimiento y control mensual</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group p-6 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:border-blue-500/50 hover:-translate-y-2 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Sparkles size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Estética & Blanqueamiento
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Aclaramiento dental seguro con luz fría y restauraciones en resina de alta estética que devuelven el brillo natural.
            </p>
            <div className="pt-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>Resultados inmediatos</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="group p-6 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:border-purple-500/50 hover:-translate-y-2 space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Stethoscope size={24} />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Endodoncia & Cirugía Oral
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Tratamiento de conductos radiculares para salvar piezas dentales y extracción especializada de cordales sin molestias.
            </p>
            <div className="pt-2 text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>Especialistas certificados</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE COMPROMISO CLÍNICO Y ATENCIÓN HUMANA */}
      <section id="compromiso" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 p-8 sm:p-12 text-white border border-teal-500/30 shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Atención Odontológica Personalizada y Sin Dolor
              </h3>

              <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed font-medium">
                En NexusOdonto combinamos la calidez humana con herramientas digitales de registro clínico para que tengas siempre a la mano tu evolución médica, diagnósticos claros y citas organizadas.
              </p>

              <div className="space-y-3.5 text-xs sm:text-sm font-semibold text-teal-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-400 flex-shrink-0" />
                  <span>Odontograma digital anatómico por pieza y superficie dental</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-400 flex-shrink-0" />
                  <span>Historia clínica electrónica conforme a normativas de salud</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-teal-400 flex-shrink-0" />
                  <span>Recordatorios y confirmaciones directas de citas</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-white text-slate-950 hover:bg-teal-100 px-6 py-3.5 font-extrabold text-sm shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Ingresar a mi Cuenta</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Tarjeta de Resumen Clínico */}
            <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center font-bold text-sm">
                    NO
                  </div>
                  <div>
                    <p className="text-xs font-bold">Portal NexusOdonto</p>
                    <p className="text-[10px] text-teal-300">Sillones Clínicos Habilitados</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200">
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <span>Horarios de Atención:</span>
                  <strong className="text-teal-300">Lun a Sáb (08:00 - 17:00)</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
                  <span>Especialistas Disponibles:</span>
                  <strong className="text-teal-300">Ortodoncia, Cirugía, Endodoncia</strong>
                </div>
                <div className="p-3 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-100 flex items-center justify-between">
                  <span>Canal de Atención:</span>
                  <strong className="text-white">Portal Web & Recepción</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ESPECIALISTAS */}
      <section id="profesionales" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Cuerpo Médico
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Nuestros Odontólogos Especialistas
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Profesionales altamente calificados y comprometidos con tu bienestar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Doctor 1 */}
          <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-teal-500/20 text-teal-700 dark:text-teal-300 flex items-center justify-center font-extrabold text-lg border border-teal-500/30">
                LG
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Dra. Laura Gómez</h4>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Ortodoncia y Estética Dental</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Reg. TP-OD-1098765</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Especialista en diseño de sonrisa, alineación estética y rehabilitación mínimamente invasiva.
            </p>
          </div>

          {/* Doctor 2 */}
          <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-extrabold text-lg border border-cyan-500/30">
                RM
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Dr. Roberto Martínez</h4>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Cirugía Oral e Implantología</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Reg. TP-OD-1098766</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Cirujano oral con amplia experiencia en extracciones complejas, cordales y regeneración ósea.
            </p>
          </div>

          {/* Doctor 3 */}
          <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center justify-center font-extrabold text-lg border border-blue-500/30">
                AS
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Dra. Ana Sofía Silva</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Endodoncia y Periodoncia</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Reg. TP-OD-1098767</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Especialista en preservación de piezas dentales, tratamiento de conductos y cuidado gingival.
            </p>
          </div>
        </div>
      </section>

      {/* 6. BANNER FINAL DE ACCESO */}
      <section className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div className="rounded-3xl bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-blue-500/15 border border-teal-500/30 p-8 sm:p-12 space-y-6 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-sm">
            <Award size={20} />
            <span>Excelencia y Calidez Odontológica</span>
          </div>

          <h3 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Comienza a cuidar tu sonrisa hoy mismo
          </h3>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium">
            Accede a tu portal seguro para solicitar citas, consultar diagnósticos y mantener tu salud bucal en óptimas condiciones.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-8 py-4 text-base font-extrabold text-white dark:text-slate-950 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Iniciar Sesión en NexusOdonto</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="contacto" className="relative z-10 bg-white/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-white/10 pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-12 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200/80 dark:border-white/10 text-xs">
          
          <div className="space-y-3 md:col-span-1">
            <BrandLogo imageClassName="h-7 w-auto object-contain" textClassName="text-base" />
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Centro de atención odontológica integral y gestión clínica especializada.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock size={14} className="text-teal-500" />
              <span>Horario de Atención</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400">Lunes a Viernes: 08:00 AM - 05:00 PM</p>
            <p className="text-slate-500 dark:text-slate-400">Sábados: 08:00 AM - 12:00 PM</p>
            <p className="text-slate-500 dark:text-slate-400">Domingos y Festivos: Cerrado</p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPin size={14} className="text-cyan-500" />
              <span>Ubicación</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400">Calle 100 #15-20, Centro Médico Odontológico</p>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
              <Phone size={13} className="text-teal-500" /> +57 (601) 745-9000
            </p>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail size={13} className="text-cyan-500" /> contacto@nexusodonto.com
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900 dark:text-white">Acceso al Sistema</p>
            <p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                Ingreso al Portal →
              </button>
            </p>
            <p>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Registrar Paciente
              </button>
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} NexusOdonto. Todos los derechos reservados.</p>
          <p className="font-mono text-[11px]">Sistema de Salud Oral Especializado</p>
        </div>
      </footer>
    </div>
  );
}
