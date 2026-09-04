import axiosClient from './axiosClient';
import { personService } from './personService';
import { employeeService } from './employeeService';
import { specialtyService } from './specialtyService';

export interface ProfessionalResponseDto {
  id: string;
  employeeId?: string;
  personId?: string;
  specialtyId?: string;
  specialtyIds?: string[];
  professionalLicense?: string;
  licenseNumber?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  // Campos enriquecidos
  firstName?: string;
  lastName?: string;
  fullName?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  specialtyName?: string;
}

export interface CreateProfessionalDto {
  employeeId?: string;
  personId?: string;
  specialtyIds?: string[];
  specialtyId?: string;
  professionalLicense?: string;
  licenseNumber?: string;
  bio?: string;
  isActive?: boolean;
}

export interface UpdateProfessionalDto {
  employeeId?: string;
  personId?: string;
  specialtyIds?: string[];
  specialtyId?: string;
  professionalLicense?: string;
  licenseNumber?: string;
  isActive?: boolean;
  bio?: string;
}

export interface RegisterProfessionalRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentNumber?: string;
  documentTypeId?: string;
  specialtyId?: string;
  specialtyIds?: string[];
  professionalLicense: string;
  bio?: string;
}

const mapProfessional = (item: any): ProfessionalResponseDto => {
  const license = item.professionalLicense || item.licenseNumber || '';
  const specIds: string[] = item.specialtyIds || (item.specialtyId ? [item.specialtyId] : []);
  const specId = specIds[0] || item.specialtyId || '';
  return {
    ...item,
    personId: item.personId || item.employeeId || '',
    licenseNumber: license,
    professionalLicense: license,
    specialtyIds: specIds,
    specialtyId: specId,
  };
};

export const professionalService = {
  getAll: async (): Promise<ProfessionalResponseDto[]> => {
    const response = await axiosClient.get('/v1/Professionals');
    const rawProfs: any[] = Array.isArray(response.data) ? response.data : [];

    // Enriquecer en paralelo con empleados, personas y especialidades
    try {
      const [employees, persons, specialties] = await Promise.all([
        employeeService.getAll().catch(() => []),
        personService.getAll().catch(() => []),
        specialtyService.getAll().catch(() => []),
      ]);

      return rawProfs.map((p) => {
        const emp = employees.find((e) => e.id === p.employeeId);
        const person = emp ? persons.find((per) => per.id === emp.personId) : null;
        const specialty = specialties.find((s) => p.specialtyIds?.includes(s.id));

        const firstName = person?.firstName || '';
        const lastName = person?.lastName || '';
        const fullName = (firstName || lastName)
          ? `Dr(a). ${firstName} ${lastName}`.trim()
          : undefined;

        return mapProfessional({
          ...p,
          employeeId: p.employeeId,
          personId: emp?.personId,
          licenseNumber: p.professionalLicense || p.licenseNumber,
          professionalLicense: p.professionalLicense || p.licenseNumber,
          firstName,
          lastName,
          fullName,
          email: person?.email || '',
          phone: person?.phone || '',
          documentNumber: person?.documentNumber || '',
          specialtyId: specialty?.id || p.specialtyIds?.[0],
          specialtyIds: p.specialtyIds || [],
          specialtyName: specialty?.name || 'Odontología General',
        });
      });
    } catch {
      return rawProfs.map(mapProfessional);
    }
  },

  getById: async (id: string): Promise<ProfessionalResponseDto> => {
    const response = await axiosClient.get(`/v1/Professionals/${id}`);
    return mapProfessional(response.data);
  },

  create: async (data: CreateProfessionalDto): Promise<ProfessionalResponseDto> => {
    const license = data.professionalLicense || data.licenseNumber || '';
    const specIds = data.specialtyIds || (data.specialtyId ? [data.specialtyId] : []);
    const payload = {
      employeeId: data.employeeId || data.personId || undefined,
      personId: data.personId || data.employeeId || undefined,
      professionalLicense: license,
      licenseNumber: license,
      specialtyIds: specIds,
      specialtyId: specIds[0] || data.specialtyId,
    };
    const response = await axiosClient.post('/v1/Professionals', payload);
    return mapProfessional(response.data);
  },

  update: async (id: string, data: UpdateProfessionalDto): Promise<ProfessionalResponseDto> => {
    const license = data.professionalLicense || data.licenseNumber || '';
    const specIds = data.specialtyIds || (data.specialtyId ? [data.specialtyId] : undefined);
    const payload = {
      professionalLicense: license,
      specialtyIds: specIds,
      isActive: data.isActive,
    };
    const response = await axiosClient.put(`/v1/Professionals/${id}`, payload);
    return mapProfessional(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/v1/Professionals/${id}`);
  },

  /**
   * Registro integral de un nuevo odontólogo:
   * 1. Crea la persona en la tabla PERSONS (si no existe)
   * 2. Crea el empleado en la tabla EMPLOYEES con cargo ODONTOLOGO y código formateado
   * 3. Crea el registro en la tabla PROFESSIONALS vinculado a la especialidad
   */
  registerComplete: async (req: RegisterProfessionalRequest): Promise<ProfessionalResponseDto> => {
    const timestamp = Date.now();
    const docNumber = req.documentNumber || `10${timestamp.toString().slice(-8)}`;
    const docTypeId = req.documentTypeId || 'e0000000-0000-0000-0000-000000000001'; // CC

    // 1. Crear persona
    const person = await personService.create({
      documentTypeId: docTypeId,
      documentNumber: docNumber,
      firstName: req.firstName.trim(),
      lastName: req.lastName.trim(),
      email: req.email.trim(),
      phone: req.phone?.trim() || '+57 300 000 0000',
    });

    // 2. Generar código de empleado con formato OD001..OD999
    let nextCode = 'OD010';
    try {
      const existingEmployees = await employeeService.getAll();
      const num = (existingEmployees.length + 1).toString().padStart(3, '0');
      nextCode = `OD${num}`;
    } catch {
      nextCode = `OD${timestamp.toString().slice(-3)}`;
    }

    // 3. Crear empleado
    const employee = await employeeService.create({
      personId: person.id,
      jobTitleId: '11000000-0000-0000-0000-000000000003', // Cargo ODONTOLOGO
      hireDate: new Date().toISOString().split('T')[0],
      employeeCode: nextCode,
    });

    // 4. Determinar IDs de especialidades
    const specialtyIds = req.specialtyIds && req.specialtyIds.length > 0
      ? req.specialtyIds
      : req.specialtyId
      ? [req.specialtyId]
      : ['18000000-0000-0000-0000-000000000001']; // Odontología General por defecto

    // 5. Crear profesional
    const createdProf = await professionalService.create({
      employeeId: employee.id,
      professionalLicense: req.professionalLicense.trim() || `COL-${timestamp.toString().slice(-5)}`,
      specialtyIds,
    });

    return {
      ...createdProf,
      employeeId: employee.id,
      personId: person.id,
      firstName: req.firstName,
      lastName: req.lastName,
      fullName: `Dr(a). ${req.firstName} ${req.lastName}`.trim(),
      email: req.email,
      phone: req.phone,
      documentNumber: docNumber,
      licenseNumber: req.professionalLicense,
      professionalLicense: req.professionalLicense,
      bio: req.bio,
    };
  },
};
