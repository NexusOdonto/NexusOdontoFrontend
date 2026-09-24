import axiosClient from './axiosClient';
import { personService } from './personService';

export interface PatientResponseDto {
  id: string;
  personId: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;
  allergies?: string;
  isActive?: boolean;
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
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;
  allergies?: string;
}

export interface UpdatePatientDto {
  personId?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  bloodType?: string;
  allergies?: string;
  isActive?: boolean;
}

const mapPatientResponse = (data: any): PatientResponseDto => ({
  ...data,
  emergencyContactName: data?.emergencyContact || data?.emergencyContactName,
  emergencyContactPhone: data?.emergencyPhone || data?.emergencyContactPhone,
  emergencyContact: data?.emergencyContact || data?.emergencyContactName,
  emergencyPhone: data?.emergencyPhone || data?.emergencyContactPhone,
});

export const patientService = {
  getAll: async (): Promise<PatientResponseDto[]> => {
    const response = await axiosClient.get('/v1/Patients');
    const rawPatients: any[] = Array.isArray(response.data) ? response.data : (response.data?.items || []);

    try {
      const persons = await personService.getAll().catch(() => []);
      if (Array.isArray(persons) && persons.length > 0) {
        return rawPatients.map((p) => {
          const matchedPerson = persons.find(
            (per) => per.id && p.personId && String(per.id).toLowerCase() === String(p.personId).toLowerCase()
          );
          return mapPatientResponse({
            ...p,
            firstName: matchedPerson?.firstName || p.firstName,
            lastName: matchedPerson?.lastName || p.lastName,
            documentNumber: matchedPerson?.documentNumber || p.documentNumber,
            email: matchedPerson?.email || p.email,
            phone: matchedPerson?.phone || p.phone,
            address: matchedPerson?.address || p.address,
            dateOfBirth: matchedPerson?.dateOfBirth || p.dateOfBirth,
          });
        });
      }
    } catch {
      // Fallback
    }

    return rawPatients.map(mapPatientResponse);
  },

  getById: async (id: string): Promise<PatientResponseDto> => {
    const response = await axiosClient.get(`/v1/Patients/${id}`);
    return mapPatientResponse(response.data);
  },

  getByPersonId: async (personId: string): Promise<PatientResponseDto | null> => {
    try {
      const response = await axiosClient.get(`/v1/Patients/by-person/${personId}`);
      return mapPatientResponse(response.data);
    } catch {
      return null;
    }
  },

  getByDocument: async (documentNumber: string): Promise<PatientResponseDto | null> => {
    try {
      const response = await axiosClient.get(
        `/v1/Patients/by-document/${encodeURIComponent(documentNumber)}`
      );
      return mapPatientResponse(response.data);
    } catch {
      return null;
    }
  },

  create: async (data: CreatePatientDto): Promise<PatientResponseDto> => {
    const payload = {
      personId: data.personId,
      emergencyContact: data.emergencyContact || data.emergencyContactName || null,
      emergencyPhone: data.emergencyPhone || data.emergencyContactPhone || null,
    };
    const response = await axiosClient.post('/v1/Patients', payload);
    return mapPatientResponse(response.data);
  },

  update: async (id: string, data: UpdatePatientDto): Promise<PatientResponseDto> => {
    const payload = {
      emergencyContact: data.emergencyContact || data.emergencyContactName || null,
      emergencyPhone: data.emergencyPhone || data.emergencyContactPhone || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    const response = await axiosClient.put(`/v1/Patients/${id}`, payload);
    return mapPatientResponse(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Patients/${id}`);
  },
};
