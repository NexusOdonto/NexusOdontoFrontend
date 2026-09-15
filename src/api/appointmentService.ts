
export interface AppointmentClinicalContextDto {
  appointmentId: string;
  patientId: string;
  patientFullName: string;
  patientDocument?: string;
  patientEmail?: string;
  patientPhone?: string;
  clinicalHistoryId: string;
  professionalId?: string;
  professionalFullName?: string;
  serviceName?: string;
  startsAt: string;
  endsAt: string;
  statusName: string;
  canBeAttended: boolean;
  attendanceMessage?: string;
  latestOdontogram?: any;
}
import axiosClient from './axiosClient';

export interface AppointmentResponseDto {
  id: string;
  patientId: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  appointmentStatusId: string;
  appointmentOriginId: string;
  reasonForVisit?: string;
  notes?: string;
  createdByUserId?: string;
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  // Campos enriquecidos opcionales del join/display
  patientName?: string;
  patientEmail?: string;
  patientDocument?: string;
  professionalName?: string;
  serviceName?: string;
  statusName?: string;
  canBeAttended?: boolean;
  attendanceMessage?: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  /** Preferred professional; with autoAssignProfessional the API may pick another free dentist. */
  professionalId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  appointmentStatusId: string;
  appointmentOriginId: string;
  reasonForVisit?: string;
  notes?: string;
  /** Patient self-booking: try preferred, then other active professionals free in the slot. */
  autoAssignProfessional?: boolean;
}

export interface UpdateAppointmentDto {
  patientId?: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  appointmentStatusId: string;
  appointmentOriginId: string;
  reasonForVisit?: string;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface AppointmentStatusDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface AppointmentOriginDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export const appointmentService = {
  getAll: async (): Promise<AppointmentResponseDto[]> => {
    const response = await axiosClient.get('/v1/Appointments');
    return response.data;
  },

  getById: async (id: string): Promise<AppointmentResponseDto> => {
    const response = await axiosClient.get(`/v1/Appointments/${id}`);
    return response.data;
  },

  create: async (data: CreateAppointmentDto): Promise<AppointmentResponseDto> => {
    const response = await axiosClient.post('/v1/Appointments', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAppointmentDto): Promise<AppointmentResponseDto> => {
    const response = await axiosClient.put(`/v1/Appointments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Appointments/${id}`);
  },

  getStatuses: async (): Promise<AppointmentStatusDto[]> => {
    const response = await axiosClient.get('/v1/AppointmentStatuses');
    return response.data;
  },

    getClinicalContext: async (id: string): Promise<AppointmentClinicalContextDto> => {
    const response = await axiosClient.get(`/v1/Appointments/${id}/clinical-context`);
    return response.data;
  },

  markNoShow: async (id: string, reason?: string): Promise<AppointmentResponseDto> => {
    const response = await axiosClient.post(`/v1/Appointments/${id}/no-show`, { reason });
    return response.data;
  },
  getOrigins: async (): Promise<AppointmentOriginDto[]> => {
    const response = await axiosClient.get('/v1/AppointmentOrigins');
    return response.data;
  },
};
