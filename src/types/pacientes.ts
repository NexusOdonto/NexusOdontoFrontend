/**
 * Entidades y tipos del módulo de Pacientes e Historia Clínica correspondientes al esquema Oracle.
 */

import { isAnyKeyOnline } from "../features/auth/presenceService";

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

export const isPatientActive = (paciente?: Paciente | null): boolean => {
  if (!paciente) return false;

  // Revisar si está en la lista de cuentas bloqueadas/desactivadas
  try {
    const deactivatedListRaw = localStorage.getItem("nexus_deactivated_accounts");
    if (deactivatedListRaw) {
      const deactivatedList: string[] = JSON.parse(deactivatedListRaw);
      const doc = (paciente.documento || "").trim();
      const email = (paciente.correo || "").toLowerCase().trim();
      const pId = paciente.patientId || String(paciente.id || "");
      if (doc && deactivatedList.includes(doc)) return false;
      if (email && deactivatedList.includes(email)) return false;
      if (pId && deactivatedList.includes(pId)) return false;
    }
  } catch {}

  const raw = (paciente as any).isActive ?? (paciente as any).is_active ?? (paciente as any).activo;
  if (raw !== undefined) return Boolean(raw);

  const estadoLower = (paciente.estado || "").toLowerCase().trim();
  if (estadoLower === "inactivo" || estadoLower === "inactive" || estadoLower === "0" || estadoLower === "false") {
    return false;
  }
  return true;
};

export const isPatientOnline = (paciente?: Paciente | null, currentUser?: any): boolean => {
  if (!paciente) return false;
  if (!isPatientActive(paciente)) return false;

  const doc = (paciente.documento || "").trim();
  const email = (paciente.correo || "").toLowerCase().trim();
  const pId = paciente.patientId || String(paciente.id || "");
  const perId = paciente.personId || "";

  // 1. Coincide con el usuario autenticado en esta pestaña
  if (currentUser) {
    const userDoc = (currentUser.cedula || currentUser.documento || "").trim();
    const userEmail = (currentUser.email || currentUser.correo || "").toLowerCase().trim();
    const userId = currentUser.id || "";
    const userPersonId = currentUser.personId || "";

    if (userDoc && doc && userDoc === doc) return true;
    if (userEmail && email && userEmail === email) return true;
    if (userId && pId && userId === pId) return true;
    if (userPersonId && perId && userPersonId === perId) return true;
  }

  // 2. Registro de sesiones activas (localStorage + otras pestañas)
  return isAnyKeyOnline([doc, email, pId, perId, paciente.id != null ? String(paciente.id) : ""]);
}
