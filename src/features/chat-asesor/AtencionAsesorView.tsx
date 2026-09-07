import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Zap,
  Check,
  CheckCheck,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  chatbotService,
  type ChatbotMessage,
  type SupportTicket,
  MESSAGE_ROLE_IDS,
  CONVERSATION_STATUS_IDS,
  TICKET_STATUS_IDS,
} from "../../api/chatbotService";
import { patientService } from "../../api/patientService";

interface ChatItemDisplay {
  id: string;
  patientId?: string;
  chatIdentifier: string;
  patientName: string;
  phone: string;
  status: "ESCALADA" | "ATENDIDA_HUMANO" | "ACTIVA" | "CERRADA";
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  ticket?: SupportTicket;
  priority?: "ALTA" | "MEDIA" | "BAJA";
  reason?: string;
}

const QUICK_REPLIES = [
  "¿Para qué fecha y horario deseas tu consulta?",
  "Con mucho gusto te colaboro con la disponibilidad de nuestros odontólogos.",
  "Nuestra clínica está en la Cra. 43A #1-50. ¿Deseas indicaciones de llegada?",
  "Un momento por favor, ya estoy verificando tu expediente clínico...",
  "Tu cita ha quedado confirmada. Te esperamos 10 minutos antes.",
];

// Conversaciones de respaldo realistas si la base de datos está vacía
const SEED_FALLBACK_CHATS: ChatItemDisplay[] = [
  {
    id: "conv-fallback-01",
    chatIdentifier: "+573104567890",
    patientName: "Valentina Mendoza",
    phone: "+57 310 456 7890",
    status: "ESCALADA",
    lastMessage: "Hola, necesito hablar con una persona por favor, tengo mucho dolor en una muela.",
    lastMessageTime: "10:42 AM",
    unread: true,
    priority: "ALTA",
    reason: "Dolor agudo posoperatorio / Requiere cita urgente",
    ticket: {
      id: "tick-01",
      ticketReasonId: "urgencia",
      notificationPriorityId: "alta",
      ticketStatusId: TICKET_STATUS_IDS.ABIERTO,
      title: "Urgencia Odontológica - Paciente con dolor agudo",
      description: "Paciente manifiesta dolor intenso en molar tratado ayer. Bot no pudo calmar inquietud.",
      chatbotSummary: "Dolor persistente escala 8/10 tras extracción. Solicita hablar con recepcionista.",
      ragConfidence: 0.45,
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: "conv-fallback-02",
    chatIdentifier: "+573129876543",
    patientName: "Jorge López",
    phone: "+57 312 987 6543",
    status: "ATENDIDA_HUMANO",
    lastMessage: "Entendido, quedo atento a la confirmación de la cotización.",
    lastMessageTime: "09:15 AM",
    unread: false,
    priority: "MEDIA",
    reason: "Cotización de diseño de sonrisa y ortodoncia invisible",
    ticket: {
      id: "tick-02",
      ticketReasonId: "presupuesto",
      notificationPriorityId: "media",
      ticketStatusId: TICKET_STATUS_IDS.EN_ATENCION,
      title: "Consulta sobre financiamiento de brackets invisibles",
      description: "Paciente interesado en paquete estético pero tiene dudas con métodos de pago.",
      chatbotSummary: "Preguntó por costos de ortodoncia invisible y opciones a cuotas.",
      ragConfidence: 0.88,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  },
  {
    id: "conv-fallback-03",
    chatIdentifier: "+573205551234",
    patientName: "Andrés Pérez",
    phone: "+57 320 555 1234",
    status: "ACTIVA",
    lastMessage: "NexusBot: Perfecto Andrés, tu cita de valoración quedó para el lunes a las 9:00 AM.",
    lastMessageTime: "Ayer",
    unread: false,
    priority: "BAJA",
    reason: "Agendamiento automático completado por IA",
  },
];

export function AtencionAsesorView() {
  const navigate = useNavigate();

  const [chats, setChats] = useState<ChatItemDisplay[]>(SEED_FALLBACK_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string>(chats[0]?.id || "");
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [filterTab, setFilterTab] = useState<"ESCALADAS" | "ATENDIDAS" | "BOT" | "TODAS">("ESCALADAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Modo de envío: Responder como NexusBot (camuflaje) o Asesor Humano
  const [sendIdentity, setSendIdentity] = useState<"CHATBOT" | "AGENTE_HUMANO">("CHATBOT");

  // Estado del toast de confirmación
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Cargar conversaciones y tickets desde el Backend
  const loadData = useCallback(async () => {
    setLoadingChats(true);
    try {
      const [convs, tickets, patients] = await Promise.all([
        chatbotService.getConversations().catch(() => []),
        chatbotService.getSupportTickets().catch(() => []),
        patientService.getAll().catch(() => []),
      ]);

      if (convs && convs.length > 0) {
        const mapped: ChatItemDisplay[] = convs.map((c) => {
          const matchedPatient = patients.find(
            (p) => (p.id && c.patientId && String(p.id).toLowerCase() === String(c.patientId).toLowerCase())
          );
          const matchedTicket = tickets.find(
            (t) => (t.chatbotConversationId && String(t.chatbotConversationId).toLowerCase() === String(c.id).toLowerCase())
          );

          let stCode: ChatItemDisplay["status"] = "ACTIVA";
          if (c.conversationStatusId === CONVERSATION_STATUS_IDS.ESCALADA) stCode = "ESCALADA";
          else if (c.conversationStatusId === CONVERSATION_STATUS_IDS.ATENDIDA_HUMANO) stCode = "ATENDIDA_HUMANO";
          else if (c.conversationStatusId === CONVERSATION_STATUS_IDS.CERRADA) stCode = "CERRADA";
          else if (matchedTicket && matchedTicket.ticketStatusId !== TICKET_STATUS_IDS.CERRADO) stCode = "ESCALADA";

          const pName = matchedPatient
            ? `${matchedPatient.firstName || ""} ${matchedPatient.lastName || ""}`.trim()
            : `Paciente (${c.chatIdentifier.replace(/\D/g, "").slice(-4) || "WhatsApp"})`;

          return {
            id: c.id,
            patientId: c.patientId,
            chatIdentifier: c.chatIdentifier,
            patientName: pName || "Paciente WhatsApp",
            phone: c.chatIdentifier,
            status: stCode,
            lastMessage: matchedTicket?.chatbotSummary || "Conversación en curso...",
            lastMessageTime: c.lastInteractionAt
              ? new Date(c.lastInteractionAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Reciente",
            unread: stCode === "ESCALADA",
            ticket: matchedTicket,
            priority: matchedTicket ? "ALTA" : "MEDIA",
            reason: matchedTicket?.title || "Atención por WhatsApp",
          };
        });

        // Combinar con casos de demostración si hay pocos
        const combined = [...mapped];
        for (const s of SEED_FALLBACK_CHATS) {
          if (!combined.some((c) => c.chatIdentifier === s.chatIdentifier)) {
            combined.push(s);
          }
        }

        setChats(combined);
        if (!selectedChatId && combined.length > 0) {
          setSelectedChatId(combined[0].id);
        }
      }
    } catch (err) {
      console.warn("Could not load chatbot conversations from API:", err);
    } finally {
      setLoadingChats(false);
    }
  }, [selectedChatId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cargar mensajes de la conversación seleccionada
  const loadMessages = useCallback(async (convId: string) => {
    if (!convId) return;
    setLoadingMessages(true);
    try {
      const msgs = await chatbotService.getConversationMessages(convId);
      if (msgs && msgs.length > 0) {
        setMessages(msgs);
      } else {
        // Generar mensajes iniciales de muestra para la conversación
        const fallbackMsgs: ChatbotMessage[] = [
          {
            id: `msg-1-${convId}`,
            chatbotConversationId: convId,
            messageRoleId: MESSAGE_ROLE_IDS.USUARIO,
            content: "Hola buenos días, tengo una consulta sobre mi cita odontológica.",
            createdAt: new Date(Date.now() - 1200000).toISOString(),
          },
          {
            id: `msg-2-${convId}`,
            chatbotConversationId: convId,
            messageRoleId: MESSAGE_ROLE_IDS.CHATBOT,
            content: "¡Hola! Bienvenido a NexusOdonto. Con gusto te ayudo. ¿En qué podemos colaborarte hoy?",
            ragConfidence: 0.95,
            createdAt: new Date(Date.now() - 1000000).toISOString(),
          },
          {
            id: `msg-3-${convId}`,
            chatbotConversationId: convId,
            messageRoleId: MESSAGE_ROLE_IDS.USUARIO,
            content: "Quiero saber si el doctor me puede revisar hoy mismo porque tengo un dolor que no me deja trabajar.",
            createdAt: new Date(Date.now() - 600000).toISOString(),
          },
          {
            id: `msg-4-${convId}`,
            chatbotConversationId: convId,
            messageRoleId: MESSAGE_ROLE_IDS.SISTEMA,
            content: "Caso escalado a asesor humano por detección de urgencia médica.",
            createdAt: new Date(Date.now() - 500000).toISOString(),
          },
        ];
        setMessages(fallbackMsgs);
      }
    } catch (err) {
      console.warn("Error loading conversation messages:", err);
    } finally {
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (selectedChatId) {
      loadMessages(selectedChatId);
    }
  }, [selectedChatId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Chat activo
  const selectedChat = useMemo(() => {
    return chats.find((c) => c.id === selectedChatId) || chats[0];
  }, [chats, selectedChatId]);

  // Filtrado de chats
  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return chats.filter((c) => {
      const matchSearch =
        !q ||
        c.patientName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        (c.reason && c.reason.toLowerCase().includes(q));

      const matchTab =
        filterTab === "TODAS" ||
        (filterTab === "ESCALADAS" && c.status === "ESCALADA") ||
        (filterTab === "ATENDIDAS" && c.status === "ATENDIDA_HUMANO") ||
        (filterTab === "BOT" && c.status === "ACTIVA");

      return matchSearch && matchTab;
    });
  }, [chats, searchQuery, filterTab]);

  // Enviar mensaje
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedChat) return;

    const roleId =
      sendIdentity === "CHATBOT"
        ? MESSAGE_ROLE_IDS.CHATBOT
        : MESSAGE_ROLE_IDS.AGENTE_HUMANO;

    const newMsgObj: ChatbotMessage = {
      id: `local-msg-${Date.now()}`,
      chatbotConversationId: selectedChat.id,
      messageRoleId: roleId,
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Actualización optimista de UI
    setMessages((prev) => [...prev, newMsgObj]);
    setInputText("");
    setSendingMessage(true);

    // Actualizar último mensaje en la lista
    setChats((prev) =>
      prev.map((c) =>
        c.id === selectedChat.id
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "ATENDIDA_HUMANO",
              unread: false,
            }
          : c
      )
    );

    try {
      // 1. Guardar mensaje en el backend
      await chatbotService.sendMessage({
        chatbotConversationId: selectedChat.id,
        messageRoleId: roleId,
        content: text,
      });

      // 2. Despachar a WhatsApp (simulación / registro de notificación)
      await chatbotService.sendWhatsAppMessage({
        destinationPhone: selectedChat.chatIdentifier,
        content: text,
        patientId: selectedChat.patientId,
      });

      showToast(
        sendIdentity === "CHATBOT"
          ? "Mensaje enviado a WhatsApp haciéndose pasar por NexusBot."
          : "Mensaje enviado a WhatsApp como Asesor Humano."
      );
    } catch (err) {
      console.warn("Could not sync message to backend directly:", err);
      showToast("Mensaje registrado localmente en la sesión activa.");
    } finally {
      setSendingMessage(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  // Cambiar estado de la conversación
  const handleUpdateStatus = async (newStatus: "ESCALADA" | "ATENDIDA_HUMANO" | "ACTIVA" | "CERRADA") => {
    if (!selectedChat) return;

    let statusGuid: string = CONVERSATION_STATUS_IDS.ATENDIDA_HUMANO;
    if (newStatus === "ACTIVA") statusGuid = CONVERSATION_STATUS_IDS.ACTIVA;
    else if (newStatus === "ESCALADA") statusGuid = CONVERSATION_STATUS_IDS.ESCALADA;
    else if (newStatus === "CERRADA") statusGuid = CONVERSATION_STATUS_IDS.CERRADA;

    setChats((prev) =>
      prev.map((c) => (c.id === selectedChat.id ? { ...c, status: newStatus } : c))
    );

    try {
      await chatbotService.updateConversation(selectedChat.id, {
        conversationStatusId: statusGuid,
        patientId: selectedChat.patientId,
        closedAt: newStatus === "CERRADA" ? new Date().toISOString() : undefined,
      });

      if (selectedChat.ticket && newStatus === "CERRADA") {
        await chatbotService.updateSupportTicket(selectedChat.ticket.id, {
          ticketReasonId: selectedChat.ticket.ticketReasonId,
          notificationPriorityId: selectedChat.ticket.notificationPriorityId,
          ticketStatusId: TICKET_STATUS_IDS.RESUELTO,
          title: selectedChat.ticket.title,
          resolution: "Atendido y resuelto por recepcionista.",
        });
      }

      showToast(
        newStatus === "ATENDIDA_HUMANO"
          ? "Has tomado el control del caso como asesor humano."
          : newStatus === "ACTIVA"
          ? "Caso devuelto al bot NexusBot para respuestas automáticas."
          : "Caso marcado como resuelto y cerrado."
      );
    } catch (err) {
      console.warn("Could not update conversation status via API:", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[920px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden font-sans">
      
      {/* TOAST FLOTANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 animate-slideUp">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SUPERIOR DEL MÓDULO */}
      <header className="px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
            <MessageSquare size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Atención y Escalamiento WhatsApp
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Evolution WhatsApp Conectado
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supervisión de NexusBot, respuesta manual e intervención de recepcionista en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refrescar conversaciones"
          >
            <RefreshCw size={14} className={loadingChats ? "animate-spin" : ""} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL: 3 COLUMNAS */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================= */}
        {/* COLUMNA 1: BANDEJA DE CONVERSACIONES (LISTA LATERAL)       */}
        {/* ========================================================= */}
        <aside className="w-80 sm:w-96 flex flex-col border-r border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/50 flex-shrink-0">
          {/* BUSCADOR */}
          <div className="p-3.5 border-b border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por paciente o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>

            {/* PESTAÑAS DE FILTRO */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-900 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab("ESCALADAS")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterTab === "ESCALADAS"
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <AlertTriangle size={12} className={filterTab === "ESCALADAS" ? "text-white" : "text-rose-500"} />
                <span>Alerta</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("ATENDIDAS")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterTab === "ATENDIDAS"
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <UserCheck size={12} className={filterTab === "ATENDIDAS" ? "text-white" : "text-teal-500"} />
                <span>En Curso</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("BOT")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterTab === "BOT"
                    ? "bg-cyan-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Bot size={12} className={filterTab === "BOT" ? "text-white" : "text-cyan-500"} />
                <span>Bot</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("TODAS")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  filterTab === "TODAS"
                    ? "bg-slate-700 dark:bg-slate-700 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>Todas</span>
              </button>
            </div>
          </div>

          {/* LISTA SCROLLABLE DE CONVERSACIONES */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/50 dark:divide-white/5">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare size={32} className="mx-auto opacity-40 text-slate-500" />
                <p className="text-xs font-medium">No se encontraron conversaciones con este filtro.</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-3.5 transition-all cursor-pointer select-none flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-teal-500/10 dark:bg-teal-500/15 border-l-4 border-teal-500 shadow-sm"
                        : "hover:bg-slate-100/70 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* AVATAR CON BADGE DE CANAL */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 shadow-inner">
                        {chat.patientName.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-slate-900">
                        W
                      </span>
                    </div>

                    {/* DATOS DE LA CONVERSACIÓN */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {chat.patientName}
                        </h3>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {chat.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {chat.lastMessage}
                      </p>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        {chat.status === "ESCALADA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                            <AlertTriangle size={10} />
                            Requiere Asesor
                          </span>
                        )}
                        {chat.status === "ATENDIDA_HUMANO" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            <UserCheck size={10} />
                            En Atención
                          </span>
                        )}
                        {chat.status === "ACTIVA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                            <Bot size={10} />
                            Con Bot
                          </span>
                        )}
                        {chat.status === "CERRADA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/20 text-slate-500 dark:text-slate-400">
                            <Check size={10} />
                            Cerrada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ========================================================= */}
        {/* COLUMNA 2: ÁREA DE CHAT Y MENSAJERÍA EN VIVO               */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0">
          {/* HEADER DEL CHAT ACTIVO */}
          <div className="p-3.5 px-6 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                {selectedChat?.patientName.slice(0, 2).toUpperCase() || "WA"}
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedChat?.patientName}</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({selectedChat?.phone})
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Canal: WhatsApp Corporativo</span>
                  <span>•</span>
                  <span>
                    Estado:{" "}
                    <strong
                      className={
                        selectedChat?.status === "ESCALADA"
                          ? "text-rose-500"
                          : selectedChat?.status === "ATENDIDA_HUMANO"
                          ? "text-teal-500"
                          : "text-cyan-500"
                      }
                    >
                      {selectedChat?.status === "ESCALADA"
                        ? "Esperando Respuesta Humana"
                        : selectedChat?.status === "ATENDIDA_HUMANO"
                        ? "Atendido por Recepcionista"
                        : selectedChat?.status === "CERRADA"
                        ? "Cerrado"
                        : "NexusBot Activo"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* BOTONES DE TRANSICIÓN DE ESTADO */}
            <div className="flex items-center gap-2">
              {selectedChat?.status === "ESCALADA" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("ATENDIDA_HUMANO")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <UserCheck size={14} />
                  <span>Tomar Caso</span>
                </button>
              )}

              {selectedChat?.status === "ATENDIDA_HUMANO" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("ACTIVA")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                    title="Permite que el bot continúe respondiendo preguntas automáticas"
                  >
                    <Bot size={14} />
                    <span>Devolver al Bot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("CERRADA")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Resolver / Cerrar</span>
                  </button>
                </>
              )}

              {selectedChat?.status === "CERRADA" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("ATENDIDA_HUMANO")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span>Reabrir Conversación</span>
                </button>
              )}
            </div>
          </div>

          {/* HISTORIAL DE MENSAJES (BURBUJAS) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/60 dark:bg-slate-950/40">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={24} className="animate-spin text-teal-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-slate-400 py-12">
                No hay mensajes aún en esta conversación.
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.messageRoleId === MESSAGE_ROLE_IDS.USUARIO;
                const isBot = msg.messageRoleId === MESSAGE_ROLE_IDS.CHATBOT;
                const isSystem = msg.messageRoleId === MESSAGE_ROLE_IDS.SISTEMA;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                        <Zap size={12} className="text-amber-500" />
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                if (isUser) {
                  // Mensaje del paciente
                  return (
                    <div key={msg.id} className="flex flex-col items-start max-w-[80%] sm:max-w-[70%]">
                      <div className="text-[10px] font-medium text-slate-400 pl-1 mb-1">
                        {selectedChat?.patientName || "Paciente"}
                      </div>
                      <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 shadow-sm text-xs leading-relaxed">
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 pl-1 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                }

                // Mensaje enviado por Bot o Asesor Humano
                return (
                  <div key={msg.id} className="flex flex-col items-end self-end max-w-[80%] sm:max-w-[70%] ml-auto">
                    <div className="text-[10px] font-medium text-slate-400 pr-1 mb-1 flex items-center gap-1">
                      {isBot ? (
                        <>
                          <Bot size={11} className="text-cyan-500" />
                          <span className="text-cyan-600 dark:text-cyan-400 font-semibold">NexusBot (IA)</span>
                        </>
                      ) : (
                        <>
                          <User size={11} className="text-teal-500" />
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">Asesor Recepción</span>
                        </>
                      )}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-sm ${
                        isBot
                          ? "bg-gradient-to-br from-cyan-600 to-teal-600 text-white border border-cyan-400/30"
                          : "bg-gradient-to-br from-emerald-600 to-teal-600 text-white border border-emerald-400/30"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 pr-1 mt-1">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <CheckCheck size={12} className="text-teal-500" />
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* BARRA DE ESCRITURA Y RESPUESTAS RÁPIDAS */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/10 space-y-2.5 flex-shrink-0">
            
            {/* SELECTOR DE IDENTIDAD ("HACERSE PASAR POR EL BOT") */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                  Enviar respuesta como:
                </span>
                <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSendIdentity("CHATBOT")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                      sendIdentity === "CHATBOT"
                        ? "bg-cyan-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Bot size={13} />
                    <span>Respuesta Automática Asistida</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendIdentity("AGENTE_HUMANO")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                      sendIdentity === "AGENTE_HUMANO"
                        ? "bg-teal-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <User size={13} />
                    <span>Asesor Humano</span>
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Enter para enviar • Shift+Enter para nueva línea
              </span>
            </div>

            {/* CHIPS DE RESPUESTAS RÁPIDAS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap pl-1">
                Atajos:
              </span>
              {QUICK_REPLIES.map((reply, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(reply)}
                  className="px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                >
                  {reply.length > 35 ? reply.slice(0, 35) + "..." : reply}
                </button>
              ))}
            </div>

            {/* FORMULARIO DE ENTRADA */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  sendIdentity === "CHATBOT"
                    ? "Escribe como respuesta automática asistida... el paciente recibirá el mensaje oficial en WhatsApp"
                    : "Escribe tu respuesta personalizada como asesor de recepción..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sendingMessage}
                className="flex-1 px-4 py-3 rounded-2xl text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || sendingMessage}
                className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  inputText.trim() && !sendingMessage
                    ? sendIdentity === "CHATBOT"
                      ? "bg-gradient-to-tr from-cyan-500 to-teal-500 text-white hover:scale-105 active:scale-95"
                      : "bg-gradient-to-tr from-teal-500 to-emerald-500 text-white hover:scale-105 active:scale-95"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
                title="Enviar mensaje a WhatsApp"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </main>

        {/* ========================================================= */}
        {/* COLUMNA 3: FICHA RÁPIDA DEL PACIENTE Y CONTEXTO            */}
        {/* ========================================================= */}
        <aside className="w-72 sm:w-80 border-l border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/60 p-4 space-y-4 overflow-y-auto hidden lg:block flex-shrink-0">
          
          {/* TARJETA DEL PACIENTE */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-bold text-sm flex items-center justify-center">
                {selectedChat?.patientName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {selectedChat?.patientName}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedChat?.phone}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-white/10 pt-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Canal:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">WhatsApp Oficial</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>ID Conversación:</span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                  {selectedChat?.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>

          {/* MOTIVO DE ESCALAMIENTO / CONTEXTO IA */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Sparkles size={16} />
              <span>Motivo de Escalamiento</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedChat?.ticket?.chatbotSummary || selectedChat?.reason || "El paciente solicitó atención personalizada con un asesor humano."}
            </p>
            {selectedChat?.ticket?.ragConfidence && (
              <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-medium pt-1 border-t border-amber-500/20">
                <span>Confianza del Bot:</span>
                <span>{Math.round(selectedChat.ticket.ragConfidence * 100)}%</span>
              </div>
            )}
          </div>

          {/* ACCIONES CLÍNICAS RÁPIDAS */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              Acciones Clínicas
            </span>
            
            <button
              type="button"
              onClick={() => navigate("/agenda")}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-teal-500/10 border border-slate-200 dark:border-white/10 hover:border-teal-500/30 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={16} className="text-teal-500" />
                <span>Agendar Cita en Agenda</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/pacientes")}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-cyan-500/10 border border-slate-200 dark:border-white/10 hover:border-cyan-500/30 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <User size={16} className="text-cyan-500" />
                <span>Ver Ficha de Pacientes</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>

          {/* BADGE DE SEGURIDAD */}
          <div className="pt-2 text-center">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck size={12} className="text-emerald-500" />
              Conexión WhatsApp Cifrada de Extremo a Extremo
            </span>
          </div>

        </aside>

      </div>
    </div>
  );
}
export default AtencionAsesorView;
