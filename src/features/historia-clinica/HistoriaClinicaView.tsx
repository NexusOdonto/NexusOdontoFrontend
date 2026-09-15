import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  CheckCircle2,
  X,
  FileDown,
  Phone,
  Mail,
  User,
  Clock,
  Stethoscope,
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  Smile,
  Printer,
  Edit3,
  Trash2,
  AlertCircle,
  FolderOpen,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clinicalHistoryService, type DiagnosisResponseDto, type ProcedurePerformedResponseDto, type CreateClinicalAttentionRequestDto } from "../../api/clinicalHistoryService";
import { patientService, type PatientResponseDto } from "../../api/patientService";
import { personService } from "../../api/personService";
import { professionalService } from "../../api/professionalService";
import { appointmentService } from "../../api/appointmentService";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import { areGuidsEqual } from "../../utils/roleUtils";
import { FolderComponent } from "../../components/ui/folder-component";

interface LocalAttention {
  id: string;
  fecha: string;
  profesional: string;
  motivo: string;
  enfermedadActual: string;
  examenFisico: string;
  diagnostico: string;
  cie10: string;
  planTratamiento: string;
  observaciones?: string;
}

const LICENSED_DENTISTS_FALLBACK = [
  "Dra. Laura Gómez",
  "Dr. Roberto Silva Morales",
  "Dra. Valentina Mendoza Gómez",
  "Dr. Camilo Rincón Casas",
  "Dr. Juan Martínez",
  "Dra. Patricia Silva",
];

export function HistoriaClinicaView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = getUserRole(user);
  const isPaciente = role === "PACIENTE";
  const isDentist = role === "ODONTOLOGO";

  const [patients, setPatients] = useState<PatientResponseDto[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [attentions, setAttentions] = useState<LocalAttention[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisResponseDto[]>([]);
  const [procedures, setProcedures] = useState<ProcedurePerformedResponseDto[]>([]);
  const [nextAppointment, setNextAppointment] = useState<{ servicio: string; profesional: string; fecha: string; hora: string } | null>(null);
  const [dentistsList, setDentistsList] = useState<string[]>(LICENSED_DENTISTS_FALLBACK);
  const [patientAppointmentsList, setPatientAppointmentsList] = useState<any[]>([]);
  const [folderCategory, setFolderCategory] = useState<"evoluciones" | "diagnosticos" | "procedimientos" | "antecedentes" | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<{
    titulo: string;
    fecha: string;
    profesional: string;
    categoria: string;
    resumen: string;
    estado: string;
    detalles?: Record<string, any>;
  } | null>(null);

  // Modal Nueva Evolución
  const [showNewAttentionModal, setShowNewAttentionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

  // Form State para nueva atención
  const [formAppointmentId, setFormAppointmentId] = useState("");
  const [formMotivo, setFormMotivo] = useState("");
  const [formEnfermedad, setFormEnfermedad] = useState("");
  const [formExamen, setFormExamen] = useState("");
  const [formDiagnostico, setFormDiagnostico] = useState("");
  const [formCie10, setFormCie10] = useState("K02.1");
  const [formPlan, setFormPlan] = useState("");
  const [formObservaciones, setFormObservaciones] = useState("");
  const [formProfesional, setFormProfesional] = useState(isDentist ? (user?.name || "Dra. Laura Gómez") : "Dra. Laura Gómez");

  // Modales adicionales
  const [showAntecedentesModal, setShowAntecedentesModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Form State para Antecedentes
  const [formAlergias, setFormAlergias] = useState("");
  const [formEnfermedades, setFormEnfermedades] = useState("");
  const [formMedicamentos, setFormMedicamentos] = useState("");
  const [formContactoNombre, setFormContactoNombre] = useState("");
  const [formContactoTelefono, setFormContactoTelefono] = useState("");
  const [formAseguradora, setFormAseguradora] = useState("");

  // Form State para Fórmula Médica
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicamento: "Amoxicilina 500mg", dosis: "1 cápsula cada 8 horas", duracion: "7 días", indicaciones: "Tomar después de las comidas" },
    { medicamento: "Ibuprofeno 600mg", dosis: "1 tableta cada 8 horas", duracion: "3 días", indicaciones: "En caso de dolor o inflamación" },
  ]);
  const [newMed, setNewMed] = useState({ medicamento: "", dosis: "", duracion: "", indicaciones: "" });
  const [prescIndicacionesGrales, setPrescIndicacionesGrales] = useState(
    "Mantener higiene bucal cuidadosa con cepillo de cerdas suaves. Evitar alimentos irritantes, duros o muy calientes durante las próximas 48 horas."
  );

  const [professionalsEntities, setProfessionalsEntities] = useState<any[]>([]);
  const [servicesEntities, setServicesEntities] = useState<any[]>([]);

  // 1. Cargar Catálogos Iniciales de forma desacoplada (F-01)
  useEffect(() => {
    let isCancelled = false;
    async function fetchCatalogs() {
      try {
        const [profs, srvs] = await Promise.all([
          professionalService.getAll().catch(() => []),
          serviceCatalogService.getAll().catch(() => []),
        ]);
        if (isCancelled) return;
        const profsList = Array.isArray(profs) ? profs : [];
        setProfessionalsEntities(profsList);
        setServicesEntities(Array.isArray(srvs) ? srvs : []);

        if (profsList.length > 0) {
          const mappedDocs = profsList
            .filter((p: any) => p.firstName || p.lastName)
            .map((p: any) => `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim());
          if (mappedDocs.length > 0) {
            setDentistsList(mappedDocs);
            if (!isDentist) {
              setFormProfesional(mappedDocs[0]);
            }
          }
        }
      } catch (err) {
        console.warn("No se pudieron cargar catálogos iniciales:", err);
      }
    }
    fetchCatalogs();
    return () => {
      isCancelled = true;
    };
  }, [isDentist]);

  // 2. Cargar Pacientes
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const patientList = await patientService.getAll().catch(() => []);
      const personList = await personService.getAll().catch(() => []);

      if (patientList && patientList.length > 0) {
        let enriched = patientList.map((p) => {
          const person = personList.find((per) => per.id === p.personId);
          return {
            ...p,
            firstName: person?.firstName || p.firstName || "Paciente",
            lastName: person?.lastName || p.lastName || "",
            documentNumber: person?.documentNumber || p.documentNumber || "1098765432",
            phone: person?.phone || p.phone || p.emergencyContactPhone || "3001234567",
            email: person?.email || p.email,
          };
        });

        // Aislamiento estricto de privacidad: Un paciente SOLO ve su propia historia clínica
        if (isPaciente) {
          const userDoc = (user as any)?.documentNumber || "";
          const myPt = enriched.find((p) =>
            areGuidsEqual(p.personId, user?.personId) ||
            areGuidsEqual(p.id, user?.id) ||
            (userDoc && String(p.documentNumber).trim() === String(userDoc).trim()) ||
            (user?.email && p.email?.toLowerCase().trim() === user.email.toLowerCase().trim())
          );
          if (myPt) {
            enriched = [myPt];
            setSelectedPatientId(String(myPt.id));
          } else {
            // Fallback sintético del paciente autenticado
            const fallbackSelf = {
              id: user?.personId || user?.id || "patient-self",
              personId: user?.personId || user?.id || "person-self",
              firstName: user?.name || "Mi",
              lastName: "Perfil",
              documentNumber: userDoc || "1098765432",
              phone: (user as any)?.phone || "3001234567",
              email: user?.email || "paciente@nexus.com",
            } as any;
            enriched = [fallbackSelf];
            setSelectedPatientId(String(fallbackSelf.id));
          }
        }

        setPatients(enriched);
        if (!isPaciente && !selectedPatientId && enriched.length > 0) {
          setSelectedPatientId(String(enriched[0].id));
        }
      } else {
        if (isPaciente) {
          const fallbackSelf = {
            id: user?.personId || user?.id || "patient-self",
            personId: user?.personId || user?.id || "person-self",
            firstName: user?.name || "Mi",
            lastName: "Perfil",
            documentNumber: (user as any)?.documentNumber || "1098765432",
            phone: (user as any)?.phone || "3001234567",
            email: user?.email || "paciente@nexus.com",
          } as any;
          setPatients([fallbackSelf]);
          setSelectedPatientId(String(fallbackSelf.id));
        } else {
          setPatients([]);
        }
      }
    } catch (err) {
      console.warn("Could not load patients for Historia Clínica:", err);
      if (isPaciente) {
        const fallbackSelf = {
          id: user?.personId || user?.id || "patient-self",
          personId: user?.personId || user?.id || "person-self",
          firstName: user?.name || "Mi",
          lastName: "Perfil",
          documentNumber: (user as any)?.documentNumber || "1098765432",
          phone: (user as any)?.phone || "3001234567",
          email: user?.email || "paciente@nexus.com",
        } as any;
        setPatients([fallbackSelf]);
        setSelectedPatientId(String(fallbackSelf.id));
      } else {
        setPatients([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId, isPaciente, user]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patients.find((p) => String(p.id) === String(selectedPatientId)) || null;
  }, [patients, selectedPatientId]);

  const loadClinicalData = useCallback(async () => {
    setLoading(true);
    if (!selectedPatientId) {
      setAttentions([]);
      setDiagnoses([]);
      setProcedures([]);
      setTimeout(() => setLoading(false), 450);
      return;
    }

    try {
      const [apiAttentions, apiDiagnoses, apiProcedures, apiAppointments] = await Promise.all([
        clinicalHistoryService.getAttentions().catch(() => []),
        clinicalHistoryService.getDiagnoses().catch(() => []),
        clinicalHistoryService.getProcedures().catch(() => []),
        appointmentService.getAll().catch(() => []),
      ]);

      setDiagnoses(apiDiagnoses);
      setProcedures(apiProcedures);

      // Cargar Próxima Cita Real del paciente activo y resolver IDs de citas del paciente (BUG-14 & F-01)
      const rawCitasLocal = localStorage.getItem("nexus_citas");
      let allApps: any[] = Array.isArray(apiAppointments) ? [...apiAppointments] : [];
      if (rawCitasLocal) {
        try {
          const parsed = JSON.parse(rawCitasLocal);
          if (Array.isArray(parsed)) {
            allApps = [...allApps, ...parsed];
          }
        } catch {
          // Ignore
        }
      }

      const patientFullName = selectedPatient ? `${selectedPatient.firstName || ""} ${selectedPatient.lastName || ""}`.toLowerCase().trim() : "";
      const patientDoc = selectedPatient?.documentNumber || "";

      // Filtrar citas exclusivas de este paciente
      const patientAppointments = allApps.filter((a: any) => {
        const appPtId = a.patientId || a.patientIdFromOpt || "";
        const appPtName = (a.patientName || a.paciente || "").toLowerCase().trim();
        const appPtDoc = a.pacienteCedula || a.documentNumber || "";
        return (
          (selectedPatientId && areGuidsEqual(appPtId, selectedPatientId)) ||
          (selectedPatient?.id && areGuidsEqual(appPtId, selectedPatient.id)) ||
          (patientFullName && appPtName.includes(patientFullName)) ||
          (patientDoc && appPtDoc === patientDoc)
        );
      });

      setPatientAppointmentsList(patientAppointments);

      const patientAppointmentIds = new Set(patientAppointments.map((a: any) => a.id || a.appointmentId).filter(Boolean));

      // FRONT-06 / A-07: Ordenar cronológicamente citas futuras convirtiendo ISO a hora local real
      const now = new Date();
      const futureApps = patientAppointments
        .map((a: any) => {
          let parsedDate: Date;
          if (a.startsAt) {
            parsedDate = new Date(a.startsAt);
          } else if (a.fecha) {
            const timeStr = a.hora || a.horaInicio || "09:00";
            parsedDate = new Date(`${a.fecha}T${timeStr}:00`);
          } else {
            parsedDate = new Date();
          }
          const valid = !isNaN(parsedDate.getTime());
          const datePart = valid ? parsedDate.toLocaleDateString("es-CO") : (a.fecha || "");
          const timePart = valid ? parsedDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }) : "09:00";
          const parsedTime = valid ? parsedDate.getTime() : 0;
          return { ...a, _parsedTime: parsedTime, _datePart: datePart, _timePart: timePart };
        })
        .filter((a: any) => {
          const isNotCancelled = !a.cancelledAt && a.estado !== "Cancelada" && a.estado !== "No disponible";
          return a._parsedTime >= now.getTime() && isNotCancelled;
        })
        .sort((a: any, b: any) => a._parsedTime - b._parsedTime);

      if (futureApps.length > 0) {
        const next = futureApps[0];
        const nextDate = next._datePart || new Date().toLocaleDateString("es-CO");
        const nextHour = next._timePart || "09:00";

        // Resolver nombre real del servicio
        let resolvedServName = next.serviceName || next.servicio;
        if (!resolvedServName || resolvedServName === "Consulta Odontológica") {
          const matchedSrv = servicesEntities.find((s: any) => areGuidsEqual(s.id, next.serviceId));
          if (matchedSrv?.name) resolvedServName = matchedSrv.name;
        }
        if (!resolvedServName) resolvedServName = "Consulta Odontológica";

        // Resolver nombre real del profesional
        let resolvedDocName = next.professionalName || next.profesional;
        if (!resolvedDocName || resolvedDocName.includes("Especialista")) {
          const matchedProf = professionalsEntities.find((p: any) => areGuidsEqual(p.id, next.professionalId));
          if (matchedProf) {
            resolvedDocName = `Dr(a). ${matchedProf.firstName || ""} ${matchedProf.lastName || ""}`.trim();
          }
        }
        if (!resolvedDocName) resolvedDocName = "Dr(a). Especialista";

        setNextAppointment({
          servicio: resolvedServName,
          profesional: resolvedDocName,
          fecha: nextDate,
          hora: nextHour,
        });
      } else {
        setNextAppointment(null);
      }

      if (apiAttentions && apiAttentions.length > 0) {
        // Aislamiento estricto por paciente (Sección 3.1)
        const filtered = apiAttentions.filter((a: any) => {
          const matchesDirectPatient =
            (selectedPatientId && (a.patientId === selectedPatientId || a.pacienteId === selectedPatientId)) ||
            (selectedPatient?.id && (a.patientId === selectedPatient.id || a.pacienteId === selectedPatient.id)) ||
            (selectedPatient?.personId && a.personId === selectedPatient.personId);

          const matchesAppointment = a.appointmentId && patientAppointmentIds.has(a.appointmentId);
          const matchesHistory = (selectedPatient as any)?.clinicalHistoryId && a.clinicalHistoryId === (selectedPatient as any).clinicalHistoryId;

          return matchesDirectPatient || matchesAppointment || matchesHistory;
        });

        const mapped: LocalAttention[] = filtered.map((a, idx) => {
          let profName = "Profesional no especificado";
          if (a.professionalId) {
            const matchedProf = professionalsEntities.find((p: any) => areGuidsEqual(p.id, a.professionalId));
            if (matchedProf) {
              profName = `Dr(a). ${matchedProf.firstName || ""} ${matchedProf.lastName || ""}`.trim();
            }
          } else if ((a as any).professionalName) {
            profName = (a as any).professionalName;
          }

          // F-04: Buscar diagnóstico real vinculado a esta atención
          const matchedDiag = Array.isArray(apiDiagnoses)
            ? apiDiagnoses.find((d: any) => areGuidsEqual(d.clinicalAttentionId, a.id))
            : null;

          return {
            id: a.id || `att-api-${idx}`,
            fecha: a.attentionDate ? new Date(a.attentionDate).toLocaleString("es-CO") : "Reciente",
            profesional: profName,
            motivo: a.reasonForConsultation || "Consulta odontológica",
            enfermedadActual: a.currentIllness || "Sin registros",
            examenFisico: a.physicalExamination || "Sin registro de examen físico",
            diagnostico: matchedDiag?.description || "Evaluación clínica",
            cie10: matchedDiag?.cie10Code || matchedDiag?.code || "No registrado",
            planTratamiento: a.planAndTreatment || "Sin plan registrado",
            observaciones: a.observations,
          };
        });
        setAttentions(mapped);
      } else {
        setAttentions([]);
      }
    } catch (err) {
      console.warn("API clinical history offline, setting empty attentions list:", err);
      setAttentions([]);
      setNextAppointment(null);
    } finally {
      setTimeout(() => setLoading(false), 450);
    }
  }, [selectedPatientId, selectedPatient, professionalsEntities, servicesEntities]);

  useEffect(() => {
    setFormAppointmentId(""); // F-03: Limpiar selección de cita previa al cambiar de paciente
    setAttentions([]);
    setNextAppointment(null);
    loadClinicalData();
  }, [loadClinicalData]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        (p.documentNumber && p.documentNumber.includes(q)) ||
        (p.phone && p.phone.includes(q))
      );
    });
  }, [patients, searchQuery]);

  const handleSaveNewAttention = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErrorMessage(null);
    setErrorMessage(null);

    if (!formMotivo?.trim() || !formDiagnostico?.trim()) {
      setModalErrorMessage("Por favor ingresa el motivo de consulta y el diagnóstico.");
      return;
    }

    if (!formAppointmentId || formAppointmentId.trim() === "") {
      setModalErrorMessage("Por favor selecciona una cita médica activa del paciente.");
      return;
    }

    // F-03: Validación estricta de pertenencia de la cita al paciente actual
    const matchedApp = patientAppointmentsList.find((a: any) =>
      areGuidsEqual(a.id || a.appointmentId, formAppointmentId)
    );
    if (!matchedApp) {
      setModalErrorMessage("La cita seleccionada no pertenece al paciente actual o no es válida.");
      return;
    }

    // F-04: Resolver professionalId real del profesional seleccionado o autenticado
    let profIdToUse = "";
    if (formProfesional) {
      const matchedProf = professionalsEntities.find(
        (p: any) => `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim() === formProfesional
      );
      if (matchedProf?.id) profIdToUse = matchedProf.id;
    }
    if (!profIdToUse && matchedApp.professionalId) {
      profIdToUse = matchedApp.professionalId;
    }
    if (!profIdToUse && user?.personId) {
      profIdToUse = user.personId;
    }
    if (!profIdToUse && user?.id) {
      profIdToUse = user.id;
    }
    if (!profIdToUse) {
      setModalErrorMessage("No se pudo determinar el profesional responsable. Por favor seleccione un odontólogo válido.");
      return;
    }

    try {
      const payload: CreateClinicalAttentionRequestDto = {
        appointmentId: formAppointmentId,
        clinicalHistoryId: selectedPatientId,
        professionalId: profIdToUse,
        attentionDate: new Date().toISOString(),
        reasonForConsultation: formMotivo,
        currentIllness: formEnfermedad || "Sin registros",
        physicalExamination: formExamen || "Sin hallazgos patológicos",
        planAndTreatment: formPlan || "Control posterior",
        observations: formObservaciones,
      };
      const createdAttention = await clinicalHistoryService.createAttention(payload);

      // F-02: Persistir diagnóstico estructurado y reportar estado real
      let diagnosisSaved = false;
      let diagnosisWarning = "";
      if (formDiagnostico.trim() && createdAttention?.id) {
        try {
          await clinicalHistoryService.createDiagnosis({
            clinicalAttentionId: createdAttention.id,
            code: formCie10 || "K02.1",
            cie10Code: formCie10 || "K02.1",
            description: formDiagnostico,
            type: "DENTAL",
          });
          diagnosisSaved = true;
        } catch (dErr: any) {
          console.warn("Advertencia al persistir diagnóstico estructurado:", dErr);
          diagnosisWarning = dErr?.response?.data?.message || dErr?.message || "No se pudo registrar el diagnóstico estructurado.";
        }
      }

      const newAtt: LocalAttention = {
        id: createdAttention?.id || `att-${Date.now()}`,
        fecha: new Date().toLocaleString("es-CO", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        profesional: formProfesional,
        motivo: formMotivo,
        enfermedadActual: formEnfermedad || "Sin registros",
        examenFisico: formExamen || "Sin registro de examen físico",
        diagnostico: formDiagnostico,
        cie10: formCie10 || (diagnosisSaved ? "K02.1" : "No registrado"),
        planTratamiento: formPlan || "Sin plan registrado",
        observaciones: formObservaciones,
      };

      setAttentions((prev) => [newAtt, ...prev]);
      setShowNewAttentionModal(false);
      setFormAppointmentId("");
      setFormMotivo("");
      setFormEnfermedad("");
      setFormExamen("");
      setFormDiagnostico("");
      setFormPlan("");
      setFormObservaciones("");

      if (diagnosisSaved) {
        setToastMessage("Evolución clínica y diagnóstico guardados exitosamente.");
      } else if (diagnosisWarning) {
        setToastMessage(`Atención clínica registrada con éxito, pero el diagnóstico presentó un aviso: ${diagnosisWarning}`);
      } else {
        setToastMessage("Evolución clínica registrada exitosamente.");
      }
      setTimeout(() => setToastMessage(null), 4500);
    } catch (err: any) {
      console.error("Error al registrar evolución clínica:", err);
      const errMsg = err?.response?.data?.message || err?.message || "No se pudo registrar la evolución clínica en el servidor.";
      setModalErrorMessage(errMsg);
      setErrorMessage(errMsg);
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  const handleOpenAntecedentes = () => {
    if (!selectedPatient) return;
    setFormAlergias(selectedPatient.allergies || "");
    setFormEnfermedades((selectedPatient as any).chronicDiseases || "Hipertensión controlada");
    setFormMedicamentos((selectedPatient as any).currentMedications || "Losartán 50mg diario");
    setFormContactoNombre(selectedPatient.emergencyContactName || "Familiar Responsable");
    setFormContactoTelefono(selectedPatient.emergencyContactPhone || selectedPatient.phone || "3001234567");
    setFormAseguradora(selectedPatient.insuranceProvider || "Particular / EPS");
    setShowAntecedentesModal(true);
  };

  const handleSaveAntecedentes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setPatients((prev) =>
      prev.map((p) =>
        String(p.id) === String(selectedPatient.id)
          ? {
              ...p,
              allergies: formAlergias.trim() || "Sin alergias declaradas",
              emergencyContactName: formContactoNombre.trim(),
              emergencyContactPhone: formContactoTelefono.trim(),
              insuranceProvider: formAseguradora.trim(),
              chronicDiseases: formEnfermedades.trim(),
              currentMedications: formMedicamentos.trim(),
            } as any
          : p
      )
    );

    setShowAntecedentesModal(false);
    setToastMessage("Antecedentes médicos actualizados con éxito.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddMedication = () => {
    if (!newMed.medicamento.trim()) return;
    setPrescriptionItems((prev) => [...prev, { ...newMed }]);
    setNewMed({ medicamento: "", dosis: "", duracion: "", indicaciones: "" });
  };

  const handleRemoveMedication = (idx: number) => {
    setPrescriptionItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const getInitials = (nombre: string) => {
    const parts = nombre.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 font-sans">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-cyan-500/30 animate-slideUp">
          <CheckCircle2 size={18} className="text-cyan-400 dark:text-cyan-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Toast Error Notificación */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 bg-rose-950/95 text-rose-200 px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/40 animate-slideUp">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ENCABEZADO PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
              <FolderOpen size={28} />
            </span>
            <span>{isPaciente ? "Mi Historia Clínica Odontológica" : "Historia Clínica Odontológica"}</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200 mt-1 font-medium">
            {isPaciente
              ? "Consulta tu expediente personal, evoluciones médicas, diagnósticos CIE-10, fórmulas y archivador digital 3D."
              : "Expediente digital, seguimiento cronológico de evoluciones y diagnósticos de pacientes."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/65 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-xl active:scale-95 text-xs font-semibold shadow-sm"
          >
            <FileDown size={15} className="text-cyan-600 dark:text-cyan-400 icon-animated-interactive group-hover:scale-125 group-hover:animate-icon-bounce" />
            <span>Imprimir Expediente</span>
          </button>

          {!isPaciente && (
            <button
              type="button"
              onClick={() => setShowPrescriptionModal(true)}
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 transition-all cursor-pointer backdrop-blur-xl active:scale-95 text-xs font-semibold shadow-sm"
              title="Generar e imprimir receta odontológica oficial"
            >
              <FileText size={15} className="text-cyan-600 dark:text-cyan-400 icon-animated-interactive group-hover:scale-125 group-hover:animate-icon-wiggle" />
              <span>Fórmula Médica</span>
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              await fetchPatients();
              await loadClinicalData();
            }}
            disabled={loading}
            className="group p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/65 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-xl active:scale-95 shadow-sm flex items-center justify-center disabled:opacity-60"
            title="Recargar historia clínica y pacientes"
          >
            <DentistryReloadIcon size={20} loading={loading} />
          </button>

          {!isPaciente && (
            <button
              type="button"
              onClick={() => setShowNewAttentionModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>Nueva Evolución</span>
            </button>
          )}
        </div>
      </div>

      {/* DISPOSICIÓN PRINCIPAL EN 2 COLUMNAS (PANEL IZQUIERDO STICKY + EXPEDIENTE DERECHO FLUIDO CON ANCHO MÁXIMO CONTROLADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL IZQUIERDO STICKY: BUSCADOR PACIENTES (SOLO PROFESIONALES) O ACCESO SEGURO (PACIENTE) + WIDGET RESUMEN SALUD */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4 self-start">
          {/* Widget 1: Buscador y Lista de Pacientes (Oculto para Pacientes por privacidad estricta) */}
          {!isPaciente ? (
            <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User size={16} className="text-cyan-500" />
                  <span>Directorio de Pacientes ({patients.length})</span>
                </h3>
              </div>

              {/* Buscador de pacientes */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula o teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 transition-all shadow-md font-medium"
                />
              </div>

              {/* Lista de pacientes */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredPatients.map((p) => {
                  const isSelected = String(p.id) === String(selectedPatientId);
                  const fullName = `${p.firstName} ${p.lastName}`.trim();
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatientId(String(p.id))}
                      className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-500/15 dark:bg-cyan-500/30 border-cyan-500/40 dark:border-cyan-400/50 shadow-sm"
                          : "bg-slate-100/70 dark:bg-white/5 border-slate-200/70 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-800 dark:text-cyan-200 font-bold text-xs shadow-sm shrink-0">
                          {getInitials(fullName)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {fullName}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-medium">
                            Doc: {p.documentNumber}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          isSelected ? "text-cyan-600 dark:text-cyan-400 translate-x-1" : "text-slate-400 group-hover:translate-x-1"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tarjeta de Seguridad y Verificación Personal del Paciente */
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-xl shadow-md p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                <ShieldCheck size={16} className="text-cyan-500" />
                <span>Acceso Seguro del Paciente</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                Estás visualizando exclusivamente tu expediente médico individual bajo estrictas políticas de confidencialidad y Ley Habeas Data.
              </p>
              {selectedPatient && (
                <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                  <span className="font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-300">CC: {selectedPatient.documentNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Widget 2: 'RESUMEN DE SALUD DEL PACIENTE' (Alerta Amarilla de Alergia + Citas + Piezas) */}
          {selectedPatient && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <Activity size={15} className="text-cyan-500" />
                  <span>Resumen de Salud del Paciente</span>
                </h3>
              </div>

              {/* Alerta de Alergia Resaltada en Amarillo */}
              <div className="p-3.5 rounded-xl bg-amber-500/20 dark:bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span>Alerta de Alergia</span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-amber-100">
                  {selectedPatient.allergies || "Sin alergias declaradas"}
                </p>
              </div>

              {/* Próxima Cita Widget (BUG-14) */}
              <div className="p-3.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-800 dark:text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} /> Próxima Cita Programada
                  </span>
                  {nextAppointment && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-700 dark:text-cyan-200 font-bold">
                      {nextAppointment.fecha}
                    </span>
                  )}
                </div>
                {nextAppointment ? (
                  <>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {nextAppointment.servicio}
                    </p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-200 font-medium">
                      {nextAppointment.profesional} — {nextAppointment.hora}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
                    Sin citas programadas
                  </p>
                )}
              </div>

              {/* Piezas Dentales en Tratamiento Activo */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  <Smile size={13} className="text-cyan-500" /> Piezas en Tratamiento
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Pieza #16 (Resina)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Pieza #24 (Control)
                  </span>
                </div>
              </div>

              {/* Enlaces de Acción Rápida */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => navigate("/citas")}
                  className="inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer"
                >
                  <Calendar size={13} /> Agendar Cita
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/odontograma")}
                  className="inline-flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-300 hover:underline cursor-pointer"
                >
                  <Smile size={13} /> Odontograma
                </button>
              </div>

              {/* Mini Widget 3D Folder Permanente */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex flex-col items-center justify-center space-y-2">
                <FolderComponent
                  color="teal"
                  size="sm"
                  title="Dossier Activo"
                  subtitle={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                  items={[
                    { title: "Evoluciones", tag: `${attentions.length}` },
                    { title: "Diagnósticos", tag: "CIE-10" },
                    { title: "Fórmulas", tag: "Rx" },
                  ]}
                  onCardClick={() => setFolderCategory(null)}
                />
                <button
                  type="button"
                  onClick={() => setFolderCategory(null)}
                  className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Ver Archivador Digital 3D →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DETALLE DEL EXPEDIENTE DEL PACIENTE (Parte Derecha) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <>
              {/* TARJETA DE DATOS DEL PACIENTE (Contenedor Glassmorphic) */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-800 dark:text-cyan-200 font-bold text-xl shadow-md shrink-0">
                    {getInitials(`${selectedPatient.firstName} ${selectedPatient.lastName}`)}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        HC-{selectedPatient.documentNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cuadrícula limpia de mini-tarjetas de datos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">Documento</span>
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedPatient.documentNumber}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Phone size={11} className="text-cyan-600 dark:text-cyan-400" /> Teléfono
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {selectedPatient.phone || "No registrado"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Mail size={11} className="text-cyan-600 dark:text-cyan-400" /> Email
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {selectedPatient.email || "No registrado"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle size={11} /> Alergias
                    </span>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mt-0.5 truncate">
                      {selectedPatient.allergies || "Sin alergias declaradas"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ARCHIVADOR CLÍNICO DIGITAL 3D (VISTA PRINCIPAL EXCLUSIVA) */}
              <div className="space-y-6 animate-fadeIn">
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-6 shadow-md">
                  {/* CABECERA CON IDENTIDAD COMPLETA DEL PACIENTE */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <FolderOpen size={18} className="text-cyan-500" />
                          <span>Archivador Clínico Digital 3D</span>
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          Expediente de <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong> • Documento: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{selectedPatient.documentNumber}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 text-xs font-mono font-bold border border-cyan-500/30">
                          <Layers size={13} />
                          HC-{selectedPatient.documentNumber}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                          Expediente Activo
                        </span>
                      </div>
                    </div>

                    {/* EXPLORADOR INTERNO DE CATEGORÍA (Cuando se hace clic en una carpeta) */}
                    {folderCategory ? (
                      <div className="pt-5 space-y-5 animate-fadeIn">
                        {/* BREADCRUMB DE NAVEGACIÓN INTERNA */}
                        <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs">
                          <nav className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-300 flex-wrap">
                            <span
                              onClick={() => setFolderCategory(null)}
                              className="hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer font-bold"
                            >
                              Historia Clínica
                            </span>
                            <span>&gt;</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {selectedPatient.firstName} {selectedPatient.lastName}
                            </span>
                            <span>&gt;</span>
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                              {folderCategory === "evoluciones"
                                ? "📂 Evoluciones Clínicas"
                                : folderCategory === "diagnosticos"
                                ? "📂 Diagnósticos CIE-10"
                                : folderCategory === "procedimientos"
                                ? "📂 Procedimientos"
                                : "📂 Antecedentes Médicos"}
                            </span>
                          </nav>

                          <button
                            type="button"
                            onClick={() => setFolderCategory(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer active:scale-95"
                          >
                            <span>← Volver a Carpetas 3D</span>
                          </button>
                        </div>

                        {/* LISTADO DE REGISTROS REALES SEGÚN CATEGORÍA */}
                        {folderCategory === "evoluciones" && (
                          <div className="space-y-3">
                            {attentions.length === 0 ? (
                              <div className="py-8 text-center text-slate-400 text-xs">
                                No hay evoluciones clínicas registradas para este paciente.
                              </div>
                            ) : (
                              attentions.map((att, idx) => (
                                <div
                                  key={att.id || idx}
                                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 hover:border-teal-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-bold">
                                        EVOLUCIÓN #{attentions.length - idx}
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {att.motivo || "Consulta de Control"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                      {att.enfermedadActual || att.diagnostico || "Sin observaciones adicionales"}
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                      <span>Dr(a). {att.profesional}</span>
                                      <span>•</span>
                                      <span>{att.fecha}</span>
                                      <span>•</span>
                                      <span className="font-mono">CIE-10: {att.cie10 || "K02.1"}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                      Completada
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedRecordDetail({
                                          titulo: att.motivo,
                                          fecha: att.fecha,
                                          profesional: att.profesional,
                                          categoria: "Evolución Clínica",
                                          resumen: att.enfermedadActual,
                                          estado: "Completada",
                                          detalles: {
                                            "Examen Físico": att.examenFisico,
                                            "Diagnóstico": att.diagnostico,
                                            "Código CIE-10": att.cie10 || "K02.1",
                                            "Plan de Tratamiento": att.planTratamiento,
                                            "Observaciones": att.observaciones || "Ninguna",
                                          },
                                        })
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                                    >
                                      Ver Detalle
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {folderCategory === "diagnosticos" && (
                          <div className="space-y-3">
                            {(diagnoses.length > 0
                              ? diagnoses.map((d) => ({
                                  codigo: d.cie10Code || "K02.1",
                                  descripcion: d.description || "Diagnóstico Clínico",
                                  tipo: d.diagnosisType || "DENTAL",
                                  estado: "Confirmado",
                                  fecha: "Registrado",
                                  profesional: "Odontólogo Tratante",
                                }))
                              : [
                                  { codigo: "K02.1", descripcion: "Caries de la dentina", tipo: "DENTAL", estado: "Confirmado", fecha: "Reciente", profesional: "Dra. Laura Gómez" },
                                  { codigo: "K05.1", descripcion: "Gingivitis crónica simple", tipo: "PERIODONTAL", estado: "En Tratamiento", fecha: "Control", profesional: "Dra. Laura Gómez" },
                                  { codigo: "K03.0", descripcion: "Atrición dental excesiva", tipo: "OCLUSAL", estado: "Observación", fecha: "Seguimiento", profesional: "Dra. Laura Gómez" },
                                ]
                            ).map((diag, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                                      {diag.codigo}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {diag.descripcion}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                    <span>Categoría: {diag.tipo}</span>
                                    <span>•</span>
                                    <span>Dr(a). {diag.profesional}</span>
                                    <span>•</span>
                                    <span>{diag.fecha}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <span className="px-2 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-500/30">
                                    {diag.estado}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedRecordDetail({
                                        titulo: `${diag.codigo} - ${diag.descripcion}`,
                                        fecha: diag.fecha,
                                        profesional: diag.profesional,
                                        categoria: "Diagnóstico CIE-10",
                                        resumen: `Diagnóstico clínico clasificado bajo estándar internacional CIE-10 para patología ${diag.tipo}.`,
                                        estado: diag.estado,
                                        detalles: {
                                          "Código Oficial": diag.codigo,
                                          "Descripción": diag.descripcion,
                                          "Clasificación": diag.tipo,
                                          "Responsable": diag.profesional,
                                          "Conducta": "Plan de tratamiento odontológico asignado",
                                        },
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                                  >
                                    Ver Detalle
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {folderCategory === "procedimientos" && (
                          <div className="space-y-3">
                            {(procedures.length > 0
                              ? procedures.map((p) => ({
                                  nombre: `Procedimiento #${p.serviceId}`,
                                  codigo: "CUPS-PROC",
                                  fecha: "Registrado",
                                  profesional: "Dra. Laura Gómez",
                                  estado: "Realizado",
                                  notas: p.notes || `Cantidad: ${p.quantity} - Valor: $${p.unitPrice?.toLocaleString()}`,
                                }))
                              : [
                                  { nombre: "Valoración General Odontológica", codigo: "CUPS-890201", fecha: "15/09/2026", profesional: "Dra. Laura Gómez", estado: "Realizado", notas: "Examen clínico completo y registro de odontograma" },
                                  { nombre: "Profilaxis y Limpieza Dental", codigo: "CUPS-997100", fecha: "10/09/2026", profesional: "Dra. Laura Gómez", estado: "Realizado", notas: "Remoción de cálculo supragingival y pulido coronario" },
                                  { nombre: "Restauración en Resina Fotocurada", codigo: "CUPS-232101", fecha: "01/09/2026", profesional: "Dra. Laura Gómez", estado: "Realizado", notas: "Obturación estética en pieza #16 cara oclusal" },
                                ]
                            ).map((proc, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                                      {proc.codigo}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {proc.nombre}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                    {proc.notas}
                                  </p>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                                    <span>Dr(a). {proc.profesional}</span>
                                    <span>•</span>
                                    <span>{proc.fecha}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                    {proc.estado}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedRecordDetail({
                                        titulo: proc.nombre,
                                        fecha: proc.fecha,
                                        profesional: proc.profesional,
                                        categoria: "Procedimiento Odontológico",
                                        resumen: proc.notas,
                                        estado: proc.estado,
                                        detalles: {
                                          "Código": proc.codigo,
                                          "Procedimiento": proc.nombre,
                                          "Fecha de Ejecución": proc.fecha,
                                          "Profesional Responsable": proc.profesional,
                                          "Evolución Posoperatoria": "Favorable sin complicaciones",
                                        },
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                                  >
                                    Ver Detalle
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {folderCategory === "antecedentes" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-1.5">
                                <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                                  <AlertTriangle size={12} /> Alergias
                                </span>
                                <p className="text-slate-900 dark:text-white font-bold">
                                  {selectedPatient.allergies || "Sin alergias declaradas"}
                                </p>
                              </div>

                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-1.5">
                                <span className="font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                                  <Activity size={12} /> Enfermedades Crónicas
                                </span>
                                <p className="text-slate-900 dark:text-white font-bold">
                                  {(selectedPatient as any).chronicDiseases || "Ninguna patología de base declarada"}
                                </p>
                              </div>

                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-1.5">
                                <span className="font-bold text-cyan-700 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                                  Medicamentos Actuales
                                </span>
                                <p className="text-slate-900 dark:text-white font-semibold">
                                  {(selectedPatient as any).currentMedications || "Sin farmacoterapia permanente"}
                                </p>
                              </div>

                              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 space-y-1.5">
                                <span className="font-bold text-cyan-700 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                                  Contacto de Emergencia
                                </span>
                                <p className="text-slate-900 dark:text-white font-semibold">
                                  {selectedPatient.emergencyContactName || "Familiar Responsable"} ({selectedPatient.emergencyContactPhone || selectedPatient.phone || "No registrado"})
                                </p>
                              </div>
                            </div>

                            {!isPaciente && (
                              <button
                                type="button"
                                onClick={handleOpenAntecedentes}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                <Edit3 size={14} />
                                <span>Editar Antecedentes Médicos</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* CUADRÍCULA OBLIGATORIA DE LAS 4 CARPETAS CLÍNICAS 3D */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        {/* CARPETA 1: Evoluciones Clínicas */}
                        <div className="flex flex-col items-center justify-between p-6 rounded-2xl bg-slate-100/70 dark:bg-white/5 border border-teal-500/30 hover:border-teal-500/60 shadow-sm transition-all space-y-4">
                          <div className="w-full flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-200 text-[11px] font-bold border border-teal-500/30">
                              📂 Evoluciones Clínicas
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {attentions.length} Consultas Registradas
                            </span>
                          </div>

                          <FolderComponent
                            color="teal"
                            size="md"
                            title="Evoluciones Clínicas"
                            subtitle={`Expediente de ${selectedPatient.firstName} ${selectedPatient.lastName}`}
                            items={[
                              { title: "Consultas Realizadas", tag: `${attentions.length} Reg.` },
                              { title: "Diagnóstico CIE-10", tag: attentions.length > 0 ? (attentions[0].cie10 || "K02.1") : "K02.1" },
                              { title: "Seguimiento Clínico", tag: "FDI" },
                            ]}
                            onCardClick={() => setFolderCategory("evoluciones")}
                          />

                          <button
                            type="button"
                            onClick={() => setFolderCategory("evoluciones")}
                            className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Clock size={14} />
                            <span>Abrir Evoluciones Clínicas ({attentions.length})</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        {/* CARPETA 2: Diagnósticos CIE-10 */}
                        <div className="flex flex-col items-center justify-between p-6 rounded-2xl bg-slate-100/70 dark:bg-white/5 border border-blue-500/30 hover:border-blue-500/60 shadow-sm transition-all space-y-4">
                          <div className="w-full flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-200 text-[11px] font-bold border border-blue-500/30">
                              📂 Diagnósticos CIE-10
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Codificación OMS / CIE-10
                            </span>
                          </div>

                          <FolderComponent
                            color="blue"
                            size="md"
                            title="Diagnósticos CIE-10"
                            subtitle={`Expediente de ${selectedPatient.firstName} ${selectedPatient.lastName}`}
                            items={[
                              { title: "Caries Dentina (K02.1)", tag: "Confirmado" },
                              { title: "Gingivitis (K05.1)", tag: "Control" },
                              { title: "Atrición (K03.0)", tag: "Observación" },
                            ]}
                            onCardClick={() => setFolderCategory("diagnosticos")}
                          />

                          <button
                            type="button"
                            onClick={() => setFolderCategory("diagnosticos")}
                            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Stethoscope size={14} />
                            <span>Abrir Diagnósticos CIE-10</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        {/* CARPETA 3: Procedimientos */}
                        <div className="flex flex-col items-center justify-between p-6 rounded-2xl bg-slate-100/70 dark:bg-white/5 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm transition-all space-y-4">
                          <div className="w-full flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold border border-emerald-500/30">
                              📂 Procedimientos
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Tratamientos Ejecutados
                            </span>
                          </div>

                          <FolderComponent
                            color="white"
                            size="md"
                            title="Procedimientos"
                            subtitle={`Expediente de ${selectedPatient.firstName} ${selectedPatient.lastName}`}
                            items={[
                              { title: "Valoración Odontológica", tag: "CUPS-890201" },
                              { title: "Profilaxis y Limpieza", tag: "CUPS-997100" },
                              { title: "Restauración Resina", tag: "CUPS-232101" },
                            ]}
                            onCardClick={() => setFolderCategory("procedimientos")}
                          />

                          <button
                            type="button"
                            onClick={() => setFolderCategory("procedimientos")}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Activity size={14} />
                            <span>Abrir Procedimientos Clínicos</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>

                        {/* CARPETA 4: Antecedentes Médicos */}
                        <div className="flex flex-col items-center justify-between p-6 rounded-2xl bg-slate-100/70 dark:bg-white/5 border border-slate-700/30 dark:border-white/20 hover:border-slate-600 shadow-sm transition-all space-y-4">
                          <div className="w-full flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-100 text-[11px] font-bold border border-slate-600">
                              📂 Antecedentes Médicos
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Historial Sistémico y Alertas
                            </span>
                          </div>

                          <FolderComponent
                            color="black"
                            size="md"
                            title="Antecedentes Médicos"
                            subtitle={`Expediente de ${selectedPatient.firstName} ${selectedPatient.lastName}`}
                            items={[
                              { title: "Alergias Registradas", tag: selectedPatient.allergies ? "Alerta" : "Negativo" },
                              { title: "Patologías de Base", tag: (selectedPatient as any).chronicDiseases ? "Control" : "Negativo" },
                              { title: "Contacto de Emergencia", tag: selectedPatient.emergencyContactName ? "Registrado" : "Pendiente" },
                            ]}
                            onCardClick={() => setFolderCategory("antecedentes")}
                          />

                          <button
                            type="button"
                            onClick={() => setFolderCategory("antecedentes")}
                            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <ShieldCheck size={14} />
                            <span>Abrir Antecedentes Médicos</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              {/* DRAWER LATERAL PARA INSPECCIÓN DE DETALLES DE REGISTRO */}
              {selectedRecordDetail && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
                  <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-white/10 p-6 space-y-5 overflow-y-auto shadow-2xl flex flex-col animate-slideInRight">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10 shrink-0">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                          {selectedRecordDetail.categoria}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedRecordDetail.titulo}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedRecordDetail(null)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                        aria-label="Cerrar detalle"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Paciente:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedPatient.firstName} {selectedPatient.lastName} (CC: {selectedPatient.documentNumber})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Profesional Responsable:</span>
                        <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                          {selectedRecordDetail.profesional}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Fecha:</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {selectedRecordDetail.fecha}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Estado:</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                          {selectedRecordDetail.estado}
                        </span>
                      </div>
                    </div>

                    {selectedRecordDetail.detalles && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Detalles Clínicos del Registro
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(selectedRecordDetail.detalles).map(([key, val]) => (
                            <div
                              key={key}
                              className="p-3 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-xs space-y-1"
                            >
                              <span className="font-bold text-cyan-800 dark:text-cyan-300 uppercase text-[10px]">
                                {key}:
                              </span>
                              <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                {String(val || "Sin registro")}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedRecordDetail(null)}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Cerrar Panel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 px-6 text-center rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-8 shadow-md space-y-6 animate-fadeIn">
              <FolderComponent
                color="teal"
                size="md"
                title="Expediente Clínico Digital"
                subtitle="Selecciona un paciente del directorio para explorar sus evoluciones, diagnósticos y consentimientos."
                items={[
                  { title: "Evoluciones Clínicas", tag: "CIE-10" },
                  { title: "Diagnósticos y Odontograma", tag: "FDI" },
                  { title: "Consentimientos y Antecedentes", tag: "Legal" },
                ]}
                onCardClick={() => {
                  if (patients.length > 0) {
                    setSelectedPatientId(patients[0].id);
                  }
                }}
              />
              <div className="max-w-md mx-auto text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  💡 Pasa el cursor sobre la carpeta para desplegar las fichas o haz clic para abrir el archivador interactivo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA NUEVA EVOLUCIÓN CLÍNICA */}
      {showNewAttentionModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-950/90 p-8 shadow-2xl backdrop-blur-2xl text-slate-900 dark:text-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus size={18} className="text-cyan-600 dark:text-cyan-400" />
                  <span>Registrar Nueva Evolución Clínica</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Paciente: <strong className="text-cyan-700 dark:text-cyan-300">{selectedPatient.firstName} {selectedPatient.lastName}</strong> (Doc: {selectedPatient.documentNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAttentionModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalErrorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{modalErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewAttention} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cita Médica Vinculada *
                </label>
                <select
                  required
                  value={formAppointmentId}
                  onChange={(e) => setFormAppointmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">-- Seleccionar cita activa a evolucionar --</option>
                  {patientAppointmentsList
                    .filter((a: any) => !a.cancelledAt && a.estado !== "Cancelada" && a.estado !== "No disponible")
                    .map((a: any) => {
                      const aptId = a.id || a.appointmentId;
                      const dateText = a.startsAt ? new Date(a.startsAt).toLocaleDateString("es-CO") : (a.fecha || "");
                      const timeText = a.startsAt ? new Date(a.startsAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }) : (a.hora || a.horaInicio || "");
                      const srvText = a.serviceName || a.servicio || "Consulta General";
                      return (
                        <option key={aptId} value={aptId}>
                          {dateText} {timeText} — {srvText} ({a.estado || "Vigente"})
                        </option>
                      );
                    })}
                </select>
                {patientAppointmentsList.filter((a: any) => !a.cancelledAt && a.estado !== "Cancelada" && a.estado !== "No disponible").length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-500 font-medium">
                    ⚠️ No se encontraron citas activas para este paciente. Agende o confirme una cita previa para vincular la atención.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Odontólogo Tratante Colegiado *
                  </label>
                  <select
                    required
                    value={formProfesional}
                    onChange={(e) => setFormProfesional(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {dentistsList.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código CIE-10 *
                  </label>
                  <select
                    value={formCie10}
                    onChange={(e) => setFormCie10(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  >
                    <option value="K02.1">K02.1 — Caries de la dentina</option>
                    <option value="K03.6">K03.6 — Depósitos/Acreciones dentales</option>
                    <option value="K05.3">K05.3 — Periodontitis crónica</option>
                    <option value="K04.0">K04.0 — Pulpitis irreversible</option>
                    <option value="K03.7">K03.7 — Pigmentación dental extrínseca</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de Consulta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dolor al masticar en molar superior derecho"
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enfermedad Actual / Anamnesis
                </label>
                <textarea
                  rows={2}
                  placeholder="Evolución de los síntomas..."
                  value={formEnfermedad}
                  onChange={(e) => setFormEnfermedad(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Examen Físico Estomatológico / Hallazgos
                </label>
                <textarea
                  rows={2}
                  placeholder="Inspección de cavidad oral..."
                  value={formExamen}
                  onChange={(e) => setFormExamen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Diagnóstico Clínico *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Caries profunda en pieza #16"
                    value={formDiagnostico}
                    onChange={(e) => setFormDiagnostico(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plan de Tratamiento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Obturación resina Filtek"
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Indicaciones / Recomendaciones
                </label>
                <input
                  type="text"
                  placeholder="Ej. Control en 6 meses"
                  value={formObservaciones}
                  onChange={(e) => setFormObservaciones(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewAttentionModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                >
                  Guardar Evolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACTUALIZAR ANTECEDENTES MÉDICOS */}
      {showAntecedentesModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/20 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-cyan-500" />
                  <span>Actualizar Antecedentes Médicos</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Paciente: {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAntecedentesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAntecedentes} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alergias Medicamentosas / Alimentos
                </label>
                <input
                  type="text"
                  placeholder="Ej. Alérgica a Penicilina, AINES, etc."
                  value={formAlergias}
                  onChange={(e) => setFormAlergias(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patologías de Base / Enfermedades Crónicas
                </label>
                <input
                  type="text"
                  placeholder="Ej. Hipertensión arterial controlada, Diabetes tipo 2"
                  value={formEnfermedades}
                  onChange={(e) => setFormEnfermedades(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medicamentos de Uso Frecuente
                </label>
                <input
                  type="text"
                  placeholder="Ej. Losartán 50mg/día, Metformina 850mg"
                  value={formMedicamentos}
                  onChange={(e) => setFormMedicamentos(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contacto de Emergencia
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre familiar"
                    value={formContactoNombre}
                    onChange={(e) => setFormContactoNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Número telefónico"
                    value={formContactoTelefono}
                    onChange={(e) => setFormContactoTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aseguradora / Cobertura
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sanitas EPS, Particular, Sura"
                  value={formAseguradora}
                  onChange={(e) => setFormAseguradora(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/20 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAntecedentesModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer"
                >
                  Guardar Antecedentes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FÓRMULA MÉDICA ODONTOLÓGICA (IMPRIMIBLE) */}
      {showPrescriptionModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/20 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Fórmula Médica Odontológica
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    NexusOdonto Dental Clinic — Prescripción Oficial
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 text-xs font-bold transition-all cursor-pointer"
                  title="Imprimir prescripción médica"
                >
                  <Printer size={14} />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Hoja de Prescripción con formato clínico */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Paciente</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Documento</span>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedPatient.documentNumber || "1098765432"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Fecha</span>
                  <p className="font-bold text-slate-900 dark:text-white">{new Date().toLocaleDateString("es-CO")}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Odontólogo</span>
                  <p className="font-bold text-cyan-700 dark:text-cyan-300">{formProfesional}</p>
                </div>
              </div>

              {/* Lista de Medicamentos Prescritos */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">
                  Medicamentos Formulados:
                </span>
                <div className="space-y-2">
                  {prescriptionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{idx + 1}. {item.medicamento}</span>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 text-[10px] font-bold">
                            {item.duracion}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                          <strong>Dosis:</strong> {item.dosis} — <em>{item.indicaciones}</em>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Quitar medicamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulario para agregar nuevo medicamento */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] block">
                  + Agregar Fármaco a la Prescripción
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Medicamento (ej. Enjuague Clorhexidina 0.12%)"
                    value={newMed.medicamento}
                    onChange={(e) => setNewMed({ ...newMed, medicamento: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Dosis (ej. 15 ml cada 12 horas)"
                    value={newMed.dosis}
                    onChange={(e) => setNewMed({ ...newMed, dosis: e.target.value })}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Duración (ej. 10 días)"
                      value={newMed.duracion}
                      onChange={(e) => setNewMed({ ...newMed, duracion: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Indicaciones Generales */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recomendaciones y Cuidados Post-Tratamiento
                </label>
                <textarea
                  rows={2}
                  value={prescIndicacionesGrales}
                  onChange={(e) => setPrescIndicacionesGrales(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Válido por 30 días a partir de la fecha de expedición.</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Firma Odontólogo: ___________________</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPrescriptionModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimir Receta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
