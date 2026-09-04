/**
 * Entidades y tipos del módulo de Pacientes e Historia Clínica correspondientes al esquema Oracle.
 */

export interface DocumentTypeEntity {
  id: string; // GUID RAW(16)
  code: string; // CC, TI, CE, PASAPORTE, etc.
  name: string;
  isActive: boolean;
}

export interface GenderEntity {
  id: string; // GUID RAW(16)
  code: string; // M, F, OTRO
  name: string;
}

export interface BackgroundTypeEntity {
  id: string; // GUID RAW(16)
  code: string; // ALERGIA, PATOLOGICO, QUIRURGICO, FARMACOLOGICO, FAMILIAR
  name: string;
  description?: string;
}

export interface PatientBackgroundEntity {
  id: string; // GUID RAW(16)
  patientId: string; // FK -> patients
  backgroundTypeId: string; // FK -> background_types
  backgroundTypeName?: string;
  description: string;
  diagnosedAt?: string;
  treatment?: string;
}

export interface Paciente {
  id: number | string; // ID numérico en memoria o GUID en BD Oracle
  personId?: string; // FK -> persons.id
  patientId?: string; // FK -> patients.id
  nombre: string;
  primerNombre?: string;
  segundoNombre?: string;
  apellidos?: string;
  documento: string;
  tipoDocumento?: string; // FK o código de document_types
  tipoDocumentoId?: string;
  telefono: string;
  estado: string; // Activo, Inactivo
  correo?: string;
  fechaNacimiento?: string;
  genero?: string;
  generoId?: string; // FK -> genders
  direccion?: string;
  proximaCita?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  alergias?: string;
  antecedentes?: PatientBackgroundEntity[];
}

export const PACIENTES_STORAGE_KEY = "nexusodontopacientes";
