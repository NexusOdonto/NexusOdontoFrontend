import axiosClient from './axiosClient';

export interface HubNotificationDto {
  id: string;
  recipientUserId?: string | null;
  recipientRoleId?: string | null;
  title: string;
  content: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export const hubNotificationService = {
  /** Notificaciones recientes dirigidas al usuario autenticado o a sus roles. */
  getMine: async (): Promise<HubNotificationDto[]> => {
    const response = await axiosClient.get('/v1/HubNotifications/mine');
    return Array.isArray(response.data) ? response.data : [];
  },
};
