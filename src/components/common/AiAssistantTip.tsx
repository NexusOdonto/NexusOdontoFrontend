import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Bot,
  Lightbulb,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

interface TipItem {
  badge?: string;
  title: string;
  content: string;
  actionText?: string;
  actionPath?: string;
}

const ROUTE_TIPS: Record<string, TipItem[]> = {
  "/dashboard": [
    {
      badge: "Copilot Operativo",
      title: "Visión General Inteligente",
      content:
        "El panel monitorea en tiempo real las citas del día y el estado de los consultorios. Puedes ver qué doctores están en consulta o en receso de almuerzo en la sección 'Equipo en Turno Hoy'.",
      actionText: "Ver Agenda Semanal",
      actionPath: "/agenda",
    },
    {
      badge: "Sugerencia de Flujo",
      title: "Gestión Rápida de Estados",
      content:
        "Para acelerar la atención, confirma la llegada del paciente cambiando su cita a 'En Atención'. Esto habilitará automáticamente el registro de su evolución en Historia Clínica.",
      actionText: "Ir a Citas del Día",
      actionPath: "/citas",
    },
    {
      badge: "Consejo Nexus AI",
      title: "Nomenclatura Institucional",
      content:
        "Los sillones de atención dental se unificaron bajo la denominación 'Consultorio' para un estándar más formal y médico en reportes y vistas de agenda.",
    },
  ],
  "/citas": [
    {
      badge: "Copilot de Admisión",
      title: "Búsqueda y Filtros Rápidos",
      content:
        "Escribe la cédula o nombre en el buscador superior para filtrar de inmediato. Los botones de la derecha te permiten gestionar el estado de la cita o registrar inasistencia con justificación.",
    },
    {
      badge: "Alerta Predictiva",
      title: "Citas con Reprogramación",
      content:
        "Si ves una cita con la insignia naranja 'Requiere reprogramación', significa que el horario del doctor cambió. Haz clic en 'Reprogramar' para contactar al paciente y reubicar su turno.",
    },
    {
      badge: "Integridad Clínica",
      title: "Control de Estados",
      content:
        "Las citas con estado 'Cancelada' o 'No asistió' quedan automáticamente bloqueadas para evitar aperturas accidentales de historias clínicas no ejecutadas.",
    },
  ],
  "/agenda": [
    {
      badge: "Copilot de Agenda",
      title: "Matriz Semanal Dinámica",
      content:
        "Las citas del mismo horario se agrupan en dossiers visuales ('📁 N Citas'). Haz clic en cualquier tarjeta para abrir el desglose completo de pacientes asignados a ese bloque.",
    },
    {
      badge: "Protección de Jornada",
      title: "Receso de Almuerzo Protegido",
      content:
        "El carrusel de descanso (12:00 a 14:00) reserva el espacio de almuerzo de los doctores. Si necesitas programar un procedimiento largo, procura que inicie en franjas continuas de atención.",
    },
    {
      badge: "Atajo Rápido",
      title: "Agendamiento con un Clic",
      content:
        "Haz clic en cualquier celda horaria disponible para abrir la ventana de agendamiento con la fecha y hora exacta ya precargada en el formulario.",
      actionText: "Crear Nueva Cita",
      actionPath: "/citas",
    },
  ],
  "/historia-clinica": [
    {
      badge: "Asistente Clínico AI",
      title: "Evoluciones Médicas Encadenadas",
      content:
        "Para registrar una nueva evolución o consulta, selecciona una cita que esté activa. El sistema vinculará al doctor en turno y guardará el examen estomatológico y plan de tratamiento.",
    },
    {
      badge: "Sincronización CIE-10",
      title: "Mapeo con Odontograma",
      content:
        "Cualquier patología o hallazgo marcado en el Odontograma FDI se sincroniza automáticamente con la carpeta de Diagnósticos CIE-10 sin necesidad de recargar la página.",
      actionText: "Abrir Odontograma",
      actionPath: "/odontograma",
    },
    {
      badge: "Exportación Documental",
      title: "Expediente y Recetas en PDF",
      content:
        "Puedes generar el Expediente Clínico Completo o la Prescripción Farmacológica en formato PDF con firma y membrete institucional listos para entrega al paciente.",
    },
  ],
  "/odontograma": [
    {
      badge: "Copilot Odontológico",
      title: "Mapeo Anatómico FDI",
      content:
        "Haz clic en cualquier diente (del 11 al 48 permanente) para seleccionar sus 5 caras anatómicas: Mesial (M), Distal (D), Oclusal (O), Vestibular (V) y Lingual/Palatino (L).",
    },
    {
      badge: "Convenciones y Colores",
      title: "Diagnósticos por Superficie",
      content:
        "Utiliza la barra de herramientas superior para alternar entre Caries (rojo), Obturación (azul), Corona, Endodoncia o Extracción. Los cambios se guardan en la nube al pulsar 'Guardar Odontograma'.",
    },
    {
      badge: "Reporte Gráfico",
      title: "Descarga Vectorial de Odontograma",
      content:
        "Pulsa 'Descargar Odontograma' para generar un PDF vectorial de alta fidelidad que puedes imprimir o adjuntar al expediente físico del paciente.",
    },
  ],
  "/profesionales": [
    {
      badge: "Gestión de Personal",
      title: "Política: Cambios Rigen Desde Mañana",
      content:
        "Para proteger las citas que ya están en curso hoy, cualquier modificación en la jornada o turnos semanales del odontólogo empezará a regir automáticamente a partir de mañana.",
    },
    {
      badge: "Detección de Conflicto",
      title: "Aviso de Citas Afectadas",
      content:
        "Al guardar un nuevo horario, el sistema simula las citas futuras. Si alguna queda por fuera del nuevo turno, se marcará para reprogramación y se enviará una alerta a la campana del doctor.",
    },
  ],
  "/servicios": [
    {
      badge: "Tarifario Flexible",
      title: "Entrada Libre de Precios y Tiempos",
      content:
        "Puedes escribir libremente la tarifa en pesos colombianos ($ COP) y ajustar con precisión los minutos de duración en el sillón dental de acuerdo con la complejidad del procedimiento.",
    },
    {
      badge: "Calibración de Agenda",
      title: "Impacto en Tiempos de Cita",
      content:
        "La duración que configures aquí será la que determine los bloques horarios ocupados al momento de agendar citas para este servicio en la Agenda semanal.",
    },
  ],
  "/pacientes": [
    {
      badge: "Directorio de Pacientes",
      title: "Monitoreo de Presencia y Estado",
      content:
        "El punto verde en la lista indica que el paciente tiene sesión abierta o actividad reciente. Utiliza el botón 'Nuevo Paciente' para abrir la ficha de ingreso completa.",
    },
  ],
  "/configuracion": [
    {
      badge: "Persistencia Multi-dispositivo",
      title: "Sincronización en Base de Datos",
      content:
        "Los datos de la clínica (NIT, línea de WhatsApp, horarios generales y tiempos de cita) se sincronizan con el backend central y se reflejan de inmediato en cualquier dispositivo que inicie sesión.",
    },
  ],
  "/atencion-chat": [
    {
      badge: "Copilot WhatsApp",
      title: "Resolución de Contactos",
      content:
        "El panel resuelve automáticamente los números en formato internacional E.164 (+57...) y permite atender directamente a los pacientes que escriben al WhatsApp de la clínica.",
    },
  ],
  "/usuarios": [
    {
      badge: "Control de Cuentas",
      title: "Seguridad y Roles",
      content:
        "Puedes activar o desactivar el acceso de usuarios al sistema. El usuario administrador principal cuenta con protección contra bloqueos accidentales.",
    },
  ],
  "/roles-permisos": [
    {
      badge: "Matriz de Privilegios",
      title: "Permisos Granulares",
      content:
        "Modifica qué roles pueden Ver, Crear, Editar o Eliminar en cada módulo. Los cambios aplican de forma inmediata en las rutas protegidas.",
    },
  ],
};

const DEFAULT_TIPS: TipItem[] = [
  {
    badge: "Nexus AI Copilot",
    title: "Asistente Clínico Inteligente",
    content:
      "Bienvenido a NexusOdonto. Este asistente de IA analiza la pantalla actual para guiarte paso a paso en tus flujos de agendamiento, gestión clínica y administración odontológica.",
  },
];

export function AiAssistantTip() {
  const location = useLocation();
  const navigate = useNavigate();

  // Clave de almacenamiento para recordar si el usuario minimizó el asistente
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("nexus_ai_tip_collapsed") === "true";
  });
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Obtener la lista de consejos de la ruta actual
  const tips = useMemo(() => {
    const path = location.pathname;
    // Buscar coincidencia exacta o por prefijo
    for (const route in ROUTE_TIPS) {
      if (path === route || (route !== "/dashboard" && path.startsWith(route))) {
        return ROUTE_TIPS[route];
      }
    }
    return DEFAULT_TIPS;
  }, [location.pathname]);

  // Resetear índice al cambiar de ruta y reabrir si cambió de módulo
  useEffect(() => {
    setCurrentTipIndex(0);
    setIsDismissed(false);
  }, [location.pathname]);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("nexus_ai_tip_collapsed", String(next));
  };

  const handleNextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  if (isDismissed) return null;

  const currentTip = tips[currentTipIndex % tips.length];

  return (
    <aside
      aria-label="Asistente Nexus AI"
      className="relative mb-5 overflow-hidden rounded-2xl border transition-all duration-300 shadow-lg border-teal-500/25 bg-gradient-to-r from-teal-950/40 via-cyan-950/20 to-slate-900/60 backdrop-blur-xl text-slate-100 dark:border-teal-500/30 dark:from-teal-950/60 dark:via-cyan-950/30 dark:to-slate-950/80"
    >
      {/* Resplandor superior decorativo de IA */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 opacity-80" />

      {/* CABECERA DEL ASISTENTE */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/20 border-b border-teal-500/10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.5)]">
            <Sparkles size={15} className="animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold tracking-wider uppercase text-teal-300 font-mono">
              Nexus AI Copilot
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-200 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              {currentTip.badge || "Sugerencia Inteligente"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {tips.length > 1 && !isCollapsed && (
            <button
              type="button"
              onClick={handleNextTip}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg text-teal-200/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Ver siguiente sugerencia de IA para esta pantalla"
            >
              <RefreshCw size={12} className="text-teal-400" />
              <span className="hidden md:inline">Siguiente consejo</span>
              <span className="text-[10px] text-teal-400/80">({currentTipIndex + 1}/{tips.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expandir guía de IA" : "Minimizar guía de IA"}
            title={isCollapsed ? "Expandir guía" : "Minimizar guía"}
          >
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Ocultar asistente por esta sesión"
            title="Ocultar asistente"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* CONTENIDO EXPANDIBLE */}
      {!isCollapsed && (
        <div className="p-4 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="hidden sm:flex mt-0.5 p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
              <Bot size={18} />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-400 shrink-0" />
                  <span>{currentTip.title}</span>
                </h4>
              </div>

              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200/90 font-sans">
                {currentTip.content}
              </p>
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN RÁPIDA SUGERIDA */}
          {currentTip.actionText && currentTip.actionPath && (
            <div className="shrink-0 pt-1 md:pt-0">
              <button
                type="button"
                onClick={() => currentTip.actionPath && navigate(currentTip.actionPath)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 hover:from-teal-400 hover:to-cyan-400 shadow-md hover:shadow-cyan-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>{currentTip.actionText}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
