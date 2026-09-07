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
import cuadroLandingDark from "../../assets/cuadro-landing-dark.webp";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const backgroundImage = isDark ? fondoDark : fondoLight;

  const heroBackgroundStyle = {
    backgroundImage: isDark
      ? `linear-gradient(
          90deg,
          rgba(1, 25, 46, 0.78) 0%,
          rgba(1, 25, 46, 0.62) 45%,
          rgba(1, 25, 46, 0.35) 100%
        ), url(${cuadroLandingDark})`
      : `linear-gradient(
          90deg,
          rgba(249, 246, 235, 0.32) 0%,
          rgba(249, 246, 235, 0.18) 45%,
          rgba(249, 246, 235, 0.06) 100%
        ), url(${cuadroLandingDark})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F9F6EB] text-[#0A0A0A] transition-colors duration-500 selection:bg-[#437C76] selection:text-white dark:bg-[#01192E] dark:text-slate-100">
      {/* FONDO GENERAL */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-30 transition-opacity duration-700 dark:opacity-35"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-[#D4DACD]/70 bg-[#F9F6EB]/85 shadow-sm backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-[#01192E]/85">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group flex cursor-pointer select-none items-center gap-3"
          >
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#7DADAA]/40 bg-gradient-to-br from-[#B4CEC5]/30 via-[#9FC1B8]/20 to-[#7DADAA]/20 shadow-md transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
              <img
                src={logoNexus}
                alt="NexusOdonto Logo"
                className="h-10 w-10 object-contain drop-shadow"
              />
            </div>

            <div>
              <span className="bg-gradient-to-r from-[#1F3F3B] via-[#2F5E58] to-[#437C76] bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl dark:from-[#A7BFB7] dark:via-[#65958E] dark:to-[#437C76]">
                NexusOdonto
              </span>

              <span className="-mt-1 block text-[10px] font-bold uppercase tracking-widest text-[#0A0A0A] dark:text-[#A7BFB7]">
                Centro Odontológico Especializado
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#0A0A0A] md:flex dark:text-[#D4DACD]">
            <a
              href="#servicios"
              className="transition-colors hover:text-[#1F3F3B] dark:hover:text-[#A7BFB7]"
            >
              Tratamientos
            </a>

            <a
              href="#compromiso"
              className="transition-colors hover:text-[#1F3F3B] dark:hover:text-[#A7BFB7]"
            >
              Nuestra Clínica
            </a>

            <a
              href="#profesionales"
              className="transition-colors hover:text-[#1F3F3B] dark:hover:text-[#A7BFB7]"
            >
              Especialistas
            </a>

            <a
              href="#contacto"
              className="transition-colors hover:text-[#1F3F3B] dark:hover:text-[#A7BFB7]"
            >
              Ubicación & Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-16 cursor-pointer items-center overflow-hidden rounded-full border p-1 shadow-inner transition-all duration-300 ${
                theme === "dark"
                  ? "border-[#437C76]/60 bg-[#022337] shadow-[#01192E]/30"
                  : "border-[#9FC1B8] bg-[#E5E9E2] shadow-[#7DADAA]/15"
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
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-75 opacity-0"
                }`}
              >
                <svg className="h-4 w-4 drop-shadow" viewBox="0 0 24 24">
                  <path
                    d="M7 2C4.8 2 3 3.8 3 6c0 3.2 1.2 7.5 2.5 11.5.7 2.1 2.2 2.5 3 1 .6-1.2 1.2-3 1.5-4.2.3 1.2.9 3 1.5 4.2.8 1.5 2.3 1.1 3-1C15.8 13.5 17 9.2 17 6c0-2.2-1.8-4-4-4-1.2 0-2.2.5-3 1.3C9.2 2.5 8.2 2 7 2z"
                    fill="#A7BFB7"
                    transform="translate(2, 1)"
                  />
                  <circle cx="10" cy="7" r="2.2" fill="#65958E" />
                </svg>
              </div>

              <div
                className={`absolute right-2 z-10 flex items-center justify-center transition-all duration-300 ${
                  theme === "dark"
                    ? "pointer-events-none scale-75 opacity-0"
                    : "scale-100 opacity-100"
                }`}
              >
                <svg
                  className="h-4 w-4 text-[#65958E] drop-shadow-sm"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M7 2C4.8 2 3 3.8 3 6c0 3.2 1.2 7.5 2.5 11.5.7 2.1 2.2 2.5 3 1 .6-1.2 1.2-3 1.5-4.2.3 1.2.9 3 1.5 4.2.8 1.5 2.3 1.1 3-1C15.8 13.5 17 9.2 17 6c0-2.2-1.8-4-4-4-1.2 0-2.2.5-3 1.3C9.2 2.5 8.2 2 7 2z"
                    transform="translate(2, 1)"
                  />
                  <circle cx="15.5" cy="5" r="1.1" fill="#1F3F3B" />
                </svg>
              </div>

              <span
                className={`relative z-20 inline-block h-6 w-6 transform rounded-full border shadow-md transition-transform duration-300 ease-in-out ${
                  theme === "dark"
                    ? "translate-x-8 border-[#437C76] bg-[#063143]"
                    : "translate-x-0 border-[#9FC1B8] bg-white"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#437C76] via-[#2F5E58] to-[#1F3F3B] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-[#2F5E58] hover:to-[#1F3F3B] active:scale-95 sm:text-sm dark:text-[#01192E]"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 min-h-[calc(100vh-80px)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="relative mx-auto flex min-h-[650px] max-w-[1600px] items-center justify-center">
          {/* CUADRO PRINCIPAL */}
          <div
            className="relative z-20 w-full max-w-[1550px] overflow-hidden rounded-[24px] bg-transparent shadow-[0_30px_100px_rgba(0,0,0,0.18)] transition-all duration-500 dark:bg-[#01192E] dark:shadow-[0_30px_100px_rgba(0,0,0,0.28)]"
            style={heroBackgroundStyle}
          >
            {/* CAPA DE PROFUNDIDAD */}
            <div
              className={`pointer-events-none absolute inset-0 ${
                isDark
                  ? "bg-gradient-to-br from-[#01192E]/15 via-transparent to-[#022337]/25"
                  : "bg-gradient-to-br from-[#F9F6EB]/8 via-transparent to-[#F9F6EB]/10"
              }`}
            />

            {/* DECORACIÓN SUPERIOR */}
            <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-96 rounded-full bg-[#2A6970]/10 blur-3xl" />

            <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full border border-[#7DADAA]/10" />

            {/* CONTENIDO */}
            <div className="relative z-10 grid min-h-[560px] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
              {/* LADO IZQUIERDO */}
              <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 lg:py-16 xl:px-20">
                {/* ETIQUETA */}
                <div className="mb-7 flex items-center gap-3">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#437C76]" />

                  <span
                    className={`text-[9px] font-black uppercase tracking-[0.32em] drop-shadow-[0_2px_8px_rgba(249,246,235,0.95)] ${
                      isDark
                        ? "text-[#FFFFFF] drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]"
                        : "text-[#050505]"
                    }`}
                  >
                    Odontología integral y especializada
                  </span>
                </div>

                {/* TITULO */}
                <div className="max-w-[680px]">
                  <h1
                    className={`text-[2.2rem] font-black leading-[1.05] tracking-[-0.035em] drop-shadow-[0_3px_14px_rgba(249,246,235,0.95)] sm:text-5xl lg:text-[3.6rem] ${
                      isDark
                        ? "text-white drop-shadow-[0_4px_18px_rgba(255,255,255,0.4)]"
                        : "text-[#050505]"
                    }`}
                  >
                    Atención odontológica
                  </h1>

                  <h1 className="mt-2 text-[2.2rem] font-black leading-[1.05] tracking-[-0.035em] drop-shadow-[0_3px_14px_rgba(249,246,235,0.9)] sm:text-5xl lg:text-[3.6rem]">
                    <span
                      className={`bg-clip-text text-transparent ${
                        isDark
                          ? "bg-gradient-to-r from-[#FFFFFF] via-[#DDEDE9] to-[#8CB9B2]"
                          : "bg-gradient-to-r from-[#050505] via-[#153B36] to-[#24574F]"
                      }`}
                    >
                      clara, cercana y especializada
                    </span>
                  </h1>
                </div>

                {/* DESCRIPCIÓN */}
                <p
                  className={`mt-6 max-w-[620px] text-[13px] font-bold leading-7 drop-shadow-[0_2px_8px_rgba(249,246,235,0.9)] sm:text-sm ${
                    isDark
                      ? "text-[#FFFFFF] drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]"
                      : "text-[#050505]"
                  }`}
                >
                  Gestiona tus citas, consulta tu información clínica y mantén
                  el seguimiento de tu salud bucal desde un solo lugar, de
                  manera segura, organizada y sencilla.
                </p>

                {/* BOTONES */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#437C76] via-[#2F5E58] to-[#1F3F3B] px-7 py-3.5 text-xs font-black text-white shadow-lg shadow-[#2F5E58]/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
                  >
                    Acceder al Portal Clínico
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className={`inline-flex items-center justify-center gap-3 rounded-xl border px-7 py-3.5 text-xs font-bold backdrop-blur-md transition-all ${
                      isDark
                        ? "border-[#B4CEC5]/60 bg-[#01192E]/25 text-white hover:border-[#EAF4F1]/80 hover:bg-[#063143]/45"
                        : "border-[#1F3F3B]/50 bg-[#F9F6EB]/70 text-[#050505] hover:border-[#1F3F3B] hover:bg-[#F9F6EB]/90"
                    }`}
                  >
                    <UserCheck
                      size={16}
                      className={
                        isDark ? "text-[#EAF4F1]" : "text-[#1F3F3B]"
                      }
                    />
                    Crear Cuenta de Paciente
                  </button>
                </div>

                {/* LÍNEA SEPARADORA */}
                <div className="mt-9 h-px w-full max-w-[760px] bg-gradient-to-r from-[#437C76]/70 via-[#2F5E58]/40 to-transparent" />

                {/* BENEFICIOS PRINCIPALES */}
                <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div
                    className={`border-l pl-4 ${
                      isDark
                        ? "border-[#B4CEC5]/80"
                        : "border-[#1F3F3B]/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar
                        size={15}
                        className={
                          isDark ? "text-[#EAF4F1]" : "text-[#1F3F3B]"
                        }
                      />

                      <p
                        className={`text-[11px] font-black drop-shadow-[0_2px_6px_rgba(249,246,235,0.9)] ${
                          isDark
                            ? "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
                            : "text-[#050505]"
                        }`}
                      >
                        Atención organizada
                      </p>
                    </div>

                    <p
                      className={`mt-2 text-[10px] font-semibold leading-relaxed drop-shadow-[0_2px_6px_rgba(249,246,235,0.85)] ${
                        isDark
                          ? "text-[#FFFFFF]"
                          : "text-[#050505]"
                      }`}
                    >
                      Gestiona tus citas desde un mismo portal.
                    </p>
                  </div>

                  <div
                    className={`border-l pl-4 ${
                      isDark
                        ? "border-[#B4CEC5]/80"
                        : "border-[#1F3F3B]/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardCheck
                        size={15}
                        className={
                          isDark ? "text-[#EAF4F1]" : "text-[#1F3F3B]"
                        }
                      />

                      <p
                        className={`text-[11px] font-black drop-shadow-[0_2px_6px_rgba(249,246,235,0.9)] ${
                          isDark
                            ? "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
                            : "text-[#050505]"
                        }`}
                      >
                        Información clínica
                      </p>
                    </div>

                    <p
                      className={`mt-2 text-[10px] font-semibold leading-relaxed drop-shadow-[0_2px_6px_rgba(249,246,235,0.85)] ${
                        isDark
                          ? "text-[#FFFFFF]"
                          : "text-[#050505]"
                      }`}
                    >
                      Consulta tus registros y seguimiento fácilmente.
                    </p>
                  </div>

                  <div
                    className={`border-l pl-4 ${
                      isDark
                        ? "border-[#B4CEC5]/80"
                        : "border-[#1F3F3B]/70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <HeartPulse
                        size={15}
                        className={
                          isDark ? "text-[#EAF4F1]" : "text-[#1F3F3B]"
                        }
                      />

                      <p
                        className={`text-[11px] font-black drop-shadow-[0_2px_6px_rgba(249,246,235,0.9)] ${
                          isDark
                            ? "text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]"
                            : "text-[#050505]"
                        }`}
                      >
                        Atención especializada
                      </p>
                    </div>

                    <p
                      className={`mt-2 text-[10px] font-semibold leading-relaxed drop-shadow-[0_2px_6px_rgba(249,246,235,0.85)] ${
                        isDark
                          ? "text-[#FFFFFF]"
                          : "text-[#050505]"
                      }`}
                    >
                      Profesionales comprometidos con tu bienestar.
                    </p>
                  </div>
                </div>

                {/* BENEFICIOS INFERIORES */}
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2">
                    <CircleCheck
                      size={13}
                      className={
                        isDark ? "text-[#EAF4F1]" : "text-[#1F3F3B]"
                      }
                    />

                    <span
                      className={`text-[10px] font-bold drop-shadow-[0_2px_6px_rgba(249,246,235,0.9)] ${
                        isDark ? "text-white" : "text-[#050505]"
                      }`}
                    >
                      Información protegida
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CircleCheck
                      size={13}
                      className={
                        isDark ? "text-[#EAF4F1]" : "text-[#1F3F3B]"
                      }
                    />

                    <span
                      className={`text-[10px] font-bold drop-shadow-[0_2px_6px_rgba(249,246,235,0.9)] ${
                        isDark ? "text-white" : "text-[#050505]"
                      }`}
                    >
                      Gestión digital
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CircleCheck
                      size={13}
                      className={
                        isDark ? "text-[#EAF4F1]" : "text-[#1F3F3B]"
                      }
                    />

                    <span
                      className={`text-[10px] font-bold drop-shadow-[0_2px_6px_rgba(249,246,235,0.9)] ${
                        isDark ? "text-white" : "text-[#050505]"
                      }`}
                    >
                      Atención personalizada
                    </span>
                  </div>
                </div>
              </div>

              {/* LADO DERECHO */}
              <div className="relative hidden min-h-[560px] overflow-hidden lg:block">
                <div className="absolute left-0 top-1/2 h-64 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[#B4CEC5]/30 to-transparent" />

                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#01192E]/5 to-[#01192E]/15" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1F3F3B] dark:text-[#A7BFB7]">
            Nuestros servicios
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-[#050505] sm:text-5xl dark:text-[#F4F0E6]">
            Tratamientos diseñados para tu sonrisa
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#0A0A0A] sm:text-base dark:text-[#B4CEC5]">
            Procedimientos clínicos avanzados y atención especializada para
            mantener tu salud bucal en las mejores condiciones.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-16 gap-y-14 md:grid-cols-2">
          <div className="group flex gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9FC1B8]/20 text-[#1F3F3B] transition-transform group-hover:scale-110 dark:text-[#A7BFB7]">
              <Activity size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#050505] dark:text-[#F4F0E6]">
                Valoración & Limpieza Profunda
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
                Eliminación de placa bacteriana y sarro con ultrasonido,
                pulido coronal y diagnóstico preventivo integral.
              </p>

              <span className="mt-4 inline-block text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                Sesión clínica: 30 - 45 min
              </span>
            </div>
          </div>

          <div className="group flex gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#B4CEC5]/30 text-[#2F5E58] transition-transform group-hover:scale-110 dark:text-[#A7BFB7]">
              <Smile size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#050505] dark:text-[#F4F0E6]">
                Ortodoncia & Alineación
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
                Corrección de mordida y alineación estética mediante brackets
                metálicos, estéticos o alineadores transparentes.
              </p>

              <span className="mt-4 inline-block text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                Seguimiento y control mensual
              </span>
            </div>
          </div>

          <div className="group flex gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#9FC1B8]/20 text-[#1F3F3B] transition-transform group-hover:scale-110 dark:text-[#A7BFB7]">
              <Sparkles size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#050505] dark:text-[#F4F0E6]">
                Estética & Blanqueamiento
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
                Aclaramiento dental seguro y restauraciones estéticas que
                devuelven el brillo natural de tu sonrisa.
              </p>

              <span className="mt-4 inline-block text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                Resultados inmediatos
              </span>
            </div>
          </div>

          <div className="group flex gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D4DACD]/50 text-[#1F3F3B] transition-transform group-hover:scale-110 dark:bg-[#22535B]/40 dark:text-[#A7BFB7]">
              <Stethoscope size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#050505] dark:text-[#F4F0E6]">
                Endodoncia & Cirugía Oral
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
                Tratamiento especializado para preservar tus piezas dentales y
                resolver procedimientos quirúrgicos complejos.
              </p>

              <span className="mt-4 inline-block text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                Especialistas certificados
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPROMISO */}
      <section
        id="compromiso"
        className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1F3F3B] dark:text-[#A7BFB7]">
              NexusOdonto
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-tight text-[#050505] sm:text-5xl dark:text-[#F4F0E6]">
              Atención odontológica personalizada y sin dolor
            </h2>

            <p className="mt-7 text-base leading-relaxed text-[#0A0A0A] dark:text-[#D4DACD]">
              En NexusOdonto combinamos la calidez humana con herramientas
              digitales para que tengas siempre a la mano tu evolución médica,
              diagnósticos claros y citas organizadas.
            </p>

            <div className="mt-9 space-y-5">
              <div className="flex items-center gap-4">
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-[#2F5E58]"
                />

                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#D4DACD]">
                  Odontograma digital anatómico por pieza y superficie dental
                </span>
              </div>

              <div className="flex items-center gap-4">
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-[#2F5E58]"
                />

                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#D4DACD]">
                  Historia clínica electrónica conforme a normativas de salud
                </span>
              </div>

              <div className="flex items-center gap-4">
                <CheckCircle2
                  size={20}
                  className="shrink-0 text-[#2F5E58]"
                />

                <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#D4DACD]">
                  Recordatorios y confirmaciones directas de citas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-10 inline-flex cursor-pointer items-center gap-3 text-sm font-black text-[#1F3F3B] transition-all hover:gap-5 dark:text-[#A7BFB7]"
            >
              Ingresar a mi cuenta
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-[#9FC1B8]/20 via-[#7DADAA]/10 to-[#65958E]/15 blur-3xl" />

            <div className="relative py-8 sm:py-12">
              <div className="mb-10 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#437C76] to-[#1F3F3B] shadow-lg shadow-[#2F5E58]/20">
                  <ShieldCheck size={26} className="text-white" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[#1F3F3B] dark:text-[#A7BFB7]">
                    Tecnología que cuida
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-[#050505] sm:text-3xl dark:text-[#F4F0E6]">
                    Tu tranquilidad primero
                  </h3>
                </div>
              </div>

              <div className="space-y-7">
                <div className="flex items-end justify-between gap-8">
                  <div>
                    <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#B4CEC5]">
                      Horarios de Atención
                    </p>

                    <p className="mt-1 text-lg font-black text-[#050505] dark:text-[#F4F0E6]">
                      Lun a Sáb
                    </p>
                  </div>

                  <p className="text-sm font-black text-[#1F3F3B] dark:text-[#A7BFB7]">
                    08:00 - 17:00
                  </p>
                </div>

                <div className="h-px bg-[#D4DACD] dark:bg-[#437C76]/30" />

                <div className="flex items-end justify-between gap-8">
                  <div>
                    <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#B4CEC5]">
                      Especialidades
                    </p>

                    <p className="mt-1 text-lg font-black text-[#050505] dark:text-[#F4F0E6]">
                      Atención especializada
                    </p>
                  </div>

                  <p className="max-w-[150px] text-right text-sm font-black text-[#1F3F3B] dark:text-[#A7BFB7]">
                    Ortodoncia · Cirugía · Endodoncia
                  </p>
                </div>

                <div className="h-px bg-[#D4DACD] dark:bg-[#437C76]/30" />

                <div className="flex items-end justify-between gap-8">
                  <div>
                    <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#B4CEC5]">
                      Canal de Atención
                    </p>

                    <p className="mt-1 text-lg font-black text-[#050505] dark:text-[#F4F0E6]">
                      Siempre conectado
                    </p>
                  </div>

                  <p className="text-right text-sm font-black text-[#1F3F3B] dark:text-[#A7BFB7]">
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
        className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#1F3F3B] dark:text-[#A7BFB7]">
            Cuerpo médico
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-[#050505] sm:text-5xl dark:text-[#F4F0E6]">
            Nuestros odontólogos especialistas
          </h2>

          <p className="mt-5 text-sm text-[#0A0A0A] dark:text-[#B4CEC5]">
            Profesionales altamente calificados y comprometidos con tu
            bienestar.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
          <article className="group">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-[#1F3F3B] dark:text-[#A7BFB7]">
                LG
              </span>

              <div>
                <h3 className="text-lg font-black text-[#050505] dark:text-[#F4F0E6]">
                  Dra. Laura Gómez
                </h3>

                <p className="text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                  Ortodoncia y Estética Dental
                </p>
              </div>
            </div>

            <p className="mt-7 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
              Especialista en diseño de sonrisa, alineación estética y
              rehabilitación mínimamente invasiva.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-px w-8 bg-[#2F5E58]/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#2F5E58]" />
            </div>
          </article>

          <article className="group">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-[#2F5E58] dark:text-[#A7BFB7]">
                RM
              </span>

              <div>
                <h3 className="text-lg font-black text-[#050505] dark:text-[#F4F0E6]">
                  Dr. Roberto Martínez
                </h3>

                <p className="text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                  Cirugía Oral e Implantología
                </p>
              </div>
            </div>

            <p className="mt-7 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
              Cirujano oral con amplia experiencia en extracciones complejas,
              cordales y regeneración ósea.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-px w-8 bg-[#437C76]/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#437C76]" />
            </div>
          </article>

          <article className="group">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-[#1F3F3B] dark:text-[#A7BFB7]">
                AS
              </span>

              <div>
                <h3 className="text-lg font-black text-[#050505] dark:text-[#F4F0E6]">
                  Dra. Ana Sofía Silva
                </h3>

                <p className="text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                  Endodoncia y Periodoncia
                </p>
              </div>
            </div>

            <p className="mt-7 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
              Especialista en preservación de piezas dentales, tratamiento de
              conductos y cuidado gingival.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-px w-8 bg-[#1F3F3B]/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#1F3F3B]" />
            </div>
          </article>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative z-10 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl border-y border-[#D4DACD]/70 py-16 lg:py-20 dark:border-[#437C76]/30">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-[#1F3F3B] dark:text-[#A7BFB7]">
                <Award size={18} />

                <span className="text-xs font-black uppercase tracking-[0.25em]">
                  Atención odontológica especializada
                </span>
              </div>

              <h2 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-[#050505] sm:text-5xl dark:text-[#F4F0E6]">
                Tu salud bucal merece una atención de calidad
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#0A0A0A] sm:text-base dark:text-[#D4DACD]">
                Accede a tu portal seguro para gestionar citas, consultar
                información clínica y mantener el seguimiento de tu atención.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex cursor-pointer items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-gradient-to-r from-[#437C76] via-[#2F5E58] to-[#1F3F3B] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#2F5E58]/20 transition-all hover:scale-105 active:scale-95 dark:text-[#01192E]"
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
        className="relative z-10 border-t border-[#D4DACD]/70 bg-[#F4F0E6]/50 px-4 py-14 backdrop-blur-xl dark:border-[#437C76]/30 dark:bg-[#01192E]/40 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 text-sm md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoNexus}
                alt="Logo NexusOdonto"
                className="h-10 w-10 object-contain"
              />

              <div>
                <span className="text-lg font-black text-[#050505] dark:text-[#F4F0E6]">
                  NexusOdonto
                </span>

                <span className="block text-[9px] font-bold uppercase tracking-widest text-[#0A0A0A] dark:text-[#A7BFB7]">
                  Salud oral especializada
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
              Centro de atención odontológica integral y gestión clínica
              especializada.
            </p>

            <div className="mt-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2F5E58]" />

              <span className="text-xs font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                Atención clínica disponible
              </span>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 font-black text-[#050505] dark:text-[#F4F0E6]">
              <Clock size={16} className="text-[#2F5E58]" />
              Horario de Atención
            </p>

            <div className="mt-5 space-y-3 text-[#0A0A0A] dark:text-[#B4CEC5]">
              <div>
                <p className="font-semibold text-[#050505] dark:text-[#D4DACD]">
                  Lunes a Viernes
                </p>

                <p>08:00 AM - 05:00 PM</p>
              </div>

              <div>
                <p className="font-semibold text-[#050505] dark:text-[#D4DACD]">
                  Sábados
                </p>

                <p>08:00 AM - 12:00 PM</p>
              </div>

              <div>
                <p className="font-semibold text-[#050505] dark:text-[#D4DACD]">
                  Domingos y Festivos
                </p>

                <p>Cerrado</p>
              </div>
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 font-black text-[#050505] dark:text-[#F4F0E6]">
              <MapPin size={16} className="text-[#2F5E58]" />
              Ubicación & Contacto
            </p>

            <div className="mt-5 space-y-3 text-[#0A0A0A] dark:text-[#B4CEC5]">
              <p>
                Calle 100 #15-20
                <br />
                Centro Médico Odontológico
              </p>

              <p className="flex items-center gap-2">
                <Phone size={15} className="text-[#2F5E58]" />
                +57 (601) 745-9000
              </p>

              <p className="flex items-center gap-2">
                <Mail size={15} className="text-[#1F3F3B]" />
                contacto@nexusodonto.com
              </p>
            </div>
          </div>

          <div>
            <p className="font-black text-[#050505] dark:text-[#F4F0E6]">
              Acceso al Sistema
            </p>

            <p className="mt-5 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
              Ingresa a tu portal para gestionar tu información y solicitudes
              de atención.
            </p>

            <div className="mt-5 flex flex-col items-start gap-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex cursor-pointer items-center gap-2 font-bold text-[#1F3F3B] transition-transform hover:translate-x-1 dark:text-[#A7BFB7]"
              >
                Ingreso al Portal
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="cursor-pointer text-[#0A0A0A] transition-colors hover:text-[#050505] dark:text-[#B4CEC5] dark:hover:text-[#F4F0E6]"
              >
                Registrar Paciente
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[#D4DACD]/70 pt-7 text-xs text-[#0A0A0A] sm:flex-row dark:border-[#437C76]/30 dark:text-[#B4CEC5]">
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