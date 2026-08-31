import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  RefreshCw,
  Zap,
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

export default function ChatBotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = getUserRole(user);

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine role config
  const roleConfig = React.useMemo(() => {
    switch (role) {
      case "PACIENTE":
        return {
          title: "Asistente del Paciente",
          badge: "Paciente",
          color: "teal",
          initialMessage: `¡Hola ${user?.nombre || "Andrés"}! 👋 Soy tu asistente NexusOdonto. ¿En qué puedo ayudarte hoy con tus citas, tratamientos o cuidados dentales?`,
          suggestions: [
            "📅 ¿Cómo agendo una nueva cita?",
            "🔍 Consultar el estado de mis citas",
            "🦷 Consejos de cuidado tras una limpieza",
            "💳 Métodos de pago y convenios",
          ],
        };
      case "ODONTOLOGO":
        return {
          title: "Asistente Clínico",
          badge: "Odontólogo",
          color: "blue",
          initialMessage: `¡Saludos, Dr(a). ${user?.apellido || user?.nombre || ""}! 🦷 Estoy listo para asistirte con tu agenda de pacientes, odontograma e historias clínicas.`,
          suggestions: [
            "📋 Resumen de pacientes del día",
            "🦷 Guía para actualizar Odontograma",
            "📝 Protocolo de evolución clínica",
            "⏰ Consultar agenda de la semana",
          ],
        };
      case "RECEPCIONISTA":
        return {
          title: "Asistente de Recepción",
          badge: "Recepción",
          color: "purple",
          initialMessage: `¡Hola ${user?.nombre || "María"}! 🏥 Asistente de recepción listo para consultar disponibilidad médica, servicios y soporte de citas.`,
          suggestions: [
            "👨‍⚕️ Disponibilidad de odontólogos",
            "💰 Catálogo de servicios y precios",
            "➕ ¿Cómo registrar un paciente nuevo?",
            "📞 Protocolo de confirmación de citas",
          ],
        };
      case "ADMINISTRADOR":
      default:
        return {
          title: "Asistente de Supervisión",
          badge: "Admin",
          color: "cyan",
          initialMessage: `¡Hola Administrador ${user?.nombre || ""}! ⚡ Supervisión de NexusOdonto activa. ¿Qué métricas o configuraciones deseas consultar?`,
          suggestions: [
            "📊 Resumen de métricas del sistema",
            "👥 Gestión de usuarios y roles",
            "🛡️ Estado de seguridad y auditoría",
            "⚙️ Configuración general",
          ],
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

  // Reset messages when role changes
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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Generate intelligent response based on role and text
  const generateBotResponse = (prompt: string): { text: string; actionLink?: { text: string; path: string } } => {
    const lower = prompt.toLowerCase();

    if (role === "PACIENTE") {
      if (lower.includes("agendar") || lower.includes("nueva cita") || lower.includes("cita")) {
        return {
          text: "¡Con gusto! Puedes solicitar y agendar tu próxima cita odontológica seleccionando la fecha y tu odontólogo de preferencia en nuestra sección de citas.",
          actionLink: { text: "Ir a Mis Citas", path: "/citas" },
        };
      }
      if (lower.includes("estado") || lower.includes("mis citas") || lower.includes("consultar")) {
        return {
          text: "Tienes 1 cita programada: 'Limpieza y Valoración General' con la Dra. Laura Gómez el 15 de Septiembre a las 10:00 AM. Puedes ver el detalle en tu perfil.",
          actionLink: { text: "Ver en Mi Perfil", path: "/perfil" },
        };
      }
      if (lower.includes("cuidado") || lower.includes("limpieza") || lower.includes("consejo") || lower.includes("cepillado")) {
        return {
          text: "Recomendaciones post-tratamiento: 1) Cepilla tus dientes suavemente 3 veces al día con cerdas suaves. 2) Usa hilo dental a diario. 3) Evita alimentos extremadamente duros o con colorantes durante las primeras 24 horas.",
        };
      }
      if (lower.includes("pago") || lower.includes("precio") || lower.includes("tarifa") || lower.includes("convenio")) {
        return {
          text: "Aceptamos pagos con tarjeta de crédito, débito, transferencias y convenios con las principales entidades de salud. Para cotizaciones detalladas, acércate a recepción.",
        };
      }
      return {
        text: "Entiendo tu consulta. Recuerda que ante cualquier urgencia o molestia dental puedes comunicarte de inmediato con nuestra línea de atención o visitarnos en la clínica.",
      };
    }

    if (role === "ODONTOLOGO") {
      if (lower.includes("paciente") || lower.includes("resumen") || lower.includes("dia") || lower.includes("hoy")) {
        return {
          text: "Hoy tienes 4 pacientes citados: Andrés Pérez (10:00 AM - Limpieza), Claudia Ortiz (11:30 AM - Control Ortodoncia), Jorge Rivas (2:00 PM - Endodoncia) y Sofía Mora (4:00 PM - Valoración).",
          actionLink: { text: "Abrir Agenda Clínica", path: "/agenda" },
        };
      }
      if (lower.includes("odontograma") || lower.includes("diente") || lower.includes("grafico")) {
        return {
          text: "El Odontograma interactivo permite registrar hallazgos (caries, obturaciones, coronas) tanto en dentición permanente como temporal, y exportar reportes en PDF.",
          actionLink: { text: "Abrir Odontograma", path: "/odontograma" },
        };
      }
      if (lower.includes("historia") || lower.includes("evolucion") || lower.includes("nota")) {
        return {
          text: "Para registrar evoluciones clínicas, diagnósticos CIE-10 y procedimientos, puedes acceder al expediente electrónico del paciente.",
          actionLink: { text: "Ir a Historia Clínica", path: "/historia-clinica" },
        };
      }
      return {
        text: "Registrado. ¿Deseas que te asista con la búsqueda de antecedentes o el odontograma de algún paciente en particular?",
      };
    }

    if (role === "RECEPCIONISTA") {
      if (lower.includes("disponibilidad") || lower.includes("doctor") || lower.includes("odontologo")) {
        return {
          text: "La Dra. Laura Gómez tiene espacios libres hoy de 3:00 PM a 4:00 PM. El Dr. Carlos Méndez tiene disponibilidad mañana en la jornada de la mañana.",
          actionLink: { text: "Ver Agenda Completa", path: "/agenda" },
        };
      }
      if (lower.includes("servicio") || lower.includes("precio") || lower.includes("tarifa") || lower.includes("catalogo")) {
        return {
          text: "Nuestros servicios incluyen Profilaxis ($80.000), Resina Simple ($120.000), Blanqueamiento Láser ($450.000) e Implantes Dentales. Puedes consultar el catálogo completo.",
          actionLink: { text: "Ver Servicios", path: "/servicios" },
        };
      }
      if (lower.includes("nuevo paciente") || lower.includes("registrar") || lower.includes("crear")) {
        return {
          text: "Para admitir un paciente nuevo, solicita documento de identidad, nombres, teléfono y correo electrónico para crear su ficha clínica.",
          actionLink: { text: "Registrar Paciente", path: "/pacientes/nuevo" },
        };
      }
      return {
        text: "Información procesada. Puedes verificar el flujo de admisiones y agendamiento directamente en los módulos de Citas y Pacientes.",
      };
    }

    // ADMINISTRADOR
    if (lower.includes("metrica") || lower.includes("resumen") || lower.includes("rendimiento") || lower.includes("dashboard")) {
      return {
        text: "Estado del Sistema: 12 módulos operativos, 98.5% de cumplimiento en citas semanales, 4 roles activos y 0 incidencias críticas registradas en auditoría.",
        actionLink: { text: "Ir al Dashboard", path: "/dashboard" },
      };
    }
    if (lower.includes("usuario") || lower.includes("rol") || lower.includes("permiso")) {
      return {
        text: "Puedes administrar altas de personal médico, roles con políticas RBAC y auditoría de accesos desde el panel de administración.",
        actionLink: { text: "Gestión de Usuarios", path: "/usuarios" },
      };
    }
    return {
      text: "Comando administrativo recibido. El sistema se encuentra sincronizado con todas las políticas de acceso y seguridad activas.",
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
    }, 600);
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
            {/* Pulsing ring */}
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
                  Asistente Virtual Activo
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

            {/* TYPING INDICATOR */}
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

          {/* SUGERENCIAS RÁPIDAS (CHIPS) */}
          <div className="p-2.5 bg-slate-100/70 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {roleConfig.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(suggestion)}
                className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* INPUT FORM */}
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
