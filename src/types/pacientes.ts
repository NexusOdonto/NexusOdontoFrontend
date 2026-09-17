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
  generoId?: string; // FK -> genders
  direccion?: string;
  proximaCita?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  alergias?: string;
  fotoUrl?: string;
  antecedentes?: PatientBackgroundEntity[];
}

export const PACIENTES_STORAGE_KEY = "nexusodontopacientes";

export const isPatientOnline = (paciente?: Paciente | null, currentUser?: any): boolean => {
  if (!paciente) return false;

  // 1. Si coincide con el usuario autenticado con sesión abierta
  if (currentUser) {
    const doc = (paciente.documento || "").trim();
    const email = (paciente.correo || "").toLowerCase().trim();
    const pId = paciente.patientId || String(paciente.id || "");
    const perId = paciente.personId || "";

    const userDoc = (currentUser.cedula || currentUser.documento || "").trim();
    const userEmail = (currentUser.email || currentUser.correo || "").toLowerCase().trim();
    const userId = currentUser.id || "";
    const userPersonId = currentUser.personId || "";

    if (userDoc && doc && userDoc === doc) return true;
    if (userEmail && email && userEmail === email) return true;
    if (userId && pId && userId === pId) return true;
    if (userPersonId && perId && userPersonId === perId) return true;
  }

  // 2. Si su identificador está en el registro de sesiones activas en línea
  try {
    const onlineListRaw = localStorage.getItem("nexus_online_users");
    if (onlineListRaw) {
      const onlineList: string[] = JSON.parse(onlineListRaw);
      if (Array.isArray(onlineList)) {
        const doc = (paciente.documento || "").trim();
        const email = (paciente.correo || "").toLowerCase().trim();
        const pId = paciente.patientId || String(paciente.id || "");
        if (doc && onlineList.includes(doc)) return true;
        if (email && onlineList.some((k) => k && k.toLowerCase() === email)) return true;
        if (pId && onlineList.includes(pId)) return true;
      }
    }
  } catch {
    // Ignore
  }

  return false;
};
