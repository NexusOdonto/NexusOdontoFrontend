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
  appointmentId?: string;
  clinicalExam?: string;
  progressNotes?: string;
  treatmentPlan?: string;
  // Compatibilidad con vistas previas
  clinicalHistoryId?: string;
  professionalId?: string;
  attentionDate?: string;
  reasonForConsultation?: string;
  currentIllness?: string;
  physicalExamination?: string;
  planAndTreatment?: string;
  observations?: string;
}


export interface DiagnosisResponseDto {
  id: string;
  clinicalAttentionId: string;
  code?: string;
  cie10Code?: string;
  description: string;
  type?: string;
  diagnosisType?: string;
  isPresumptive?: boolean;
  createdAt?: string;
  observations?: string;
  notes?: string;
}

export interface CreateDiagnosisRequestDto {
  clinicalAttentionId: string;
  code?: string;
  cie10Code?: string;
  description: string;
  type?: string;
  diagnosisType?: string;
  isPresumptive?: boolean;
}

export interface ProcedurePerformedResponseDto {
  id: string;
  clinicalAttentionId: string;
  serviceId: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
  createdAt?: string;
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
    if (!data.appointmentId || data.appointmentId.trim() === '') {
      throw new Error("Se requiere una cita vinculada activa para registrar la atención clínica.");
    }
    const payload = {
      appointmentId: data.appointmentId,
      clinicalExam: data.clinicalExam || data.physicalExamination || data.reasonForConsultation || null,
      progressNotes: data.progressNotes || data.observations || data.currentIllness || null,
      treatmentPlan: data.treatmentPlan || data.planAndTreatment || null,
    };
    const response = await axiosClient.post('/v1/ClinicalAttentions', payload);
    return response.data;
  },

  getDiagnoses: async (): Promise<DiagnosisResponseDto[]> => {
    const response = await axiosClient.get('/v1/Diagnoses');
    return (response.data || []).map((d: any) => ({
      ...d,
      cie10Code: d.code || d.cie10Code || '',
      diagnosisType: d.type || d.diagnosisType || 'DENTAL',
    }));
  },

  createDiagnosis: async (data: CreateDiagnosisRequestDto): Promise<DiagnosisResponseDto> => {
    const payload = {
      clinicalAttentionId: data.clinicalAttentionId,
      code: data.code || data.cie10Code || 'K02.9',
      description: data.description || 'Diagnóstico dental',
      type: data.type || data.diagnosisType || 'DENTAL',
    };
    const response = await axiosClient.post('/v1/Diagnoses', payload);
    return {
      ...response.data,
      cie10Code: response.data.code || response.data.cie10Code,
      diagnosisType: response.data.type || response.data.diagnosisType,
    };
  },

  getProcedures: async (): Promise<ProcedurePerformedResponseDto[]> => {
    const response = await axiosClient.get('/v1/ProceduresPerformed');
    return response.data;
  },
};

