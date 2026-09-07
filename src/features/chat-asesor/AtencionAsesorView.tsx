import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Send,
  User,
  Bot,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Phone,
  RefreshCw,
  Search,
  Check,
  Sparkles,
  Calendar,
  ChevronRight,
  X,
  Inbox,
  Bell,
} from "lucide-react";
import {
  chatbotService,
  MESSAGE_ROLE_IDS,
  CONVERSATION_STATUS_IDS,
  TICKET_STATUS_IDS,
} from "../../api/chatbotService";
import type { ChatbotMessage, SupportTicket } from "../../api/chatbotService";
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
  rawTimestamp: string;
  unread: boolean;
  unreadCount: number;
  ticket?: SupportTicket;
  priority?: "ALTA" | "MEDIA" | "BAJA";
  reason?: string;
}

// Función utilitaria para desduplicar mensajes por ID y por contenido/rol/marcas de tiempo cercanas
function deduplicateMessages(msgs: ChatbotMessage[]): ChatbotMessage[] {
  const seenIds = new Set<string>();
  const result: ChatbotMessage[] = [];

  for (const m of msgs) {
    if (m.id && seenIds.has(m.id)) continue;
    if (m.id) seenIds.add(m.id);

    const isDuplicate = result.some((prev) => {
      if (
        prev.content.trim() === m.content.trim() &&
        String(prev.messageRoleId).toLowerCase() === String(m.messageRoleId).toLowerCase()
      ) {
        const t1 = new Date(prev.createdAt).getTime();
        const t2 = new Date(m.createdAt).getTime();
        if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) < 10000) {
          return true;
        }
      }
      return false;
    });

    if (!isDuplicate) {
      result.push(m);
    }
  }

  return result;
}

// Función utilitaria para formatear números de teléfono y JIDs de WhatsApp
function formatPhone(identifier: string, patientPhone?: string): string {
  const raw = patientPhone || identifier || "";
  if (!raw) return "WhatsApp";

  const cleanedDomain = raw.replace(/@.*$/, "").trim();
  const digitsOnly = cleanedDomain.replace(/\D/g, "");

  if (!digitsOnly) return cleanedDomain;

  // Mapeo específico para el LID de pruebas 57213628510462 de WhatsApp Evolution API
  if (digitsOnly === "57213628510462" || cleanedDomain.includes("57213628510462")) {
    return "+57 323 889 1073";
  }

  // Celulares colombianos de 10 dígitos (ej. 3238891073)
  if (digitsOnly.length === 10 && digitsOnly.startsWith("3")) {
    return `+57 ${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }

  // Celulares colombianos de 12 dígitos (ej. 573238891073)
  if (digitsOnly.length === 12 && digitsOnly.startsWith("573")) {
    return `+57 ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`;
  }

  // Teléfonos fijos colombianos de 12 dígitos (ej. 576012345678)
  if (digitsOnly.length === 12 && digitsOnly.startsWith("5760")) {
    return `+57 (60${digitsOnly.slice(4, 5)}) ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`;
  }

  // Teléfonos fijos colombianos de 10 dígitos (ej. 6012345678)
  if (digitsOnly.length === 10 && digitsOnly.startsWith("60")) {
    return `+57 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
  }

  if (digitsOnly.length >= 10 && digitsOnly.length <= 12) {
    if (digitsOnly.startsWith("57")) {
      return `+57 ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`;
    }
    return `+${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 7)} ${digitsOnly.slice(7)}`;
  }

  return `+${digitsOnly}`;
}

// Función utilitaria para corregir el desfase de zona horaria (UTC a Hora Local)
function formatTime(dateStr?: string): string {
  if (!dateStr) return "Reciente";
  let isoStr = dateStr.trim();
  if (!isoStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(isoStr)) {
    isoStr += "Z";
  }
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return "Reciente";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Helper para convertir timestamp a epoch para ordenamiento descendente
function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  let isoStr = dateStr.trim();
  if (!isoStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(isoStr)) {
    isoStr += "Z";
  }
  const t = new Date(isoStr).getTime();
  return isNaN(t) ? 0 : t;
}

function formatTicketSummary(summary?: string, reason?: string): string {
  const text = summary || reason || "";
  if (!text) return "Conversación en curso por WhatsApp";

  let cleaned = text.replace(/\d+@(s\.whatsapp\.net|lid|c\.us)/gi, "").replace(/@.*$/, "").trim();

  if (cleaned.includes("SOLICITUD_USUARIO")) {
    return "El paciente solicitó atención personalizada con un asesor humano.";
  }
  if (cleaned.includes("BAJA_CONFIANZA_RAG")) {
    return "Transferencia por baja confianza en la respuesta automática de la IA.";
  }
  if (cleaned.includes("EMERGENCIA") || cleaned.includes("URGENCIA")) {
    return "Urgencia odontológica detectada.";
  }

  cleaned = cleaned.replace(/^Paciente\s+.*?reportó:\s*/i, "").trim();
  cleaned = cleaned.replace(/^Paciente\s+reportó:\s*/i, "").trim();

  return cleaned || "Atención requerida por WhatsApp";
}

function getAvatarText(name: string): string {
  if (!name) return "WA";
  if (name.startsWith("+") || /^\d/.test(name)) {
    return "WA";
  }
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function isUserMessage(roleIdStr?: string): boolean {
  if (!roleIdStr) return false;
  const str = roleIdStr.toLowerCase();
  return (
    str === MESSAGE_ROLE_IDS.USUARIO.toLowerCase() ||
    str === "usuario" ||
    str === "user"
  );
}

function isBotMessage(roleIdStr?: string): boolean {
  if (!roleIdStr) return false;
  const str = roleIdStr.toLowerCase();
  return (
    str === MESSAGE_ROLE_IDS.CHATBOT.toLowerCase() ||
    str === "chatbot" ||
    str === "bot"
  );
}

function isAgenteMessage(roleIdStr?: string): boolean {
  if (!roleIdStr) return false;
  const str = roleIdStr.toLowerCase();
  return (
    str === MESSAGE_ROLE_IDS.AGENTE_HUMANO.toLowerCase() ||
    str === "agente_humano" ||
    str === "agente" ||
    str === "human_agent"
  );
}

export function AtencionAsesorView() {
  const navigate = useNavigate();

  const [chats, setChats] = useState<ChatItemDisplay[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [filterTab, setFilterTab] = useState<"ESCALADAS" | "ATENDIDAS" | "BOT" | "TODAS">("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [sendIdentity, setSendIdentity] = useState<"CHATBOT" | "AGENTE_HUMANO">("CHATBOT");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const readSetRef = useRef<Set<string>>(new Set());
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const lastMsgCountRef = useRef<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingChats(true);
    try {
      const [convs, tickets, patients, allMsgs] = await Promise.all([
        chatbotService.getConversations().catch(() => []),
        chatbotService.getSupportTickets().catch(() => []),
        patientService.getAll().catch(() => []),
        chatbotService.getAllMessages().catch(() => []),
      ]);

      if (convs && convs.length > 0) {
        const mapped: ChatItemDisplay[] = convs.map((c) => {
          const cleanDigits = (str?: string) => (str || "").replace(/\D/g, "");
          const chatDigits = cleanDigits(c.chatIdentifier);

          const matchedPatient = patients.find(
            (p) =>
              (p.id && c.patientId && String(p.id).toLowerCase() === String(c.patientId).toLowerCase()) ||
              (p.phone && chatDigits && cleanDigits(p.phone).endsWith(chatDigits.slice(-10))) ||
              (p.emergencyPhone && chatDigits && cleanDigits(p.emergencyPhone).endsWith(chatDigits.slice(-10)))
          );
          const matchedTicket = tickets.find(
            (t) => t.chatbotConversationId && String(t.chatbotConversationId).toLowerCase() === String(c.id).toLowerCase()
          );

          let stCode: ChatItemDisplay["status"] = "ACTIVA";
          if (c.conversationStatusId === CONVERSATION_STATUS_IDS.ESCALADA) stCode = "ESCALADA";
          else if (c.conversationStatusId === CONVERSATION_STATUS_IDS.ATENDIDA_HUMANO) stCode = "ATENDIDA_HUMANO";
          else if (c.conversationStatusId === CONVERSATION_STATUS_IDS.CERRADA) stCode = "CERRADA";
          else if (matchedTicket && matchedTicket.ticketStatusId !== TICKET_STATUS_IDS.CERRADO) stCode = "ESCALADA";

          const formattedPhone = formatPhone(c.chatIdentifier, matchedPatient?.phone || matchedPatient?.emergencyPhone);

          const pName = matchedPatient
            ? `${matchedPatient.firstName || ""} ${matchedPatient.lastName || ""}`.trim()
            : formattedPhone;

          const cleanSummary = formatTicketSummary(matchedTicket?.chatbotSummary, matchedTicket?.title);

          const convMsgs = allMsgs
            .filter(
              (m) =>
                m.chatbotConversationId &&
                String(m.chatbotConversationId).toLowerCase() === String(c.id).toLowerCase()
            )
            .sort((a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt));

          const lastMsg = convMsgs.length > 0 ? convMsgs[convMsgs.length - 1] : null;

          const rawTime = lastMsg?.createdAt || c.lastInteractionAt || c.startedAt || "";
          const formattedTime = formatTime(rawTime);
          const displayLastMessage = lastMsg?.content || cleanSummary;

          const isRead = readSetRef.current.has(c.id) || c.id === selectedChatId;
          const currentUnreadCount = isRead
            ? 0
            : unreadMap[c.id] !== undefined
            ? unreadMap[c.id]
            : stCode === "ESCALADA"
            ? 1
            : 0;

          return {
            id: c.id,
            patientId: c.patientId,
            chatIdentifier: c.chatIdentifier,
            patientName: pName,
            phone: formattedPhone,
            status: stCode,
            lastMessage: displayLastMessage,
            lastMessageTime: formattedTime,
            rawTimestamp: rawTime,
            unread: currentUnreadCount > 0,
            unreadCount: currentUnreadCount,
            ticket: matchedTicket,
            priority: matchedTicket ? "ALTA" : "MEDIA",
            reason: cleanSummary,
          };
        });

        mapped.sort((a, b) => parseTimestamp(b.rawTimestamp) - parseTimestamp(a.rawTimestamp));

        setChats(mapped);

        setSelectedChatId((prev) => {
          if (prev && mapped.some((ch) => ch.id === prev)) return prev;
          return mapped[0]?.id || "";
        });
      } else {
        setChats([]);
        setSelectedChatId("");
      }
    } catch (err) {
      console.warn("Could not load chatbot conversations from API:", err);
      if (!isSilent) setChats([]);
    } finally {
      if (!isSilent) setLoadingChats(false);
    }
  }, [selectedChatId, unreadMap]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMessages = useCallback(async (convId: string, isSilent = false) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    if (!isSilent) setLoadingMessages(true);
    try {
      const msgs = await chatbotService.getConversationMessages(convId);
      if (msgs && msgs.length > 0) {
        setMessages(deduplicateMessages(msgs));

        const prevCount = lastMsgCountRef.current[convId] || 0;
        if (isSilent && msgs.length > prevCount) {
          const lastMsg = msgs[msgs.length - 1];
          if (isUserMessage(lastMsg.messageRoleId)) {
            showToast(`💬 Nuevo mensaje de WhatsApp: ${lastMsg.content.slice(0, 30)}...`);
          }
        }
        lastMsgCountRef.current[convId] = msgs.length;

        const lastUserOrBotMsg = msgs[msgs.length - 1];
        if (lastUserOrBotMsg?.content) {
          const rawTime = lastUserOrBotMsg.createdAt;
          const newTime = formatTime(rawTime);
          setChats((prev) => {
            const updated = prev.map((ch) =>
              ch.id === convId
                ? { ...ch, lastMessage: lastUserOrBotMsg.content, lastMessageTime: newTime, rawTimestamp: rawTime }
                : ch
            );
            return updated.sort((a, b) => parseTimestamp(b.rawTimestamp) - parseTimestamp(a.rawTimestamp));
          });
        }
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn("Error loading conversation messages:", err);
      if (!isSilent) setMessages([]);
    } finally {
      if (!isSilent) setLoadingMessages(false);
      setTimeout(scrollToBottom, 100);
    }
  }, [scrollToBottom, showToast]);

  useEffect(() => {
    if (selectedChatId) {
      readSetRef.current.add(selectedChatId);
      setUnreadMap((prev) => ({ ...prev, [selectedChatId]: 0 }));
      setChats((prev) =>
        prev.map((c) => (c.id === selectedChatId ? { ...c, unread: false, unreadCount: 0 } : c))
      );
      loadMessages(selectedChatId);
    } else {
      setMessages([]);
    }
  }, [selectedChatId, loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
      if (selectedChatId) {
        loadMessages(selectedChatId, true);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData, loadMessages, selectedChatId]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId),
    [chats, selectedChatId]
  );

  const counts = useMemo(() => {
    return {
      escaladas: chats.filter((c) => c.status === "ESCALADA").length,
      atendidas: chats.filter((c) => c.status === "ATENDIDA_HUMANO").length,
      bot: chats.filter((c) => c.status === "ACTIVA").length,
      todas: chats.length,
    };
  }, [chats]);

  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = chats.filter((c) => {
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

    return list.sort((a, b) => parseTimestamp(b.rawTimestamp) - parseTimestamp(a.rawTimestamp));
  }, [chats, searchQuery, filterTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedChat) return;

    const roleId =
      sendIdentity === "CHATBOT"
        ? MESSAGE_ROLE_IDS.CHATBOT
        : MESSAGE_ROLE_IDS.AGENTE_HUMANO;

    const currentTimeIso = new Date().toISOString();
    const formattedNow = formatTime(currentTimeIso);

    const newMsgObj: ChatbotMessage = {
      id: `local-msg-${Date.now()}`,
      chatbotConversationId: selectedChat.id,
      messageRoleId: roleId,
      content: text,
      createdAt: currentTimeIso,
    };

    setMessages((prev) => deduplicateMessages([...prev, newMsgObj]));
    setInputText("");
    setSendingMessage(true);

    readSetRef.current.add(selectedChat.id);

    setChats((prev) => {
      const updated = prev.map((c) =>
        c.id === selectedChat.id
          ? {
              ...c,
              lastMessage: text,
              lastMessageTime: formattedNow,
              rawTimestamp: currentTimeIso,
              status: "ATENDIDA_HUMANO" as const,
              unread: false,
              unreadCount: 0,
            }
          : c
      );
      return updated.sort((a, b) => parseTimestamp(b.rawTimestamp) - parseTimestamp(a.rawTimestamp));
    });

    try {
      let sentToBackend = false;

      if (selectedChat.ticket?.id && !selectedChat.ticket.id.startsWith("tick-")) {
        try {
          await chatbotService.replyToTicket(selectedChat.ticket.id, text, roleId);
          sentToBackend = true;
        } catch (ticketErr) {
          console.warn("replyToTicket failed, falling back to direct message send:", ticketErr);
        }
      }

      if (!sentToBackend) {
        await chatbotService.sendMessage({
          chatbotConversationId: selectedChat.id,
          messageRoleId: roleId,
          content: text,
        }).catch(() => null);

        const cleanPhone = selectedChat.chatIdentifier.replace(/@.*$/, "").replace(/\D/g, "");
        await chatbotService.sendWhatsAppMessage({
          destinationPhone: cleanPhone || selectedChat.chatIdentifier,
          content: text,
          patientId: selectedChat.patientId,
        });
      }

      showToast(
        sendIdentity === "CHATBOT"
          ? "Mensaje enviado a WhatsApp haciéndose pasar por NexusBot (Camuflaje IA)."
          : "Mensaje enviado a WhatsApp como Asesor Humano de Recepción."
      );
    } catch (err) {
      console.warn("Could not sync message to backend directly:", err);
      showToast("Mensaje registrado localmente en la sesión activa.");
    } finally {
      setSendingMessage(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleUpdateStatus = async (newStatus: "ESCALADA" | "ATENDIDA_HUMANO" | "ACTIVA" | "CERRADA") => {
    if (!selectedChat) return;

    let statusGuid: string = CONVERSATION_STATUS_IDS.ATENDIDA_HUMANO;
    if (newStatus === "ACTIVA") statusGuid = CONVERSATION_STATUS_IDS.ACTIVA;
    else if (newStatus === "ESCALADA") statusGuid = CONVERSATION_STATUS_IDS.ESCALADA;
    else if (newStatus === "CERRADA") statusGuid = CONVERSATION_STATUS_IDS.CERRADA;

    const targetConvId = selectedChat.id;
    readSetRef.current.add(targetConvId);

    setChats((prev) =>
      prev.map((c) => (c.id === targetConvId ? { ...c, status: newStatus, unread: false, unreadCount: 0 } : c))
    );

    if (newStatus === "ATENDIDA_HUMANO") {
      setFilterTab("ATENDIDAS");
    } else if (newStatus === "ACTIVA") {
      setFilterTab("BOT");
    } else if (newStatus === "CERRADA") {
      setFilterTab("TODAS");
    }

    try {
      await chatbotService.updateConversation(targetConvId, {
        conversationStatusId: statusGuid,
        patientId: selectedChat.patientId,
        closedAt: newStatus === "CERRADA" ? new Date().toISOString() : undefined,
      });

      if (selectedChat.ticket) {
        if (newStatus === "CERRADA" || newStatus === "ACTIVA") {
          await chatbotService.resolveTicket(
            selectedChat.ticket.id,
            newStatus === "ACTIVA" ? "Devuelto al bot para atención automática." : "Atendido y cerrado por recepcionista."
          );
        }
      }

      showToast(
        newStatus === "ATENDIDA_HUMANO"
          ? "Has tomado el control del caso como Asesor Humano."
          : newStatus === "ACTIVA"
          ? "Caso devuelto al bot NexusBot para respuestas automáticas."
          : "Caso resuelto y marcado como cerrado."
      );
    } catch (err) {
      console.warn("Could not update conversation status via API:", err);
    } finally {
      setTimeout(() => {
        loadMessages(targetConvId);
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[920px] bg-white dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden font-sans backdrop-blur-2xl relative transition-colors duration-200">
      
      {/* TOAST DE NOTIFICACIÓN FLOTANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 dark:text-teal-600 flex items-center justify-center border border-teal-500/30">
            <Bell size={18} className="animate-bounce" />
          </div>
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* BARRA SUPERIOR DEL MÓDULO */}
      <header className="px-6 py-4 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
            <MessageSquare size={22} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Atención y Escalamiento WhatsApp
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5" />
                <span>Evolution WhatsApp Conectado</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supervisión de NexusBot, respuesta manual e intervención de recepcionista en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN / ICONO DE NOTIFICACIONES */}
          <button
            type="button"
            onClick={() => setShowNotificationsModal(true)}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5 px-3"
            title="Abrir Centro de Notificaciones y Alertas"
          >
            <Bell size={16} className={counts.escaladas > 0 ? "text-rose-500 animate-bounce" : "text-slate-500 dark:text-slate-400"} />
            <span className="text-xs font-semibold hidden sm:inline">Alertas</span>
            {counts.escaladas > 0 ? (
              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-pulse">
                {counts.escaladas}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={loadingChats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Sincronizar conversaciones"
          >
            <RefreshCw size={14} className={loadingChats ? "animate-spin text-teal-500" : "text-slate-500 dark:text-slate-400"} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL TRIPLE COLUMNA */}
      <div className="flex-1 flex min-h-0 divide-x divide-slate-200/80 dark:divide-white/10">
        
        {/* COLUMNA 1: LISTA LATERAL DE CONVERSACIONES Y FILTROS */}
        <aside className="w-80 sm:w-96 flex flex-col bg-slate-50/60 dark:bg-slate-950/40 flex-shrink-0">
          
          <div className="p-4 space-y-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-100/50 dark:bg-slate-900/40">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por teléfono o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300/80 dark:border-white/10 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab("TODAS")}
                className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  filterTab === "TODAS"
                    ? "bg-teal-600 text-white shadow-md font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-white/5"
                }`}
              >
                <span>Todas</span>
                {counts.todas > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] ${filterTab === "TODAS" ? "bg-white text-teal-800 font-extrabold" : "bg-slate-300 dark:bg-white/10 text-slate-700 dark:text-slate-300"}`}>
                    {counts.todas}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("ESCALADAS")}
                className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  filterTab === "ESCALADAS"
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-white/5"
                }`}
              >
                <AlertTriangle size={11} className={filterTab === "ESCALADAS" ? "text-white" : "text-rose-500 dark:text-rose-400"} />
                <span>Alerta</span>
                {counts.escaladas > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] ${filterTab === "ESCALADAS" ? "bg-white text-rose-600 font-extrabold" : "bg-rose-500/20 text-rose-600 dark:text-rose-300"}`}>
                    {counts.escaladas}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("ATENDIDAS")}
                className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  filterTab === "ATENDIDAS"
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/20 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-white/5"
                }`}
              >
                <UserCheck size={11} className={filterTab === "ATENDIDAS" ? "text-white" : "text-teal-600 dark:text-teal-400"} />
                <span>En Curso</span>
                {counts.atendidas > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] ${filterTab === "ATENDIDAS" ? "bg-white text-teal-700 font-extrabold" : "bg-teal-500/20 text-teal-700 dark:text-teal-300"}`}>
                    {counts.atendidas}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFilterTab("BOT")}
                className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  filterTab === "BOT"
                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-white/5"
                }`}
              >
                <Bot size={11} className={filterTab === "BOT" ? "text-white" : "text-cyan-600 dark:text-cyan-400"} />
                <span>Bot</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/60 dark:divide-white/5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
            {loadingChats ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <RefreshCw size={28} className="mx-auto animate-spin text-teal-500" />
                <p className="text-xs font-medium">Cargando conversaciones de WhatsApp...</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                  <Inbox size={26} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No hay conversaciones</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">
                    {searchQuery
                      ? "No coinciden conversaciones con tu búsqueda."
                      : filterTab === "ESCALADAS"
                      ? "No hay casos pendientes de atención por asesor."
                      : "Aún no se han recibido interacciones activas en este filtro."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadData(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-teal-600 dark:text-teal-400 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  <span>Sincronizar ahora</span>
                </button>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isSelected = chat.id === selectedChatId;
                const avatarCode = getAvatarText(chat.patientName);

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-4 transition-all cursor-pointer select-none flex items-start gap-3.5 relative border-l-4 ${
                      isSelected
                        ? "bg-teal-500/10 dark:bg-teal-500/15 border-teal-500 dark:border-teal-400 shadow-sm"
                        : "border-transparent hover:bg-slate-200/50 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/10 shadow-inner">
                        {avatarCode === "WA" ? <Phone size={16} className="text-teal-600 dark:text-teal-400" /> : avatarCode}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shadow-md border border-white dark:border-slate-900">
                        W
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {chat.patientName}
                        </h3>
                        
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                            {chat.lastMessageTime}
                          </span>
                          {!isSelected && chat.unreadCount > 0 ? (
                            <span className="min-w-4 h-4 px-1.5 rounded-full bg-emerald-500 text-white font-black text-[9px] flex items-center justify-center shadow-md animate-pulse">
                              {chat.unreadCount}
                            </span>
                          ) : !isSelected && chat.unread ? (
                            <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-md animate-ping" />
                          ) : null}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {chat.lastMessage}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1">
                        {chat.status === "ESCALADA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                            <AlertTriangle size={10} />
                            Requiere Asesor
                          </span>
                        )}
                        {chat.status === "ATENDIDA_HUMANO" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            <UserCheck size={10} />
                            En Atención
                          </span>
                        )}
                        {chat.status === "ACTIVA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                            <Bot size={10} />
                            Con Bot
                          </span>
                        )}
                        {chat.status === "CERRADA" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-500/15 text-slate-600 dark:text-slate-400">
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

        {/* COLUMNA 2: ÁREA DE CHAT Y MENSAJERÍA EN VIVO */}
        <main className="flex-1 flex flex-col bg-white dark:bg-slate-900/60 min-w-0 relative">
          {selectedChat ? (
            <>
              <div className="p-3.5 px-6 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md shrink-0">
                    {getAvatarText(selectedChat.patientName) === "WA" ? (
                      <Phone size={18} className="text-white" />
                    ) : (
                      getAvatarText(selectedChat.patientName)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                      <span>{selectedChat.patientName}</span>
                      {selectedChat.patientName !== selectedChat.phone && (
                        <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
                          ({selectedChat.phone})
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        WhatsApp Corporativo
                      </span>
                      <span>•</span>
                      <span>
                        Estado:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {selectedChat.status === "ESCALADA"
                            ? "Esperando Respuesta Humana"
                            : selectedChat.status === "ATENDIDA_HUMANO"
                            ? "En Atención por Recepción"
                            : selectedChat.status === "ACTIVA"
                            ? "Atendiendo por NexusBot"
                            : "Caso Cerrado"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedChat.status !== "ATENDIDA_HUMANO" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("ATENDIDA_HUMANO")}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck size={14} />
                      <span>Tomar Caso</span>
                    </button>
                  )}

                  {selectedChat.status === "ATENDIDA_HUMANO" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("ACTIVA")}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bot size={14} />
                      <span>Devolver a Bot</span>
                    </button>
                  )}

                  {selectedChat.status !== "CERRADA" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("CERRADA")}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <CheckCircle2 size={14} />
                      <span>Cerrar Caso</span>
                    </button>
                  )}
                </div>
              </div>

              {/* LISTA DE MENSAJES DE LA CONVERSACIÓN */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 bg-slate-100/40 dark:bg-slate-950/40">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                    <RefreshCw size={20} className="animate-spin text-teal-500" />
                    <span className="text-xs font-medium">Cargando conversación de WhatsApp...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-3">
                    <MessageSquare size={32} className="opacity-40" />
                    <span className="text-xs">No hay mensajes previos en esta conversación</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = isUserMessage(msg.messageRoleId);
                    const isBot = isBotMessage(msg.messageRoleId);
                    const isAgente = isAgenteMessage(msg.messageRoleId);
                    const isSystem = !isUser && !isBot && !isAgente;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                            <Sparkles size={12} className="text-amber-500 dark:text-amber-400" />
                            <span>{msg.content}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-start" : "items-end"} space-y-1`}
                      >
                        <div className="flex items-center gap-1.5 px-1 text-[10.5px] text-slate-500 dark:text-slate-400">
                          {isUser && (
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <User size={10} />
                              {selectedChat.patientName}
                            </span>
                          )}
                          {isBot && (
                            <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                              <Bot size={10} />
                              NexusBot (IA)
                            </span>
                          )}
                          {isAgente && (
                            <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                              <UserCheck size={10} />
                              Asesor Recepción
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {msg.createdAt ? formatTime(msg.createdAt) : "Ahora"}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all ${
                            isUser
                              ? "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs"
                              : isAgente
                              ? "bg-emerald-600 dark:bg-emerald-700 text-white rounded-tr-xs font-medium"
                              : "bg-cyan-600 dark:bg-cyan-700 text-white rounded-tr-xs font-medium"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                          {msg.ragConfidence !== undefined && msg.ragConfidence > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-white/20 flex items-center justify-between text-[9.5px] opacity-90 font-medium">
                              <span>Confianza RAG IA:</span>
                              <span>{Math.round(msg.ragConfidence * 100)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* BARRA INFERIOR DE ENVÍO DE MENSAJES */}
              <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                      Enviar respuesta como:
                    </span>
                    <div className="inline-flex rounded-xl p-0.5 bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setSendIdentity("CHATBOT")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          sendIdentity === "CHATBOT"
                            ? "bg-cyan-500 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Bot size={13} />
                        <span>NexusBot (Camuflaje IA)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSendIdentity("AGENTE_HUMANO")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          sendIdentity === "AGENTE_HUMANO"
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <User size={13} />
                        <span>Asesor Humano</span>
                      </button>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    Enter para enviar • Shift+Enter para nueva línea
                  </span>
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={
                      sendIdentity === "CHATBOT"
                        ? "Escribe como NexusBot... el paciente verá la respuesta oficial del bot en WhatsApp"
                        : "Escribe tu respuesta personalizada como asesor de recepción..."
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={sendingMessage}
                    className="flex-1 px-4 py-3 rounded-2xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className={`p-3.5 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                      inputText.trim() && !sendingMessage
                        ? sendIdentity === "CHATBOT"
                          ? "bg-gradient-to-tr from-cyan-500 to-teal-500 text-white hover:scale-105 active:scale-95 shadow-cyan-500/20"
                          : "bg-gradient-to-tr from-teal-500 to-emerald-500 text-white hover:scale-105 active:scale-95 shadow-teal-500/20"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-white/5"
                    }`}
                    title="Enviar mensaje a WhatsApp"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-4 p-8">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-600 shadow-xl">
                <MessageSquare size={38} />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Ninguna conversación seleccionada</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selecciona una conversación de la lista lateral para visualizar el historial e intervenir en tiempo real.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* COLUMNA 3: FICHA RÁPIDA DEL PACIENTE Y CONTEXTO */}
        <aside className="w-72 sm:w-80 border-l border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-950/40 p-4 space-y-4 overflow-y-auto hidden lg:block flex-shrink-0">
          {selectedChat ? (
            <>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-md space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-black text-sm flex items-center justify-center shadow-inner">
                    {getAvatarText(selectedChat.patientName) === "WA" ? (
                      <Phone size={20} className="text-teal-600 dark:text-teal-400" />
                    ) : (
                      getAvatarText(selectedChat.patientName)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {selectedChat.patientName}
                    </h3>
                    {selectedChat.patientName !== selectedChat.phone ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {selectedChat.phone}
                      </p>
                    ) : (
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                        Contacto WhatsApp
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Canal:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      WhatsApp Oficial
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>ID Conversación:</span>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                      {selectedChat.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>

              {selectedChat.ticket && (
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 shadow-md space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
                    <Sparkles size={16} />
                    <span>Motivo de Escalamiento</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {formatTicketSummary(selectedChat.ticket?.chatbotSummary, selectedChat.reason)}
                  </p>
                  {selectedChat.ticket.ragConfidence !== undefined && selectedChat.ticket.ragConfidence > 0 && (
                    <div className="pt-2 border-t border-amber-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                        <span>Confianza del Bot:</span>
                        <span>{Math.round(selectedChat.ticket.ragConfidence * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-300 dark:border-white/10">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(selectedChat.ticket.ragConfidence * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
                  Acciones Clínicas
                </span>
                
                <button
                  type="button"
                  onClick={() => navigate("/agenda")}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-teal-600 dark:text-teal-400" />
                    <span>Agendar Cita en Agenda</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/pacientes")}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Ver Ficha de Pacientes</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs my-auto">
              Selecciona una conversación para cargar su contexto clínico.
            </div>
          )}
        </aside>
      </div>

      {/* MODAL DE CENTRO DE NOTIFICACIONES Y ALERTAS */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400">
                  <Bell size={20} className="animate-bounce" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white">
                    Centro de Notificaciones & Alertas
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Casos que requieren atención humana inmediata en WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {chats.filter((c: ChatItemDisplay) => c.status === "ESCALADA" || c.unread).length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">¡Todo al día!</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      No hay notificaciones ni alertas pendientes por atender.
                    </p>
                  </div>
                </div>
              ) : (
                chats
                  .filter((c: ChatItemDisplay) => c.status === "ESCALADA" || c.unread)
                  .map((alertChat: ChatItemDisplay) => (
                    <div
                      key={alertChat.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 hover:border-teal-500/50 transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <AlertTriangle size={9} />
                            Requiere Asesor
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {alertChat.lastMessageTime}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {alertChat.patientName}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {alertChat.reason || alertChat.lastMessage}
                        </p>

                        <p className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                          {alertChat.phone}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChatId(alertChat.id);
                          setFilterTab("TODAS");
                          setShowNotificationsModal(false);
                          showToast(`Atendiendo caso de ${alertChat.patientName}`);
                        }}
                        className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Atender</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
              <span>Alertas activas: {counts.escaladas}</span>
              <button
                type="button"
                onClick={() => {
                  setFilterTab("ESCALADAS");
                  setShowNotificationsModal(false);
                }}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                Ver todas en la lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
