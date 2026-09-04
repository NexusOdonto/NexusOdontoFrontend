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
  CircleCheck,
  ClipboardCheck,
  HeartPulse,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import logoNexus from "../../assets/nexus-odonto-logo.webp";
import fondoLight from "../../assets/landingfondo-white.webp";
import fondoDark from "../../assets/landingfondo-black.webp";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const backgroundImage = isDark ? fondoDark : fondoLight;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-500 selection:bg-teal-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      {/* FONDO */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-25 transition-opacity duration-700 dark:opacity-15"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      <div className="fixed -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none" />
      <div className="fixed -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 border border-teal-500/40 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 overflow-hidden">
              <img
                src={logoNexus}
                alt="NexusOdonto Logo"
                className="h-10 w-10 object-contain drop-shadow"
              />
            </div>

            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                NexusOdonto
              </span>

              <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest -mt-1">
                Centro Odontológico Especializado
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#servicios"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Tratamientos
            </a>

            <a
              href="#compromiso"
              className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              Nuestra Clínica
            </a>

            <a
              href="#profesionales"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Especialistas
            </a>

            <a
              href="#contacto"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Ubicación & Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-16 items-center rounded-full p-1 transition-all duration-300 cursor-pointer overflow-hidden border shadow-inner ${
                theme === "dark"
                  ? "bg-slate-900 border-rose-900/60 shadow-rose-950/30"
                  : "bg-emerald-100/90 border-teal-300 shadow-teal-500/15"
              }`}
              title={
                theme === "dark"
                  ? "Cambiar a Modo Claro"
                  : "Cambiar a Modo Oscuro"
              }
              aria-label="Cambiar tema"
            >
              <div
                className={`absolute left-2 z-10 flex items-center justify-center transition-all duration-300 ${
                  theme === "dark"
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-75 pointer-events-none"
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
                  theme === "dark"
                    ? "opacity-0 scale-75 pointer-events-none"
                    : "opacity-100 scale-100"
                }`}
              >
                <svg
                  className="w-4 h-4 text-teal-600 drop-shadow-sm"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
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

      {/* HERO */}
      <section className="relative z-10 h-[calc(100vh-80px)] min-h-[620px] overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto h-full">
          {/* Detalles decorativos */}
          <div className="absolute top-[12%] left-[3%] hidden lg:block h-16 w-16 rounded-full border border-teal-400/15" />

          <div className="absolute top-[20%] right-[5%] hidden lg:block h-3 w-3 rounded-full bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.6)]" />

          <div className="grid h-full grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            {/* CONTENIDO PRINCIPAL */}
            <div className="relative z-20 max-w-3xl py-10 lg:py-0">
              <div className="flex items-center gap-3 mb-5 lg:mb-6">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-teal-400" />

                <span className="text-[9px] sm:text-[10px] font-black tracking-[0.35em] uppercase text-teal-600 dark:text-teal-400">
                  Odontología integral y especializada
                </span>
              </div>

              <h1 className="max-w-3xl text-[2.9rem] sm:text-6xl lg:text-[4.7rem] xl:text-[5.2rem] font-black tracking-[-0.045em] leading-[0.94] text-slate-900 dark:text-white">
                Una atención dental
                <br />
                pensada para cuidar
                <span className="block mt-3 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  mucho más que tu sonrisa
                </span>
              </h1>

              <p className="mt-5 lg:mt-6 max-w-2xl text-sm sm:text-base lg:text-[15px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                Gestiona tus citas, consulta tu información clínica y mantén el
                seguimiento de tu salud bucal desde un solo lugar, de forma
                clara, segura y sencilla.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-7 lg:mt-8">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 px-7 py-3.5 text-sm font-black text-white dark:text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/30 active:scale-95 cursor-pointer"
                >
                  Acceder al Portal Clínico
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-300/70 bg-white/50 px-7 py-3.5 text-sm font-bold text-slate-700 backdrop-blur-md transition-all hover:bg-white dark:border-white/15 dark:bg-slate-900/30 dark:text-white dark:hover:bg-white/10 cursor-pointer"
                >
                  <UserCheck size={17} className="text-cyan-500" />
                  Crear Cuenta de Paciente
                </button>
              </div>

              {/* BENEFICIOS COMPACTOS */}
              <div className="mt-8 lg:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-3xl">
                <div className="relative pl-4 border-l border-teal-400/60">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-teal-500" />

                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Atención organizada
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Gestiona tus citas desde un mismo portal.
                  </p>
                </div>

                <div className="relative pl-4 border-l border-cyan-400/60">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={14} className="text-cyan-500" />

                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Información clínica
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Consulta tus registros y seguimiento fácilmente.
                  </p>
                </div>

                <div className="relative pl-4 border-l border-blue-400/60">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={14} className="text-blue-500" />

                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Atención especializada
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Profesionales comprometidos con tu bienestar.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <CircleCheck size={14} className="text-teal-500" />

                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Información protegida
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CircleCheck size={14} className="text-cyan-500" />

                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Gestión digital
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CircleCheck size={14} className="text-blue-500" />

                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Atención personalizada
                  </span>
                </div>
              </div>
            </div>

            {/* LADO DERECHO - SOLO DETALLES VISUALES */}
            <div className="relative hidden lg:flex h-full items-center justify-end pointer-events-none">
              <div className="relative h-[430px] w-full max-w-[460px]">
                <div className="absolute right-8 top-8 h-44 w-44 rounded-full border border-teal-400/20" />

                <div className="absolute right-20 top-24 h-28 w-28 rounded-full border border-cyan-400/15" />

                <div className="absolute left-8 top-1/2 -translate-y-1/2 h-24 w-px bg-gradient-to-b from-transparent via-teal-400/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      >
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
            Nuestros servicios
          </p>

          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Tratamientos diseñados para tu sonrisa
          </h2>

          <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Procedimientos clínicos avanzados y atención especializada para
            mantener tu salud bucal en las mejores condiciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-14">
          <div className="group flex gap-5">
            <div className="shrink-0 h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 transition-transform group-hover:scale-110">
              <Activity size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Valoración & Limpieza Profunda
              </h3>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Eliminación de placa bacteriana y sarro con ultrasonido,
                pulido coronal y diagnóstico preventivo integral.
              </p>

              <span className="inline-block mt-4 text-xs font-bold text-teal-600 dark:text-teal-400">
                Sesión clínica: 30 - 45 min
              </span>
            </div>
          </div>

          <div className="group flex gap-5">
            <div className="shrink-0 h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 transition-transform group-hover:scale-110">
              <Smile size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Ortodoncia & Alineación
              </h3>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Corrección de mordida y alineación estética mediante brackets
                metálicos, estéticos o alineadores transparentes.
              </p>

              <span className="inline-block mt-4 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                Seguimiento y control mensual
              </span>
            </div>
          </div>

          <div className="group flex gap-5">
            <div className="shrink-0 h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110">
              <Sparkles size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Estética & Blanqueamiento
              </h3>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Aclaramiento dental seguro y restauraciones estéticas que
                devuelven el brillo natural de tu sonrisa.
              </p>

              <span className="inline-block mt-4 text-xs font-bold text-blue-600 dark:text-blue-400">
                Resultados inmediatos
              </span>
            </div>
          </div>

          <div className="group flex gap-5">
            <div className="shrink-0 h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110">
              <Stethoscope size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Endodoncia & Cirugía Oral
              </h3>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tratamiento especializado para preservar tus piezas dentales y
                resolver procedimientos quirúrgicos complejos.
              </p>

              <span className="inline-block mt-4 text-xs font-bold text-purple-600 dark:text-purple-400">
                Especialistas certificados
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPROMISO */}
      <section
        id="compromiso"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-600 dark:text-teal-400">
              NexusOdonto
            </p>

            <h2 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Atención odontológica personalizada y sin dolor
            </h2>

            <p className="mt-7 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              En NexusOdonto combinamos la calidez humana con herramientas
              digitales para que tengas siempre a la mano tu evolución médica,
              diagnósticos claros y citas organizadas.
            </p>

            <div className="mt-9 space-y-5">
              <div className="flex items-center gap-4">
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-teal-500"
                />

                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Odontograma digital anatómico por pieza y superficie dental
                </span>
              </div>

              <div className="flex items-center gap-4">
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-teal-500"
                />

                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Historia clínica electrónica conforme a normativas de salud
                </span>
              </div>

              <div className="flex items-center gap-4">
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-teal-500"
                />

                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Recordatorios y confirmaciones directas de citas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-10 inline-flex items-center gap-3 text-sm font-black text-teal-600 dark:text-teal-400 hover:gap-5 transition-all cursor-pointer"
            >
              Ingresar a mi cuenta
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-blue-500/15 blur-3xl" />

            <div className="relative py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <ShieldCheck size={26} className="text-white" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-600 dark:text-teal-400">
                    Tecnología que cuida
                  </p>

                  <h3 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Tu tranquilidad primero
                  </h3>
                </div>
              </div>

              <div className="space-y-7">
                <div className="flex items-end justify-between gap-8">
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Horarios de Atención
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      Lun a Sáb
                    </p>
                  </div>

                  <p className="text-sm font-black text-teal-600 dark:text-teal-400">
                    08:00 - 17:00
                  </p>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10" />

                <div className="flex items-end justify-between gap-8">
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Especialidades
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      Atención especializada
                    </p>
                  </div>

                  <p className="max-w-[150px] text-right text-sm font-black text-cyan-600 dark:text-cyan-400">
                    Ortodoncia · Cirugía · Endodoncia
                  </p>
                </div>

                <div className="h-px bg-slate-200 dark:bg-white/10" />

                <div className="flex items-end justify-between gap-8">
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Canal de Atención
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">
                      Siempre conectado
                    </p>
                  </div>

                  <p className="text-right text-sm font-black text-blue-600 dark:text-blue-400">
                    Portal Web
                    <br />
                    y Recepción
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALISTAS */}
      <section
        id="profesionales"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
            Cuerpo médico
          </p>

          <h2 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Nuestros odontólogos especialistas
          </h2>

          <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
            Profesionales altamente calificados y comprometidos con tu
            bienestar.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-10">
          <article className="group">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-teal-500">LG</span>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Dra. Laura Gómez
                </h3>

                <p className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  Ortodoncia y Estética Dental
                </p>
              </div>
            </div>

            <p className="mt-7 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Especialista en diseño de sonrisa, alineación estética y
              rehabilitación mínimamente invasiva.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-px w-8 bg-teal-500/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            </div>
          </article>

          <article className="group">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-cyan-500">RM</span>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Dr. Roberto Martínez
                </h3>

                <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  Cirugía Oral e Implantología
                </p>
              </div>
            </div>

            <p className="mt-7 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Cirujano oral con amplia experiencia en extracciones complejas,
              cordales y regeneración ósea.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-px w-8 bg-cyan-500/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            </div>
          </article>

          <article className="group">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-blue-500">AS</span>

              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Dra. Ana Sofía Silva
                </h3>

                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  Endodoncia y Periodoncia
                </p>
              </div>
            </div>

            <p className="mt-7 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Especialista en preservación de piezas dentales, tratamiento de
              conductos y cuidado gingival.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-px w-8 bg-blue-500/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            </div>
          </article>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto border-y border-slate-200/70 dark:border-white/10 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Award size={18} />

                <span className="text-xs font-black uppercase tracking-[0.25em]">
                  Atención odontológica especializada
                </span>
              </div>

              <h2 className="mt-6 max-w-3xl text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Tu salud bucal merece una atención de calidad
              </h2>

              <p className="mt-5 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Accede a tu portal seguro para gestionar citas, consultar
                información clínica y mantener el seguimiento de tu atención.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 px-8 py-4 text-sm font-black text-white dark:text-slate-950 shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Iniciar Sesión
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contacto"
        className="relative z-10 border-t border-slate-200/70 bg-white/50 px-4 py-14 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoNexus}
                alt="Logo NexusOdonto"
                className="h-10 w-10 object-contain"
              />

              <div>
                <span className="font-black text-lg text-slate-900 dark:text-white">
                  NexusOdonto
                </span>

                <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Salud oral especializada
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Centro de atención odontológica integral y gestión clínica
              especializada.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500" />

              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                Atención clínica disponible
              </span>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <Clock size={16} className="text-teal-500" />
              Horario de Atención
            </p>

            <div className="mt-5 space-y-3 text-slate-500 dark:text-slate-400">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Lunes a Viernes
                </p>
                <p>08:00 AM - 05:00 PM</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Sábados
                </p>
                <p>08:00 AM - 12:00 PM</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Domingos y Festivos
                </p>
                <p>Cerrado</p>
              </div>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
              <MapPin size={16} className="text-cyan-500" />
              Ubicación & Contacto
            </p>

            <div className="mt-5 space-y-3 text-slate-500 dark:text-slate-400">
              <p>
                Calle 100 #15-20
                <br />
                Centro Médico Odontológico
              </p>

              <p className="flex items-center gap-2">
                <Phone size={15} className="text-teal-500" />
                +57 (601) 745-9000
              </p>

              <p className="flex items-center gap-2">
                <Mail size={15} className="text-cyan-500" />
                contacto@nexusodonto.com
              </p>
            </div>
          </div>

          <div>
            <p className="font-black text-slate-900 dark:text-white">
              Acceso al Sistema
            </p>

            <p className="mt-5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Ingresa a tu portal para gestionar tu información y solicitudes
              de atención.
            </p>

            <div className="mt-5 flex flex-col items-start gap-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 font-bold text-teal-600 dark:text-teal-400 hover:translate-x-1 transition-transform cursor-pointer"
              >
                Ingreso al Portal
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Registrar Paciente
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-7 border-t border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} NexusOdonto. Todos los derechos
            reservados.
          </p>

          <p className="font-mono">
            Sistema de Salud Oral Especializado
          </p>
        </div>
      </footer>
    </div>
  );
}