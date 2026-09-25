import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  User,
  Users,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  Phone,
  Mail,
} from "lucide-react";

import {
  PACIENTES_STORAGE_KEY,
  type Paciente,
} from "../../../types/pacientes";
import { GlassSelect } from "../../../components/common/GlassSelect";
import { GlassDatePicker } from "../../../components/common/GlassDatePicker";
import { personService } from "../../../api/personService";
import { patientService } from "../../../api/patientService";
import {
  ANTECEDENT_TYPE_IDS,
  patientAntecedentService,
} from "../../../api/patientAntecedentService";

const pacienteSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(1, "Los nombres son obligatorios.")
    .max(100, "Los nombres no pueden superar los 100 caracteres."),

  apellidos: z
    .string()
    .trim()
    .min(1, "Los apellidos son obligatorios.")
    .max(100, "Los apellidos no pueden superar los 100 caracteres."),

  tipoDocumento: z.string(),

  numeroDocumento: z
    .string()
    .trim()
    .min(1, "El número de documento es obligatorio.")
    .regex(/^[0-9]{6,10}$/, "El documento debe contener entre 6 y 10 dígitos numéricos."),

  fechaNacimiento: z
    .string()
    .min(1, "La fecha de nacimiento es obligatoria.")
    .refine(
      (fecha) => {
        const fechaIngresada = new Date(`${fecha}T00:00:00`);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return fechaIngresada <= hoy;
      },
      {
        message: "La fecha de nacimiento no puede ser futura.",
      },
    ),

  genero: z.string().min(1, "Debes seleccionar un género."),

  correo: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      {
        message: "Ingresa un correo electrónico válido.",
      },
    ),

  telefono: z
    .string()
    .trim()
    .min(1, "El teléfono celular es obligatorio."),
});

type PacienteFormData = z.infer<typeof pacienteSchema>;

function ToothCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
        checked
          ? "bg-cyan-500/15 dark:bg-cyan-500/25 border-cyan-500/50 text-cyan-950 dark:text-cyan-100 shadow-md scale-[1.01]"
          : "bg-slate-50/80 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/80"
      }`}
    >
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-300 ${
          checked
            ? "bg-gradient-to-br from-teal-400 to-cyan-500 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-110"
            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400"
        }`}
      >
        {checked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-white animate-scaleIn"
          >
            <path d="M17.5 2C15.6 2 14.1 3.2 13 4.5 11.9 3.2 10.4 2 8.5 2 4.9 2 2 4.9 2 8.5c0 3.8 2.2 7.7 4 10.5 1.1 1.7 2.1 3 3.5 3 1.2 0 1.9-.9 2.5-1.9.6 1 1.3 1.9 2.5 1.9 1.4 0 2.4-1.3 3.5-3 1.8-2.8 4-6.7 4-10.5C22 4.9 19.1 2 17.5 2z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 opacity-60"
          >
            <path d="M17.5 2C15.6 2 14.1 3.2 13 4.5 11.9 3.2 10.4 2 8.5 2 4.9 2 2 4.9 2 8.5c0 3.8 2.2 7.7 4 10.5 1.1 1.7 2.1 3 3.5 3 1.2 0 1.9-.9 2.5-1.9.6 1 1.3 1.9 2.5 1.9 1.4 0 2.4-1.3 3.5-3 1.8-2.8 4-6.7 4-10.5C22 4.9 19.1 2 17.5 2z" />
          </svg>
        )}
      </div>

      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

export function PacienteForm() {
  const navigate = useNavigate();
  const [tutorEnabled, setTutorEnabled] = useState(false);
  const [vinculoFamiliar, setVinculoFamiliar] = useState("");
  const [alergico, setAlergico] = useState(false);
  const [alergiaDetalle, setAlergiaDetalle] = useState("");
  const [medicacionCronica, setMedicacionCronica] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    mode: "onChange",
    defaultValues: {
      nombres: "",
      apellidos: "",
      tipoDocumento: "CC",
      numeroDocumento: "",
      fechaNacimiento: "",
      genero: "",
      correo: "",
      telefono: "",
    },
  });

  const watchNombres = useWatch({ control, name: "nombres" });
  const watchApellidos = useWatch({ control, name: "apellidos" });
  const watchFechaNacimiento = useWatch({ control, name: "fechaNacimiento" });

  // Cálculo automático de edad
  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return null;
    const birth = new Date(`${dateStr}T00:00:00`);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const calculatedAge = calculateAge(watchFechaNacimiento);

  // Iniciales para el avatar preview
  const getInitials = () => {
    const n = (watchNombres || "").trim();
    const a = (watchApellidos || "").trim();
    if (n && a) return `${n[0]}${a[0]}`.toUpperCase();
    if (n) return n.substring(0, 2).toUpperCase();
    return "PX";
  };

  const onSubmit = async (data: PacienteFormData) => {
    setSubmitError("");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const pacientesGuardados = localStorage.getItem(PACIENTES_STORAGE_KEY);
    let pacientes: Paciente[] = [];

    if (pacientesGuardados) {
      try {
        const parsed = JSON.parse(pacientesGuardados);
        if (Array.isArray(parsed)) {
          pacientes = parsed;
        }
      } catch {
        pacientes = [];
      }
    }

    const documentoIngresado = data.numeroDocumento.trim();
    const pacienteDuplicado = pacientes.some(
      (paciente) => paciente.documento.trim() === documentoIngresado,
    );

    if (pacienteDuplicado) {
      setSubmitError(
        "Ya existe un paciente registrado con este número de documento.",
      );
      return;
    }

    const nuevoId =
      pacientes.length > 0
        ? Math.max(0, ...pacientes.map((paciente) => (typeof paciente.id === "number" ? paciente.id : parseInt(String(paciente.id), 10) || 0))) + 1
        : 1;

    // El checkbox de alergia se registra como antecedente clínico tipo ALERGIA.
    const descripcionAlergia = alergico
      ? alergiaDetalle.trim() || "Alergia a medicamentos (no especificada)"
      : null;

    const nuevoPaciente: Paciente = {
      id: nuevoId,
      nombre: `${data.nombres} ${data.apellidos}`.trim(),
      documento: documentoIngresado,
      telefono: data.telefono.trim(),
      estado: "Activo",
      alergias: descripcionAlergia ?? undefined,
    };

    const docTypeMap: Record<string, string> = {
      CC: "e0000000-0000-0000-0000-000000000001",
      CE: "e0000000-0000-0000-0000-000000000002",
      TI: "e0000000-0000-0000-0000-000000000003",
      PAS: "e0000000-0000-0000-0000-000000000004",
      PASAPORTE: "e0000000-0000-0000-0000-000000000004",
    };

    const sexMap: Record<string, string> = {
      FEMENINO: "f0000000-0000-0000-0000-000000000001",
      F: "f0000000-0000-0000-0000-000000000001",
      MASCULINO: "f0000000-0000-0000-0000-000000000002",
      M: "f0000000-0000-0000-0000-000000000002",
      OTRO: "f0000000-0000-0000-0000-000000000003",
    };

    const resolvedDocTypeId =
      docTypeMap[data.tipoDocumento?.toUpperCase()] || "e0000000-0000-0000-0000-000000000001";
    const resolvedSexId =
      sexMap[data.genero?.toUpperCase()] || "f0000000-0000-0000-0000-000000000002";

    let createdPersonId: string | null = null;
    try {
      const createdPerson = await personService.create({
        documentTypeId: resolvedDocTypeId,
        documentNumber: documentoIngresado,
        firstName: data.nombres.trim(),
        lastName: data.apellidos.trim(),
        email: data.correo?.trim() || `${documentoIngresado}@paciente.com`,
        phone: data.telefono.trim(),
        dateOfBirth: data.fechaNacimiento,
        sexId: resolvedSexId,
      });
      createdPersonId = createdPerson?.id || null;
    } catch (personErr: any) {
      console.error("Error al registrar persona:", personErr);
      setSubmitError(personErr?.response?.data?.message || "No se pudo registrar los datos personales en el servidor.");
      return;
    }

    if (createdPersonId) {
      let createdPatientId: string | null = null;
      try {
        const createdPatient = await patientService.create({
          personId: createdPersonId,
          emergencyContactName: tutorEnabled ? "Tutor Legal" : undefined,
          emergencyContactPhone: tutorEnabled ? data.telefono.trim() : undefined,
        });
        createdPatientId = createdPatient?.id || null;
      } catch (patientErr: any) {
        console.error("Error al vincular registro clínico de paciente:", patientErr);
        setSubmitError("Persona registrada, pero falló la vinculación del registro clínico de paciente.");
        return;
      }

      if (descripcionAlergia && createdPatientId) {
        try {
          await patientAntecedentService.create({
            patientId: createdPatientId,
            antecedentTypeId: ANTECEDENT_TYPE_IDS.ALERGIA,
            description: descripcionAlergia,
          });
        } catch (antecedentErr: any) {
          console.error("Error al registrar el antecedente de alergia:", antecedentErr);
          setSubmitError(
            antecedentErr?.response?.status === 403
              ? "Paciente creado, pero tu rol no tiene permiso para registrar antecedentes clínicos. Avisa a un administrador."
              : "Paciente creado, pero no se pudo registrar la alergia en su historia clínica.",
          );
          return;
        }
      }
    }

    const pacientesActualizados = [nuevoPaciente, ...pacientes];
    localStorage.setItem(
      PACIENTES_STORAGE_KEY,
      JSON.stringify(pacientesActualizados),
    );

    setTutorEnabled(false);
    setAlergico(false);
    setAlergiaDetalle("");
    navigate("/pacientes");
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {submitError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-3 backdrop-blur-md shadow-md animate-fadeIn">
          <AlertCircle size={20} className="text-rose-500 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* ESTRUCTURA COMPACTA DE 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA (7 COLS): INFORMACIÓN PERSONAL */}
        <div className="lg:col-span-7 space-y-6">
          <section className="rounded-3xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5 animate-slideUp animate-stagger-1">
            {/* AVATAR PREVIEW + TITULO */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 text-cyan-700 dark:text-cyan-300 font-black text-base border border-cyan-500/40 shadow-sm">
                  {getInitials()}
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Información Personal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Expediente e identificación oficial
                  </p>
                </div>
              </div>

              {calculatedAge !== null && (
                <span className="px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 shadow-sm">
                  <Calendar size={13} />
                  {calculatedAge} años
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombres */}
              <div className="space-y-1.5">
                <label htmlFor="nombres" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nombres *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="nombres"
                    type="text"
                    {...register("nombres")}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm"
                  />
                </div>
                {errors.nombres && (
                  <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block pt-0.5">
                    {errors.nombres.message}
                  </span>
                )}
              </div>

              {/* Apellidos */}
              <div className="space-y-1.5">
                <label htmlFor="apellidos" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Apellidos *
                </label>
                <input
                  id="apellidos"
                  type="text"
                  {...register("apellidos")}
                  className="w-full px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm"
                />
                {errors.apellidos && (
                  <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block pt-0.5">
                    {errors.apellidos.message}
                  </span>
                )}
              </div>

              {/* Tipo + Número Documento */}
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="numeroDocumento" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Documento de Identidad *
                </label>
                <div className="flex gap-2">
                  <GlassSelect
                    value={watch("tipoDocumento") || "CC"}
                    onChange={(val) => setValue("tipoDocumento", val, { shouldValidate: true })}
                    options={[
                      { value: "CC", label: "CC" },
                      { value: "TI", label: "TI" },
                      { value: "CE", label: "CE" },
                      { value: "PAS", label: "Pasaporte" },
                    ]}
                    variant="form"
                    containerClassName="w-28 shrink-0"
                  />

                  <div className="relative flex-1">
                    <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="numeroDocumento"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Ej: 1076543210"
                      {...register("numeroDocumento", {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        },
                      })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-sm font-mono text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm"
                    />
                  </div>
                </div>
                {errors.numeroDocumento && (
                  <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block pt-0.5">
                    {errors.numeroDocumento.message}
                  </span>
                )}
              </div>

              {/* Fecha Nacimiento */}
              <div className="space-y-1.5">
                <label htmlFor="fechaNacimiento" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Fecha de nacimiento *
                </label>
                <GlassDatePicker
                  value={watch("fechaNacimiento") || ""}
                  onChange={(val) => setValue("fechaNacimiento", val, { shouldValidate: true })}
                  placeholder="dd/mm/aaaa"
                  variant="form"
                  maxDate={new Date().toISOString().split("T")[0]}
                  yearRange={{ start: 1920, end: new Date().getFullYear() }}
                  className="w-full"
                />
                {errors.fechaNacimiento && (
                  <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block pt-0.5">
                    {errors.fechaNacimiento.message}
                  </span>
                )}
              </div>

              {/* Género */}
              <div className="space-y-1.5">
                <label htmlFor="genero" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Género *
                </label>
                <GlassSelect
                  value={watch("genero") || ""}
                  onChange={(val) => setValue("genero", val, { shouldValidate: true })}
                  placeholder="Seleccione género..."
                  variant="form"
                  fullWidth
                  options={[
                    { value: "femenino", label: "Femenino" },
                    { value: "masculino", label: "Masculino" },
                    { value: "otro", label: "Otro" },
                  ]}
                />
                {errors.genero && (
                  <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block pt-0.5">
                    {errors.genero.message}
                  </span>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label htmlFor="telefono" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Teléfono celular *
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="telefono"
                    type="tel"
                    {...register("telefono")}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm"
                  />
                </div>
                {errors.telefono && (
                  <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block pt-0.5">
                    {errors.telefono.message}
                  </span>
                )}
              </div>

              {/* Correo */}
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="correo" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="correo"
                    type="email"
                    {...register("correo")}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-cyan-500/30 transition-all shadow-sm"
                  />
                </div>
                {errors.correo && (
                  <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 block pt-0.5">
                    {errors.correo.message}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA (5 COLS): TUTOR LEGAL + ANTECEDENTES + BOTONES DE ACCIÓN */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECCIÓN TUTOR LEGAL */}
          <section className="rounded-3xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 p-6 backdrop-blur-xl shadow-xl space-y-4 animate-slideUp animate-stagger-2">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                  <Users size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tutor / Responsable
                </h3>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 px-2.5 py-1 rounded-xl shadow-sm">
                <input
                  type="checkbox"
                  checked={tutorEnabled}
                  onChange={(event) => setTutorEnabled(event.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Habilitar</span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="tutor" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Nombre del tutor
                </label>
                <input
                  id="tutor"
                  type="text"
                  disabled={!tutorEnabled}
                  className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="vinculo" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Vínculo familiar
                </label>
                <GlassSelect
                  value={vinculoFamiliar}
                  onChange={(val) => setVinculoFamiliar(val)}
                  placeholder="Seleccione vínculo..."
                  variant="form"
                  fullWidth
                  disabled={!tutorEnabled}
                  options={[
                    { value: "madre", label: "Madre" },
                    { value: "padre", label: "Padre" },
                    { value: "acudiente", label: "Acudiente / Apoderado" },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN ANTECEDENTES */}
          <section className="rounded-3xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 p-6 backdrop-blur-xl shadow-xl space-y-4 animate-slideUp animate-stagger-3">
            <div className="flex items-center gap-2.5 border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <FileCheck size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Antecedentes Clínicos
              </h3>
            </div>

            <div className="space-y-2.5">
              <ToothCheckbox
                checked={alergico}
                onChange={setAlergico}
                label="¿Es alérgico a algún medicamento?"
              />

              {alergico && (
                <div className="space-y-1 pl-1">
                  <label htmlFor="alergiaDetalle" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    ¿A cuál medicamento?
                  </label>
                  <input
                    id="alergiaDetalle"
                    type="text"
                    value={alergiaDetalle}
                    onChange={(e) => setAlergiaDetalle(e.target.value)}
                    placeholder="Ej: Penicilina, Ibuprofeno"
                    className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all shadow-sm"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Si lo dejas vacío se registra como alergia sin especificar.
                  </p>
                </div>
              )}

              <ToothCheckbox
                checked={medicacionCronica}
                onChange={setMedicacionCronica}
                label="¿Toma medicación de forma crónica?"
              />

              <div className="space-y-1 pt-1">
                <label htmlFor="observaciones" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Observaciones preliminares
                </label>
                <textarea
                  id="observaciones"
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none transition-all shadow-sm"
                />
              </div>
            </div>
          </section>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex items-center justify-end gap-3 pt-1 animate-slideUp animate-stagger-4">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
              onClick={() => navigate("/pacientes")}
              disabled={isSubmitting}
            >
              <XCircle size={15} />
              <span>Cancelar</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white dark:text-slate-950 font-bold text-xs shadow-lg dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? "Procesando..." : "Guardar Expediente"}</span>
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}