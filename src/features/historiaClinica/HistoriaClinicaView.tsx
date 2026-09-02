import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  User,
  AlertTriangle,
  HeartPulse,
  Smile,
  Plus,
  X,
  Stethoscope,
  Calendar,
  CheckCircle2,
  Search,
} from "lucide-react";

interface AtencionClinica {
  id: string;
  fecha: string;
  doctor: string;
  motivo: string;
  enfermedadActual: string;
  examenFisico: string;
  diagnosticoCie10: string;
  planTratamiento: string;
  observaciones: string;
}

interface PacienteHistoria {
  id: string;
  nombre: string;
  cedula: string;
  edad: number;
  tipoSangre: string;
  alergias: string[];
  enfermedadesSistemicas: string[];
  medicamentos: string[];
  antecedentesOdontologicos: string;
  atenciones: AtencionClinica[];
}

const pacientesHistoriasFallback: PacienteHistoria[] = [
  {
    id: "pac-1",
    nombre: "Andrés Pérez",
    cedula: "1076543210",
    edad: 28,
    tipoSangre: "O+",
    alergias: ["Penicilina", "AINEs"],
    enfermedadesSistemicas: ["Ninguna"],
    medicamentos: ["Ninguno actualmente"],
    antecedentesOdontologicos: "Ortodoncia previa hace 3 años. Sensibilidad en molares inferiores.",
    atenciones: [
      {
        id: "at-1",
        fecha: "2026-08-30",
        doctor: "Dra. Laura Gómez",
        motivo: "Revisión general y dolor en pieza #16",
        enfermedadActual: "Paciente refiere dolor punzante al consumir bebidas frías o dulces en cuadrante superior derecho.",
        examenFisico: "Caries oclusal profunda en pieza #16. Encías con leve gingivitis marginal generalizada.",
        diagnosticoCie10: "K02.1 - Caries de la dentina",
        planTratamiento: "Obturación en resina compuesta fotocurada pieza #16 y profilaxis con ultrasonido.",
        observaciones: "Excelente tolerancia al procedimiento. Se cita a control en 6 meses.",
      },
      {
        id: "at-2",
        fecha: "2026-02-14",
        doctor: "Dr. Juan Martínez",
        motivo: "Valoración de cordales retenidas",
        enfermedadActual: "Molestia y presión en zona retromolar inferior izquierda.",
        examenFisico: "Pieza #38 en erupción parcial con pericoronaritis leve.",
        diagnosticoCie10: "K07.3 - Anomalías de la posición de los dientes (Cordal incluida)",
        planTratamiento: "Lavado antiséptico y programación para exodoncia quirúrgica.",
        observaciones: "Se prescribe colutorio con clorhexidina al 0.12%.",
      },
    ],
  },
  {
    id: "pac-2",
    nombre: "María Fernanda López",
    cedula: "1087654321",
    edad: 34,
    tipoSangre: "A+",
    alergias: ["Ninguna conocida"],
    enfermedadesSistemicas: ["Hipotiroidismo controlado"],
    medicamentos: ["Levotiroxina 50mcg"],
    antecedentesOdontologicos: "Bruxismo nocturno moderado. Placa miorrelajante.",
    atenciones: [
      {
        id: "at-3",
        fecha: "2026-07-20",
        doctor: "Dra. Laura Gómez",
        motivo: "Desgaste en bordes incisales y dolor matutino en ATM",
        enfermedadActual: "Sensación de fatiga muscular en maseteros al despertar.",
        examenFisico: "Facetas de desgaste en incisivos superiores e inferiores. Apertura bucal conservada.",
        diagnosticoCie10: "F45.8 - Bruxismo / Trastorno de ATM",
        planTratamiento: "Ajuste oclusal y confección de nueva placa neuromuscular.",
        observaciones: "Se orienta sobre higiene del sueño y fisioterapia mandibular.",
      },
    ],
  },
  {
    id: "pac-3",
    nombre: "Carlos Andrés Pérez",
    cedula: "1098761234",
    edad: 25,
    tipoSangre: "O+",
    alergias: ["Polen"],
    enfermedadesSistemicas: ["Ninguna"],
    medicamentos: ["Antihistamínicos ocasionales"],
    antecedentesOdontologicos: "Higiene regular, cálculo supragingival en anteriores inferiores.",
    atenciones: [],
  },
];

export function HistoriaClinicaView() {
  const [pacientes] = useState<PacienteHistoria[]>(pacientesHistoriasFallback);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>(pacientesHistoriasFallback[0].id);
  const [searchPac, setSearchPac] = useState("");
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form nueva evolución clínica
  const [formMotivo, setFormMotivo] = useState("");
  const [formEnfermedad, setFormEnfermedad] = useState("");
  const [formExamen, setFormExamen] = useState("");
  const [formDiagnostico, setFormDiagnostico] = useState("");
  const [formPlan, setFormPlan] = useState("");
  const [formObservaciones, setFormObservaciones] = useState("");
  const [formDoctor, setFormDoctor] = useState("Dra. Laura Gómez");

  const pacienteSeleccionado = pacientes.find((p) => p.id === selectedPacienteId) || pacientes[0];

  const handleCreateEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMotivo.trim() || !formDiagnostico.trim()) return;

    const nuevaAtencion: AtencionClinica = {
      id: `at-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      doctor: formDoctor,
      motivo: formMotivo.trim(),
      enfermedadActual: formEnfermedad.trim() || "Paciente asiste a consulta de seguimiento.",
      examenFisico: formExamen.trim() || "Examen intraoral dentro de límites normales.",
      diagnosticoCie10: formDiagnostico.trim(),
      planTratamiento: formPlan.trim() || "Tratamiento ejecutado satisfactoriamente.",
      observaciones: formObservaciones.trim() || "Evolución clínica favorable.",
    };

    pacienteSeleccionado.atenciones.unshift(nuevaAtencion);

    setShowEvolutionModal(false);
    setFormMotivo("");
    setFormEnfermedad("");
    setFormExamen("");
    setFormDiagnostico("");
    setFormPlan("");
    setFormObservaciones("");
    setSuccessToast("¡Nota de evolución clínica registrada con éxito!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const filteredPacientesList = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchPac.toLowerCase()) ||
      p.cedula.includes(searchPac)
  );

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-scaleIn">
          <CheckCircle2 size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Encabezado Principal estilo Pacientes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Historia Clínica Odontológica
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Registro médico-odontológico, antecedentes, diagnósticos CIE-10 y evolución clínica.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            to="/odontograma"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold text-xs transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
          >
            <Smile size={16} />
            <span>Abrir Odontograma</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowEvolutionModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Nueva Nota de Evolución</span>
          </button>
        </div>
      </div>

      {/* Selector de Paciente */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 animate-slideUp animate-stagger-1">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar paciente por cédula o nombre..."
            value={searchPac}
            onChange={(e) => setSearchPac(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 backdrop-blur-xl shadow-md"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filteredPacientesList.map((p) => {
            const isSelected = p.id === pacienteSeleccionado.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPacienteId(p.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer backdrop-blur-xl ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border border-cyan-500/50 shadow-md scale-[1.02]"
                    : "bg-white/80 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 shadow-sm"
                }`}
              >
                <User size={13} className="inline mr-1.5 text-cyan-500" />
                <span>{p.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Contenido: Antecedentes (Izquierda) + Línea de Tiempo de Evolución (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 animate-slideUp animate-stagger-2">
        {/* Panel Izquierdo: Ficha del Paciente y Antecedentes */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-800 dark:text-cyan-200 font-extrabold shadow-sm">
                <User size={22} className="text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {pacienteSeleccionado.nombre}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  CC: {pacienteSeleccionado.cedula} • {pacienteSeleccionado.edad} años
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tipo de Sangre & Factor Rh
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-bold font-mono">
                  {pacienteSeleccionado.tipoSangre}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <AlertTriangle size={13} className="text-amber-500" />
                  <span>Alergias Conocidas</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pacienteSeleccionado.alergias.map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <HeartPulse size={13} className="text-cyan-500" />
                  <span>Enfermedades Sistémicas</span>
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {pacienteSeleccionado.enfermedadesSistemicas.join(", ")}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Medicamentos de Uso Frecuente
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {pacienteSeleccionado.medicamentos.join(", ")}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Antecedentes Odontológicos Relevantes
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pacienteSeleccionado.antecedentesOdontologicos}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Evoluciones Clínicas (Timeline) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/15">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-cyan-500" />
                <span>Evoluciones Clínicas Registradas ({pacienteSeleccionado.atenciones.length})</span>
              </h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Orden cronológico descendente
              </span>
            </div>

            {pacienteSeleccionado.atenciones.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                No hay atenciones clínicas registradas aún para este paciente.
              </div>
            ) : (
              <div className="space-y-4">
                {pacienteSeleccionado.atenciones.map((atencion) => (
                  <div
                    key={atencion.id}
                    className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                          <Calendar size={13} />
                          {atencion.fecha}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Stethoscope size={13} className="text-teal-500" />
                          {atencion.doctor}
                        </span>
                      </div>

                      <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                        {atencion.diagnosticoCie10}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">
                          Motivo de Consulta:
                        </strong>
                        <p className="text-slate-600 dark:text-slate-400">{atencion.motivo}</p>
                      </div>

                      <div>
                        <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">
                          Enfermedad Actual:
                        </strong>
                        <p className="text-slate-600 dark:text-slate-400">{atencion.enfermedadActual}</p>
                      </div>

                      <div>
                        <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">
                          Examen Físico / Estomatológico:
                        </strong>
                        <p className="text-slate-600 dark:text-slate-400">{atencion.examenFisico}</p>
                      </div>

                      <div>
                        <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">
                          Plan de Tratamiento y Procedimientos:
                        </strong>
                        <p className="text-slate-600 dark:text-slate-400">{atencion.planTratamiento}</p>
                      </div>
                    </div>

                    {atencion.observaciones && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                        <strong className="text-slate-700 dark:text-slate-300">Observaciones:</strong>{" "}
                        {atencion.observaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NUEVA EVOLUCIÓN CLÍNICA */}
      {showEvolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Registrar Atención Clínica
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paciente: <strong className="text-teal-600 dark:text-teal-300">{pacienteSeleccionado.nombre}</strong> (CC: {pacienteSeleccionado.cedula})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEvolutionModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvolution} className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Odontólogo Tratante *
                </label>
                <select
                  value={formDoctor}
                  onChange={(e) => setFormDoctor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                >
                  <option value="Dra. Laura Gómez">Dra. Laura Gómez (Ortodoncia)</option>
                  <option value="Dr. Juan Martínez">Dr. Juan Martínez (Cirugía Oral)</option>
                  <option value="Dra. Patricia Silva">Dra. Patricia Silva (Endodoncia)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de la Consulta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Control de ortodoncia y cambio de arcos"
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Diagnóstico (Código CIE-10) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. K02.1 - Caries de la dentina / K07.4 - Maloclusión tipo II"
                  value={formDiagnostico}
                  onChange={(e) => setFormDiagnostico(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Examen Estomatológico / Hallazgos
                </label>
                <textarea
                  rows={2}
                  placeholder="Descripción de tejidos blandos, periodonto y piezas afectadas..."
                  value={formExamen}
                  onChange={(e) => setFormExamen(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Procedimientos Realizados & Plan
                </label>
                <textarea
                  rows={2}
                  placeholder="Procedimiento ejecutado en la sesión, materiales utilizados..."
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEvolutionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white dark:text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  Guardar Evolución Clínica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default HistoriaClinicaView;
