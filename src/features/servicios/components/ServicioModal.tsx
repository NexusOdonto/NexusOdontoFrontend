import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Servicio } from "../../../types/servicios";
import { formatCurrency } from "../../../utils/currency";
import { GlassSelect } from "../../../components/common/GlassSelect";
import {
  X,
  Clock,
  DollarSign,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Scissors,
  Smile,
  Activity,
  Stethoscope,
  Plus,
  Minus,
  CheckCircle2,
} from "lucide-react";

export const CATEGORIAS_ODONTOLOGICAS = [
  "Higiene y Prevención",
  "Operatoria / Resinas",
  "Cirugía Oral",
  "Endodoncia",
  "Estética Dental",
  "Ortodoncia",
  "Odontopediatría",
  "Odontología General",
];

const PRESETS_DURACION = [15, 30, 45, 60, 90, 120];

interface ServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (servicio: Omit<Servicio, "id"> & { id?: number | string }) => Promise<void> | void;
  servicioInicial?: Servicio | null;
}

function getCategoryIcon(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes("estética")) {
    return {
      Icon: Sparkles,
      color: "text-purple-300",
      bg: "bg-purple-500/20 border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]",
    };
  }
  if (c.includes("operatoria") || c.includes("resina")) {
    return {
      Icon: ShieldCheck,
      color: "text-sky-300",
      bg: "bg-sky-500/20 border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.3)]",
    };
  }
  if (c.includes("cirugía")) {
    return {
      Icon: Scissors,
      color: "text-amber-300",
      bg: "bg-amber-500/20 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    };
  }
  if (c.includes("higiene") || c.includes("prevención")) {
    return {
      Icon: Smile,
      color: "text-teal-300",
      bg: "bg-teal-500/20 border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.3)]",
    };
  }
  if (c.includes("endodoncia")) {
    return {
      Icon: Activity,
      color: "text-rose-300",
      bg: "bg-rose-500/20 border-rose-400/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    };
  }
  return {
    Icon: Stethoscope,
    color: "text-cyan-300",
    bg: "bg-cyan-500/20 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
  };
}

export function ServicioModal({
  isOpen,
  onClose,
  onSave,
  servicioInicial,
}: ServicioModalProps) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_ODONTOLOGICAS[0]);
  const [duracion, setDuracion] = useState(45);
  const [precio, setPrecio] = useState(60000);
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (servicioInicial) {
      setNombre(servicioInicial.nombre);
      setCategoria(servicioInicial.categoria || CATEGORIAS_ODONTOLOGICAS[0]);
      setDuracion(servicioInicial.duracion || 45);
      setPrecio(servicioInicial.precio || 50000);
      setDescripcion(servicioInicial.descripcion || "");
      setActivo(servicioInicial.activo ?? true);
    } else {
      setNombre("");
      setCategoria(CATEGORIAS_ODONTOLOGICAS[0]);
      setDuracion(45);
      setPrecio(60000);
      setDescripcion("");
      setActivo(true);
    }
    setError(null);
  }, [servicioInicial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre del procedimiento es requerido.");
      return;
    }
    if (!descripcion.trim()) {
      setError("Por favor ingresa una descripción clínica del servicio.");
      return;
    }
    if (duracion <= 0) {
      setError("La duración debe ser mayor a 0 minutos.");
      return;
    }
    if (precio <= 0) {
      setError("El precio debe ser mayor a 0.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        ...(servicioInicial?.id ? { id: servicioInicial.id } : {}),
        nombre: nombre.trim(),
        categoria,
        duracion,
        precio,
        descripcion: descripcion.trim(),
        activo,
        ...(servicioInicial?.codigo ? { codigo: servicioInicial.codigo } : {}),
      });
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          "Ocurrió un error al guardar el servicio."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = Boolean(servicioInicial?.id);
  const { Icon: CategoryIcon, color: catColor, bg: catBg } = getCategoryIcon(categoria);

  const cambiarDuracion = (delta: number) => {
    setDuracion((prev) => Math.max(5, prev + delta));
  };

  const cambiarPrecio = (delta: number) => {
    setPrecio((prev) => Math.max(1000, prev + delta));
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg mx-2 my-auto rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden backdrop-blur-3xl animate-scaleIn flex flex-col max-h-[min(92dvh,100%)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal con Icono reactivo a la especialidad */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-2xl border flex items-center justify-center transition-all duration-300 ${catBg}`}
            >
              <CategoryIcon size={22} className={catColor} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {isEditing ? "Editar Procedimiento Clínico" : "Nuevo Procedimiento Odontológico"}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {isEditing
                  ? `Modificando arancel clínico: ${servicioInicial?.codigo || "SRV"}`
                  : "Registra un nuevo tratamiento en el catálogo oficial de la clínica"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs shadow-sm">
              <AlertCircle size={17} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre y Especialidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Nombre del Procedimiento *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Profilaxis y Detartraje"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Especialidad Odontológica *
              </label>
              <GlassSelect
                value={categoria}
                onChange={(val) => setCategoria(val)}
                placeholder="Seleccione especialidad..."
                variant="form"
                fullWidth
                options={CATEGORIAS_ODONTOLOGICAS.map((cat) => ({
                  value: cat,
                  label: cat,
                }))}
              />
            </div>
          </div>

          {/* Duración con Selector Unificado */}
          <div className="p-4.5 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-cyan-600 dark:text-cyan-400" />
                Duración del Sillón Dental
              </label>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-mono font-black text-xs">
                <span>{duracion} minutos</span>
              </div>
            </div>

            {/* Presets rápidos */}
            <div className="grid grid-cols-6 gap-2">
              {PRESETS_DURACION.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDuracion(min)}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                    duracion === min
                      ? "bg-cyan-600 text-white border-cyan-600 dark:bg-cyan-500/30 dark:border-cyan-400 dark:text-cyan-100 shadow-sm"
                      : "bg-white dark:bg-slate-950/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  {min}m
                </button>
              ))}
            </div>

            {/* Ajuste fino +/- */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px]">Ajuste fino de tiempo:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cambiarDuracion(-5)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Restar 5 min"
                >
                  <Minus size={12} />
                  <span>5m</span>
                </button>
                <button
                  type="button"
                  onClick={() => cambiarDuracion(5)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Sumar 5 min"
                >
                  <Plus size={12} />
                  <span>5m</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tarifa y Estado Operativo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Tarifa */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-teal-600 dark:text-emerald-400" />
                Tarifa Oficial (COP) *
              </label>

              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono font-black text-xs text-teal-700 dark:text-emerald-400 select-none">
                  $ COP
                </span>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                  placeholder="80000"
                  className="w-full pl-18 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white font-mono font-black text-base outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              {/* Botones de incremento rápido */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => cambiarPrecio(10000)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-[10px] font-mono cursor-pointer transition-colors"
                >
                  + $10k
                </button>
                <button
                  type="button"
                  onClick={() => cambiarPrecio(50000)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-[10px] font-mono cursor-pointer transition-colors"
                >
                  + $50k
                </button>
                <span className="text-[11px] font-mono font-bold text-teal-700 dark:text-emerald-400 ml-auto">
                  {formatCurrency(precio || 0)}
                </span>
              </div>
            </div>

            {/* Estado Operativo */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Disponibilidad Clínica
              </label>

              <button
                type="button"
                onClick={() => setActivo(!activo)}
                className={`w-full py-3 px-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  activo
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                    : "bg-slate-100 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {activo ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                  )}
                  <span className="font-black tracking-wide">
                    {activo ? "Servicio Activo en Agenda" : "Servicio Inactivo / Oculto"}
                  </span>
                </div>

                <span
                  className={`h-6 w-6 rounded-full flex items-center justify-center transition-transform ${
                    activo ? "bg-emerald-500 text-white dark:text-slate-950 shadow-sm" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <CheckCircle2 size={15} strokeWidth={2.5} />
                </span>
              </button>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {activo ? "Visible para cotizaciones y citas" : "No disponible para agendamiento"}
              </p>
            </div>
          </div>

          {/* Descripción clínica */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Detalle Clínico e Indicaciones *
            </label>
            <textarea
              rows={3}
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle clínico del procedimiento, materiales empleados o indicaciones para el paciente..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none transition-all leading-relaxed"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-6 py-3 text-xs font-black text-white dark:text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5"
            >
              {submitting
                ? "Guardando..."
                : isEditing
                ? "Actualizar Procedimiento"
                : "Crear Procedimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
