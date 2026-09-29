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
  Search,
  FileText,
  ScanLine,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";

const logoNexus = "/nexus-odonto-logo.webp";
import fondoLight from "../../assets/landingfondo-white.webp";
import fondoDark from "../../assets/landingfondo-black.webp";
const cuadroLandingDark = "/cuadro-landing-dark.webp";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const backgroundImage = isDark ? fondoDark : fondoLight;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F9F6EB] text-[#0A0A0A] transition-colors duration-500 selection:bg-[#437C76] selection:text-white dark:bg-[#01192E] dark:text-slate-100">
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-20 transition-opacity duration-700 dark:opacity-25"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />

      {/* Orbes de luz y ambient glow en movimiento suave */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 rounded-full bg-teal-500/15 dark:bg-teal-400/10 blur-[100px] pointer-events-none animate-orb-drift" />
      <div className="fixed bottom-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/15 dark:bg-cyan-400/10 blur-[120px] pointer-events-none animate-orb-drift" style={{ animationDelay: '-7s' }} />

      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#F9F6EB]/20 via-transparent to-[#F4F0E6]/40 dark:from-[#01192E]/30 dark:via-[#01192E]/10 dark:to-[#01192E]/50" />

      <header className="sticky top-0 z-50 w-full border-b border-[#D4DACD]/70 bg-[#F9F6EB]/90 shadow-sm backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-[#01192E]/90 animate-slideDown">
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
                width={40}
                height={40}
                fetchPriority="high"
                decoding="async"
                className="h-10 w-10 object-contain"
              />
            </div>

            <div>
              <span className="font-prata bg-gradient-to-r from-[#1F3F3B] via-[#2F5E58] to-[#437C76] bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl dark:from-[#A7BFB7] dark:via-[#65958E] dark:to-[#437C76]">
                NexusOdonto
              </span>

              <span className="-mt-1 block font-caacupe text-xs tracking-wider text-[#0A0A0A] dark:text-[#A7BFB7]">
                Centro Odontológico Especializado
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold font-instrument tracking-wide text-[#0A0A0A] md:flex dark:text-[#D4DACD]">
            <a
              href="#servicios"
              className="transition-colors hover:text-[#1F3F3B] dark:hover:text-[#A7BFB7]"
            >
              Tratamientos
            </a>

            <a
              href="#proceso"
              className="transition-colors hover:text-[#1F3F3B] dark:hover:text-[#A7BFB7]"
            >
              Atención
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
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-16 cursor-pointer items-center overflow-hidden rounded-full border p-1 shadow-inner transition-all duration-300 ${
                theme === "dark"
                  ? "border-[#437C76]/60 bg-[#022337]"
                  : "border-[#9FC1B8] bg-[#E5E9E2]"
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
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                  className="h-4 w-4 text-[#65958E]"
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
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#437C76] via-[#2F5E58] to-[#1F3F3B] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 sm:text-sm dark:text-[#EAF4F1]"
            >
              <span>Iniciar Sesión</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="relative z-10">
        <section className="relative z-10 min-h-[calc(100vh-80px)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="relative mx-auto flex min-h-[650px] max-w-[1600px] items-center justify-center">
            <div className="relative z-20 w-full max-w-[1550px] overflow-hidden rounded-[24px] border border-[#D4DACD]/60 bg-[#F9F6EB]/30 shadow-[0_30px_100px_rgba(0,0,0,0.12)] transition-all duration-500 dark:border-white/10 dark:bg-[#01192E]/40 dark:shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
              <img
                src={cuadroLandingDark}
                alt=""
                role="presentation"
                fetchPriority="high"
                decoding="async"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
              />

              <div
                className={`pointer-events-none absolute inset-0 ${
                  isDark
                    ? "bg-gradient-to-r from-[#01192E]/95 via-[#01192E]/82 to-[#01192E]/35"
                    : "bg-gradient-to-r from-[#F9F6EB]/92 via-[#F9F6EB]/70 to-[#F9F6EB]/20"
                }`}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#01192E]/20 dark:to-[#01192E]/35" />

              <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-96 rounded-full bg-[#2A6970]/10 blur-3xl" />

              <div className="relative z-10 grid min-h-[560px] grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 lg:py-16 xl:px-20">
                  <div className="mb-7 flex items-center gap-3">
                    <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#437C76]" />

                    <span className="font-oswald text-[13px] uppercase tracking-[0.25em] text-[#153B36] dark:text-[#B4CEC5]">
                      Odontología integral y especializada
                    </span>
                  </div>

                  <div className="max-w-[680px]">
                    <h1 className="font-prata text-[2.2rem] font-bold leading-[1.1] tracking-tight text-[#050505] sm:text-5xl lg:text-[3.6rem] dark:text-[#F4F0E6]">
                      Atención odontológica{" "}
                      <span
                        className={`mt-2 block bg-clip-text text-transparent ${
                          isDark
                            ? "bg-gradient-to-r from-[#F4F0E6] via-[#CFE1DD] to-[#7DADAA]"
                            : "bg-gradient-to-r from-[#050505] via-[#153B36] to-[#24574F]"
                        }`}
                      >
                        clara, cercana y especializada
                      </span>
                    </h1>
                  </div>

                  <p className="mt-6 max-w-[620px] font-sans text-[15px] font-normal leading-7 text-[#000000] sm:text-base dark:text-[#D4E2DE]">
                    Gestiona tus citas, consulta tu información clínica y mantén
                    el seguimiento de tu salud bucal desde un solo lugar, de
                    manera segura, organizada y sencilla.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row font-instrument">
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#437C76] via-[#2F5E58] to-[#1F3F3B] px-7 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#2F5E58]/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
                    >
                      Acceder al Portal Clínico
                      <ArrowRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className={`inline-flex items-center justify-center gap-3 rounded-xl border px-7 py-3.5 text-xs font-bold backdrop-blur-md transition-all ${
                        isDark
                          ? "border-[#7DADAA]/50 bg-[#01192E]/60 text-[#F4F0E6] hover:border-[#B4CEC5]/70 hover:bg-[#063143]/70"
                          : "border-[#1F3F3B]/40 bg-[#F9F6EB]/80 text-[#050505] hover:border-[#1F3F3B] hover:bg-[#F9F6EB]"
                      }`}
                    >
                      <UserCheck
                        size={16}
                        className={
                          isDark ? "text-[#A7BFB7]" : "text-[#1F3F3B]"
                        }
                      />
                      Crear Cuenta de Paciente
                    </button>
                  </div>

                  <div className="mt-9 h-px w-full max-w-[760px] bg-gradient-to-r from-[#437C76]/70 via-[#2F5E58]/40 to-transparent" />

                  <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {[
                      {
                        icon: Calendar,
                        title: "Atención organizada",
                        description:
                          "Gestiona tus citas desde un mismo portal.",
                      },
                      {
                        icon: ClipboardCheck,
                        title: "Información clínica",
                        description:
                          "Consulta tus registros y seguimiento fácilmente.",
                      },
                      {
                        icon: HeartPulse,
                        title: "Atención especializada",
                        description:
                          "Profesionales comprometidos con tu bienestar.",
                      },
                    ].map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className={`border-l pl-4 ${
                            isDark
                              ? "border-[#7DADAA]"
                              : "border-[#1F3F3B]/70"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              size={15.5}
                              className={
                                isDark
                                  ? "text-[#A7BFB7]"
                                  : "text-[#1F3F3B]"
                              }
                            />

                            <p className="text-[11.5px] font-black text-[#050505] dark:text-[#F4F0E6]">
                              {item.title}
                            </p>
                          </div>

                          <p className="mt-2 text-[10.5px] font-medium leading-relaxed text-[#000000] dark:text-[#B4CEC5]">
                            {item.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                    {[
                      "Información protegida",
                      "Gestión digital",
                      "Atención personalizada",
                    ].map((beneficio) => (
                      <div
                        key={beneficio}
                        className="flex items-center gap-2"
                      >
                        <CircleCheck
                          size={13}
                          className={
                            isDark ? "text-[#A7BFB7]" : "text-[#1F3F3B]"
                          }
                        />

                        <span className="text-[10px] font-bold text-[#15302D] dark:text-[#D4DACD]">
                          {beneficio}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative hidden min-h-[560px] overflow-hidden lg:block">
                  <div className="absolute left-0 top-1/2 h-64 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-[#B4CEC5]/30 to-transparent" />
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
          <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <span className="absolute left-0 top-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute left-0 top-0 h-px w-28 bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-px w-28 bg-[#050505] dark:bg-white/60" />

            <div className="mb-16 max-w-2xl">
              <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#1F3F3B] dark:text-[#A7BFB7]">
                Nuestros servicios
              </p>

              <h2 className="mt-4 font-prata text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#050505] dark:text-[#F4F0E6]">
                Tratamientos diseñados para tu sonrisa
              </h2>

              <p className="mt-5 text-sm leading-relaxed text-[#0A0A0A] sm:text-base dark:text-[#B4CEC5]">
                Procedimientos clínicos avanzados y atención especializada para
                mantener tu salud bucal en las mejores condiciones.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
              {[
                {
                  icon: Activity,
                  title: "Valoración & Limpieza Profunda",
                  description:
                    "Eliminación de placa bacteriana y sarro con ultrasonido, pulido coronal y diagnóstico preventivo integral.",
                  info: "Sesión clínica: 30 - 45 min",
                },
                {
                  icon: Smile,
                  title: "Ortodoncia & Alineación",
                  description:
                    "Corrección de mordida y alineación estética mediante brackets metálicos, estéticos o alineadores transparentes.",
                  info: "Seguimiento y control mensual",
                },
                {
                  icon: Sparkles,
                  title: "Estética & Blanqueamiento",
                  description:
                    "Aclaramiento dental seguro y restauraciones estéticas que devuelven el brillo natural de tu sonrisa.",
                  info: "Resultados inmediatos",
                },
                {
                  icon: Stethoscope,
                  title: "Endodoncia & Cirugía Oral",
                  description:
                    "Tratamiento especializado para preservar tus piezas dentales y resolver procedimientos quirúrgicos complejos.",
                  info: "Especialistas certificados",
                },
              ].map((service) => {
                const Icon = service.icon;

                return (
                  <div
                    key={service.title}
                    className="group flex gap-5 p-6 rounded-3xl bg-white/40 dark:bg-[#01192E]/30 border border-[#D4DACD]/40 dark:border-white/5 backdrop-blur-md card-hover-elevate transition-all duration-300 cursor-default"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#9FC1B8]/20 text-[#1F3F3B] transition-all duration-300 group-hover:scale-115 group-hover:rotate-6 group-hover:bg-[#9FC1B8]/40 dark:bg-[#437C76]/15 dark:text-[#A7BFB7] dark:group-hover:bg-[#437C76]/30 icon-animated-interactive">
                      <Icon size={26} className="group-hover:animate-icon-bounce transition-transform" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-prata text-xl font-bold text-[#050505] dark:text-[#F4F0E6] group-hover:text-[#1F3F3B] dark:group-hover:text-[#A7BFB7] transition-colors">
                        {service.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
                        {service.description}
                      </p>

                      <span className="mt-4 inline-block font-spacemono text-xs font-semibold text-[#1F3F3B] dark:text-[#A7BFB7] px-2.5 py-1 rounded-lg bg-teal-500/10 dark:bg-teal-400/10 border border-teal-500/20">
                        {service.info}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* NUEVA INTEGRACIÓN - PROCESO ODONTOLÓGICO */}
        <section
          id="proceso"
          className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <span className="absolute left-0 top-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute left-0 top-0 h-px w-28 bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-px w-28 bg-[#050505] dark:bg-white/60" />

            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
              <div>
                <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#1F3F3B] dark:text-[#A7BFB7]">
                  Tu atención paso a paso
                </p>

                <h2 className="mt-5 font-prata text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#050505] dark:text-[#F4F0E6]">
                  Una experiencia odontológica organizada
                </h2>

                <p className="mt-6 text-sm leading-relaxed text-[#0A0A0A] sm:text-base dark:text-[#B4CEC5]">
                  Desde tu primera consulta hasta el seguimiento de tu
                  tratamiento, NexusOdonto mantiene tu atención clínica
                  organizada y conectada.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="mt-9 font-instrument inline-flex cursor-pointer items-center gap-3 text-sm font-bold text-[#1F3F3B] transition-all hover:gap-5 dark:text-[#A7BFB7]"
                >
                  Crear mi cuenta de paciente
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-[23px] top-8 hidden h-[calc(100%-64px)] w-px bg-gradient-to-b from-[#437C76]/70 via-[#2F5E58]/30 to-transparent sm:block dark:from-[#7DADAA]/70" />

                <div className="space-y-9">
                  {[
                    {
                      number: "01",
                      icon: Calendar,
                      title: "Agenda tu consulta",
                      description:
                        "Selecciona una fecha para tu valoración odontológica y organiza tu atención desde el portal.",
                    },
                    {
                      number: "02",
                      icon: Search,
                      title: "Valoración y diagnóstico",
                      description:
                        "El profesional realiza la evaluación clínica de tu salud oral y registra la información necesaria.",
                    },
                    {
                      number: "03",
                      icon: FileText,
                      title: "Plan de tratamiento",
                      description:
                        "Recibe una orientación clara sobre el procedimiento odontológico recomendado para tu caso.",
                    },
                    {
                      number: "04",
                      icon: ScanLine,
                      title: "Seguimiento clínico",
                      description:
                        "Consulta tu evolución, registros y seguimiento de tratamiento desde un mismo lugar.",
                    },
                  ].map((step) => {
                    const Icon = step.icon;

                    return (
                      <div
                        key={step.number}
                        className="group relative flex gap-6"
                      >
                        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#437C76]/30 bg-[#F9F6EB] shadow-sm transition-transform duration-300 group-hover:scale-110 dark:border-[#7DADAA]/40 dark:bg-[#01192E]">
                          <Icon
                            size={20}
                            className="text-[#1F3F3B] dark:text-[#A7BFB7]"
                          />
                        </div>

                        <div className="pb-2">
                          <div className="flex items-center gap-4">
                            <span className="font-spacemono text-xs font-bold tracking-wider text-[#437C76] dark:text-[#7DADAA]">
                              {step.number}
                            </span>

                            <span className="h-px w-8 bg-[#437C76]/30" />
                          </div>

                          <h3 className="mt-2 font-prata text-xl font-bold text-[#050505] dark:text-[#F4F0E6]">
                            {step.title}
                          </h3>

                          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[#2F5E58]/15 pt-8 dark:border-white/10">
              <div className="flex items-center gap-2">
              </div>

              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>
        </section>

        {/* COMPROMISO */}
        <section
          id="compromiso"
          className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <span className="absolute left-0 top-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute left-0 top-0 h-px w-28 bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-px w-28 bg-[#050505] dark:bg-white/60" />

            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#1F3F3B] dark:text-[#A7BFB7]">
                  NexusOdonto
                </p>

                <h2 className="mt-5 font-prata text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#050505] dark:text-[#F4F0E6]">
                  Atención odontológica personalizada y sin dolor
                </h2>

                <p className="mt-7 text-base leading-relaxed text-[#0A0A0A] dark:text-[#D4DACD]">
                  En NexusOdonto combinamos la calidez humana con herramientas
                  digitales para que tengas siempre a la mano tu evolución
                  médica, diagnósticos claros y citas organizadas.
                </p>

                <div className="mt-9 space-y-5">
                  {[
                    "Odontograma digital anatómico por pieza y superficie dental",
                    "Historia clínica electrónica conforme a normativas de salud",
                    "Recordatorios y confirmaciones directas de citas",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-4">
                      <CheckCircle2
                        size={20}
                        className="shrink-0 text-[#2F5E58]"
                      />

                      <span className="text-sm font-semibold text-[#0A0A0A] dark:text-[#D4DACD]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-10 font-instrument inline-flex cursor-pointer items-center gap-3 text-sm font-bold text-[#1F3F3B] transition-all hover:gap-5 dark:text-[#A7BFB7]"
                >
                  Ingresar a mi cuenta
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="relative">
                <div className="relative p-8 sm:p-12">
                  <div className="mb-10 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#437C76] to-[#1F3F3B] shadow-lg shadow-[#2F5E58]/20">
                      <ShieldCheck size={26} className="text-white" />
                    </div>

                    <div>
                      <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#1F3F3B] dark:text-[#A7BFB7]">
                        Tecnología que cuida
                      </p>

                      <h3 className="mt-1 font-prata text-2xl font-bold text-[#050505] sm:text-3xl dark:text-[#F4F0E6]">
                        Tu tranquilidad primero
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-7">
                    <div className="space-y-2.5">
                      <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#B4CEC5]">
                        Horarios de Atención
                      </p>

                      <div className="flex items-center justify-between gap-4">
                        <p className="font-prata text-base font-bold text-[#050505] dark:text-[#F4F0E6]">
                          Lunes a Viernes
                        </p>
                        <p className="font-spacemono text-xs sm:text-sm font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                          08:00 a 12:00 — 14:00 a 17:00
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <p className="font-prata text-base font-bold text-[#050505] dark:text-[#F4F0E6]">
                          Sábados
                        </p>
                        <p className="font-spacemono text-xs sm:text-sm font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                          08:00 a 12:00
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <p className="font-prata text-base font-bold text-slate-500 dark:text-slate-400">
                          Domingos
                        </p>
                        <p className="font-spacemono text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                          Cerrado
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-[#050505]/20 dark:bg-white/20" />

                    <div className="flex items-end justify-between gap-8">
                      <div>
                        <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#B4CEC5]">
                          Especialidades
                        </p>

                        <p className="mt-1 font-prata text-lg font-bold text-[#050505] dark:text-[#F4F0E6]">
                          Atención especializada
                        </p>
                      </div>

                      <p className="max-w-[150px] text-right text-sm font-semibold text-[#1F3F3B] dark:text-[#A7BFB7]">
                        Ortodoncia · Cirugía · Endodoncia
                      </p>
                    </div>

                    <div className="h-px bg-[#050505]/20 dark:bg-white/20" />

                    <div className="flex items-end justify-between gap-8">
                      <div>
                        <p className="text-sm font-bold text-[#0A0A0A] dark:text-[#B4CEC5]">
                          Canal de Atención
                        </p>

                        <p className="mt-1 font-prata text-lg font-bold text-[#050505] dark:text-[#F4F0E6]">
                          Siempre conectado
                        </p>
                      </div>

                      <p className="text-right text-sm font-semibold text-[#1F3F3B] dark:text-[#A7BFB7]">
                        Portal Web
                        <br />
                        y Recepción
                      </p>
                    </div>
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
          <div className="relative px-5 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <span className="absolute left-0 top-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute left-0 top-0 h-px w-28 bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-px w-28 bg-[#050505] dark:bg-white/60" />

            <div className="max-w-3xl">
              <p className="font-oswald text-xs uppercase tracking-[0.25em] text-[#1F3F3B] dark:text-[#A7BFB7]">
                Cuerpo médico
              </p>

              <h2 className="mt-4 font-prata text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#050505] dark:text-[#F4F0E6]">
                Nuestros odontólogos especialistas
              </h2>

              <p className="mt-5 text-sm text-[#0A0A0A] dark:text-[#B4CEC5]">
                Profesionales altamente calificados y comprometidos con tu
                bienestar.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
              {[
                {
                  initials: "LG",
                  name: "Dra. Laura Gómez",
                  specialty: "Ortodoncia y Ortopedia Maxilar",
                  description:
                    "Especialista en diseño de sonrisa, alineación estética y rehabilitación mínimamente invasiva.",
                },
                {
                  initials: "RM",
                  name: "Dr. Roberto Martínez",
                  specialty: "Cirugía Oral e Implantología",
                  description:
                    "Cirujano maxilofacial e implantólogo oral. Especializado en implantes de carga inmediata y regeneración ósea guiada.",
                },
                {
                  initials: "AS",
                  name: "Dra. Ana Sofía Silva",
                  specialty: "Endodoncia y Microcirugía Apical",
                  description:
                    "Especialista en preservación de piezas dentales mediante tratamiento de conductos avanzado y cuidado tisular.",
                },
              ].map((doctor) => (
                <article
                  key={doctor.name}
                  className="group border-l border-[#2F5E58]/30 pl-6 transition-all hover:border-[#437C76] dark:border-[#7DADAA]/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-prata text-3xl font-bold text-[#1F3F3B] dark:text-[#A7BFB7]">
                      {doctor.initials}
                    </span>

                    <div>
                      <h3 className="font-prata text-lg font-bold text-[#050505] dark:text-[#F4F0E6]">
                        {doctor.name}
                      </h3>

                      <p className="font-instrument text-xs font-semibold text-[#1F3F3B] dark:text-[#A7BFB7]">
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>

                  <p className="mt-7 text-sm leading-relaxed text-[#0A0A0A] dark:text-[#B4CEC5]">
                    {doctor.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2">
                    <span className="h-px w-8 bg-[#2F5E58]/60" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2F5E58]" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative z-10 px-4 py-24 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:px-14 lg:py-20">
            <span className="absolute left-0 top-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute left-0 top-0 h-px w-28 bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-24 w-px bg-[#050505] dark:bg-white/60" />
            <span className="absolute bottom-0 right-0 h-px w-28 bg-[#050505] dark:bg-white/60" />

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
                className="inline-flex cursor-pointer items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-gradient-to-r from-[#437C76] via-[#2F5E58] to-[#1F3F3B] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#2F5E58]/20 transition-all hover:scale-105 active:scale-95 dark:text-[#EAF4F1]"
              >
                Iniciar Sesión
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer
        id="contacto"
        className="relative z-10 border-t border-[#D4DACD]/70 bg-[#F4F0E6]/70 px-4 py-14 backdrop-blur-xl dark:border-[#437C76]/30 dark:bg-[#01192E]/70 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 text-sm md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={logoNexus}
                alt="Logo NexusOdonto"
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
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
                <p>08:00 AM - 12:00 PM | 02:00 PM - 05:00 PM</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Descanso clínico: 12:00 PM a 02:00 PM</p>
              </div>

              <div>
                <p className="font-semibold text-[#050505] dark:text-[#D4DACD]">
                  Sábados
                </p>
                <p>08:00 AM - 12:00 PM (Jornada Continua)</p>
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

          <p className="font-mono">Sistema de Salud Oral Especializado</p>
        </div>
      </footer>
    </div>
  );
}