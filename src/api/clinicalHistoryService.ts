import axiosClient from './axiosClient';

export interface ClinicalHistoryResponseDto {
  id: string;
  patientId: string;
  historyNumber: string;
  createdAt: string;
  patientName?: string;
  patientDocument?: string;
}

export interface ClinicalAttentionResponseDto {
  id: string;
  clinicalHistoryId: string;
  appointmentId?: string;
  professionalId: string;
  attentionDate: string;
  reasonForConsultation: string;
  currentIllness?: string;
  physicalExamination?: string;
  planAndTreatment?: string;
  observations?: string;
  createdAt: string;
}

export interface CreateClinicalAttentionRequestDto {
  clinicalHistoryId: string;
  appointmentId?: string;
  professionalId: string;
  attentionDate: string;
  reasonForConsultation: string;
  currentIllness?: string;
  physicalExamination?: string;
  planAndTreatment?: string;
  observations?: string;
}

export interface DiagnosisResponseDto {
  id: string;
  clinicalAttentionId: string;
  cie10Code: string;
  description: string;
  diagnosisType: string;
  isPresumptive: boolean;
}

export interface CreateDiagnosisRequestDto {
  clinicalAttentionId: string;
  cie10Code: string;
  description: string;
  diagnosisType: string;
  isPresumptive: boolean;
}

export interface ProcedurePerformedResponseDto {
  id: string;
  clinicalAttentionId: string;
  serviceId: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
}

export const clinicalHistoryService = {
  getAll: async (): Promise<ClinicalHistoryResponseDto[]> => {
    const response = await axiosClient.get('/v1/ClinicalHistories');
    return response.data;
  },

  getById: async (id: string): Promise<ClinicalHistoryResponseDto> => {
    const response = await axiosClient.get(`/v1/ClinicalHistories/${id}`);
    return response.data;
  },

  getAttentions: async (): Promise<ClinicalAttentionResponseDto[]> => {
    const response = await axiosClient.get('/v1/ClinicalAttentions');
    return response.data;
  },

  createAttention: async (data: CreateClinicalAttentionRequestDto): Promise<ClinicalAttentionResponseDto> => {
    const response = await axiosClient.post('/v1/ClinicalAttentions', data);
    return response.data;
  },

  getDiagnoses: async (): Promise<DiagnosisResponseDto[]> => {
    const response = await axiosClient.get('/v1/Diagnoses');
    return response.data;
  },

  createDiagnosis: async (data: CreateDiagnosisRequestDto): Promise<DiagnosisResponseDto> => {
    const response = await axiosClient.post('/v1/Diagnoses', data);
    return response.data;
  },

  getProcedures: async (): Promise<ProcedurePerformedResponseDto[]> => {
    const response = await axiosClient.get('/v1/ProceduresPerformed');
    return response.data;
  },
};
