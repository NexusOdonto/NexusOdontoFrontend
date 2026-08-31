import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  RefreshCw,
  Zap,
  Calendar,
  Search,
  FileText,
  CreditCard,
  Stethoscope,
  Smile,
  Users,
  ShieldCheck,
  Clock,
  UserPlus,
  Receipt,
  PhoneCall,
  Activity,
  Settings,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  actionLink?: {
    text: string;
    path: string;
  };
}

interface SuggestionItem {
  text: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export default function ChatBotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = getUserRole(user);

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Configuración contextual del Asistente según el Rol Activo (Sin Emojis)
  const roleConfig = React.useMemo(() => {
    switch (role) {
      case "PACIENTE":
        return {
          title: "Asistente del Paciente",
          badge: "Paciente",
          color: "teal",
          initialMessage: `Bienvenido ${user?.nombre || "Andrés"}. Soy el Asistente Virtual de NexusOdonto. ¿En qué puedo orientarte hoy con respecto a tus citas, tratamientos odontológicos o cuidados preventivos?`,
          suggestions: [
            { text: "¿Cómo agendo una nueva cita?", icon: Calendar },
            { text: "Consultar el estado de mis citas", icon: Search },
            { text: "Consejos de cuidado tras una limpieza", icon: Smile },
            { text: "Métodos de pago y convenios", icon: CreditCard },
          ] as SuggestionItem[],
        };
      case "ODONTOLOGO":
        return {
          title: "Asistente Clínico",
          badge: "Odontólogo",
          color: "blue",
          initialMessage: `Saludos Dr(a). ${user?.apellido || user?.nombre || ""}. Asistente Clínico activo para apoyarte con tu agenda médica, odontograma e historias clínicas.`,
          suggestions: [
            { text: "Resumen de pacientes del día", icon: Users },
            { text: "Guía para actualizar Odontograma", icon: Smile },
            { text: "Protocolo de evolución clínica", icon: FileText },
            { text: "Consultar agenda de la semana", icon: Clock },
          ] as SuggestionItem[],
        };
      case "RECEPCIONISTA":
        return {
          title: "Asistente de Recepción",
          badge: "Recepción",
          color: "purple",
          initialMessage: `Hola ${user?.nombre || "María"}. Asistente de recepción disponible para consulta de disponibilidad médica, servicios y soporte de citas.`,
          suggestions: [
            { text: "Disponibilidad de odontólogos", icon: Stethoscope },
            { text: "Catálogo de servicios y precios", icon: Receipt },
            { text: "¿Cómo registrar un paciente nuevo?", icon: UserPlus },
            { text: "Protocolo de confirmación de citas", icon: PhoneCall },
          ] as SuggestionItem[],
        };
      case "ADMINISTRADOR":
      default:
        return {
          title: "Asistente de Supervisión",
          badge: "Admin",
          color: "cyan",
          initialMessage: `Hola Administrador ${user?.nombre || ""}. Supervisión de NexusOdonto activa. ¿Qué métricas operativas o configuraciones deseas consultar?`,
          suggestions: [
            { text: "Resumen de métricas del sistema", icon: Activity },
            { text: "Gestión de usuarios y roles", icon: Users },
            { text: "Estado de seguridad y auditoría", icon: ShieldCheck },
            { text: "Configuración general", icon: Settings },
          ] as SuggestionItem[],
        };
    }
  }, [role, user]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: roleConfig.initialMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Actualizar mensaje inicial al cambiar el rol
  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "bot",
        text: roleConfig.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [roleConfig]);

  // Auto scroll al final de la conversación
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Generador de respuestas sin emojis
  const generateBotResponse = (prompt: string): { text: string; actionLink?: { text: string; path: string } } => {
    const lower = prompt.toLowerCase();

    if (role === "PACIENTE") {
      if (lower.includes("agendar") || lower.includes("nueva cita") || lower.includes("cita")) {
        return {
          text: "Puedes solicitar tu próxima cita odontológica ingresando a la sección 'Mis Citas' y seleccionando el servicio, la fecha y el horario de tu preferencia.",
          actionLink: { text: "Ir a Mis Citas", path: "/citas" },
        };
      }
      if (lower.includes("estado") || lower.includes("mis citas") || lower.includes("consultar")) {
        return {
          text: "Tienes una cita programada para 'Limpieza y Valoración General' con la Dra. Laura Gómez el 15 de Septiembre a las 10:00 AM. Puedes revisar el detalle en tu perfil.",
          actionLink: { text: "Ver en Mi Perfil", path: "/perfil" },
        };
      }
      if (lower.includes("cuidado") || lower.includes("limpieza") || lower.includes("consejo") || lower.includes("cepillado")) {
        return {
          text: "Recomendaciones posteriores al tratamiento: 1) Cepillar suavemente 3 veces al día con cerdas suaves. 2) Utilizar seda dental diariamente. 3) Evitar alimentos pigmentados o excesivamente duros durante las primeras 24 horas.",
        };
      }
      if (lower.includes("pago") || lower.includes("precio") || lower.includes("tarifa") || lower.includes("convenio")) {
        return {
          text: "Aceptamos pagos con tarjeta de crédito, débito, transferencias electrónicas y convenios institucionales. En recepción te brindarán asesoría sobre planes de financiamiento.",
        };
      }
      return {
        text: "Mensaje recibido. Si experimentas una urgencia o dolor dental agudo, te recomendamos acudir de inmediato a nuestras instalaciones para atención prioritaria.",
      };
    }

    if (role === "ODONTOLOGO") {
      if (lower.includes("paciente") || lower.includes("resumen") || lower.includes("dia") || lower.includes("hoy")) {
        return {
          text: "Pacientes programados para hoy: Andrés Pérez (10:00 AM - Limpieza), Claudia Ortiz (11:30 AM - Control Ortodoncia), Jorge Rivas (2:00 PM - Endodoncia) y Sofía Mora (4:00 PM - Valoración).",
          actionLink: { text: "Abrir Agenda Clínica", path: "/agenda" },
        };
      }
      if (lower.includes("odontograma") || lower.includes("diente") || lower.includes("grafico")) {
        return {
          text: "El Odontograma interactivo permite registrar hallazgos patológicos y procedimientos (caries, obturaciones, coronas) en dentición permanente y temporal.",
          actionLink: { text: "Abrir Odontograma", path: "/odontograma" },
        };
      }
      if (lower.includes("historia") || lower.includes("evolucion") || lower.includes("nota")) {
        return {
          text: "Para registrar evoluciones clínicas, diagnósticos CIE-10 y procedimientos efectuados, puedes ingresar directamente al expediente del paciente.",
          actionLink: { text: "Ir a Historia Clínica", path: "/historia-clinica" },
        };
      }
      return {
        text: "Registro procesado. Puedes consultar los antecedentes y exámenes diagnósticos del paciente en el expediente clínico.",
      };
    }

    if (role === "RECEPCIONISTA") {
      if (lower.includes("disponibilidad") || lower.includes("doctor") || lower.includes("odontologo")) {
        return {
          text: "Disponibilidad médica: La Dra. Laura Gómez cuenta con espacio hoy de 3:00 PM a 4:00 PM. El Dr. Juan Martínez tiene disponibilidad en la jornada matutina de mañana.",
          actionLink: { text: "Ver Agenda Completa", path: "/agenda" },
        };
      }
      if (lower.includes("servicio") || lower.includes("precio") || lower.includes("tarifa") || lower.includes("catalogo")) {
        return {
          text: "Tarifas de referencia: Profilaxis ($80.000), Resina Simple ($120.000), Blanqueamiento Láser ($450.000) e Implantes Dentales. Puedes consultar el catálogo completo en Servicios.",
          actionLink: { text: "Ver Servicios", path: "/servicios" },
        };
      }
      if (lower.includes("nuevo paciente") || lower.includes("registrar") || lower.includes("crear")) {
        return {
          text: "Para registrar un paciente nuevo, solicita documento de identidad, nombres, apellidos, teléfono y correo electrónico para abrir su ficha médica.",
          actionLink: { text: "Registrar Paciente", path: "/pacientes/nuevo" },
        };
      }
      return {
        text: "Solicitud registrada. Recuerda verificar las solicitudes de citas pendientes para su confirmación y asignación de consultorio.",
      };
    }

    // ADMINISTRADOR
    if (lower.includes("metrica") || lower.includes("resumen") || lower.includes("rendimiento") || lower.includes("dashboard")) {
      return {
        text: "Métricas del Sistema: 12 módulos activos, 98.5% de cumplimiento en citas programadas, 4 roles RBAC y 0 incidencias críticas registradas en auditoría.",
        actionLink: { text: "Ir al Dashboard", path: "/dashboard" },
      };
    }
    if (lower.includes("usuario") || lower.includes("rol") || lower.includes("permiso")) {
      return {
        text: "Puedes administrar el personal de la clínica, los permisos por rol y las directivas de seguridad en la sección de Usuarios.",
        actionLink: { text: "Gestión de Usuarios", path: "/usuarios" },
      };
    }
    return {
      text: "Comando administrativo verificado. El sistema se encuentra sincronizado y operando con normalidad.",
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateBotResponse(text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionLink: response.actionLink,
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "bot",
        text: roleConfig.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <>
      {/* BOTÓN FLOTANTE (FAB) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-[0_8px_30px_rgba(20,184,166,0.4)] hover:shadow-[0_12px_40px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
            aria-label="Abrir Asistente Virtual"
          >
            {/* Anillo de pulso sutil */}
            <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-40 animate-ping pointer-events-none" />
            <Bot className="w-7 h-7 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-400 border-2 border-slate-900" />
            </span>
          </button>
        )}
      </div>

      {/* VENTANA MODAL DEL CHATBOT */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] h-[560px] max-h-[85vh] flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-fadeIn">
          {/* CABECERA */}
          <div className="p-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight">NexusBot</h3>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/20 rounded-full uppercase tracking-wider">
                    {roleConfig.badge}
                  </span>
                </div>
                <p className="text-xs text-teal-100 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span>Asistente Virtual Activo</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/80 hover:text-white cursor-pointer"
                title="Reiniciar conversación"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/80 hover:text-white cursor-pointer"
                title="Cerrar asistente"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ÁREA DE MENSAJES */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-medium rounded-tr-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {msg.actionLink && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(msg.actionLink!.path);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-700 dark:text-teal-300 font-semibold text-xs transition-colors border border-teal-500/30 cursor-pointer"
                    >
                      <Zap size={13} />
                      <span>{msg.actionLink.text}</span>
                    </button>
                  )}

                  <span
                    className={`block text-[10px] mt-1 text-right ${
                      msg.sender === "user" ? "text-slate-800/70" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {/* INDICADOR DE ESCRITURA */}
            {isTyping && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs">
                <div className="h-7 w-7 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                  <Bot size={15} />
                </div>
                <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* SUGERENCIAS RÁPIDAS (CON ICONOS VECTORIALES LUCIDE) */}
          <div className="p-2.5 bg-slate-100/70 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {roleConfig.suggestions.map((suggestion, idx) => {
              const IconComponent = suggestion.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(suggestion.text)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer active:scale-95"
                >
                  <IconComponent size={13} className="text-teal-500" />
                  <span>{suggestion.text}</span>
                </button>
              );
            })}
          </div>

          {/* FORMULARIO DE ENVÍO */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Escribe tu mensaje aquí..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none border border-transparent focus:border-teal-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="h-9 w-9 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm shrink-0"
              aria-label="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
