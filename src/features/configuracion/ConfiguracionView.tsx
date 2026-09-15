import { useState } from "react";
import {
  Building2,
  Clock,
  Bell,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Sliders,
} from "lucide-react";

interface ConfiguracionClinica {
  nombreClinica: string;
  razonSocial: string;
  nit: string;
  telefono: string;
  whatsapp: string;
  email: string;
  direccion: string;
  ciudad: string;
  horaApertura: string;
  horaCierre: string;
  duracionCitaDefault: number;
  diasHabiles: string[];
  moneda: string;
  prefijoRecibo: string;
  notificarWhatsApp: boolean;
  notificarEmail: boolean;
  horasAnticipacionRecordatorio: number;
  backupAutomatico: boolean;
}

const CONFIG_DEFAULT: ConfiguracionClinica = {
  nombreClinica: "NexusOdonto Dental Clinic",
  razonSocial: "NexusOdonto Salud Oral S.A.S.",
  nit: "901.458.729-3",
  telefono: "+57 (601) 745-9000",
  whatsapp: "+57 310 892 4512",
  email: "contacto@nexusodonto.com",
  direccion: "Calle 100 # 15-20, Centro Médico Odontológico",
  ciudad: "Bogotá, Colombia",
  horaApertura: "08:00",
  horaCierre: "18:00",
  duracionCitaDefault: 45,
  diasHabiles: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  moneda: "COP ($)",
  prefijoRecibo: "REC-",
  notificarWhatsApp: true,
  notificarEmail: true,
  horasAnticipacionRecordatorio: 24,
  backupAutomatico: true,
};

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function ConfiguracionView() {
  const [config, setConfig] = useState<ConfiguracionClinica>(() => {
    const saved = localStorage.getItem("nexus_configuracion_clinica");
    if (saved) {
      try {
        return { ...CONFIG_DEFAULT, ...JSON.parse(saved) };
      } catch (_e) {
        return CONFIG_DEFAULT;
      }
    }
    return CONFIG_DEFAULT;
  });

  const [tabActiva, setTabActiva] = useState<"clinica" | "agenda" | "notificaciones" | "sistema">("clinica");
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const handleChange = (campo: keyof ConfiguracionClinica, valor: any) => {
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleToggleDia = (dia: string) => {
    setConfig((prev) => {
      const existe = prev.diasHabiles.includes(dia);
      return {
        ...prev,
        diasHabiles: existe
          ? prev.diasHabiles.filter((d) => d !== dia)
          : [...prev.diasHabiles, dia],
      };
    });
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("nexus_configuracion_clinica", JSON.stringify(config));
    setGuardadoExitoso(true);
    setTimeout(() => {
      setGuardadoExitoso(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 pb-16">
      {/* Toast Notificación */}
      {guardadoExitoso && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-slideUp backdrop-blur-md">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">Configuración de la clínica guardada correctamente</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-800 bg-cyan-500/15 border border-cyan-500/30 dark:text-cyan-300 dark:bg-cyan-500/20 dark:border-cyan-400/40 px-3 py-0.5 rounded-full shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
              NexusOdonto · Sistema y Parámetros
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            Configuración General
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
            Personaliza los parámetros operativos de la clínica, información corporativa, horarios de atención y reglas de la plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-6 py-3 text-xs sm:text-sm font-black text-white dark:text-slate-950 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
        >
          {guardadoExitoso ? (
            <>
              <CheckCircle2 size={18} />
              <span>Guardado Exitoso</span>
            </>
          ) : (
            <>
              <Save size={18} strokeWidth={2.4} />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      {guardadoExitoso && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold animate-slideDown shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
          <span>Los parámetros de configuración de la clínica han sido actualizados con éxito.</span>
        </div>
      )}

      {/* Pestañas de Configuración */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold animate-slideUp scrollbar-none">
        <button
          type="button"
          onClick={() => setTabActiva("clinica")}
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap border text-xs font-bold flex items-center gap-2 backdrop-blur-2xl ${
            tabActiva === "clinica"
              ? "bg-cyan-600 text-white border-cyan-600 shadow-md dark:bg-cyan-500/30 dark:border-cyan-400/70 dark:text-cyan-100"
              : "bg-white/80 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:border-cyan-400/40 dark:hover:text-white"
          }`}
        >
          <Building2 size={15} />
          <span>Datos de la Clínica</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("agenda")}
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap border text-xs font-bold flex items-center gap-2 backdrop-blur-2xl ${
            tabActiva === "agenda"
              ? "bg-cyan-600 text-white border-cyan-600 shadow-md dark:bg-cyan-500/30 dark:border-cyan-400/70 dark:text-cyan-100"
              : "bg-white/80 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:border-cyan-400/40 dark:hover:text-white"
          }`}
        >
          <Clock size={15} />
          <span>Agenda y Horarios</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("notificaciones")}
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap border text-xs font-bold flex items-center gap-2 backdrop-blur-2xl ${
            tabActiva === "notificaciones"
              ? "bg-cyan-600 text-white border-cyan-600 shadow-md dark:bg-cyan-500/30 dark:border-cyan-400/70 dark:text-cyan-100"
              : "bg-white/80 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:border-cyan-400/40 dark:hover:text-white"
          }`}
        >
          <Bell size={15} />
          <span>Notificaciones</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("sistema")}
          className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap border text-xs font-bold flex items-center gap-2 backdrop-blur-2xl ${
            tabActiva === "sistema"
              ? "bg-cyan-600 text-white border-cyan-600 shadow-md dark:bg-cyan-500/30 dark:border-cyan-400/70 dark:text-cyan-100"
              : "bg-white/80 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:border-cyan-400/40 dark:hover:text-white"
          }`}
        >
          <Sliders size={15} />
          <span>Parámetros y Sistema</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      <form onSubmit={handleGuardar} className="space-y-6">
        {/* TAB 1: DATOS DE LA CLÍNICA */}
        {tabActiva === "clinica" && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Información Corporativa de la Clínica
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Estos datos aparecen en recibos, cotizaciones y encabezados oficiales.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  value={config.nombreClinica}
                  onChange={(e) => handleChange("nombreClinica", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={config.razonSocial}
                  onChange={(e) => handleChange("razonSocial", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  NIT / Identificación Fiscal
                </label>
                <input
                  type="text"
                  value={config.nit}
                  onChange={(e) => handleChange("nit", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white font-mono text-xs sm:text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={13} className="text-cyan-600 dark:text-cyan-400" />
                  Teléfono Fijo / PBX
                </label>
                <input
                  type="text"
                  value={config.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-600 dark:text-emerald-400" />
                  WhatsApp de Contacto
                </label>
                <input
                  type="text"
                  value={config.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={13} className="text-teal-600 dark:text-teal-400" />
                  Correo de Recepción
                </label>
                <input
                  type="email"
                  value={config.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={13} className="text-rose-600 dark:text-rose-400" />
                  Dirección de la Sede Principal
                </label>
                <input
                  type="text"
                  value={config.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Ciudad y País
                </label>
                <input
                  type="text"
                  value={config.ciudad}
                  onChange={(e) => handleChange("ciudad", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AGENDA Y HORARIOS */}
        {tabActiva === "agenda" && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Horarios de Atención y Gestión de Turnos
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Reglas que controlan los intervalos de citas y la disponibilidad en el calendario.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Hora de Apertura
                </label>
                <input
                  type="time"
                  value={config.horaApertura}
                  onChange={(e) => handleChange("horaApertura", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm font-mono outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Hora de Cierre
                </label>
                <input
                  type="time"
                  value={config.horaCierre}
                  onChange={(e) => handleChange("horaCierre", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm font-mono outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Duración Predeterminada de Cita
                </label>
                <select
                  value={config.duracionCitaDefault}
                  onChange={(e) => handleChange("duracionCitaDefault", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none focus:border-cyan-500 dark:focus:border-cyan-400 cursor-pointer"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos (1 hora)</option>
                </select>
              </div>
            </div>

            {/* Días Hábiles */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Días de Atención en la Clínica
              </label>
              <div className="flex flex-wrap gap-2.5">
                {DIAS_SEMANA.map((dia) => {
                  const activo = config.diasHabiles.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => handleToggleDia(dia)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                        activo
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm dark:bg-teal-500/30 dark:border-teal-400/60 dark:text-teal-200"
                          : "bg-white dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {dia}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTIFICACIONES */}
        {tabActiva === "notificaciones" && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Recordatorios y Mensajería a Pacientes
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Control de mensajes automatizados para reducción de inasistencias.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Recordatorios automáticos por WhatsApp
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Envía recordatorio de cita con opción de confirmación al WhatsApp del paciente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("notificarWhatsApp", !config.notificarWhatsApp)}
                  className={`h-7 w-12 rounded-full transition-colors cursor-pointer p-1 relative flex items-center ${
                    config.notificarWhatsApp ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      config.notificarWhatsApp ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Confirmación inmediata por Correo Electrónico
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Notifica al paciente por email al crear o reprogramar una cita clínica.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("notificarEmail", !config.notificarEmail)}
                  className={`h-7 w-12 rounded-full transition-colors cursor-pointer p-1 relative flex items-center ${
                    config.notificarEmail ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      config.notificarEmail ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 space-y-2">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Horas de Anticipación para el Recordatorio
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={config.horasAnticipacionRecordatorio}
                    onChange={(e) =>
                      handleChange("horasAnticipacionRecordatorio", Number(e.target.value))
                    }
                    className="w-32 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white font-mono text-sm outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    horas antes del turno programado (por defecto: 24 horas)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PARÁMETROS Y SISTEMA */}
        {tabActiva === "sistema" && (
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Moneda, Facturación y Copias de Seguridad
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Ajustes contables y parámetros técnicos de persistencia de datos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Moneda Oficial de la Clínica
                </label>
                <input
                  type="text"
                  value={config.moneda}
                  onChange={(e) => handleChange("moneda", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm font-mono outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Prefijo de Recibos y Cotizaciones
                </label>
                <input
                  type="text"
                  value={config.prefijoRecibo}
                  onChange={(e) => handleChange("prefijoRecibo", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm font-mono outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Copias de Seguridad Automáticas Diarias
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Genera una copia encriptada de historias clínicas y transacciones cada medianoche.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange("backupAutomatico", !config.backupAutomatico)}
                className={`h-7 w-12 rounded-full transition-colors cursor-pointer p-1 relative flex items-center ${
                  config.backupAutomatico ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white transition-transform ${
                    config.backupAutomatico ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
