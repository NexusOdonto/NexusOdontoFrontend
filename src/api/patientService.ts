import axiosClient from './axiosClient';

export interface PatientResponseDto {
  id: string;
  personId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;
  allergies?: string;
  createdAt: string;
  // Campos enriquecidos de Person
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  documentTypeName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface CreatePatientDto {
  personId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;
  allergies?: string;
}

export interface UpdatePatientDto {
  personId: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;
  allergies?: string;
}

export const patientService = {
  getAll: async (): Promise<PatientResponseDto[]> => {
    const response = await axiosClient.get('/v1/Patients');
    return response.data;
  },

  getById: async (id: string): Promise<PatientResponseDto> => {
    const response = await axiosClient.get(`/v1/Patients/${id}`);
    return response.data;
  },

  create: async (data: CreatePatientDto): Promise<PatientResponseDto> => {
    const response = await axiosClient.post('/v1/Patients', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePatientDto): Promise<PatientResponseDto> => {
    const response = await axiosClient.put(`/v1/Patients/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Patients/${id}`);
  },
};
