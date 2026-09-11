import { useNotifications } from '../../context/NotificationContext';
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  ArrowLeft,
  Info,
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
  AlertCircle,
  QrCode,
  Smartphone,
  LogOut,
  ExternalLink,
} from "lucide-react";
import {
  chatbotService,
  MESSAGE_ROLE_IDS,
  CONVERSATION_STATUS_IDS,
  TICKET_STATUS_IDS,
} from "../../api/chatbotService";
import type { ChatbotMessage, SupportTicket } from "../../api/chatbotService";
import { patientService } from "../../api/patientService";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import { areGuidsEqual } from "../../utils/roleUtils";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidGuid(id?: string | null): boolean {
  return !!id && GUID_RE.test(id.trim());
}

interface ChatItemDisplay {
  id: string;
  allConversationIds?: string[];
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

// Limpia comillas escapadas accidentales y formato en bruto de respuestas del bot
function cleanMessageContent(content: string): string {
  if (!content) return "";
  let res = content.trim();
  if (res.startsWith('"') && res.endsWith('"') && res.length > 2) {
    res = res.slice(1, -1);
  }
  return res
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/^"(.*?)"$/gm, '$1');
}

// Función utilitaria para desduplicar mensajes por ID y por contenido/marcas de tiempo cercanas
function deduplicateMessages(msgs: ChatbotMessage[]): ChatbotMessage[] {
  const map = new Map<string, ChatbotMessage>();

  for (const m of msgs) {
    if (!m || !m.content) continue;

    // Si ya existe por ID idéntico
    if (m.id && map.has(m.id)) continue;

    const normContent = m.content.trim();
    const normRole = String(m.messageRoleId || "").toLowerCase();
    const mIsUser = isUserMessage(m.messageRoleId);
    const timeMs = parseTimestamp(m.createdAt);

    let foundKey: string | null = null;
    for (const [key, existing] of map.entries()) {
      if (existing.content.trim() === normContent) {
        const existingRole = String(existing.messageRoleId || "").toLowerCase();
        const existingIsUser = isUserMessage(existing.messageRoleId);
        const exTime = parseTimestamp(existing.createdAt);
        const timeDiff = Math.abs(exTime - timeMs);

        // 1. Mismo rol con desfase menor a 20 segundos
        const sameRole = existingRole === normRole;
        // 2. O ambos son mensajes salientes de la clínica (Asesor o Bot) con mismo texto en menos de 20s
        const bothClinicOutgoing = !mIsUser && !existingIsUser;

        if ((sameRole || bothClinicOutgoing) && timeDiff < 20000) {
          foundKey = key;
          break;
        }
      }
    }

    if (foundKey) {
      const existing = map.get(foundKey)!;
      // Si el existente es un mensaje local temporal y este es persistido, reemplazarlo
      if (m.id && !m.id.startsWith("local-msg-") && existing.id.startsWith("local-msg-")) {
        map.delete(foundKey);
        map.set(m.id, m);
      }
    } else {
      map.set(m.id || `msg-${Math.random()}`, m);
    }
  }

  return Array.from(map.values()).sort((a, b) => parseTimestamp(a.createdAt) - parseTimestamp(b.createdAt));
}

// Mapeo canónico de LIDs (Linked Device IDs de WhatsApp) hacia teléfonos reales y nombres
const KNOWN_LID_MAP: Record<string, { phone: string; name: string }> = {
  "233783743803574": { phone: "+57 300 111 2233", name: "Kevin Pico" },
  "189515549421795": { phone: "+57 322 668 8304", name: "J" },
  "57213628510462": { phone: "+57 323 889 1073", name: "Pipe" },
  "144444363939899": { phone: "+57 310 444 4436", name: "Santiago" },
  "12696040816707": { phone: "+57 316 126 9604", name: "Jerson R" },
};

// Función utilitaria para formatear números de teléfono y JIDs de WhatsApp
function formatPhone(identifier: string, patientPhone?: string): string {
  const raw = patientPhone || identifier || "";
  if (!raw) return "WhatsApp";

  const cleanedDomain = raw.replace(/@.*$/, "").trim();
  const digitsOnly = cleanedDomain.replace(/\D/g, "");

  if (!digitsOnly) return cleanedDomain;

  // Si es un LID conocido de pruebas en Evolution API
  if (KNOWN_LID_MAP[digitsOnly]) {
    return KNOWN_LID_MAP[digitsOnly].phone;
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

  // Teléfonos internacionales estándar (10 a 12 dígitos)
  if (digitsOnly.length >= 10 && digitsOnly.length <= 12) {
    if (digitsOnly.startsWith("57")) {
      return `+57 ${digitsOnly.slice(2, 5)} ${digitsOnly.slice(5, 8)} ${digitsOnly.slice(8)}`;
    }
    return `+${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 7)} ${digitsOnly.slice(7)}`;
  }

  // Si tiene más de 12 dígitos o proviene de un @lid interno de WhatsApp
  if (digitsOnly.length > 12 || raw.includes("@lid")) {
    return `WhatsApp (${digitsOnly.slice(-6)})`;
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
  const { addNotification } = useNotifications();

  const [chats, setChats] = useState<ChatItemDisplay[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [showContactInfo, setShowContactInfo] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [filterTab, setFilterTab] = useState<"ESCALADAS" | "ATENDIDAS" | "BOT" | "TODAS">("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [sendIdentity, setSendIdentity] = useState<"CHATBOT" | "AGENTE_HUMANO">("CHATBOT");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastErrorMessage, setToastErrorMessage] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<{ connected: boolean; state: string; base64?: string; instanceName?: string } | null>(null);
  const [restartingQr, setRestartingQr] = useState(false);

  const fetchQr = useCallback(async () => {
    try {
      const data = await chatbotService.getQrData();
      setQrData(data);
    } catch (e) {
      console.warn("Error consultando estado de QR WhatsApp:", e);
    }
  }, []);

  const isConnected = qrData?.connected === true || qrData?.state === "open";
  const isCheckingConnection = qrData === null;

  useEffect(() => {
    fetchQr();
    // Continúa verificando automáticamente si el modal está abierto o si WhatsApp todavía no está conectado
    if (!showQrModal && isConnected) return;
    const interval = setInterval(() => {
      fetchQr();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchQr, showQrModal, isConnected]);

  const handleRestartQr = async () => {
    setRestartingQr(true);
    try {
      await chatbotService.restartQrInstance();
      showToast("Generando nuevo código QR...");
      setTimeout(async () => {
        await fetchQr();
        setRestartingQr(false);
      }, 1200);
    } catch {
      showToast("Error al reiniciar la instancia QR");
      setRestartingQr(false);
    }
  };

  const [loggingOutQr, setLoggingOutQr] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleConfirmLogoutQr = async () => {
    setLoggingOutQr(true);
    try {
      await chatbotService.logoutQrInstance();
      showToast("Sesión de WhatsApp cerrada. Puedes escanear un nuevo código QR.");
      setTimeout(async () => {
        await fetchQr();
        setLoggingOutQr(false);
        setShowLogoutConfirm(false);
      }, 1500);
    } catch {
      showToast("Error al desvincular WhatsApp");
      setLoggingOutQr(false);
      setShowLogoutConfirm(false);
    }
  };

  const readSetRef = useRef<Set<string>>(new Set());
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const lastMsgCountRef = useRef<Record<string, number>>({});
  const chatsRef = useRef<ChatItemDisplay[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  /** When false, user scrolled up to read history — do not yank them to bottom on poll. */
  const stickToBottomRef = useRef(true);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
    try {
      addNotification({
        title: 'Notificación de WhatsApp',
        message: msg,
        link: '/atencion-chat',
        type: 'whatsapp_escalated',
      });
    } catch {
      // Ignore
    }
  }, [addNotification]);

  const showErrorToast = useCallback((msg: string) => {
    setToastErrorMessage(msg);
    setTimeout(() => setToastErrorMessage(null), 5000);
  }, []);

  const isNearBottom = useCallback((thresholdPx = 120) => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (!force && !stickToBottomRef.current && !isNearBottom()) return;
    stickToBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: force ? "auto" : "smooth" });
  }, [isNearBottom]);

  const handleMessagesScroll = useCallback(() => {
    stickToBottomRef.current = isNearBottom(120);
  }, [isNearBottom]);

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
        const mapped: ChatItemDisplay[] = convs.map((c): ChatItemDisplay => {
          const cleanDigits = (str?: string) => (str || "").replace(/\D/g, "");
          const chatDigits = cleanDigits(c.chatIdentifier);

          // Resolver si este chatIdentifier corresponde a un LID conocido
          const mappedLid = KNOWN_LID_MAP[chatDigits];
          const effectivePhoneDigits = mappedLid ? cleanDigits(mappedLid.phone) : "";

          const matchedPatient = patients.find(
            (p) =>
              (p.id && c.patientId && String(p.id).toLowerCase() === String(c.patientId).toLowerCase()) ||
              (p.phone && chatDigits && cleanDigits(p.phone).endsWith(chatDigits.slice(-10))) ||
              (p.emergencyPhone && chatDigits && cleanDigits(p.emergencyPhone).endsWith(chatDigits.slice(-10))) ||
              (effectivePhoneDigits && p.phone && cleanDigits(p.phone).endsWith(effectivePhoneDigits.slice(-10))) ||
              (effectivePhoneDigits && p.emergencyPhone && cleanDigits(p.emergencyPhone).endsWith(effectivePhoneDigits.slice(-10)))
          );
          const matchedTicket = tickets.find(
            (t) => t.chatbotConversationId && String(t.chatbotConversationId).toLowerCase() === String(c.id).toLowerCase()
          );

          const isTicketPending =
            matchedTicket &&
            !areGuidsEqual(matchedTicket.ticketStatusId, TICKET_STATUS_IDS.CERRADO) &&
            !areGuidsEqual(matchedTicket.ticketStatusId, TICKET_STATUS_IDS.RESUELTO);

          let stCode: ChatItemDisplay["status"] = "ACTIVA";
          if (areGuidsEqual(c.conversationStatusId, CONVERSATION_STATUS_IDS.CERRADA)) {
            stCode = "CERRADA";
          } else if (areGuidsEqual(c.conversationStatusId, CONVERSATION_STATUS_IDS.ATENDIDA_HUMANO)) {
            stCode = "ATENDIDA_HUMANO";
          } else if (isTicketPending) {
            stCode = "ESCALADA";
          } else if (areGuidsEqual(c.conversationStatusId, CONVERSATION_STATUS_IDS.ESCALADA)) {
            stCode = isTicketPending ? "ESCALADA" : "ACTIVA";
          } else {
            stCode = "ACTIVA";
          }

          const formattedPhone = formatPhone(c.chatIdentifier, matchedPatient?.phone || matchedPatient?.emergencyPhone);

          const pName = matchedPatient
            ? `${matchedPatient.firstName || ""} ${matchedPatient.lastName || ""}`.trim()
            : mappedLid?.name
            ? mappedLid.name
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

        // Unificar conversaciones que pertenecen al mismo número de teléfono (JID y LID)
        const groupedByPhone = new Map<string, ChatItemDisplay>();

        for (const item of mapped) {
          const key = item.phone || item.chatIdentifier;
          if (!groupedByPhone.has(key)) {
            groupedByPhone.set(key, { ...item, allConversationIds: [item.id] });
          } else {
            const existing = groupedByPhone.get(key)!;
            existing.allConversationIds = [...(existing.allConversationIds || [existing.id]), item.id];
            // Priorizar la información de la sesión más reciente
            if (parseTimestamp(item.rawTimestamp) > parseTimestamp(existing.rawTimestamp)) {
              existing.id = item.id;
              existing.chatIdentifier = item.chatIdentifier;
              existing.lastMessage = item.lastMessage;
              existing.lastMessageTime = item.lastMessageTime;
              existing.rawTimestamp = item.rawTimestamp;
              existing.status = item.status;
              existing.ticket = item.ticket || existing.ticket;
            }
            existing.unreadCount = (existing.unreadCount || 0) + (item.unreadCount || 0);
            existing.unread = existing.unreadCount > 0;
          }
        }

        const consolidated = Array.from(groupedByPhone.values()).sort(
          (a, b) => parseTimestamp(b.rawTimestamp) - parseTimestamp(a.rawTimestamp)
        );

        setChats(consolidated);

        setSelectedChatId((prev) => {
          if (prev && consolidated.some((ch) => ch.id === prev || ch.allConversationIds?.includes(prev))) {
            const matching = consolidated.find((ch) => ch.id === prev || ch.allConversationIds?.includes(prev));
            return matching ? matching.id : prev;
          }
          return consolidated[0]?.id || "";
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

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const loadMessages = useCallback(async (convId: string, isSilent = false) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    if (!isSilent) setLoadingMessages(true);
    try {
      const currentChat = chatsRef.current.find(
        (c) => c.id === convId || c.allConversationIds?.includes(convId)
      );
      const targetIds =
        currentChat?.allConversationIds && currentChat.allConversationIds.length > 0
          ? currentChat.allConversationIds
          : [convId];

      const allResults = await Promise.all(
        targetIds.map((id: string) => chatbotService.getConversationMessages(id).catch(() => []))
      );
      const msgs = allResults.flat();
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
      // Initial open: always jump to latest. Silent poll: only if user is already near bottom.
      setTimeout(() => scrollToBottom(!isSilent), 100);
    }
  }, [scrollToBottom, showToast]);

  useEffect(() => {
    if (selectedChatId) {
      stickToBottomRef.current = true;
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
    if (!text || !selectedChat || sendingMessage) return;

    const roleId =
      sendIdentity === "CHATBOT"
        ? MESSAGE_ROLE_IDS.CHATBOT
        : MESSAGE_ROLE_IDS.AGENTE_HUMANO;

    const currentTimeIso = new Date().toISOString();
    const formattedNow = formatTime(currentTimeIso);

    setSendingMessage(true);

    try {
      // Always via .NET → FastAPI/Evolution (works with or without open ticket).
      // Never WhatsAppNotifications or browser → /bot agent/send-message.
      await chatbotService.sendConversationWhatsApp(selectedChat.id, text, roleId);

      // Inserción segura solo después de confirmar la entrega en servidor
      const newMsgObj: ChatbotMessage = {
        id: `msg-${Date.now()}`,
        chatbotConversationId: selectedChat.id,
        messageRoleId: roleId,
        content: text,
        createdAt: currentTimeIso,
      };

      setMessages((prev) => deduplicateMessages([...prev, newMsgObj]));
      setInputText("");
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

      showToast(
        sendIdentity === "CHATBOT"
          ? "Mensaje enviado a WhatsApp haciéndose pasar por NexusBot (Camuflaje IA)."
          : "Mensaje enviado a WhatsApp como Asesor Humano de Recepción."
      );
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      console.error("Error al enviar mensaje:", err);
      const errMsg = err?.response?.data?.message || err?.message || "No se pudo entregar el mensaje. Error de conexión con el servidor.";
      showErrorToast(errMsg);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "ESCALADA" | "ATENDIDA_HUMANO" | "ACTIVA" | "CERRADA") => {
    if (!selectedChat) return;

    let statusGuid: string = CONVERSATION_STATUS_IDS.ATENDIDA_HUMANO;
    if (newStatus === "ACTIVA") statusGuid = CONVERSATION_STATUS_IDS.ACTIVA;
    else if (newStatus === "ESCALADA") statusGuid = CONVERSATION_STATUS_IDS.ESCALADA;
    else if (newStatus === "CERRADA") statusGuid = CONVERSATION_STATUS_IDS.CERRADA;

    const targetConvId = selectedChat.id;
    const convIdsToUpdate =
      selectedChat.allConversationIds && selectedChat.allConversationIds.length > 0
        ? selectedChat.allConversationIds
        : [targetConvId];
    const previousStatus = selectedChat.status;
    const previousTicket = selectedChat.ticket;
    readSetRef.current.add(targetConvId);

    // Optimistic UI
    setChats((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              status: newStatus,
              ticket:
                c.ticket && (newStatus === "CERRADA" || newStatus === "ACTIVA")
                  ? { ...c.ticket, ticketStatusId: TICKET_STATUS_IDS.RESUELTO }
                  : c.ticket,
              unread: false,
              unreadCount: 0,
            }
          : c
      )
    );

    if (newStatus === "ATENDIDA_HUMANO") {
      setFilterTab("ATENDIDAS");
    } else if (newStatus === "ACTIVA") {
      setFilterTab("BOT");
    } else if (newStatus === "CERRADA") {
      setFilterTab("TODAS");
    }

    try {
      // Close/update every JID/LID twin so phone-grouped chats stay consistent.
      await Promise.all(
        convIdsToUpdate.map((id) =>
          chatbotService.updateConversation(id, {
            conversationStatusId: statusGuid,
            patientId: selectedChat.patientId,
            closedAt: newStatus === "CERRADA" ? new Date().toISOString() : undefined,
          })
        )
      );

      // "Devolver a Bot" resumes auto-replies. "Cerrar" must NOT call resume —
      // FastAPI resume reopens the Oracle conversation as ACTIVA via obtener_o_crear_conversacion.
      if (newStatus === "ACTIVA") {
        await chatbotService.resumeConversation(selectedChat.chatIdentifier, false).catch(() => null);
      }

      const ticketId = selectedChat.ticket?.id;
      if (ticketId && isValidGuid(ticketId) && (newStatus === "CERRADA" || newStatus === "ACTIVA")) {
        const returnToBot = newStatus === "ACTIVA";
        try {
          await chatbotService.resolveTicket(
            ticketId,
            returnToBot
              ? "Devuelto al bot para atención automática."
              : "Atendido y cerrado por recepcionista.",
            returnToBot
          );
        } catch (ticketErr) {
          // Conversation status already persisted; ticket failure should not undo Cerrar in the UI.
          if (newStatus !== "CERRADA") throw ticketErr;
          console.warn("Ticket resolve failed after conversation close:", ticketErr);
        }
      }

      showToast(
        newStatus === "ATENDIDA_HUMANO"
          ? "Has tomado el control del caso como Asesor Humano."
          : newStatus === "ACTIVA"
          ? "Caso devuelto al bot NexusBot para respuestas automáticas."
          : "Caso resuelto y marcado como cerrado."
      );

      // Refresh list so CERRADA sticks after silent poll
      setTimeout(() => loadData(true), 200);
    } catch (err: any) {
      console.warn("Could not update conversation status via API:", err);
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? { ...c, status: previousStatus, ticket: previousTicket }
            : c
        )
      );
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo actualizar el estado del caso. Intenta de nuevo.";
      showErrorToast(errMsg);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-5rem)] max-h-[960px] bg-white dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden font-sans backdrop-blur-2xl relative transition-colors duration-200">
      
      {/* TOAST DE NOTIFICACIÓN FLOTANTE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/50 backdrop-blur-md animate-slideUp">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 dark:text-teal-600 flex items-center justify-center border border-teal-500/30">
            <Bell size={18} className="animate-bounce" />
          </div>
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* TOAST DE ERROR FLOTANTE */}
      {toastErrorMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-rose-950/95 text-rose-200 px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/50 backdrop-blur-md animate-slideUp">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertCircle size={18} />
          </div>
          <span className="text-xs font-semibold tracking-wide">{toastErrorMessage}</span>
        </div>
      )}

      {/* BARRA SUPERIOR DEL MÓDULO */}
      <header className={`px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 items-center justify-between flex-shrink-0 ${selectedChatId ? "hidden md:flex" : "flex"}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
            <MessageSquare size={22} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Atención y Escalamiento WhatsApp
              </h1>
              {qrData?.connected || qrData?.state === "open" ? (
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold transition-all cursor-pointer"
                  title="WhatsApp conectado. Clic para ver estado o administrar"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5" />
                  <span>Evolution WhatsApp Conectado</span>
                </button>
              ) : qrData?.state === "connecting" ? (
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-semibold transition-all cursor-pointer animate-pulse"
                  title="WhatsApp requiere escanear código QR. Haz clic aquí."
                >
                  <QrCode size={13} />
                  <span>Escanear QR WhatsApp</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition-all cursor-pointer"
                  title="WhatsApp desconectado. Clic para vincular mediante código QR"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>WhatsApp Desconectado (Vincular)</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supervisión de NexusBot, respuesta manual e intervención de recepcionista en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN VINCULAR QR WHATSAPP */}
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Abrir ventana para vincular WhatsApp por Código QR"
          >
            <QrCode size={15} />
            <span className="hidden sm:inline">Vincular QR</span>
          </button>
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
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Sincronizar conversaciones"
          >
            <DentistryReloadIcon size={16} loading={loadingChats} />
            <span>Actualizar</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: CONDICIONAL SEGÚN ESTADO DE CONEXIÓN */}
      {isCheckingConnection ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 bg-slate-50/40 dark:bg-slate-950/20">
          <RefreshCw size={32} className="animate-spin text-teal-500" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Comprobando estado de conexión con Evolution WhatsApp...
          </p>
        </div>
      ) : !isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50/40 dark:bg-slate-950/20 overflow-y-auto">
          <div className="w-full max-w-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 shadow-2xl shadow-emerald-950/10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500/20 via-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <QrCode size={30} />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                WhatsApp no está vinculado
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Los chats y mensajes de pacientes permanecerán ocultos hasta que vincules WhatsApp con NexusBot. Escanea el código QR a continuación para habilitar la atención.
              </p>
            </div>

            {/* CÓDIGO QR DIRECTO EN PANTALLA */}
            <div className="relative group inline-block">
              {qrData?.base64 ? (
                <div className="p-4 rounded-3xl bg-white border-2 border-teal-500/40 shadow-xl inline-block transition-transform duration-300 hover:scale-105">
                  <img
                    src={
                      qrData.base64.startsWith("data:")
                        ? qrData.base64
                        : `data:image/png;base64,${qrData.base64}`
                    }
                    alt="Código QR de WhatsApp"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 rounded-3xl border-2 border-dashed border-teal-500/40 bg-teal-500/5 flex flex-col items-center justify-center mx-auto space-y-3 text-teal-600 dark:text-teal-400 p-4">
                  <RefreshCw size={32} className="animate-spin text-teal-500" />
                  <span className="text-xs font-bold">Generando Código QR Seguro...</span>
                  <span className="text-[10px] text-slate-400">Conectando con Evolution API</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-left max-w-md mx-auto">
              <h4 className="text-xs font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5 mb-2">
                <Smartphone size={15} className="text-teal-600 dark:text-teal-400" />
                Instrucciones de escaneo:
              </h4>
              <ol className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1 font-medium">
                <li>Abre <b>WhatsApp</b> en tu celular corporativo.</li>
                <li>Toca <b>Menú (⋮)</b> o <b>Configuración</b>.</li>
                <li>Selecciona <b>Dispositivos vinculados</b> &gt; <b>Vincular un dispositivo</b>.</li>
                <li>Apunta la cámara de tu celular hacia este código QR.</li>
              </ol>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRestartQr}
                disabled={restartingQr}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={restartingQr ? "animate-spin" : ""} />
                <span>{restartingQr ? "Generando..." : "Generar Nuevo QR"}</span>
              </button>

              <button
                type="button"
                onClick={fetchQr}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-white/10 cursor-pointer"
              >
                Refrescar Estado
              </button>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Sincronizando automáticamente al detectar el escaneo...</span>
            </div>
          </div>
        </div>
      ) : (
        /* CUERPO PRINCIPAL TRIPLE COLUMNA (Solo visible cuando WhatsApp está conectado) */
        <div className="flex-1 flex min-h-0 divide-x divide-slate-200/80 dark:divide-white/10">
        
        {/* COLUMNA 1: LISTA LATERAL DE CONVERSACIONES Y FILTROS */}
        <aside className={`w-full md:w-80 lg:w-96 flex flex-col bg-slate-50/60 dark:bg-slate-950/40 flex-shrink-0 min-h-0 ${selectedChatId ? "hidden md:flex" : "flex"}`}>
          
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
        <main className={`flex-1 flex flex-col bg-white dark:bg-slate-900/60 min-w-0 relative ${!selectedChatId ? "hidden md:flex" : "flex"}`}>
          {selectedChat ? (
            <>
              <div className="p-3 sm:p-3.5 px-3 sm:px-6 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 gap-2">
                <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
                  {/* BOTÓN VOLVER (ESTILO WHATSAPP EN MÓVIL) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChatId("");
                      setShowContactInfo(false);
                    }}
                    className="md:hidden -ml-1 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center shrink-0 active:scale-90"
                    title="Volver a la lista de chats"
                    aria-label="Volver a chats"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  {/* AVATAR Y NOMBRE DEL CONTACTO (Click abre Ficha en Móvil/Tablet) */}
                  <div
                    onClick={() => setShowContactInfo(true)}
                    className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 cursor-pointer xl:cursor-default group"
                    title="Ver detalles del contacto"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                      {getAvatarText(selectedChat.patientName) === "WA" ? (
                        <Phone size={18} className="text-white" />
                      ) : (
                        getAvatarText(selectedChat.patientName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{selectedChat.patientName}</span>
                        {selectedChat.patientName !== selectedChat.phone && (
                          <span className="text-[11px] font-mono font-normal text-slate-500 dark:text-slate-400 hidden sm:inline truncate">
                            ({selectedChat.phone})
                          </span>
                        )}
                      </h2>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="hidden xs:inline">WhatsApp</span>
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          <strong className="text-slate-800 dark:text-slate-200">
                            {selectedChat.status === "ESCALADA"
                              ? "Esperando Respuesta"
                              : selectedChat.status === "ATENDIDA_HUMANO"
                              ? "En Atención"
                              : selectedChat.status === "ACTIVA"
                              ? "NexusBot"
                              : "Cerrado"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {selectedChat.status !== "ATENDIDA_HUMANO" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("ATENDIDA_HUMANO")}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 sm:gap-1.5 cursor-pointer"
                      title="Tomar el caso para atención por asesor"
                    >
                      <UserCheck size={14} />
                      <span className="hidden sm:inline">Tomar Caso</span>
                    </button>
                  )}

                  {selectedChat.status !== "ACTIVA" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("ACTIVA")}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] sm:text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 sm:gap-1.5 cursor-pointer"
                      title="Devolver al asistente virtual NexusBot"
                    >
                      <Bot size={14} />
                      <span className="hidden sm:inline">Devolver a Bot</span>
                    </button>
                  )}

                  {selectedChat.status !== "CERRADA" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("CERRADA")}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-sm active:scale-95"
                      title="Cerrar caso"
                    >
                      <CheckCircle2 size={14} />
                      <span className="hidden sm:inline">Cerrar</span>
                    </button>
                  )}

                  {/* BOTÓN INFO EN MÓVIL Y TABLET */}
                  <button
                    type="button"
                    onClick={() => setShowContactInfo(!showContactInfo)}
                    className="xl:hidden p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Ver ficha y acciones clínicas"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* LISTA DE MENSAJES DE LA CONVERSACIÓN */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 bg-slate-100/40 dark:bg-slate-950/40"
              >
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
                            <span>{cleanMessageContent(msg.content)}</span>
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
                          <p className="whitespace-pre-wrap break-words">{cleanMessageContent(msg.content)}</p>

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
        <aside className="w-72 sm:w-80 border-l border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-slate-950/40 p-4 space-y-4 overflow-y-auto hidden xl:block flex-shrink-0">
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
        {/* DRAWER MÓVIL/TABLET PARA CONTACTO / ACCIONES CLÍNICAS (ESTILO WHATSAPP) */}
        {showContactInfo && selectedChat && (
          <div className="fixed inset-0 z-50 xl:hidden flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-white/10 p-5 space-y-4 overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <User size={15} className="text-teal-500" />
                  Detalles y Acciones Clínicas
                </h3>
                <button
                  type="button"
                  onClick={() => setShowContactInfo(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  aria-label="Cerrar detalles"
                >
                  <X size={18} />
                </button>
              </div>
              
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
        
            </div>
          </div>
        )}
      </div>
      )}

      {/* MODAL PARA VINCULAR WHATSAPP POR QR (Renderizado en Portal para evitar recorte) */}
      {showQrModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-950/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              {/* LÍNEA DECORATIVA GRADIENTE */}
              <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 w-full" />

              {/* CABECERA DEL MODAL */}
              <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                      Vincular WhatsApp - NexusBot
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Conexión de mensajería con Evolution API
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* CONTENIDO DEL MODAL */}
              <div className="p-6 overflow-y-auto space-y-5 text-center flex-1">
                {showLogoutConfirm ? (
                  <div className="py-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                      <AlertTriangle size={32} />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                        ¿Desvincular WhatsApp?
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Se cerrará la sesión actual de Evolution API. Los chats se ocultarán y deberás escanear un nuevo código QR para volver a sincronizar el bot clínico.
                      </p>
                    </div>

                    <div className="pt-3 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        disabled={loggingOutQr}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmLogoutQr}
                        disabled={loggingOutQr}
                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {loggingOutQr ? <RefreshCw size={14} className="animate-spin" /> : <LogOut size={14} />}
                        <span>{loggingOutQr ? "Cerrando sesión..." : "Sí, Desvincular"}</span>
                      </button>
                    </div>
                  </div>
                ) : qrData?.connected || qrData?.state === "open" ? (
                  <div className="py-4 space-y-4">
                    {/* ESTADO CONECTADO */}
                    <div className="relative flex items-center justify-center mx-auto">
                      <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25">
                        <CheckCircle2 size={38} className="stroke-[2.5]" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        ¡WhatsApp Conectado y Activo!
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        NexusBot AI está sincronizado con la clínica y respondiendo mensajes de pacientes en tiempo real.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/5 text-left text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Instancia WhatsApp</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {qrData?.instanceName || "Nexus_Odonto"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Estado de Red</span>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE (Sesión abierta)
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Canal Integrado</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Evolution API v2
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Puerto del Servicio</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          localhost:8085
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowQrModal(false)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                      >
                        Continuar
                      </button>

                      <button
                        type="button"
                        onClick={handleRestartQr}
                        disabled={restartingQr}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={restartingQr ? "animate-spin text-teal-500" : ""} />
                        <span>Regenerar QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        disabled={loggingOutQr}
                        className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <LogOut size={14} />
                        <span>Desvincular WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-1">
                    {/* VISUALIZADOR DEL QR */}
                    <div className="relative group inline-block">
                      {qrData?.base64 ? (
                        <div className="p-4 rounded-3xl bg-white border-2 border-teal-500/40 shadow-2xl inline-block transition-transform duration-300 hover:scale-[1.02]">
                          <img
                            src={
                              qrData.base64.startsWith("data:")
                                ? qrData.base64
                                : `data:image/png;base64,${qrData.base64}`
                            }
                            alt="Código QR de WhatsApp"
                            className="w-56 h-56 object-contain rounded-xl"
                          />
                        </div>
                      ) : (
                        <div className="w-56 h-56 rounded-3xl border-2 border-dashed border-teal-500/40 bg-teal-500/5 flex flex-col items-center justify-center mx-auto space-y-3 text-teal-600 dark:text-teal-400 p-4">
                          <RefreshCw size={32} className="animate-spin text-teal-500" />
                          <span className="text-xs font-bold">Generando Código QR...</span>
                          <span className="text-[10px] text-slate-400">Conectando con Evolution API</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-left">
                      <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 mb-2">
                        <Smartphone size={15} className="text-teal-600 dark:text-teal-400" />
                        Pasos para escanear en tu teléfono:
                      </h4>
                      <ol className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1 font-medium">
                        <li>Abre <b>WhatsApp</b> en tu celular corporativo.</li>
                        <li>Toca <b>Menú (⋮)</b> o <b>Configuración</b>.</li>
                        <li>Selecciona <b>Dispositivos vinculados</b> &gt; <b>Vincular dispositivo</b>.</li>
                        <li>Apunta con la cámara de tu celular hacia este código QR.</li>
                      </ol>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleRestartQr}
                        disabled={restartingQr}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={restartingQr ? "animate-spin" : ""} />
                        <span>{restartingQr ? "Generando..." : "Generar Nuevo QR"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={fetchQr}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-white/10 cursor-pointer"
                      >
                        Refrescar Estado
                      </button>
                    </div>

                    <div className="pt-1">
                      <a
                        href="http://localhost:8000/qr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1.5 font-medium"
                      >
                        <ExternalLink size={13} />
                        <span>Abrir visor de QR en pantalla completa</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* PIE DEL MODAL */}
              <div className="px-6 py-3.5 bg-slate-50/90 dark:bg-slate-950 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      qrData?.connected || qrData?.state === "open"
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                        : "bg-amber-500 animate-pulse"
                    }`}
                  />
                  <span>
                    Estado:{" "}
                    <b className="uppercase text-slate-800 dark:text-slate-200">
                      {qrData?.state || "Consultando..."}
                    </b>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL DE CENTRO DE NOTIFICACIONES Y ALERTAS (Renderizado en Portal) */}
      {showNotificationsModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-slate-950/50 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              <div className="p-5 bg-slate-50/90 dark:bg-slate-950 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-sm">
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
                  title="Cerrar modal"
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

              <div className="p-3.5 bg-slate-50/90 dark:bg-slate-950 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
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
          </div>,
          document.body
        )}
    </div>
  );
}
