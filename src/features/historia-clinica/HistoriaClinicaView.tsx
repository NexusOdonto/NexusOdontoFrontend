import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  CheckCircle2,
  X,
  FileDown,
  RefreshCw,
  Phone,
  Mail,
  User,
  Clock,
  Stethoscope,
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Award,
  Calendar,
  Smile,
  Printer,
  Edit3,
  Trash2,
  AlertCircle,
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
import { areGuidsEqual } from "../../utils/roleUtils";

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
  const [activeTab, setActiveTab] = useState<"evoluciones" | "diagnosticos" | "procedimientos" | "antecedentes">("evoluciones");

  // Modal Nueva Evolución
  const [showNewAttentionModal, setShowNewAttentionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State para nueva atención
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

  // 1. Cargar Pacientes
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const patientList = await patientService.getAll().catch(() => []);
      const personList = await personService.getAll().catch(() => []);

      if (patientList && patientList.length > 0) {
        const enriched = patientList.map((p) => {
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
        setPatients(enriched);
        if (!selectedPatientId && enriched.length > 0) {
          setSelectedPatientId(enriched[0].id);
        }
      } else {
        const fallbackPatients: PatientResponseDto[] = [
          {
            id: "1",
            personId: "p1",
            firstName: "Ana María",
            lastName: "Rodríguez",
            documentNumber: "1098765432",
            phone: "3001234567",
            email: "ana.rodriguez@email.com",
            allergies: "Alérgica a Penicilina",
            bloodType: "O+",
            createdAt: "2024-01-15",
          },
          {
            id: "2",
            personId: "p2",
            firstName: "Carlos Andrés",
            lastName: "Pérez",
            documentNumber: "1023456789",
            phone: "3012345678",
            email: "carlos.perez@email.com",
            allergies: "Sin alergias declaradas",
            bloodType: "A+",
            createdAt: "2024-02-10",
          },
          {
            id: "3",
            personId: "p3",
            firstName: "María Fernanda",
            lastName: "López",
            documentNumber: "1009876543",
            phone: "3023456789",
            email: "maria.lopez@email.com",
            allergies: "Aspirina",
            bloodType: "B+",
            createdAt: "2024-03-05",
          },
          {
            id: "4",
            personId: "p4",
            firstName: "Juan David",
            lastName: "Gómez",
            documentNumber: "1091234567",
            phone: "3034567890",
            email: "juan.gomez@email.com",
            allergies: "Sin alergias declaradas",
            bloodType: "O-",
            createdAt: "2024-04-12",
          },
        ];
        setPatients(fallbackPatients);
        if (!selectedPatientId) {
          setSelectedPatientId("1");
        }
      }
    } catch (err) {
      console.warn("Could not load patients for Historia Clínica:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => String(p.id) === String(selectedPatientId)) || patients[0];
  }, [patients, selectedPatientId]);

  const loadClinicalData = useCallback(async () => {
    if (!selectedPatientId) {
      setAttentions([]);
      setDiagnoses([]);
      setProcedures([]);
      return;
    }

    try {
      const [apiAttentions, apiDiagnoses, apiProcedures, apiAppointments, apiProfessionals, apiServices] = await Promise.all([
        clinicalHistoryService.getAttentions().catch(() => []),
        clinicalHistoryService.getDiagnoses().catch(() => []),
        clinicalHistoryService.getProcedures().catch(() => []),
        appointmentService.getAll().catch(() => []),
        professionalService.getAll().catch(() => []),
        serviceCatalogService.getAll().catch(() => []),
      ]);

      setDiagnoses(apiDiagnoses);
      setProcedures(apiProcedures);

      // 1. Cargar odontólogos licenciados
      const profsList = Array.isArray(apiProfessionals) ? apiProfessionals : [];
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

      // 2. Cargar Próxima Cita Real del paciente activo y resolver IDs de citas del paciente (BUG-14 & F-01)
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

      // FRONT-06: Ordenar cronológicamente citas futuras y filtrar las pasadas
      const now = new Date();
      const futureApps = patientAppointments
        .map((a: any) => {
          const datePart = a.startsAt ? a.startsAt.split("T")[0] : a.fecha || "";
          const timePart = (a.startsAt && a.startsAt.includes("T")) ? a.startsAt.split("T")[1].substring(0, 5) : a.hora || "00:00";
          const parsedTime = datePart ? new Date(`${datePart}T${timePart}:00`).getTime() : 0;
          return { ...a, _parsedTime: parsedTime, _datePart: datePart, _timePart: timePart };
        })
        .filter((a: any) => {
          const isNotCancelled = !a.cancelledAt && a.estado !== "Cancelada";
          return a._parsedTime >= now.getTime() && isNotCancelled;
        })
        .sort((a: any, b: any) => a._parsedTime - b._parsedTime);

      if (futureApps.length > 0) {
        const next = futureApps[0];
        const nextDate = next._datePart || new Date().toISOString().split("T")[0];
        const nextHour = next._timePart || "09:00";

        // Resolver nombre real del servicio
        let resolvedServName = next.serviceName || next.servicio;
        if (!resolvedServName || resolvedServName === "Consulta Odontológica") {
          const srvList = Array.isArray(apiServices) ? apiServices : [];
          const matchedSrv = srvList.find((s: any) => areGuidsEqual(s.id, next.serviceId));
          if (matchedSrv?.name) resolvedServName = matchedSrv.name;
        }
        if (!resolvedServName) resolvedServName = "Consulta Odontológica";

        // Resolver nombre real del profesional
        let resolvedDocName = next.professionalName || next.profesional;
        if (!resolvedDocName || resolvedDocName.includes("Especialista")) {
          const matchedProf = profsList.find((p: any) => areGuidsEqual(p.id, next.professionalId));
          if (matchedProf) {
            resolvedDocName = `Dr(a). ${matchedProf.firstName || ""} ${matchedProf.lastName || ""}`.trim();
          }
        }
        if (!resolvedDocName) resolvedDocName = (dentistsList[0] || "Dr(a). Especialista");

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

        const mapped: LocalAttention[] = filtered.map((a, idx) => ({
          id: a.id || `att-api-${idx}`,
          fecha: a.attentionDate ? new Date(a.attentionDate).toLocaleString("es-CO") : "Reciente",
          profesional: "Dr. Asignado",
          motivo: a.reasonForConsultation || "Consulta odontológica",
          enfermedadActual: a.currentIllness || "Sin registros",
          examenFisico: a.physicalExamination || "Sin hallazgos patológicos",
          diagnostico: "Evaluación clínica",
          cie10: "K02.1",
          planTratamiento: a.planAndTreatment || "Control posterior",
          observaciones: a.observations,
        }));
        setAttentions(mapped);
      } else {
        setAttentions([]);
      }
    } catch (err) {
      console.warn("API clinical history offline, setting empty attentions list:", err);
      setAttentions([]);
      setNextAppointment(null);
    }
  }, [selectedPatientId, selectedPatient, isDentist]);

  useEffect(() => {
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
    if (!formMotivo || !formDiagnostico) return;
    setErrorMessage(null);

    const linkedAppointment =
      patientAppointmentsList.find((a: any) => !a.cancelledAt && a.estado !== "Cancelada") ||
      patientAppointmentsList[0];
    const appointmentIdToUse = linkedAppointment?.id || linkedAppointment?.appointmentId;

    if (!appointmentIdToUse) {
      const msg = "Se requiere una cita vinculada activa del paciente para registrar la atención clínica.";
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      const payload: CreateClinicalAttentionRequestDto = {
        appointmentId: appointmentIdToUse,
        clinicalHistoryId: selectedPatientId,
        professionalId: user?.personId || user?.id || "12000000-0000-0000-0000-000000000001",
        attentionDate: new Date().toISOString(),
        reasonForConsultation: formMotivo,
        currentIllness: formEnfermedad,
        physicalExamination: formExamen,
        planAndTreatment: formPlan,
        observations: formObservaciones,
      };
      await clinicalHistoryService.createAttention(payload);

      const newAtt: LocalAttention = {
        id: `att-${Date.now()}`,
        fecha: new Date().toLocaleString("es-CO", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        profesional: formProfesional,
        motivo: formMotivo,
        enfermedadActual: formEnfermedad || "Paciente acude a consulta por síntomas expresados.",
        examenFisico: formExamen || "Examen físico intrabucal realizado.",
        diagnostico: formDiagnostico,
        cie10: formCie10 || "K02.1",
        planTratamiento: formPlan || "Tratamiento realizado de acuerdo a protocolo clínico.",
        observaciones: formObservaciones,
      };

      setAttentions((prev) => [newAtt, ...prev]);
      setShowNewAttentionModal(false);
      setFormMotivo("");
      setFormEnfermedad("");
      setFormExamen("");
      setFormDiagnostico("");
      setFormPlan("");
      setFormObservaciones("");

      setToastMessage("Evolución clínica registrada correctamente.");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      console.error("Error al registrar evolución clínica:", err);
      const errMsg = err?.response?.data?.message || err?.message || "No se pudo registrar la evolución clínica en el servidor.";
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-cyan-500/30 animate-slideUp">
          <CheckCircle2 size={18} className="text-cyan-400 dark:text-cyan-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Toast Error Notificación */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-rose-950/95 text-rose-200 px-5 py-3.5 rounded-2xl shadow-2xl border border-rose-500/40 animate-slideUp">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* ENCABEZADO PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            Historia Clínica Odontológica
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-200 mt-1 font-medium">
            Expediente digital, seguimiento cronológico de evoluciones y diagnósticos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/65 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-xl active:scale-95 text-xs font-semibold shadow-sm"
          >
            <FileDown size={15} className="text-cyan-600 dark:text-cyan-400" />
            <span>Imprimir Expediente</span>
          </button>

          {!isPaciente && (
            <button
              type="button"
              onClick={() => setShowPrescriptionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 transition-all cursor-pointer backdrop-blur-xl active:scale-95 text-xs font-semibold shadow-sm"
              title="Generar e imprimir receta odontológica oficial"
            >
              <FileText size={15} className="text-cyan-600 dark:text-cyan-400" />
              <span>Fórmula Médica</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadClinicalData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/65 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-xl active:scale-95 shadow-sm"
            title="Recargar datos"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
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
        {/* PANEL IZQUIERDO STICKY: BUSCADOR PACIENTES + WIDGET RESUMEN SALUD */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4 self-start">
          {/* Widget 1: Buscador y Lista de Pacientes (4) */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User size={16} className="text-cyan-500" />
                <span>Pacientes ({patients.length})</span>
              </h3>
            </div>

            {/* Buscador de pacientes */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paciente..."
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

              {/* PESTAÑAS ENCAPSULADAS EN CONTENEDOR GLASSMORPHIC */}
              <div className="flex items-center rounded-2xl bg-white/90 dark:bg-slate-950/65 p-1 border border-slate-200 dark:border-white/20 backdrop-blur-xl shadow-md overflow-x-auto gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("evoluciones")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "evoluciones"
                      ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Clock size={14} />
                  <span>Evoluciones Clínicas ({attentions?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("diagnosticos")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "diagnosticos"
                      ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Stethoscope size={14} />
                  <span>Diagnósticos CIE-10</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("procedimientos")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "procedimientos"
                      ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Activity size={14} />
                  <span>Procedimientos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("antecedentes")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "antecedentes"
                      ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>Antecedentes Médicos</span>
                </button>
              </div>

              {/* CONTENIDO DE LAS PESTAÑAS */}
              {activeTab === "evoluciones" && (
                <div className="space-y-4">
                  {attentions.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-slate-200 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-6 shadow-md">
                      <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Sin evoluciones registradas
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto mt-1 font-medium">
                        Presiona "+ Nueva Evolución" para registrar la primera atención clínica de este paciente.
                      </p>
                    </div>
                  ) : (
                    attentions.map((att, idx) => (
                      <div
                        key={att.id}
                        className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-6 shadow-md space-y-4 animate-slideUp"
                      >
                        {/* Cabecera de la Evolución con Metadatos Claras */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-white/10 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 font-bold text-xs border border-cyan-500/30">
                              #{attentions.length - idx}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {att.motivo}
                              </h4>
                              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                                Odontólogo: <strong className="text-slate-900 dark:text-white font-bold">{att.profesional}</strong>
                              </span>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 px-3 py-1 text-xs font-mono font-bold text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 self-start sm:self-auto">
                            <Calendar size={13} />
                            {att.fecha}
                          </span>
                        </div>

                        {/* Textos de Anamnesis y Examen Físico en Plateado Alto Contraste */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                            <span className="font-bold text-cyan-800 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                              Enfermedad Actual / Anamnesis:
                            </span>
                            <p className="text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                              {att.enfermedadActual}
                            </p>
                          </div>

                          <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                            <span className="font-bold text-cyan-800 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                              Examen Físico / Estomatológico:
                            </span>
                            <p className="text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                              {att.examenFisico}
                            </p>
                          </div>
                        </div>

                        {/* Diagnóstico y Plan de Tratamiento Destacado */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500/15 via-cyan-500/15 to-transparent border border-cyan-500/30 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-900 dark:text-cyan-200">
                              <Award size={15} /> Diagnóstico: {att.diagnostico}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-900 dark:text-cyan-100 text-[11px] font-mono font-bold border border-cyan-500/40">
                              CIE-10: {att.cie10}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            <strong>Plan de Tratamiento:</strong> {att.planTratamiento}
                          </p>
                        </div>

                        {att.observaciones && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 italic pt-1 font-medium">
                            <strong>Indicaciones:</strong> "{att.observaciones}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "diagnosticos" && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-6 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Stethoscope size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Diagnósticos Registrados (CIE-10)</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          <th className="py-2.5 px-3">Código CIE-10</th>
                          <th className="py-2.5 px-3">Descripción</th>
                          <th className="py-2.5 px-3">Tipo</th>
                          <th className="py-2.5 px-3 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                        {diagnoses.length > 0 ? (
                          diagnoses.map((d) => (
                            <tr key={d.id} className="hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-300">
                                {d.cie10Code}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                {d.description}
                              </td>
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">
                                {d.diagnosisType}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold">
                                  Confirmado
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr className="hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-300">K02.1</td>
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Caries de la dentina</td>
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">Definitivo</td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold">Tratado</span>
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-300">K03.6</td>
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Depósitos [acreciones] en los dientes</td>
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">Presuntivo</td>
                              <td className="py-3 px-3 text-right">
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 font-bold">En Control</span>
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "procedimientos" && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-6 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity size={16} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Procedimientos y Tratamientos Ejecutados</span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          <th className="py-2.5 px-3">Procedimiento</th>
                          <th className="py-2.5 px-3">Detalle / Pieza</th>
                          <th className="py-2.5 px-3 text-center">Cant</th>
                          <th className="py-2.5 px-3 text-right">Valor Unitario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60 dark:divide-white/10">
                        {procedures.length > 0 ? (
                          procedures.map((proc) => (
                            <tr key={proc.id} className="hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Procedimiento #{proc.serviceId}</td>
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">{proc.notes || "Tratamiento estándar"}</td>
                              <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">{proc.quantity}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300">${proc.unitPrice?.toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr className="hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Obturación estética en resina de fotocurado</td>
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">Pieza #16 — Cavidad Clase I</td>
                              <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">1</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300">$120,000</td>
                            </tr>
                            <tr className="hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">Detartraje ultrasónico y profilaxis</td>
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-200 font-medium">Arcada Superior e Inferior</td>
                              <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">1</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-300">$90,000</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "antecedentes" && (
                <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck size={16} className="text-cyan-600 dark:text-cyan-400" />
                      <span>Antecedentes Médicos y Alertas Sistémicas</span>
                    </h3>
                    {!isPaciente && (
                      <button
                        type="button"
                        onClick={handleOpenAntecedentes}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Edit3 size={13} />
                        <span>Actualizar Antecedentes</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                      <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Alergias Medicamentosas / Alimentos
                      </span>
                      <p className="text-slate-900 dark:text-white font-bold">
                        {selectedPatient.allergies || "No refiere alergias conocidas."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                      <span className="font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
                        <Activity size={12} />
                        Enfermedades Sistémicas / Crónicas
                      </span>
                      <p className="text-slate-900 dark:text-white font-bold">
                        {(selectedPatient as any).chronicDiseases || "Ninguna patología de base declarada."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                      <span className="font-bold text-cyan-700 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                        Medicamentos de Uso Frecuente
                      </span>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        {(selectedPatient as any).currentMedications || "Sin farmacoterapia permanente."}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                      <span className="font-bold text-cyan-700 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                        Contacto de Emergencia
                      </span>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        {selectedPatient.emergencyContactName || "Familiar Responsable"} — {selectedPatient.emergencyContactPhone || selectedPatient.phone || "No registrado"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                      <span className="font-bold text-cyan-700 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                        Aseguradora / Cobertura
                      </span>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        {selectedPatient.insuranceProvider || "Particular / Medicina Prepagada"} (Póliza: {selectedPatient.insurancePolicyNumber || "POL-987214"})
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                      <span className="font-bold text-cyan-700 dark:text-cyan-300 uppercase text-[10px] tracking-wider">
                        Consentimiento Informado
                      </span>
                      <p className="text-slate-900 dark:text-white font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Firmado digitalmente y verificado para procedimientos clínicos.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl p-6 shadow-md">
              <User size={36} className="mx-auto text-slate-400 mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Selecciona un paciente para ver su expediente.
              </h3>
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

            <form onSubmit={handleSaveNewAttention} className="space-y-4 text-xs">
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
