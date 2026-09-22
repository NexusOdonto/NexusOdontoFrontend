import axiosClient from './axiosClient';

/** Tipos de antecedente seedeados en el backend (AntecedentTypeSeeder). */
export const ANTECEDENT_TYPE_IDS = {
  ALERGIA: '17000000-0000-0000-0000-000000000003',
} as const;

export interface PatientAntecedentResponseDto {
  id: string;
  patientId: string;
  antecedentTypeId: string;
  description: string;
  isActive: boolean;
  registeredByUserId?: string;
  registeredAt: string;
}

export interface CreatePatientAntecedentDto {
  patientId: string;
  antecedentTypeId: string;
  description: string;
}

export const patientAntecedentService = {
  getAll: async (): Promise<PatientAntecedentResponseDto[]> => {
    const response = await axiosClient.get('/v1/PatientAntecedents');
    return response.data;
  },

  /**
   * El backend no expone filtro por paciente, así que se filtra en cliente.
   * Si el listado crece, conviene añadir el endpoint y cambiar esto.
   */
  getByPatient: async (patientId: string): Promise<PatientAntecedentResponseDto[]> => {
    const all = await patientAntecedentService.getAll();
    const target = patientId.toLowerCase();
    return all.filter((a) => String(a.patientId || '').toLowerCase() === target);
  },

  create: async (data: CreatePatientAntecedentDto): Promise<PatientAntecedentResponseDto> => {
    // RegisteredByUserId lo resuelve el controlador desde el JWT.
    const response = await axiosClient.post('/v1/PatientAntecedents', {
      patientId: data.patientId,
      antecedentTypeId: data.antecedentTypeId,
      description: data.description,
    });
    return response.data;
  },
};
