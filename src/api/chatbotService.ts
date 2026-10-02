import axios from 'axios';
import axiosClient from './axiosClient';

const CHATBOT_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8000';

const chatbotClient = axios.create({
  baseURL: CHATBOT_BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatbotConversation {
  id: string;
  patientId?: string;
  chatIdentifier: string;
  chatChannelId: string;
  conversationStatusId: string;
  startedAt: string;
  lastInteractionAt?: string;
  closedAt?: string;
}

export interface ChatbotMessage {
  id: string;
  chatbotConversationId: string;
  messageRoleId: string;
  content: string;
  ragConfidence?: number;
  createdAt: string;
}

export interface CreateChatbotMessageDto {
  chatbotConversationId: string;
  messageRoleId: string;
  content: string;
  ragConfidence?: number;
}

export interface SupportTicket {
  id: string;
  chatbotConversationId?: string;
  patientId?: string;
  ticketReasonId: string;
  notificationPriorityId: string;
  ticketStatusId: string;
  title: string;
  description?: string;
  chatbotSummary?: string;
  ragConfidence?: number;
  createdAt: string;
  assignedToUserId?: string;
  assignedAt?: string;
  resolution?: string;
  closedAt?: string;
}

export interface UpdateSupportTicketDto {
  ticketReasonId: string;
  notificationPriorityId: string;
  ticketStatusId: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  resolution?: string;
}

export interface SendWhatsAppNotificationDto {
  destinationPhone: string;
  content: string;
  patientId?: string;
  appointmentId?: string;
  whatsAppNotificationTypeId?: string;
}

// Interfaz para el Asistente AI (FastAPI / Widget)
export interface ChatbotMessagePayload {
  message: string;
  userId?: string;
  role?: string;
  context?: string;
  conversationId?: string;
}

export interface ChatbotResponse {
  reply: string;
  status: 'success' | 'fallback' | 'error';
  conversationId?: string;
  actionLink?: {
    text: string;
    path: string;
  };
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
}

// IDs canónicos de los seeders
export const MESSAGE_ROLE_IDS = {
  USUARIO: 'a0000000-0000-0000-0000-000000000001',
  CHATBOT: 'a0000000-0000-0000-0000-000000000002',
  AGENTE_HUMANO: 'a0000000-0000-0000-0000-000000000003',
  SISTEMA: 'a0000000-0000-0000-0000-000000000004',
} as const;

export const CONVERSATION_STATUS_IDS = {
  ACTIVA: 'b0000000-0000-0000-0000-000000000001',
  ESCALADA: 'b0000000-0000-0000-0000-000000000002',
  ATENDIDA_HUMANO: 'b0000000-0000-0000-0000-000000000003',
  CERRADA: 'b0000000-0000-0000-0000-000000000004',
} as const;

export const TICKET_STATUS_IDS = {
  ABIERTO: 'c0000000-0000-0000-0000-000000000001',
  ASIGNADO: 'c0000000-0000-0000-0000-000000000002',
  EN_ATENCION: 'c0000000-0000-0000-0000-000000000003',
  RESUELTO: 'c0000000-0000-0000-0000-000000000004',
  CERRADO: 'c0000000-0000-0000-0000-000000000005',
} as const;

// Envío polimórfico: Soporta creación de mensaje en base de datos o consulta de widget/FastAPI
async function sendMessage(data: CreateChatbotMessageDto): Promise<ChatbotMessage>;
async function sendMessage(data: ChatbotMessagePayload, token?: string): Promise<ChatbotResponse>;
async function sendMessage(
  data: CreateChatbotMessageDto | ChatbotMessagePayload,
  token?: string
): Promise<any> {
  if ('chatbotConversationId' in data) {
    const response = await axiosClient.post('/v1/ChatbotMessages', data);
    return response.data;
  } else {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await chatbotClient.post<ChatbotResponse>('/chat', data, {
        headers,
      });

      if (res.data && res.data.reply) {
        return res.data;
      }

      throw new Error('Respuesta inválida del servidor AI.');
    } catch (error: any) {
      console.warn(
        '[ChatbotService] AI Service no disponible o en espera, usando asistente contextual:',
        error?.message
      );
      return {
        reply: '',
        status: 'fallback',
      };
    }
  }
}

export const chatbotService = {
  // Conversaciones
  getConversations: async (): Promise<ChatbotConversation[]> => {
    const response = await axiosClient.get('/v1/ChatbotConversations');
    const raw = response.data;
    return Array.isArray(raw) ? raw : raw?.items || [];
  },

  getConversationById: async (id: string): Promise<ChatbotConversation> => {
    const response = await axiosClient.get(`/v1/ChatbotConversations/${id}`);
    return response.data;
  },

  updateConversation: async (
    id: string,
    data: {
      conversationStatusId: string;
      patientId?: string;
      closedAt?: string | null;
      chatIdentifier?: string;
    }
  ): Promise<ChatbotConversation> => {
    const response = await axiosClient.put(`/v1/ChatbotConversations/${id}`, data);
    return response.data;
  },

  /** Resuelve LID WhatsApp → E.164 vía .NET proxy / Evolution. No inventa +233. */
  resolveWhatsAppIdentity: async (
    identifier: string,
    conversationId?: string
  ): Promise<{ status: string; phone?: string | null; via?: string }> => {
    try {
      const res = await axiosClient.post(
        '/v1/Chatbot/resolve-identity',
        {
          identifier,
          conversationId: conversationId || null,
        }
      );
      return res.data || { status: 'unresolved', phone: null };
    } catch {
      try {
        const res = await chatbotClient.post(
          '/api/v1/whatsapp/resolve-identity',
          {
            identifier,
            conversation_id: conversationId || null,
          },
          {
            headers: {
              'X-Internal-Secret': 'TOKEN_SECRETO_INTERNO_NET_2026',
            },
          }
        );
        return res.data || { status: 'unresolved', phone: null };
      } catch {
        return { status: 'unresolved', phone: null };
      }
    }
  },

  // Mensajes
  getAllMessages: async (): Promise<ChatbotMessage[]> => {
    try {
      const response = await axiosClient.get('/v1/ChatbotMessages');
      const raw = response.data;
      return Array.isArray(raw) ? raw : raw?.items || [];
    } catch {
      return [];
    }
  },

  getConversationMessages: async (conversationId: string): Promise<ChatbotMessage[]> => {
    try {
      const response = await axiosClient.get(`/v1/ChatbotConversations/${conversationId}/messages`);
      return response.data || [];
    } catch {
      // Fallback si endpoint específico no estuviera disponible
      const response = await axiosClient.get('/v1/ChatbotMessages');
      const all: ChatbotMessage[] = response.data || [];
      return all
        .filter((m) => m.chatbotConversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  },

  sendMessage,

  // Tickets de Soporte
  getSupportTickets: async (): Promise<SupportTicket[]> => {
    const response = await axiosClient.get('/v1/SupportTickets');
    const raw = response.data;
    return Array.isArray(raw) ? raw : raw?.items || [];
  },

  updateSupportTicket: async (id: string, data: UpdateSupportTicketDto): Promise<SupportTicket> => {
    const response = await axiosClient.put(`/v1/SupportTickets/${id}`, data);
    return response.data;
  },

  // Responder a ticket (despacha por .NET y FastAPI directo a WhatsApp)
  replyToTicket: async (ticketId: string, content: string, messageRoleId?: string): Promise<any> => {
    const response = await axiosClient.post(`/v1/SupportTickets/${ticketId}/reply`, {
      content,
      ...(messageRoleId ? { messageRoleId } : {}),
    });
    return response.data;
  },

  // Envío asesor por conversación (.NET → FastAPI/Evolution; 502 si falla)
  sendConversationWhatsApp: async (
    conversationId: string,
    content: string,
    messageRoleId?: string
  ): Promise<any> => {
    const response = await axiosClient.post(
      `/v1/ChatbotConversations/${conversationId}/send-whatsapp`,
      {
        content,
        ...(messageRoleId ? { messageRoleId } : {}),
      }
    );
    return response.data;
  },

  // Resolver ticket. returnToBot=true reabre conversación (ACTIVA); false la deja CERRADA.
  resolveTicket: async (
    ticketId: string,
    resolution?: string,
    returnToBot: boolean = true
  ): Promise<any> => {
    const response = await axiosClient.post(`/v1/SupportTickets/${ticketId}/resolve`, {
      resolution,
      returnToBot,
    });
    return response.data;
  },

  // Notificación WhatsApp saliente
  sendWhatsAppMessage: async (data: SendWhatsAppNotificationDto): Promise<any> => {
    const payload = {
      destinationPhone: data.destinationPhone,
      content: data.content,
      patientId: data.patientId || null,
      appointmentId: data.appointmentId || null,
      whatsAppNotificationTypeId:
        data.whatsAppNotificationTypeId || '70000000-0000-0000-0000-000000000001',
      scheduledFor: new Date().toISOString(),
    };
    const response = await axiosClient.post('/v1/WhatsAppNotifications', payload);
    return response.data;
  },

  // Envío directo a WhatsApp a través del microservicio de Chatbot AI / Evolution API
  sendAgentDirectMessage: async (data: {
    phoneNumber: string;
    message: string;
    senderRole?: string;
    skipDbRegister?: boolean;
  }): Promise<any> => {
    const res = await chatbotClient.post(
      '/api/v1/agent/send-message',
      {
        phone_number: data.phoneNumber,
        message: data.message,
        sender_role: data.senderRole || 'AGENTE_HUMANO',
        skip_db_register: data.skipDbRegister ?? false,
      },
      {
        headers: {
          'X-Internal-Secret': 'TOKEN_SECRETO_INTERNO_NET_2026',
        },
      }
    );
    if (!res.data) {
      throw new Error('El chatbot no confirmó el envío del mensaje a WhatsApp.');
    }
    return res.data;
  },

  // Reactivación de conversación y retorno al bot (Vía .NET proxy / FastAPI)
  resumeConversation: async (phoneNumber: string, clearHistory: boolean = false): Promise<any> => {
    try {
      const res = await axiosClient.post('/v1/Chatbot/resume', {
        phoneNumber,
        clearHistory,
      });
      return res.data;
    } catch {
      try {
        const res = await chatbotClient.post(
          '/api/v1/conversations/resume',
          {
            phone_number: phoneNumber,
            clear_history: clearHistory,
          },
          {
            headers: {
              'X-Internal-Secret': 'TOKEN_SECRETO_INTERNO_NET_2026',
            },
          }
        );
        return res.data;
      } catch (err) {
        console.warn('resumeConversation failed:', err);
        return null;
      }
    }
  },

  // Reactivación masiva de todas las conversaciones abiertas al bot (Vía .NET proxy / FastAPI)
  resumeAllConversations: async (): Promise<any> => {
    try {
      const res = await axiosClient.post('/v1/Chatbot/resume-all');
      return res.data;
    } catch {
      try {
        const res = await chatbotClient.post(
          '/api/v1/conversations/resume-all',
          {},
          {
            headers: {
              'X-Internal-Secret': 'TOKEN_SECRETO_INTERNO_NET_2026',
            },
          }
        );
        return res.data;
      } catch (err) {
        console.warn('resumeAllConversations failed:', err);
        return null;
      }
    }
  },

  // Catálogos
  getConversationStatuses: async (): Promise<CatalogItem[]> => {
    try {
      const response = await axiosClient.get('/v1/ChatbotConversationStatuses');
      return response.data || [];
    } catch {
      return [];
    }
  },

  getMessageRoles: async (): Promise<CatalogItem[]> => {
    try {
      const response = await axiosClient.get('/v1/ChatbotMessageRoles');
      return response.data || [];
    } catch {
      return [];
    }
  },

  // WhatsApp QR Code Endpoints (Vía .NET proxy / FastAPI)
  getQrData: async (): Promise<{ connected: boolean; state: string; base64?: string; instanceName?: string }> => {
    try {
      const res = await axiosClient.get('/v1/Chatbot/qr', {
        params: { t: Date.now() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      return res.data;
    } catch {
      try {
        const res = await chatbotClient.get('/qr/data', {
          params: { t: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        return res.data;
      } catch (err) {
        console.warn('Could not fetch QR data:', err);
        return { connected: false, state: 'error' };
      }
    }
  },

  restartQrInstance: async (): Promise<any> => {
    try {
      const res = await axiosClient.post('/v1/Chatbot/qr/restart');
      return res.data;
    } catch {
      try {
        const res = await chatbotClient.post('/qr/restart');
        return res.data;
      } catch (err) {
        console.warn('Could not restart QR instance:', err);
        return { status: 'error' };
      }
    }
  },

  logoutQrInstance: async (): Promise<any> => {
    try {
      const res = await axiosClient.post('/v1/Chatbot/qr/logout');
      return res.data;
    } catch {
      const res = await chatbotClient.post('/qr/logout', null, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      return res.data;
    }
  },

  getTicketStatuses: async (): Promise<CatalogItem[]> => {
    try {
      const response = await axiosClient.get('/v1/SupportTicketStatuses');
      return response.data || [];
    } catch {
      return [];
    }
  },
};
