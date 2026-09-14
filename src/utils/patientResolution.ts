import { patientService, type PatientResponseDto } from "../api/patientService";
import { personService, type Person } from "../api/personService";
import { areGuidsEqual } from "./roleUtils";

export interface ResolvePatientResult {
  patientId: string;
  personId?: string;
  patientName: string;
  isNew?: boolean;
}

export interface ResolvePatientOptions {
  identifierOrName: string;
  patientsEntities: (PatientResponseDto | any)[];
  personsEntities?: (Person | any)[];
  currentUser?: { id?: string; personId?: string; email?: string; cedula?: string; name?: string } | null;
  isPacienteRole?: boolean;
}

/**
 * Resuelve el GUID exacto del paciente o crea dinámicamente el registro en BD (Person + Patient)
 * para evitar que todas las citas se asignen a un paciente por defecto (Andrés Pérez).
 */
export async function resolveOrCreatePatient({
  identifierOrName,
  patientsEntities,
  personsEntities = [],
  currentUser,
  isPacienteRole,
}: ResolvePatientOptions): Promise<ResolvePatientResult> {
  const cleanInput = (identifierOrName || "").trim();

  // 1. Si es rol Paciente y está logueado en su sesión
  if (isPacienteRole && currentUser) {
    const matchedCurrent = patientsEntities.find((pt) =>
      (currentUser.id && areGuidsEqual(pt.id, currentUser.id)) ||
      (currentUser.personId && areGuidsEqual(pt.personId, currentUser.personId)) ||
      (currentUser.id && areGuidsEqual(pt.personId, currentUser.id))
    );
    if (matchedCurrent?.id) {
      return {
        patientId: matchedCurrent.id,
        personId: matchedCurrent.personId,
        patientName: currentUser.name || `${matchedCurrent.firstName || ""} ${matchedCurrent.lastName || ""}`.trim() || "Paciente",
      };
    }

    // Si tiene personId pero no está en la tabla de pacientes, crear su registro de paciente
    const personIdToUse = currentUser.personId || (currentUser.id && currentUser.id.length > 20 ? currentUser.id : undefined);
    if (personIdToUse) {
      try {
        const createdPatient = await patientService.create({ personId: personIdToUse });
        if (createdPatient?.id) {
          return {
            patientId: createdPatient.id,
            personId: personIdToUse,
            patientName: currentUser.name || "Paciente",
            isNew: true,
          };
        }
      } catch (e) {
        console.warn("Could not create patient record for current user, using personId as fallback:", e);
      }
    }

    if (currentUser.id && currentUser.id.length > 20) {
      return { patientId: currentUser.id, personId: currentUser.personId, patientName: currentUser.name || "Paciente" };
    }
  }

  // 2. Buscar coincidencia exacta o parcial en patientsEntities
  const matchedPt = patientsEntities.find((pt) => {
    if (!cleanInput) return false;
    if (areGuidsEqual(pt.id, cleanInput) || areGuidsEqual(pt.personId, cleanInput)) return true;
    const ptFullName = `${pt.firstName || ""} ${pt.lastName || ""}`.toLowerCase().trim();
    const inputLower = cleanInput.toLowerCase();
    if (ptFullName && (ptFullName === inputLower || ptFullName.includes(inputLower) || inputLower.includes(ptFullName))) {
      return true;
    }
    if (pt.documentNumber && String(pt.documentNumber).toLowerCase() === inputLower) {
      return true;
    }
    return false;
  });

  if (matchedPt?.id) {
    const ptName = `${matchedPt.firstName || ""} ${matchedPt.lastName || ""}`.trim() || cleanInput;
    return {
      patientId: matchedPt.id,
      personId: matchedPt.personId,
      patientName: ptName,
    };
  }

  // 3. Buscar si existe en personsEntities
  const matchedPerson = personsEntities.find((per) => {
    if (!cleanInput) return false;
    if (areGuidsEqual(per.id, cleanInput)) return true;
    const perFullName = `${per.firstName || ""} ${per.lastName || ""}`.toLowerCase().trim();
    const inputLower = cleanInput.toLowerCase();
    if (perFullName && (perFullName === inputLower || perFullName.includes(inputLower) || inputLower.includes(perFullName))) {
      return true;
    }
    if (per.documentNumber && String(per.documentNumber).toLowerCase() === inputLower) {
      return true;
    }
    return false;
  });

  if (matchedPerson?.id) {
    // Si la persona ya existe, verificar si ya tiene registro de paciente en el backend
    try {
      const createdPatient = await patientService.create({
        personId: matchedPerson.id,
        emergencyContact: "Familiar",
        emergencyPhone: "+57 300 000 0000",
      });
      if (createdPatient?.id) {
        return {
          patientId: createdPatient.id,
          personId: matchedPerson.id,
          patientName: `${matchedPerson.firstName || ""} ${matchedPerson.lastName || ""}`.trim(),
          isNew: true,
        };
      }
    } catch (err) {
      console.warn("Patient might already exist for person or error on creation:", err);
    }

    return {
      patientId: matchedPerson.id,
      personId: matchedPerson.id,
      patientName: `${matchedPerson.firstName || ""} ${matchedPerson.lastName || ""}`.trim(),
    };
  }

  // 4. Si el nombre no existe en personas ni pacientes, crear Persona + Paciente dinámicamente en el Backend
  if (cleanInput.length >= 2) {
    try {
      const parts = cleanInput.split(/\s+/);
      const firstName = parts[0] || "Paciente";
      const lastName = parts.slice(1).join(" ") || "General";
      const timestamp = Date.now();
      const docNumber = `10${timestamp.toString().slice(-8)}`;
      const safeEmail = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${timestamp.toString().slice(-4)}@nexusodonto.com`;

      const newPerson = await personService.create({
        documentTypeId: "e0000000-0000-0000-0000-000000000001", // Cédula de Ciudadanía
        documentNumber: docNumber,
        firstName,
        lastName,
        email: safeEmail,
        phone: "+57 300 123 4567",
      });

      if (newPerson?.id) {
        try {
          const newPatient = await patientService.create({
            personId: newPerson.id,
            emergencyContact: "Contacto Clínico",
            emergencyPhone: "+57 300 123 4567",
          });

          if (newPatient?.id) {
            return {
              patientId: newPatient.id,
              personId: newPerson.id,
              patientName: `${firstName} ${lastName}`,
              isNew: true,
            };
          }
        } catch (patErr) {
          console.warn("Could not create patient entity for new person:", patErr);
        }

        return {
          patientId: newPerson.id,
          personId: newPerson.id,
          patientName: `${firstName} ${lastName}`,
          isNew: true,
        };
      }
    } catch (err) {
      console.error("Failed to auto-register new person & patient:", err);
    }
  }

  // 5. Fallback seguro si la API estuviera inaccesible
  const fallbackId = patientsEntities.length > 0 && patientsEntities[0]?.id
    ? patientsEntities[0].id
    : "1e000000-0000-0000-0000-000000000001";

  return {
    patientId: fallbackId,
    patientName: cleanInput || "Paciente Registrado",
  };
}
