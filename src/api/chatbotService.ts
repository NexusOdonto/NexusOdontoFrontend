import axios from "axios";

const CHATBOT_BASE_URL =
  import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:8000";

const chatbotClient = axios.create({
  baseURL: CHATBOT_BASE_URL,
  timeout: 25000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ChatbotMessagePayload {
  message: string;
  userId?: string;
  role?: string;
  context?: string;
  conversationId?: string;
}

export interface ChatbotResponse {
  reply: string;
  status: "success" | "fallback" | "error";
  conversationId?: string;
  actionLink?: {
    text: string;
    path: string;
  };
}

export const chatbotService = {
  async sendMessage(
    payload: ChatbotMessagePayload,
    token?: string
  ): Promise<ChatbotResponse> {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await chatbotClient.post<ChatbotResponse>("/chat", payload, {
        headers,
      });

      if (res.data && res.data.reply) {
        return res.data;
      }

      throw new Error("Respuesta inválida del servidor AI.");
    } catch (error: any) {
      console.warn(
        "[ChatbotService] AI Service no disponible o en espera, usando asistente contextual:",
        error?.message
      );
      return {
        reply: "",
        status: "fallback",
      };
    }
  },
};
