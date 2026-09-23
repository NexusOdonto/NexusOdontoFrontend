import axiosClient from './axiosClient';
import { areGuidsEqual } from '../utils/roleUtils';

export const SESSION_STATUS_ACTIVE = "15000000-0000-0000-0000-000000000001";
export const SESSION_STATUS_REVOKED = "15000000-0000-0000-0000-000000000002";

export interface SessionResponseDto {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  sessionStatusId: string;
}

export const isSessionActive = (session?: SessionResponseDto | null): boolean => {
  if (!session) return false;
  if (!areGuidsEqual(session.sessionStatusId, SESSION_STATUS_ACTIVE)) return false;
  if (session.revokedAt) return false;
  if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) return false;
  return true;
};

export const sessionService = {
  getAll: async (): Promise<SessionResponseDto[]> => {
    const response = await axiosClient.get('/v1/Sessions');
    return response.data;
  },

  getById: async (id: string): Promise<SessionResponseDto> => {
    const response = await axiosClient.get(`/v1/Sessions/${id}`);
    return response.data;
  },
};
