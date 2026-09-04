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
}

export interface CreateAppointmentDto {
  patientId: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  appointmentStatusId: string;
  appointmentOriginId: string;
  reasonForVisit?: string;
  notes?: string;
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

  getOrigins: async (): Promise<AppointmentOriginDto[]> => {
    const response = await axiosClient.get('/v1/AppointmentOrigins');
    return response.data;
  },
};
