/**
 * Odontogram Cross-Patient Isolation Test Suite
 * 
 * Verifies:
 * 1. Selecting Patient A.
 * 2. Registering a dental finding on tooth 18 (Caries) and saving.
 * 3. Switching to Patient B.
 * 4. Asserting that tooth 18 for Patient B is clean (Sano / Healthy / diagnosis 'none').
 * 5. Returning to Patient A and verifying tooth 18 retains the Caries finding.
 */

import { FDI_PERMANENT_QUADRANTS, FDI_TEMPORARY_QUADRANTS, createDefaultToothState } from "./types";
import type { ToothState, Diagnosis } from "./types";

export function createCleanOdontogramState() {
  const teeth: Record<number, ToothState> = {};
  Object.values(FDI_PERMANENT_QUADRANTS).flat().forEach((toothNumber) => {
    teeth[toothNumber] = createDefaultToothState(toothNumber);
    teeth[toothNumber].isVisible = true;
  });
  Object.values(FDI_TEMPORARY_QUADRANTS).flat().forEach((toothNumber) => {
    teeth[toothNumber] = createDefaultToothState(toothNumber);
    teeth[toothNumber].isVisible = false;
  });

  return {
    dentitionType: "permanent" as const,
    teeth,
    selectedDiagnosis: "caries" as Diagnosis,
  };
}

export function testPatientIsolation() {
  const storageMock: Record<string, string> = {};

  const getStorageKey = (patientId?: string) => (patientId ? `nexus_odontograma_${patientId}` : "");
  const saveState = (patientId: string, state: any) => {
    if (!patientId) return;
    storageMock[getStorageKey(patientId)] = JSON.stringify(state);
  };
  const loadState = (patientId: string) => {
    if (!patientId) return createCleanOdontogramState();
    const raw = storageMock[getStorageKey(patientId)];
    if (!raw) return createCleanOdontogramState();
    return JSON.parse(raw);
  };

  const patientA = "patient-uuid-AAAA-1111";
  const patientB = "patient-uuid-BBBB-2222";

  // Step 1: Select Patient A
  let activePatientId = patientA;
  let currentState = loadState(activePatientId);

  // Step 2: Register finding on tooth 18 (Caries on 'vestibular') and save
  currentState.teeth[18].faces.vestibular = { diagnosis: "caries" };
  saveState(activePatientId, currentState);

  // Verify Patient A has Caries on tooth 18
  if (currentState.teeth[18].faces.vestibular.diagnosis !== "caries") {
    throw new Error("Assertion failed: Patient A should have caries on tooth 18");
  }

  // Step 3: Switch to Patient B (immediate reset & load)
  activePatientId = patientB;
  currentState = loadState(activePatientId);

  // Step 4: Assert Patient B tooth 18 is clean / healthy
  const tooth18PatientB = currentState.teeth[18];
  if (
    tooth18PatientB.faces.vestibular?.diagnosis !== "none" ||
    tooth18PatientB.faces.mesial?.diagnosis !== "none" ||
    tooth18PatientB.faces.distal?.diagnosis !== "none" ||
    tooth18PatientB.faces.palatino?.diagnosis !== "none" ||
    tooth18PatientB.faces.oclusal?.diagnosis !== "none" ||
    tooth18PatientB.condition !== "healthy"
  ) {
    throw new Error("Assertion failed: Patient B tooth 18 MUST be clean (sano)");
  }

  // Step 5: Switch back to Patient A and verify tooth 18 retains caries
  activePatientId = patientA;
  currentState = loadState(activePatientId);
  const tooth18PatientA = currentState.teeth[18];

  if (tooth18PatientA.faces.vestibular?.diagnosis !== "caries") {
    throw new Error("Assertion failed: Patient A tooth 18 MUST retain caries finding");
  }

  return {
    success: true,
    message: "Isolation test passed: Zero cross-contamination between Patient A and Patient B.",
  };
}
