import { useState, useEffect, useCallback, useMemo } from "react";
import { ServiciosGrid } from "./components/ServiciosGrid";
import { ServiciosTable } from "./components/ServiciosTable";
import { ServicioModal } from "./components/ServicioModal";
import type { Servicio } from "../../types/servicios";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { formatCurrency } from "../../utils/currency";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { GlassSelect } from "../../components/common/GlassSelect";
import {
  Plus,
  Filter,
  Search,
  Layers,
  CheckCircle2,
  Clock,
  DollarSign,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  Stethoscope,
} from "lucide-react";
import type { ServiceResponseDto } from "../../api/serviceCatalogService";

const CATEGORIAS_FILTRO = [
  { id: "todas", label: "Todos los servicios" },
  { id: "Higiene y Prevención", label: "Higiene y Prevención" },
  { id: "Operatoria / Resinas", label: "Operatoria / Resinas" },
  { id: "Cirugía Oral", label: "Cirugía Oral" },
  { id: "Endodoncia", label: "Endodoncia" },
  { id: "Estética Dental", label: "Estética Dental" },
  { id: "Ortodoncia", label: "Ortodoncia" },
];

/** Traducciones solo para los 4 seeds en inglés del backend; el resto se muestra tal cual. */
const SEED_TRANSLATIONS: Record<string, { name: string; description: string; category: string }> = {
  "general assessment": {
    name: "Valoración General Odontológica",
    description:
      "Evaluación clínica integral, diagnóstico odontológico y formulación de plan de tratamiento personalizado.",
    category: "Higiene y Prevención",
  },
  "dental prophylaxis": {
    name: "Profilaxis y Limpieza Dental",
    description:
      "Eliminación de placa bacteriana, remoción de cálculo supragingival con ultrasonido y pulido coronario.",
    category: "Higiene y Prevención",
  },
  "composite resin filling": {
    name: "Restauración en Resina Compuesta",
    description:
      "Reconstrucción estética y funcional de piezas dentales afectadas por caries con resina fotocurable.",
    category: "Operatoria / Resinas",
  },
  "teeth whitening": {
    name: "Blanqueamiento Dental Clínico",
    description:
      "Aclaramiento dental profesional en consultorio con fotoactivación y gel de peróxido de alta pureza.",
    category: "Estética Dental",
  },
};

function mapApiService(item: ServiceResponseDto): Servicio {
  const seed = SEED_TRANSLATIONS[(item.name || "").trim().toLowerCase()];
  return {
    id: item.id,
    codigo: item.code || undefined,
    nombre: seed?.name ?? item.name ?? "Servicio Odontológico",
    categoria: item.category?.trim() || seed?.category || "Odontología General",
    descripcion: seed?.description ?? item.description ?? "",
    duracion: item.durationMinutes || 45,
    precio: item.price ?? 0,
    activo: item.isActive ?? true,
  };
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string; title?: string } }; message?: string };
  return e?.response?.data?.message || e?.response?.data?.title || e?.message || fallback;
}

export function ServiciosView() {
  const { user } = useAuth();
  const rawRole = getUserRole(user);
  const userRoleStr = String((user as any)?.rol || (user as any)?.role || "").toUpperCase();

  const isOdontologo = rawRole === "ODONTOLOGO" || userRoleStr.includes("ODONTO") || userRoleStr.includes("DOCTOR") || userRoleStr.includes("DENTIST");
  const isRecepcionista = rawRole === "RECEPCIONISTA" || userRoleStr.includes("RECEPCION");
  const isPaciente = rawRole === "PACIENTE" || userRoleStr.includes("PACIENTE");
  const isAdmin = (rawRole === "ADMINISTRADOR" || (user?.email && user.email.toLowerCase().includes("admin"))) && !isOdontologo && !isRecepcionista && !isPaciente;

  // Solo los administradores pueden crear, editar o eliminar servicios del catálogo
  const canCreateServices = isAdmin;
  const canEditServices = isAdmin;
  const canDeleteServices = isAdmin;

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [precioMaximo, setPrecioMaximo] = useState("");
  const [duracionMaxima, setDuracionMaxima] = useState("");
  const [estado, setEstado] = useState<"todos" | "activo" | "inactivo">("activo");
  const [orden, setOrden] = useState<"nombre" | "precio-asc" | "precio-desc" | "duracion">("nombre");

  // Vistas y Modales
  const [vista, setVista] = useState<"grid" | "table">("grid");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioAEditar, setServicioAEditar] = useState<Servicio | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error") => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true);
      setErrorCarga(null);
      const data = await serviceCatalogService.getAll();
      const mapped: Servicio[] = Array.isArray(data) ? data.map(mapApiService) : [];
      setServicios(mapped);
      try {
        localStorage.setItem("nexus_servicios_catalog", JSON.stringify(mapped));
      } catch {
        // ignore
      }
    } catch (err: unknown) {
      console.error("Error al cargar catálogo de servicios desde API:", err);
      setErrorCarga("No se pudo cargar el catálogo de servicios desde el servidor.");
      setServicios([]);
      try {
        localStorage.removeItem("nexus_servicios_catalog");
      } catch {
        // ignore
      }
    } finally {
      setTimeout(() => setLoading(false), 450);
    }
  }, []);

  useEffect(() => {
    // Limpieza preventiva de datos mock legacy guardados en localStorage
    try {
      const raw = localStorage.getItem("nexus_servicios_catalog");
      if (raw && (raw.includes("14000000-0000-0000") || raw.includes("srv-local-"))) {
        localStorage.removeItem("nexus_servicios_catalog");
      }
    } catch {
      // ignore
    }
    fetchServicios();
  }, [fetchServicios]);

  const handleGuardarServicio = async (
    servicioData: Omit<Servicio, "id"> & { id?: number | string }
  ) => {
    try {
      if (servicioData.id) {
        await serviceCatalogService.update(String(servicioData.id), {
          code: servicioData.codigo,
          name: servicioData.nombre,
          description: servicioData.descripcion,
          durationMinutes: servicioData.duracion,
          price: servicioData.precio,
          category: servicioData.categoria,
          isActive: servicioData.activo,
        });
        showToast("Servicio actualizado correctamente.", "success");
      } else {
        await serviceCatalogService.create({
          code: servicioData.codigo,
          name: servicioData.nombre,
          description: servicioData.descripcion,
          durationMinutes: servicioData.duracion,
          price: servicioData.precio,
          category: servicioData.categoria || "Odontología General",
          isActive: servicioData.activo,
          sortOrder: servicios.length + 1,
        });
        showToast("Servicio creado correctamente.", "success");
      }
      await fetchServicios();
    } catch (err: unknown) {
      console.error("Error guardando servicio en API:", err);
      showToast(apiErrorMessage(err, "No se pudo guardar el servicio en el servidor."), "error");
      throw err;
    }
  };

  const handleToggleActivo = async (servicio: Servicio) => {
    const nuevoEstado = !servicio.activo;
    try {
      await serviceCatalogService.update(String(servicio.id), {
        code: servicio.codigo,
        name: servicio.nombre,
        description: servicio.descripcion,
        durationMinutes: servicio.duracion,
        price: servicio.precio,
        category: servicio.categoria,
        isActive: nuevoEstado,
      });
      await fetchServicios();
      showToast(
        nuevoEstado ? "Servicio activado." : "Servicio desactivado.",
        "success"
      );
    } catch (err: unknown) {
      showToast(apiErrorMessage(err, "No se pudo actualizar el estado del servicio."), "error");
    }
  };

  const handleEliminar = async (id: number | string) => {
    try {
      await serviceCatalogService.delete(String(id));
      await fetchServicios();
      showToast("Servicio eliminado.", "success");
    } catch (err: unknown) {
      showToast(apiErrorMessage(err, "No se pudo eliminar el servicio."), "error");
    }
  };

  // Abrir modal para crear
  const handleAbrirCrear = () => {
    setServicioAEditar(null);
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const handleAbrirEditar = (servicio: Servicio) => {
    setServicioAEditar(servicio);
    setModalAbierto(true);
  };

  // Filtrado y Ordenamiento
  const serviciosProcesados = useMemo(() => {
    const filtrados = servicios.filter((servicio) => {
      const q = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        !q ||
        servicio.nombre.toLowerCase().includes(q) ||
        servicio.descripcion.toLowerCase().includes(q) ||
        (servicio.codigo && servicio.codigo.toLowerCase().includes(q));

      const coincidePrecio =
        precioMaximo === "" || servicio.precio <= Number(precioMaximo);

      const coincideDuracion =
        duracionMaxima === "" || servicio.duracion <= Number(duracionMaxima);

      const coincideEstado =
        estado === "todos" ||
        (estado === "activo" && servicio.activo) ||
        (estado === "inactivo" && !servicio.activo);

      const coincideCategoria = () => {
        if (categoriaSeleccionada === "todas") return true;
        if (servicio.categoria === categoriaSeleccionada) return true;
        const n = servicio.nombre.toLowerCase();
        if (categoriaSeleccionada === "Estética Dental") return n.includes("blanqueamiento");
        if (categoriaSeleccionada === "Operatoria / Resinas")
          return n.includes("resina") || n.includes("calza") || n.includes("restauracion");
        if (categoriaSeleccionada === "Cirugía Oral")
          return n.includes("extracción") || n.includes("extraccion") || n.includes("cirugía");
        if (categoriaSeleccionada === "Higiene y Prevención")
          return n.includes("profilaxis") || n.includes("limpieza") || n.includes("detartraje");
        if (categoriaSeleccionada === "Endodoncia")
          return n.includes("endodoncia") || n.includes("conducto");
        if (categoriaSeleccionada === "Ortodoncia") return n.includes("ortodoncia") || n.includes("bracket");
        return false;
      };

      return (
        coincideBusqueda &&
        coincidePrecio &&
        coincideDuracion &&
        coincideEstado &&
        coincideCategoria()
      );
    });

    // Ordenamiento
    return filtrados.sort((a, b) => {
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
      if (orden === "precio-asc") return a.precio - b.precio;
      if (orden === "precio-desc") return b.precio - a.precio;
      if (orden === "duracion") return a.duracion - b.duracion;
      return 0;
    });
  }, [servicios, busqueda, categoriaSeleccionada, precioMaximo, duracionMaxima, estado, orden]);

  function limpiarFiltros() {
    setBusqueda("");
    setCategoriaSeleccionada("todas");
    setPrecioMaximo("");
    setDuracionMaxima("");
    setEstado("activo");
    setOrden("nombre");
  }

  // Métricas Clínicas Rápidas
  const totalServicios = servicios.length;
  const activosServicios = servicios.filter((s) => s.activo).length;
  const precioPromedio =
    totalServicios > 0
      ? Math.round(servicios.reduce((acc, s) => acc + s.precio, 0) / totalServicios)
      : 0;
  const duracionPromedio =
    totalServicios > 0
      ? Math.round(servicios.reduce((acc, s) => acc + s.duracion, 0) / totalServicios)
      : 0;

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 pb-12">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl animate-slideUp backdrop-blur-xl ${
            toast.type === "error"
              ? "bg-rose-950/90 text-rose-100 border border-rose-500/50 shadow-rose-950/50"
              : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border border-cyan-500/30 shadow-cyan-950/50"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-cyan-400 dark:text-cyan-600 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.text}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-800 bg-cyan-500/15 border border-cyan-500/30 dark:text-cyan-300 dark:bg-cyan-500/20 dark:border-cyan-400/40 px-3 py-0.5 rounded-full shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
              {isAdmin ? "NexusOdonto · Aranceles Clínicos" : "NexusOdonto · Directorio Clínico de Procedimientos"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            {isAdmin ? "Catálogo de Servicios y Tarifas" : "Catálogo de Tratamientos Odontológicos"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
            {isAdmin
              ? "Gestión centralizada de tratamientos odontológicos, tiempos de sillón y aranceles oficiales de la clínica."
              : "Consulta de referencia clínica de tratamientos odontológicos, especialidades y tiempos estimados de sillón."}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchServicios}
            disabled={loading}
            className="group p-2.5 rounded-2xl border border-slate-200/80 bg-white/80 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-2xl active:scale-95 shadow-sm flex items-center justify-center disabled:opacity-60"
            title="Recargar catálogo"
          >
            <DentistryReloadIcon size={22} loading={loading} />
          </button>

          {canCreateServices && (
            <button
              type="button"
              onClick={handleAbrirCrear}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-6 py-3 text-xs sm:text-sm font-black text-white dark:text-slate-950 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus size={19} strokeWidth={2.6} />
              <span>Nuevo Servicio</span>
            </button>
          )}
        </div>
      </div>

      {errorCarga && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 animate-fadeIn backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="font-bold">{errorCarga}</span>
          </div>
          <button
            type="button"
            onClick={fetchServicios}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Métricas Clínicas Rápidas (KPIs) adaptables para Claro y Oscuro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideDown">
        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-cyan-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold flex-shrink-0 border border-cyan-500/30 icon-animated-interactive group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all">
            <Layers size={22} className="group-hover:animate-icon-bounce" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title="Total Tratamientos">
              Total Tratamientos
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalServicios}
            </p>
            <p className="text-[10px] text-cyan-700 dark:text-cyan-300 font-semibold mt-0.5">Catálogo general</p>
          </div>
        </div>

        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-emerald-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0 border border-emerald-500/30 icon-animated-interactive group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all">
            <CheckCircle2 size={22} className="group-hover:animate-icon-wiggle" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title="Servicios Activos">
              Servicios Activos
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">
              {activosServicios}
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">100% operativos</p>
          </div>
        </div>

        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-teal-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold flex-shrink-0 border border-teal-500/30 icon-animated-interactive group-hover:scale-110 group-hover:bg-teal-500/25 transition-all">
            <Clock size={22} className="group-hover:animate-icon-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title="Duración Media">
              Duración Media
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {duracionPromedio} <span className="text-sm text-slate-500 font-sans">min</span>
            </p>
            <p className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold mt-0.5">Tiempo sillón medio</p>
          </div>
        </div>

        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-purple-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold flex-shrink-0 border border-purple-500/30 icon-animated-interactive group-hover:scale-110 group-hover:bg-purple-500/25 transition-all">
            {isAdmin ? (
              <DollarSign size={22} className="group-hover:animate-icon-bounce" />
            ) : (
              <Stethoscope size={22} className="group-hover:animate-icon-bounce" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={isAdmin ? "Tarifa Promedio" : "Especialidades"}>
              {isAdmin ? "Tarifa Promedio" : "Especialidades"}
            </p>
            <p className="text-xl sm:text-2xl font-black text-teal-700 dark:text-emerald-300 font-mono tracking-tight truncate" title={isAdmin ? formatCurrency(precioPromedio) : `${CATEGORIAS_FILTRO.length - 1} áreas`}>
              {isAdmin ? formatCurrency(precioPromedio) : `${CATEGORIAS_FILTRO.length - 1} áreas`}
            </p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mt-0.5">
              {isAdmin ? "Arancel base" : "Catálogo asistencial"}
            </p>
          </div>
        </div>
      </div>

      {/* Pestañas de Especialidad Rápida */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold animate-slideUp scrollbar-none">
        {CATEGORIAS_FILTRO.map((cat) => {
          const isActive = categoriaSeleccionada === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoriaSeleccionada(cat.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer whitespace-nowrap border text-xs font-bold backdrop-blur-2xl ${
                isActive
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-md dark:bg-cyan-500/30 dark:border-cyan-400/70 dark:text-cyan-100"
                  : "bg-white/80 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:border-cyan-400/40 dark:hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Barra Unificada de Búsqueda, Orden y Conmutador de Vista */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between animate-slideUp animate-stagger-1">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-600 dark:text-cyan-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por procedimiento, código clínico (SRV-001) o palabra clave..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/15 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all backdrop-blur-2xl shadow-sm"
          />
        </div>

        {/* Acciones de barra: Selector de orden, Filtros avanzados y Switch Vista */}
        <div className="relative z-30 flex items-center gap-2.5 flex-wrap">
          {/* Ordenar */}
          <GlassSelect
            value={orden}
            onChange={(val) => setOrden(val as any)}
            options={[
              { value: "nombre", label: "Nombre (A-Z)" },
              { value: "precio-asc", label: "Menor precio" },
              { value: "precio-desc", label: "Mayor precio" },
              { value: "duracion", label: "Menor duración" },
            ]}
            ariaLabel="Ordenar catálogo de servicios"
          />

          {/* Filtros avanzados */}
          <button
            type="button"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all cursor-pointer backdrop-blur-2xl text-xs font-bold shadow-sm ${
              mostrarFiltros
                ? "bg-cyan-600 text-white border-cyan-600 dark:bg-cyan-500/25 dark:text-cyan-100 dark:border-cyan-400/60"
                : "bg-white/85 dark:bg-slate-900/70 border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Filter size={14} className={mostrarFiltros ? "text-white dark:text-cyan-300" : "text-slate-500 dark:text-slate-400"} />
            <span>Filtros</span>
          </button>

          {/* Switch Vista Cuadrícula / Tabla */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/15 backdrop-blur-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setVista("grid")}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                vista === "grid"
                  ? "bg-white dark:bg-cyan-500/25 text-cyan-700 dark:text-cyan-200 shadow-sm border border-slate-200 dark:border-cyan-400/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Vista de Cuadrícula"
              aria-label="Vista Cuadrícula"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setVista("table")}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                vista === "table"
                  ? "bg-white dark:bg-cyan-500/25 text-cyan-700 dark:text-cyan-200 shadow-sm border border-slate-200 dark:border-cyan-400/40"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Vista de Tabla"
              aria-label="Vista Tabla"
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Filtros Avanzados */}
      {mostrarFiltros && (
        <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn text-slate-900 dark:text-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Precio Máximo ($ COP)
            </label>
            <input
              type="number"
              placeholder="Ej. 100000"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Duración Máxima (minutos)
            </label>
            <input
              type="number"
              placeholder="Ej. 60"
              value={duracionMaxima}
              onChange={(e) => setDuracionMaxima(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Estado del Procedimiento
            </label>
            <GlassSelect
              value={estado}
              onChange={(val) => setEstado(val as any)}
              className="w-full"
              options={[
                { value: "todos", label: "Todos los estados" },
                { value: "activo", label: "Solo Activos" },
                { value: "inactivo", label: "Solo Inactivos" },
              ]}
              ariaLabel="Filtrar por estado del procedimiento"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          </div>
        </div>
      )}

      {/* Contenedor Principal: Cuadrícula o Tabla */}
      <div className="pt-2 animate-slideUp animate-stagger-2">
        {vista === "grid" ? (
          <ServiciosGrid
            servicios={serviciosProcesados}
            onEditar={canEditServices ? handleAbrirEditar : undefined}
            onEliminar={canDeleteServices ? handleEliminar : undefined}
            onToggleActivo={canEditServices ? handleToggleActivo : undefined}
          />
        ) : (
          <ServiciosTable
            servicios={serviciosProcesados}
            onEditar={canEditServices ? handleAbrirEditar : undefined}
            onEliminar={canDeleteServices ? handleEliminar : undefined}
            onToggleActivo={canEditServices ? handleToggleActivo : undefined}
          />
        )}
      </div>

      {/* Modal Crear / Editar Servicio */}
      <ServicioModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSave={handleGuardarServicio}
        servicioInicial={servicioAEditar}
      />
    </div>
  );
}