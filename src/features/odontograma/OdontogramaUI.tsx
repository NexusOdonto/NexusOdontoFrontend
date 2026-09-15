import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { OdontogramaGrid } from "./components/OdontogramaGrid";
import { ConvencionesToolbar } from "./components/ConvencionesToolbar";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { odontogramService } from "../../api/odontogramService";
import { clinicalHistoryService } from "../../api/clinicalHistoryService";
import { professionalService } from "../../api/professionalService";
import { appointmentService } from "../../api/appointmentService";
import { useAuth } from "../auth/AuthContext";
import { areGuidsEqual } from "../../utils/roleUtils";
import { getUserRole } from "../../utils/routePermissions";
import {
  User,
  X,
  FileText,
  Save,
  CheckCircle2,
  Activity,
  Flame,
  ShieldCheck,
  Crown,
  Zap,
  Hexagon,
  XCircle,
  AlertTriangle,
  Sparkles,
  Shield,
  Move,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import type {
  ToothState,
  Surface,
  Diagnosis,
  Quadrants,
} from "./types";
import {
  FDI_PERMANENT_QUADRANTS,
  FDI_TEMPORARY_QUADRANTS,
  createDefaultToothState,
} from "./types";

// Fallback quadrants defined locally to ensure teeth always render
const FALLBACK_PERMANENT_QUADRANTS: Quadrants = {
  topRight: [18, 17, 16, 15, 14, 13, 12, 11],
  topLeft: [21, 22, 23, 24, 25, 26, 27, 28],
  bottomRight: [48, 47, 46, 45, 44, 43, 42, 41],
  bottomLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

const FALLBACK_TEMPORARY_QUADRANTS: Quadrants = {
  topRight: [55, 54, 53, 52, 51],
  topLeft: [61, 62, 63, 64, 65],
  bottomRight: [85, 84, 83, 82, 81],
  bottomLeft: [71, 72, 73, 74, 75],
};

// Fallback tooth state creator
const createFallbackToothState = (toothNumber: number): ToothState => ({
  toothNumber,
  isAbsent: false,
  isExtracted: false,
  isUnerupted: false,
  isVisible: true,
  condition: 'healthy',
  faces: {
    vestibular: { diagnosis: 'none' },
    palatino: { diagnosis: 'none' },
    mesial: { diagnosis: 'none' },
    distal: { diagnosis: 'none' },
    oclusal: { diagnosis: 'none' },
  },
});

function getOdontogramaStorageKey(patientId?: string): string {
  return patientId ? `nexus_odontograma_${patientId}` : "nexus_odontograma_default";
}

function getNotasStorageKey(patientId?: string): string {
  return patientId ? `nexus_odontograma_notas_${patientId}` : "nexus_odontograma_notas_default";
}

/** UI diagnosis ids that round-trip via finding description (`Cara x: crown`). */
const KNOWN_DIAGNOSES: Diagnosis[] = [
  "caries",
  "restoration",
  "sealant",
  "endodontic",
  "crown",
  "bridge",
  "implant",
  "extraction",
  "fracture",
  "mobility",
];

/**
 * Reverse-map catalog findingTypeCode + description back to UI diagnosis.
 * Description is authoritative when present (several UI types collapse to PROTESIS/RESTAURACION/FRACTURA).
 */
function mapFindingToDiagnosis(findingTypeCode?: string | null, description?: string | null): Diagnosis {
  const desc = (description || "").trim().toLowerCase();
  if (desc) {
    const colonIdx = desc.lastIndexOf(":");
    const token = (colonIdx >= 0 ? desc.slice(colonIdx + 1) : desc).trim();
    const fromToken = KNOWN_DIAGNOSES.find((d) => d === token);
    if (fromToken) return fromToken;
    for (const d of KNOWN_DIAGNOSES) {
      if (token.includes(d) || desc.includes(`: ${d}`) || desc.endsWith(d)) return d;
    }
  }

  const ft = (findingTypeCode || "").toUpperCase();
  if (!ft) return "none";

  if (ft.includes("SELL") || ft.includes("SEAL") || ft === "SEL" || ft === "SEA") return "sealant";
  if (ft.includes("REST") || ft.includes("OBT") || ft.includes("FILL")) return "restoration";
  if (ft.includes("CAR")) return "caries";
  if (ft.includes("FRA")) return "fracture";
  if (ft.includes("EXT")) return "extraction";
  if (ft.includes("MOB") || ft.includes("MOV")) return "mobility";
  if (ft.includes("END")) return "endodontic";
  if (ft.includes("BRIDGE") || ft.includes("PUENTE")) return "bridge";
  if (ft.includes("IMPLANT") || ft.includes("IMPLANTE") || ft === "IMP") return "implant";
  if (ft.includes("CROWN") || ft.includes("CORONA") || ft.includes("PROT")) return "crown";
  if (ft.includes("COR") || ft.includes("CRO")) return "crown";

  return "none";
}

function createDefaultOdontogramState(): {
  dentitionType: 'permanent' | 'temporary';
  teeth: Record<number, ToothState>;
  selectedDiagnosis: Diagnosis;
} {
  const teeth: Record<number, ToothState> = {};
  const quadrants = FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
  Object.values(quadrants).flat().forEach((toothNumber) => {
    teeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
    teeth[toothNumber].isVisible = true; // Permanent teeth visible by default
  });
  const tempQuadrants = FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
  Object.values(tempQuadrants).flat().forEach((toothNumber) => {
    teeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
    teeth[toothNumber].isVisible = false; // Temporary teeth hidden by default
  });

  return {
    dentitionType: "permanent",
    teeth,
    selectedDiagnosis: "caries",
  };
}

function cargarOdontograma(patientId?: string): {
  dentitionType: 'permanent' | 'temporary';
  teeth: Record<number, ToothState>;
  selectedDiagnosis: Diagnosis;
} {
  const key = getOdontogramaStorageKey(patientId);
  const guardado = localStorage.getItem(key);
  if (guardado) {
    try {
      const data = JSON.parse(guardado);
      return data;
    } catch {
      // Si falla, retornar estado inicial
    }
  }

  return createDefaultOdontogramState();
}

function guardarOdontograma(
  data: {
    dentitionType: 'permanent' | 'temporary';
    teeth: Record<number, ToothState>;
    selectedDiagnosis: Diagnosis;
  },
  patientId?: string
) {
  const key = getOdontogramaStorageKey(patientId);
  localStorage.setItem(key, JSON.stringify(data));
}

interface PacienteItem {
  id: string;
  nombre: string;
  cedula: string;
  clinicalHistoryId?: string;
}

interface ProfesionalItem {
  id: string;
  nombre: string;
  specialty?: string;
  personId?: string;
  documentNumber?: string;
  email?: string;
}

function matchLoggedInProfessional(
  profs: ProfesionalItem[],
  user: { id?: string; personId?: string; cedula?: string; email?: string } | null | undefined
): ProfesionalItem | undefined {
  if (!user || profs.length === 0) return undefined;
  const doc = (user.cedula || "").replace(/\D/g, "");
  const email = (user.email || "").trim().toLowerCase();
  return profs.find((pr) => {
    if (user.personId && areGuidsEqual(pr.personId, user.personId)) return true;
    if (user.personId && areGuidsEqual(pr.id, user.personId)) return true;
    if (doc && (pr.documentNumber || "").replace(/\D/g, "") === doc) return true;
    if (email && (pr.email || "").trim().toLowerCase() === email) return true;
    return false;
  });
}

function OdontogramaUI() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const navState = location.state as {
    appointmentId?: string;
    patientId?: string;
    professionalId?: string;
    patientName?: string;
    patientDocument?: string;
  } | null;
  const isDarkMode = theme === "dark";
  const userRole = getUserRole(user);
  const isOdontologo = userRole === "ODONTOLOGO";
  const isPaciente = userRole === "PACIENTE";
  const [state, setState] = useState(cargarOdontograma);
  const [selectedSurface, setSelectedSurface] = useState<{
    toothNumber: number;
    surface: Surface;
  } | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [pacientesList, setPacientesList] = useState<PacienteItem[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<PacienteItem | null>(null);
  const [profesionalesList, setProfesionalesList] = useState<ProfesionalItem[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");
  const lockedProfessionalIdRef = useRef<string>("");
  const [notasClinicas, setNotasClinicas] = useState("");
  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  // Cargar lista dinámica de pacientes y profesionales desde API
  const fetchPacientes = useCallback(async () => {
    try {
      const [patientsData, personsData, historiesData, profsData] = await Promise.all([
        patientService.getAll().catch(() => []),
        personService.getAll().catch(() => []),
        clinicalHistoryService.getAll().catch(() => []),
        professionalService.getAll().catch(() => []),
      ]);

      if (profsData && profsData.length > 0) {
        const mappedProfs: ProfesionalItem[] = profsData.map((pr: any) => {
          const docName =
            pr.fullName ||
            `Dr(a). ${pr.firstName || ""} ${pr.lastName || ""}`.trim();
          return {
            id: pr.id,
            nombre: docName,
            specialty: pr.specialtyName || pr.specialty || pr.speciality || "Odontología General",
            personId: pr.personId,
            documentNumber: pr.documentNumber,
            email: pr.email,
          };
        });
        setProfesionalesList(mappedProfs);

        // Odontólogo logueado: siempre es el responsable (no puede elegir otro).
        const matched = matchLoggedInProfessional(mappedProfs, user);
        if (isOdontologo && matched) {
          lockedProfessionalIdRef.current = matched.id;
          setSelectedProfessionalId(matched.id);
        } else if (matched) {
          lockedProfessionalIdRef.current = "";
          setSelectedProfessionalId(matched.id);
        } else if (!isOdontologo) {
          lockedProfessionalIdRef.current = "";
          setSelectedProfessionalId((prev) => prev || "");
        } else {
          lockedProfessionalIdRef.current = "";
          setSelectedProfessionalId("");
        }
      }

      if (patientsData && patientsData.length > 0) {
        let mapped: PacienteItem[] = patientsData.map((p, idx) => {
          const person = personsData.find((per) => per.id === p.personId);
          const fullName = person ? `${person.firstName} ${person.lastName}` : (p.firstName ? `${p.firstName} ${p.lastName}` : `Paciente #${idx + 1}`);
          const doc = person?.documentNumber || p.documentNumber || `10${idx}8765432`;
          const history = historiesData.find((h: any) => areGuidsEqual(h.patientId, p.id));
          return { id: p.id, personId: p.personId, nombre: fullName, cedula: doc, clinicalHistoryId: history?.id } as any;
        });

        // Aislamiento estricto de privacidad para el PACIENTE
        if (isPaciente) {
          const userDoc = (user as any)?.documentNumber || "";
          const myPt = mapped.find((p: any) =>
            areGuidsEqual(p.personId, user?.personId) ||
            areGuidsEqual(p.id, user?.id) ||
            (userDoc && String(p.cedula).trim() === String(userDoc).trim()) ||
            (user?.name && p.nombre.toLowerCase().includes(user.name.toLowerCase()))
          );
          if (myPt) {
            mapped = [myPt];
            setSelectedPaciente(myPt);
          } else {
            const fallbackSelf: PacienteItem = {
              id: user?.personId || user?.id || "patient-self",
              nombre: user?.name || "Mi Perfil",
              cedula: userDoc || "1076543210",
            };
            mapped = [fallbackSelf];
            setSelectedPaciente(fallbackSelf);
          }
        } else {
          if (mapped.length > 0) {
            setSelectedPaciente((prev) => prev || mapped[0]);
          }
        }

        setPacientesList(mapped);
      } else if (isPaciente) {
        const fallbackSelf: PacienteItem = {
          id: user?.personId || user?.id || "patient-self",
          nombre: user?.name || "Mi Perfil",
          cedula: (user as any)?.documentNumber || "1076543210",
        };
        setPacientesList([fallbackSelf]);
        setSelectedPaciente(fallbackSelf);
      }
    } catch (err) {
      console.warn("API Patients unavailable in Odontograma:", err);
    }
  }, [user, isOdontologo, isPaciente]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  // Pre-carga automatica de paciente y profesional si se navega desde una Cita
  useEffect(() => {
    if (!navState) return;
    async function initFromNavState() {
      if (navState?.appointmentId) {
        try {
          const ctx = await appointmentService.getClinicalContext(navState.appointmentId);
          if (ctx) {
            setSelectedPaciente({
              id: ctx.patientId,
              nombre: ctx.patientFullName || navState.patientName || "Paciente",
              cedula: ctx.patientDocument || navState.patientDocument || "",
              clinicalHistoryId: ctx.clinicalHistoryId,
            });
            // Solo admin/recepción pueden heredar el profesional de la cita.
            if (ctx.professionalId && !isOdontologo && !lockedProfessionalIdRef.current) {
              setSelectedProfessionalId(ctx.professionalId);
            }
            return;
          }
        } catch (err) {
          console.warn("No se pudo obtener el contexto clinico de la cita:", err);
        }
      }

      if (navState?.patientId) {
        setSelectedPaciente((prev) => ({
          id: navState.patientId!,
          nombre: navState.patientName || prev?.nombre || "Paciente",
          cedula: navState.patientDocument || prev?.cedula || "",
          clinicalHistoryId: prev?.clinicalHistoryId,
        }));
      }
      if (navState?.professionalId && !isOdontologo && !lockedProfessionalIdRef.current) {
        setSelectedProfessionalId(navState.professionalId);
      }
    }
    initFromNavState();
  }, [navState, isOdontologo]);

  // Si el odontólogo ya quedó bloqueado, reafirmar su id (evita overrides tardíos).
  useEffect(() => {
    if (!isOdontologo || !lockedProfessionalIdRef.current) return;
    setSelectedProfessionalId(lockedProfessionalIdRef.current);
  }, [isOdontologo, profesionalesList]);

  // Cerrar dropdown de paciente al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        patientDropdownRef.current &&
        !patientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Al cambiar de paciente seleccionado, hidratar odontograma desde LocalStorage y desde el servidor API (A-03, F-05, F-06, F-07)
  useEffect(() => {
    let isCancelled = false;
    async function loadPatientOdontogram() {
      if (!selectedPaciente?.id) {
        setState(createDefaultOdontogramState());
        setNotasClinicas("");
        return;
      }

      // 1. Carga inicial local
      const localState = cargarOdontograma(selectedPaciente.id);
      const keyNotas = getNotasStorageKey(selectedPaciente.id);
      const savedNotas = localStorage.getItem(keyNotas) || "";
      setState(localState);
      setNotasClinicas(savedNotas);

      // 2. Sincronización e hidratación desde el servidor usando API full o histórica
      setIsSyncingServer(true);
      try {
        // Intento 1: Obtener último odontograma relacional guardado
        try {
          const latestFull = await odontogramService.getLatestByPatient(selectedPaciente.id);
          if (!isCancelled && latestFull && latestFull.teeth && latestFull.teeth.length > 0) {
            const baseState = createDefaultOdontogramState();
            latestFull.teeth.forEach((t: any) => {
              const tooth = baseState.teeth[t.fdiNumber];
              if (tooth) {
                tooth.isAbsent = (t.stateCode === "AUSENTE");
                tooth.isExtracted = (t.stateCode === "EXTRAIDO");
                tooth.isUnerupted = (t.stateCode === "INCLUIDO");
                if (t.findings && t.findings.length > 0) {
                  t.findings.forEach((f: any) => {
                    let surf: Surface = "oclusal";
                    const s = (f.surfaceCode || "").toUpperCase();
                    if (s === "V") surf = "vestibular";
                    else if (s === "P") surf = "palatino";
                    else if (s === "M") surf = "mesial";
                    else if (s === "D") surf = "distal";
                    else if (s === "O") surf = "oclusal";

                    const diag = mapFindingToDiagnosis(f.findingTypeCode, f.description || f.note);
                    if (diag !== "none" && tooth.faces && tooth.faces[surf]) {
                      tooth.faces[surf].diagnosis = diag;
                    }
                  });
                }
              }
            });

            let cleanNotes = latestFull.notes || "";
            if (cleanNotes.includes("=== NOTAS_CLINICAS ===")) {
              const match = cleanNotes.match(/=== NOTAS_CLINICAS ===\s*([\s\S]*?)\s*=== FIN_NOTAS_CLINICAS ===/);
              cleanNotes = match ? match[1].trim() : cleanNotes;
            } else if (cleanNotes.includes("ODONTOGRAM_STATE:")) {
              cleanNotes = cleanNotes.split("ODONTOGRAM_STATE:")[0].split("Hallazgos Odontograma:")[0].replace(/^Notas Clínicas:\s*/i, "").trim();
            }

            setState(baseState);
            setNotasClinicas(cleanNotes);
            guardarOdontograma(baseState, selectedPaciente.id);
            localStorage.setItem(keyNotas, cleanNotes);
            setIsSyncingServer(false);
            return;
          }
        } catch {
          // Si no tiene registros en endpoint relacional full, proceder con fallback a getAll
        }

        const [allOdontograms, histories] = await Promise.all([
          odontogramService.getAll().catch(() => []),
          clinicalHistoryService.getAll().catch(() => []),
        ]);

        if (isCancelled) return;

        const hist = histories.find((h: any) => areGuidsEqual(h.patientId, selectedPaciente.id));
        const histId = hist?.id || selectedPaciente.clinicalHistoryId;

        // F-05: Ordenar cronológicamente de forma descendente para tomar la versión más reciente
        const matchingOdontograms = (Array.isArray(allOdontograms) ? allOdontograms : [])
          .filter((o: any) =>
            (histId && areGuidsEqual(o.clinicalHistoryId, histId)) ||
            (o.patientId && areGuidsEqual(o.patientId, selectedPaciente.id))
          )
          .sort((a: any, b: any) => {
            const timeA = new Date(a.createdAt || a.creationDate || a.attentionDate || 0).getTime();
            const timeB = new Date(b.createdAt || b.creationDate || b.attentionDate || 0).getTime();
            return timeB - timeA;
          });

        const serverOdontogram = matchingOdontograms[0];

        if (serverOdontogram && serverOdontogram.notes) {
          const marker = "ODONTOGRAM_STATE:";
          if (serverOdontogram.notes.includes(marker)) {
            const rawJson = serverOdontogram.notes.split(marker)[1]?.trim();
            if (rawJson) {
              try {
                const parsedState = JSON.parse(rawJson);
                if (parsedState && parsedState.teeth) {
                  setState(parsedState);
                  guardarOdontograma(parsedState, selectedPaciente.id);
                }
              } catch {
                // Ignore parse error
              }
            }
          }

          // F-06: Delimitación inequívoca de notas clínicas para evitar duplicación recursiva de resúmenes
          let cleanNotes = "";
          if (serverOdontogram.notes.includes("=== NOTAS_CLINICAS ===")) {
            const match = serverOdontogram.notes.match(/=== NOTAS_CLINICAS ===\s*([\s\S]*?)\s*=== FIN_NOTAS_CLINICAS ===/);
            cleanNotes = match ? match[1].trim() : "";
          } else {
            cleanNotes = serverOdontogram.notes
              .split("ODONTOGRAM_STATE:")[0]
              .split("Hallazgos Odontograma:")[0]
              .split("Dentición:")[0]
              .replace(/^Notas Clínicas:\s*/i, "")
              .trim();
          }

          if (cleanNotes) {
            setNotasClinicas(cleanNotes);
            localStorage.setItem(keyNotas, cleanNotes);
          }
        }
      } catch (err) {
        console.warn("No se pudo sincronizar odontograma con API:", err);
      } finally {
        if (!isCancelled) {
          setIsSyncingServer(false);
        }
      }
    }

    setSelectedSurface(null);
    setSelectedTooth(null);
    loadPatientOdontogram();
    return () => {
      isCancelled = true;
    };
  }, [selectedPaciente?.id, selectedPaciente?.clinicalHistoryId]);

  const getCurrentQuadrants = (): Quadrants => {
    if (state.dentitionType === "permanent") {
      return FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
    }
    return FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
  };

  const handleDentitionTypeChange = (type: 'permanent' | 'temporary') => {
    setState((prevState) => {
      const updatedTeeth = { ...prevState.teeth };

      // Permanent teeth visibility
      const permQuads = FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS;
      Object.values(permQuads).flat().forEach((toothNumber) => {
        if (!updatedTeeth[toothNumber]) {
          updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
        }
        updatedTeeth[toothNumber].isVisible = type === "permanent";
      });

      // Temporary teeth visibility
      const tempQuads = FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS;
      Object.values(tempQuads).flat().forEach((toothNumber) => {
        if (!updatedTeeth[toothNumber]) {
          updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
        }
        updatedTeeth[toothNumber].isVisible = type === "temporary";
      });

      const newState = {
        ...prevState,
        dentitionType: type,
        teeth: updatedTeeth,
      };

      guardarOdontograma(newState, selectedPaciente?.id);
      return newState;
    });
  };

  const handleSurfaceClick = (toothNumber: number, surface: Surface) => {
    setSelectedSurface({ toothNumber, surface });
    setSelectedTooth(null);
  };

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setSelectedSurface(null);
  };

  const applyDiagnosis = (diagnosis: Diagnosis) => {
    if (!selectedSurface) return;
    const { toothNumber, surface } = selectedSurface;

    setState((prevState) => {
      const updatedTeeth = { ...prevState.teeth };
      if (updatedTeeth[toothNumber]) {
        updatedTeeth[toothNumber] = {
          ...updatedTeeth[toothNumber],
          faces: {
            ...updatedTeeth[toothNumber].faces,
            [surface]: { diagnosis },
          },
        };
      }

      const newState = {
        ...prevState,
        teeth: updatedTeeth,
      };

      guardarOdontograma(newState, selectedPaciente?.id);
      return newState;
    });

    setSelectedSurface(null);
  };

  const handleDiagnosisChange = (diagnosis: Diagnosis) => {
    setState((prevState) => ({
      ...prevState,
      selectedDiagnosis: diagnosis,
    }));
  };

  const handleLimpiar = () => {
    setState((prevState) => {
      const resetTeeth: Record<number, ToothState> = {};
      const quadrants =
        prevState.dentitionType === "permanent"
          ? (FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS)
          : (FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS);

      Object.values(quadrants).flat().forEach((toothNumber) => {
        resetTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
        resetTeeth[toothNumber].isVisible = prevState.teeth[toothNumber]?.isVisible ?? true;
      });

      const newState = {
        ...prevState,
        teeth: resetTeeth,
      };

      guardarOdontograma(newState, selectedPaciente?.id);
      return newState;
    });
    setSuccessToast("Odontograma restablecido.");
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleExport = () => {
    if (!selectedPaciente) return;
    const data = {
      paciente: selectedPaciente,
      dentitionType: state.dentitionType,
      teeth: state.teeth,
      selectedDiagnosis: state.selectedDiagnosis,
      notasClinicas,
      exportedAt: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `odontograma_${selectedPaciente.cedula}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessToast("Odontograma exportado en formato JSON.");
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (data.dentitionType && data.teeth) {
          const updatedTeeth = { ...data.teeth };
          const quadrants = data.dentitionType === "permanent"
            ? (FDI_PERMANENT_QUADRANTS || FALLBACK_PERMANENT_QUADRANTS)
            : (FDI_TEMPORARY_QUADRANTS || FALLBACK_TEMPORARY_QUADRANTS);

          Object.values(quadrants).flat().forEach((toothNumber) => {
            if (!updatedTeeth[toothNumber]) {
              updatedTeeth[toothNumber] = createDefaultToothState(toothNumber) || createFallbackToothState(toothNumber);
            }
            updatedTeeth[toothNumber].isVisible = true;
          });

          const newState = {
            dentitionType: data.dentitionType,
            teeth: updatedTeeth,
            selectedDiagnosis: data.selectedDiagnosis || 'caries',
          };
          setState(newState);
          guardarOdontograma(newState, selectedPaciente?.id);
          if (data.notasClinicas) setNotasClinicas(data.notasClinicas);
          setSuccessToast("Odontograma importado correctamente.");
          setTimeout(() => setSuccessToast(null), 2500);
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  const handleSaveNotes = async () => {
    if (!selectedPaciente?.id) {
      setErrorToast("Por favor selecciona un paciente para guardar el odontograma.");
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    // 1. Guardar estado y notas de forma aislada por paciente (Sección 3.2 y 3.3)
    guardarOdontograma(state, selectedPaciente.id);
    const keyNotas = getNotasStorageKey(selectedPaciente.id);
    localStorage.setItem(keyNotas, notasClinicas);

    // 2. Obtener o resolver clinicalHistoryId real
    let historyId = selectedPaciente.clinicalHistoryId;
    if (!historyId) {
      const histories = await clinicalHistoryService.getAll().catch(() => []);
      const matched = histories.find((h) => areGuidsEqual(h.patientId, selectedPaciente.id));
      historyId = matched?.id;
    }

    // Si no tiene historyId localmente, el backend lo resolverá o creará automáticamente con el patientId

    // Odontólogo logueado: siempre firma con su propio professionalId.
    let professionalIdToUse =
      (isOdontologo && lockedProfessionalIdRef.current) || selectedProfessionalId;
    if (isOdontologo && !professionalIdToUse) {
      const matched = matchLoggedInProfessional(profesionalesList, user);
      professionalIdToUse = matched?.id || "";
    }
    if (!professionalIdToUse) {
      setErrorToast(
        isOdontologo
          ? "No se encontró tu ficha de profesional vinculada. Contacta al administrador."
          : "Selecciona el odontólogo responsable antes de guardar."
      );
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    // 4. A-03: Resumen de hallazgos (piezas/superficies van en teeth[] relacional).
    // No embeber ODONTOGRAM_STATE JSON: Oracle odontograms.notes es NVARCHAR2(2000).
    const findingsList: string[] = [];
    Object.entries(state.teeth).forEach(([toothNum, t]) => {
      if (!t || !t.isVisible) return;
      if (t.isAbsent || t.isExtracted) {
        findingsList.push(`Pieza ${toothNum}: Ausente/Extraída`);
        return;
      }
      const activeFaces = Object.entries(t.faces || {})
        .filter(([_, f]) => f?.diagnosis && f.diagnosis !== 'none')
        .map(([face, f]) => `${face} (${f.diagnosis})`);
      if (activeFaces.length > 0) {
        findingsList.push(`Pieza ${toothNum}: ${activeFaces.join(', ')}`);
      }
    });

    // F-06: Delimitación de notas clínicas (sin blob de estado; tope 2000 chars para Oracle)
    let fullClinicalNotes = [
      notasClinicas.trim() ? `=== NOTAS_CLINICAS ===\n${notasClinicas.trim()}\n=== FIN_NOTAS_CLINICAS ===` : null,
      findingsList.length > 0 ? `Hallazgos Odontograma: ${findingsList.join('; ')}` : "Sin hallazgos patológicos activos en el odontograma",
      `Dentición: ${state.dentitionType === "permanent" ? "Permanente" : "Temporal"}`,
    ].filter(Boolean).join('\n\n');
    if (fullClinicalNotes.length > 2000) {
      fullClinicalNotes = fullClinicalNotes.slice(0, 2000);
    }

    try {
      // Construir payload relacional completo de piezas y superficies para guardar en base de datos
      const teethPayload = Object.entries(state.teeth).map(([numStr, t]) => {
        const toothNumber = parseInt(numStr, 10);
        let stateCode = "SANO";
        if (t.isAbsent) stateCode = "AUSENTE";
        else if (t.isExtracted) stateCode = "EXTRAIDO";
        else if (t.isUnerupted) stateCode = "INCLUIDO";

        const findings: any[] = [];
        if (t.faces) {
          Object.entries(t.faces).forEach(([faceKey, faceVal]) => {
            if (faceVal?.diagnosis && faceVal.diagnosis !== "none") {
              let surfaceCode = "O";
              if (faceKey === "vestibular") surfaceCode = "V";
              else if (faceKey === "palatino" || faceKey === "lingual") surfaceCode = "P";
              else if (faceKey === "mesial") surfaceCode = "M";
              else if (faceKey === "distal") surfaceCode = "D";

              findings.push({
                findingTypeCode: (faceVal.diagnosis || "CARIES").toUpperCase(),
                surfaceCode,
                description: `Cara ${faceKey}: ${faceVal.diagnosis}`,
              });
            }
          });
        }

        if (
          stateCode === "SANO" &&
          findings.some((f) => String(f.findingTypeCode).toUpperCase() === "CROWN")
        ) {
          stateCode = "CORONA";
        }

        return {
          fdiNumber: toothNumber,
          stateCode,
          findings: findings.length > 0 ? findings : undefined,
        };
      });

      await odontogramService.saveFull({
        patientId: selectedPaciente.id,
        clinicalHistoryId: historyId || undefined,
        professionalId: professionalIdToUse || undefined,
        notes: fullClinicalNotes,
        teeth: teethPayload,
      });

      setSuccessToast("¡Odontograma, piezas dentales y notas guardados exitosamente en la base de datos!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error("Error al persistir odontograma en API:", err);
      setErrorToast(err?.response?.data?.message || err?.message || "Error al guardar odontograma clínico en el servidor.");
      setTimeout(() => setErrorToast(null), 5000);
    }
  };

  const currentQuadrants = getCurrentQuadrants();

  // Resumen reactivo de hallazgos clínicos del paciente
  const clinicalFindings = useMemo(() => {
    const counts: Record<string, number> = {
      caries: 0,
      restoration: 0,
      sealant: 0,
      endodontic: 0,
      crown: 0,
      bridge: 0,
      implant: 0,
      extraction: 0,
      fracture: 0,
      mobility: 0,
      healthy: 0,
    };

    const teethList = currentQuadrants.topRight
      .concat(currentQuadrants.topLeft)
      .concat(currentQuadrants.bottomRight)
      .concat(currentQuadrants.bottomLeft);

    teethList.forEach((toothId) => {
      const t = state.teeth[toothId];
      if (!t || !t.isVisible) return;

      if (t.isAbsent || t.isExtracted) {
        counts.extraction++;
        return;
      }

      const faces = t.faces || {};
      const uniqueDiags = new Set<Diagnosis>();

      (Object.keys(faces) as Surface[]).forEach((s) => {
        const diag = faces[s]?.diagnosis;
        if (diag && diag !== "none") {
          uniqueDiags.add(diag);
        }
      });

      if (t.condition === "implanted") {
        uniqueDiags.add("implant");
      }

      if (uniqueDiags.size === 0) {
        counts.healthy++;
      } else {
        uniqueDiags.forEach((d) => {
          if (counts[d] !== undefined) {
            counts[d]++;
          }
        });
      }
    });

    const totalPathologies =
      counts.caries +
      counts.restoration +
      counts.sealant +
      counts.endodontic +
      counts.crown +
      counts.bridge +
      counts.implant +
      counts.extraction +
      counts.fracture +
      counts.mobility;

    return { counts, totalPathologies, totalTeeth: teethList.length };
  }, [state.teeth, currentQuadrants]);

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Toasts (CAPA SUPERIOR ABSOLUTA z-[99999] EN ESQUINA INFERIOR DERECHA) */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/40 animate-slideUp backdrop-blur-md">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 bg-rose-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/50 animate-slideUp backdrop-blur-md">
          <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{errorToast}</span>
        </div>
      )}

      {/* Encabezado Principal de Nivel Ejecutivo */}
      <div className="relative z-30 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-slideDown">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-prata font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Odontograma Interactivo FDI
          </h1>
          <p className="text-xs sm:text-sm font-instrument text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Registro visual anatómico de patologías, tratamientos y estado dental por superficie.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 flex-shrink-0">
          {/* Selector de Paciente en Cápsula de Cristal Personalizada */}
          <div ref={patientDropdownRef} className="relative z-40">
            <button
              type="button"
              onClick={!isPaciente ? () => setIsPatientDropdownOpen((prev) => !prev) : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 rounded-2xl backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] text-xs font-bold transition-all h-[46px] ${
                isPaciente
                  ? "cursor-default"
                  : "hover:bg-white dark:hover:bg-slate-900/90 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 cursor-pointer active:scale-98 group"
              }`}
              title={isPaciente ? "Tu ficha odontológica personal" : "Cambiar paciente actual"}
            >
              <div className="h-7 w-7 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <User size={15} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold leading-none mb-0.5">
                  {isPaciente ? "Mi Ficha Dental" : "Paciente Actual"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                    {selectedPaciente?.nombre || (isPaciente ? user?.name : "Seleccionar Paciente")}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md border border-slate-200/50 dark:border-white/10">
                    CC: {selectedPaciente?.cedula || (isPaciente ? (user as any)?.documentNumber || "---" : "---")}
                  </span>
                </div>
              </div>
              {!isPaciente && (
                <ChevronDown
                  size={15}
                  className={`text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 ml-1.5 ${
                    isPatientDropdownOpen ? "rotate-180 text-cyan-500" : ""
                  }`}
                />
              )}
            </button>

            {/* Menú Desplegable Personalizado (Solo para profesionales y admins) */}
            {!isPaciente && isPatientDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 p-2 rounded-2xl bg-white/95 dark:bg-slate-900/98 border border-slate-200/90 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl z-50 animate-scaleIn space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5">
                  Seleccionar Paciente
                </div>
                {pacientesList.map((pac) => {
                  const isSelected = selectedPaciente ? pac.id === selectedPaciente.id : false;
                  return (
                    <button
                      key={pac.id}
                      type="button"
                      onClick={() => {
                        setSelectedPaciente(pac);
                        setIsPatientDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                        isSelected
                          ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {pac.nombre}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          CC: {pac.cedula}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={15} className="text-cyan-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Columna Derecha: Odontólogo Responsable + Botón Guardar / Modo Consulta */}
          <div className="flex flex-col gap-2 min-w-[220px]">
            {isPaciente ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 rounded-2xl backdrop-blur-2xl h-[46px]">
                <ShieldCheck size={16} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-wider text-cyan-700 dark:text-cyan-300 font-bold leading-none mb-0.5">
                    Modalidad de Acceso
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Consulta de Mi Historial Dental
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Selector de Profesional Responsable — bloqueado si el usuario es odontólogo */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 rounded-2xl backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] h-[46px]">
                  <ShieldCheck size={16} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-400 font-bold leading-none mb-0.5">
                      Odontólogo Responsable
                    </span>
                    {isOdontologo ? (
                      <span
                        className="text-xs font-bold text-slate-900 dark:text-white truncate"
                        title="Como odontólogo logueado, tú eres el responsable de este odontograma"
                      >
                        {profesionalesList.find((pr) => pr.id === selectedProfessionalId)?.nombre ||
                          user?.name ||
                          "Tu sesión"}
                      </span>
                    ) : (
                      <select
                        value={selectedProfessionalId}
                        onChange={(e) => setSelectedProfessionalId(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer border-none p-0 pr-1 truncate w-full"
                      >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-500">
                          -- Seleccionar Odontólogo --
                        </option>
                        {profesionalesList.map((pr) => (
                          <option key={pr.id} value={pr.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                            {pr.nombre} ({pr.specialty})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Botón de Acción Principal Guardar */}
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSyncingServer}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-xs font-bold text-white dark:text-slate-950 shadow-md shadow-cyan-500/20 dark:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
                  title="Guardar estado del odontograma y notas clínicas"
                >
                  {isSyncingServer ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} strokeWidth={2.4} />
                      <span>Guardar Odontograma</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid del Odontograma y Herramientas Clínicas */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 pt-2 animate-slideUp">
        {/* Panel de Controles y Diagnósticos (Izquierda) */}
        <div className="lg:col-span-1 space-y-4">
          <ConvencionesToolbar
            selectedDiagnosis={state.selectedDiagnosis}
            onDiagnosisChange={handleDiagnosisChange}
            dentitionType={state.dentitionType}
            onDentitionTypeChange={handleDentitionTypeChange}
            onClear={handleLimpiar}
            onExport={handleExport}
            onImport={handleImport}
            isDarkMode={isDarkMode}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Arcadas Dentales FDI y Observaciones (Centro y Derecha) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Barra de Conteo Clínico en Vivo (Hallazgos del Paciente) */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl p-4 sm:p-5 shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Activity size={13} className="animate-pulse" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Hallazgos Clínicos en Vivo
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-white/10">
                  {clinicalFindings.totalTeeth} piezas evaluadas
                </span>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {clinicalFindings.totalPathologies === 0
                  ? "Dentición completa en estado saludable"
                  : `${clinicalFindings.totalPathologies} tratamientos/lesiones detectadas`}
              </span>
            </div>

            {/* Badges reactivos de hallazgos */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Piezas Sanas */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
                <Sparkles size={13} />
                <span>Sanos: {clinicalFindings.counts.healthy}</span>
              </div>

              {/* Caries */}
              {clinicalFindings.counts.caries > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("caries")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-red-500/15 dark:bg-red-500/25 text-red-700 dark:text-red-300 border border-red-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Caries en paleta"
                >
                  <Flame size={13} className="text-red-500" />
                  <span>Caries: {clinicalFindings.counts.caries}</span>
                </button>
              )}

              {/* Obturaciones */}
              {clinicalFindings.counts.restoration > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("restoration")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Obturación en paleta"
                >
                  <ShieldCheck size={13} className="text-blue-500" />
                  <span>Obturaciones: {clinicalFindings.counts.restoration}</span>
                </button>
              )}

              {/* Coronas */}
              {clinicalFindings.counts.crown > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("crown")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Corona en paleta"
                >
                  <Crown size={13} className="text-emerald-500" />
                  <span>Coronas: {clinicalFindings.counts.crown}</span>
                </button>
              )}

              {/* Endodoncias */}
              {clinicalFindings.counts.endodontic > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("endodontic")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Endodoncia en paleta"
                >
                  <Zap size={13} className="text-purple-500" />
                  <span>Endodoncias: {clinicalFindings.counts.endodontic}</span>
                </button>
              )}

              {/* Implantes */}
              {clinicalFindings.counts.implant > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("implant")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-teal-500/15 dark:bg-teal-500/25 text-teal-700 dark:text-teal-300 border border-teal-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Implante en paleta"
                >
                  <Hexagon size={13} className="text-teal-500" />
                  <span>Implantes: {clinicalFindings.counts.implant}</span>
                </button>
              )}

              {/* Extracciones / Ausentes */}
              {clinicalFindings.counts.extraction > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("extraction")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Extracción en paleta"
                >
                  <XCircle size={13} className="text-rose-500" />
                  <span>Extracciones: {clinicalFindings.counts.extraction}</span>
                </button>
              )}

              {/* Fracturas */}
              {clinicalFindings.counts.fracture > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("fracture")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-orange-500/15 dark:bg-orange-500/25 text-orange-700 dark:text-orange-300 border border-orange-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Fractura en paleta"
                >
                  <AlertTriangle size={13} className="text-orange-500" />
                  <span>Fracturas: {clinicalFindings.counts.fracture}</span>
                </button>
              )}

              {/* Sellantes */}
              {clinicalFindings.counts.sealant > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("sealant")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Sellante en paleta"
                >
                  <Shield size={13} className="text-amber-500" />
                  <span>Sellantes: {clinicalFindings.counts.sealant}</span>
                </button>
              )}

              {/* Movilidad */}
              {clinicalFindings.counts.mobility > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiagnosisChange("mobility")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-yellow-500/15 dark:bg-yellow-500/25 text-yellow-700 dark:text-yellow-300 border border-yellow-500/40 hover:scale-105 transition-all cursor-pointer shadow-xs"
                  title="Seleccionar Movilidad en paleta"
                >
                  <Move size={13} className="text-yellow-500" />
                  <span>Movilidad: {clinicalFindings.counts.mobility}</span>
                </button>
              )}
            </div>
          </div>

          <OdontogramaGrid
            teeth={state.teeth}
            quadrants={currentQuadrants}
            onSurfaceClick={handleSurfaceClick}
            onToothClick={handleToothClick}
            selectedTooth={selectedTooth}
            isDarkMode={isDarkMode}
          />

          {/* Panel de Observaciones del Odontograma y Plan de Tratamiento */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl p-5 sm:p-6 shadow-lg shadow-slate-900/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Observaciones del Odontograma y Plan de Tratamiento
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Notas clínicas oficiales registradas para el expediente del paciente.
                  </p>
                </div>
              </div>

              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono font-bold bg-slate-100 dark:bg-white/[0.04] px-3 py-1 rounded-xl border border-slate-200 dark:border-white/10 self-start sm:self-auto">
                Paciente: {selectedPaciente?.nombre || "Sin seleccionar"}
              </span>
            </div>

            <textarea
              rows={3}
              value={notasClinicas}
              onChange={(e) => setNotasClinicas(e.target.value)}
              placeholder="Escribe aquí las observaciones clínicas detalladas por cuadrante o pieza dental..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/15 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none transition-all leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Modal de diagnóstico rápido al tocar una cara */}
      {selectedSurface && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="rounded-3xl bg-white dark:bg-slate-900 backdrop-blur-3xl border border-slate-200 dark:border-white/15 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Aplicar Diagnóstico Clínico
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Pieza <strong className="text-cyan-600 dark:text-cyan-400 font-mono">#{selectedSurface.toothNumber}</strong> • Cara <strong className="text-cyan-600 dark:text-cyan-400 uppercase">{selectedSurface.surface}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedSurface(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => applyDiagnosis(state.selectedDiagnosis)}
                className="p-3 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white dark:text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer capitalize"
              >
                Aplicar {state.selectedDiagnosis}
              </button>
              <button
                type="button"
                onClick={() => applyDiagnosis("none")}
                className="p-3 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Limpiar Cara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OdontogramaUI;
