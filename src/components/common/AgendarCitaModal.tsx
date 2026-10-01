import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Phone,
  CreditCard,
} from "lucide-react";
import { type Paciente, isPatientOnline } from "../../types/pacientes";
import { serviceCatalogService, type ServiceResponseDto } from "../../api/serviceCatalogService";
import { professionalService, type ProfessionalResponseDto } from "../../api/professionalService";
import { appointmentService, type AppointmentResponseDto } from "../../api/appointmentService";
import { ModernServiceSelect } from "./ModernServiceSelect";
import { ModernDoctorSelect } from "./ModernDoctorSelect";
import { type SelectOption } from "./SelectOrWriteInput";
import { GlassDatePicker } from "./GlassDatePicker";
import { UserAvatar } from "./UserAvatar";
import { AvailableSlotsPicker } from "./AvailableSlotsPicker";
import { useNotifications } from "../../context/NotificationContext";
import { areGuidsEqual } from "../../utils/roleUtils";
import { PROFESSIONAL_FALLBACK_LABEL } from "../../utils/professionalDisplayName";

export interface AgendarCitaModalProps {
  paciente: Paciente;
  onClose: () => void;
  onSuccess?: (createdCita?: any) => void;
}

export function AgendarCitaModal({ paciente, onClose, onSuccess }: AgendarCitaModalProps) {
  const { addNotification, refreshNotifications } = useNotifications();

  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalResponseDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>([]);

  // Dejar campos vacíos inicialmente para que el usuario elija libremente
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [serviceName, setServiceName] = useState<string>("");
  const [doctorName, setDoctorName] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");

  const isOnline = useMemo(() => isPatientOnline(paciente), [paciente]);

  const todayIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const [fecha, setFecha] = useState<string>(todayIso);
  const [hora, setHora] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar catálogos sin forzar selecciones automáticas
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoadingCatalogs(true);
      try {
        const [servicesRes, profsRes, appsRes] = await Promise.allSettled([
          serviceCatalogService.getAll(),
          professionalService.getAll(),
          appointmentService.getAll(),
        ]);

        if (!isMounted) return;

        const rawServices = servicesRes.status === "fulfilled" && Array.isArray(servicesRes.value) ? servicesRes.value : [];
        const rawProfs = profsRes.status === "fulfilled" && Array.isArray(profsRes.value) ? profsRes.value : [];
        const rawApps = appsRes.status === "fulfilled" && Array.isArray(appsRes.value) ? appsRes.value : [];

        setServices(rawServices);
        setProfessionals(rawProfs);
        setAppointments(rawApps);
      } catch (err) {
        console.error("Error loading catalogs in AgendarCitaModal:", err);
      } finally {
        if (isMounted) setLoadingCatalogs(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Transformar profesionales para ModernDoctorSelect
  const doctorsOptions: SelectOption[] = useMemo(() => {
    return professionals.map((p) => {
      const label =
        p.fullName || `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim() || PROFESSIONAL_FALLBACK_LABEL;
      return {
        id: p.id,
        label,
        subLabel: p.specialtyName || "Odontología General",
      };
    });
  }, [professionals]);

  // Servicio seleccionado actualmente para calcular duración y costo
  const activeService = useMemo(() => {
    return services.find((s) => areGuidsEqual(s.id, selectedServiceId)) || null;
  }, [services, selectedServiceId]);

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedServiceId && !serviceName) {
      setErrorMsg("Por favor seleccione un tratamiento o procedimiento.");
      return;
    }

    if (!selectedDoctorId && !doctorName) {
      setErrorMsg("Por favor seleccione un odontólogo asignado.");
      return;
    }

    if (!fecha) {
      setErrorMsg("Por favor seleccione una fecha válida.");
      return;
    }

    if (!hora) {
      setErrorMsg("Por favor seleccione uno de los horarios disponibles.");
      return;
    }

    const [h, min] = hora.split(":").map(Number);
    const durationMin = activeService?.durationMinutes || 30;
    const startTotalMin = h * 60 + min;
    const endTotalMin = startTotalMin + durationMin;

    const targetPatientId = paciente.patientId || String(paciente.id);
    const targetProfId = selectedDoctorId || professionals[0]?.id || "00000000-0000-0000-0000-000000000000";
    const targetServiceId = selectedServiceId || services[0]?.id || "00000000-0000-0000-0000-000000000000";

    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;
    const startsAt = `${fecha}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
    const endsAt = `${fecha}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00`;

    setIsSubmitting(true);
    try {
      const createdFromApi = await appointmentService.create({
        patientId: targetPatientId,
        professionalId: targetProfId,
        serviceId: targetServiceId,
        startsAt,
        endsAt,
        appointmentStatusId: "10000000-0000-0000-0000-000000000002", // CONFIRMADA
        appointmentOriginId: "20000000-0000-0000-0000-000000000003", // WEB
        reasonForVisit: motivo.trim() || `Cita para ${serviceName || "procedimiento odontológico"}`,
        notes: `Agendada desde ficha de Pacientes. Paciente: ${paciente.nombre} (${paciente.documento}). Odontólogo: ${doctorName}.`,
        autoAssignProfessional: false,
      });

      // Guardar también en caché local nexus_citas
      try {
        const localRaw = localStorage.getItem("nexus_citas");
        const existingList = localRaw ? JSON.parse(localRaw) : [];
        const newLocalItem = {
          id: Date.now(),
          appointmentId: createdFromApi?.id,
          paciente: paciente.nombre,
          pacienteCedula: paciente.documento,
          profesional: doctorName,
          servicio: serviceName || activeService?.name || "Procedimiento Odontológico",
          fecha,
          hora,
          estado: "Confirmada",
          motivo: motivo.trim() || "Agendada desde pacientes",
          patientId: targetPatientId,
          professionalId: targetProfId,
          serviceId: targetServiceId,
        };
        localStorage.setItem("nexus_citas", JSON.stringify([newLocalItem, ...existingList]));
      } catch (cacheErr) {
        console.warn("Could not cache appointment locally:", cacheErr);
      }

      window.dispatchEvent(new CustomEvent("nexus_appointment_changed"));
      refreshNotifications();

      addNotification({
        title: "Nueva Cita Registrada",
        message: `Cita confirmada para ${paciente.nombre} (${serviceName || "Consulta"}) el ${fecha} a las ${hora}.`,
        link: "/agenda",
        type: "appointment_confirmed",
      });

      if (onSuccess) {
        onSuccess(createdFromApi);
      }
      onClose();
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo agendar la cita. Por favor verifica los datos o intenta con otro horario.";
      setErrorMsg(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Agendar Nueva Cita</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Registra una cita directa para el paciente sin salir del módulo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
          {/* TARJETA RESUMEN DEL PACIENTE */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative shadow-sm">
                <UserAvatar name={paciente.nombre} avatar={paciente.fotoUrl} />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    isOnline ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  title={isOnline ? "En línea" : "Desconectado"}
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {paciente.nombre}
                </h4>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} className="text-slate-400" />
                    {paciente.documento}
                  </span>
                  {paciente.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" />
                      {paciente.telefono}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
              Paciente
            </span>
          </div>

          <form id="agendarCitaForm" onSubmit={handleSubmit} className="space-y-4">
            {/* SERVICIO O TRATAMIENTO: Selección libre (placeholder por defecto) */}
            <ModernServiceSelect
              id="pacienteServiceSelect"
              value={selectedServiceId || serviceName}
              onChange={(chosenId, chosenName) => {
                setSelectedServiceId(chosenId);
                setServiceName(chosenName);
                setErrorMsg(null);
              }}
              services={services}
              label="Servicio o Tratamiento"
              placeholder="Seleccione un tratamiento o servicio..."
              required
            />

            {/* ODONTÓLOGO ASIGNADO: Selección libre (placeholder por defecto) */}
            <ModernDoctorSelect
              id="pacienteDoctorSelect"
              value={doctorName}
              onChange={(chosenDoctor, doctorOpt) => {
                setDoctorName(chosenDoctor);
                if (doctorOpt?.id) {
                  setSelectedDoctorId(doctorOpt.id);
                } else {
                  const match = professionals.find(
                    (p) =>
                      areGuidsEqual(p.id, doctorOpt?.id) ||
                      (p.fullName && p.fullName.toLowerCase() === chosenDoctor.toLowerCase())
                  );
                  if (match) setSelectedDoctorId(match.id);
                }
                setErrorMsg(null);
              }}
              doctors={doctorsOptions}
              selectedServiceName={serviceName}
              label="Odontólogo Asignado"
              placeholder="Seleccione un odontólogo..."
              required
            />

            {/* FECHA DE LA CITA */}
            <div>
              <GlassDatePicker
                label="Fecha de la Cita"
                required
                minDate={todayIso}
                value={fecha}
                onChange={(newDate) => {
                  setFecha(newDate);
                  setErrorMsg(null);
                }}
                variant="cyan"
              />
            </div>

            {/* APARTADO DE HORARIOS DISPONIBLES */}
            <AvailableSlotsPicker
              fecha={fecha}
              doctorId={selectedDoctorId}
              doctorName={doctorName}
              durationMinutes={activeService?.durationMinutes || 30}
              value={hora}
              onChange={(val) => {
                setHora(val);
                setErrorMsg(null);
              }}
              appointments={appointments}
              variant="cyan"
            />

            {/* MOTIVO / NOTAS */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Motivo de la consulta o notas clínicas
              </label>
              <textarea
                rows={2}
                placeholder="Escribe el motivo de la cita, síntomas o detalles para el odontólogo..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none outline-none transition-all shadow-sm"
              />
            </div>

            {/* MENSAJE DE ERROR */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="agendarCitaForm"
            disabled={
              isSubmitting ||
              loadingCatalogs ||
              !selectedServiceId ||
              !selectedDoctorId ||
              !hora
            }
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando Cita...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>Confirmar Cita</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
