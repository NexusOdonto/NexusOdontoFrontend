import { useState, useEffect, useCallback, useMemo } from "react";
import { ServiciosGrid } from "./components/ServiciosGrid";
import { ServiciosTable } from "./components/ServiciosTable";
import { ServicioModal } from "./components/ServicioModal";
import type { Servicio } from "../../types/servicios";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { formatCurrency } from "../../utils/currency";
import {
  Plus,
  RefreshCw,
  Filter,
  Search,
  Layers,
  CheckCircle2,
  Clock,
  DollarSign,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
} from "lucide-react";

const CATEGORIAS_FILTRO = [
  { id: "todas", label: "Todos los servicios" },
  { id: "Higiene y Prevención", label: "Higiene y Prevención" },
  { id: "Operatoria / Resinas", label: "Operatoria / Resinas" },
  { id: "Cirugía Oral", label: "Cirugía Oral" },
  { id: "Endodoncia", label: "Endodoncia" },
  { id: "Estética Dental", label: "Estética Dental" },
  { id: "Ortodoncia", label: "Ortodoncia" },
];

const serviciosFallback: Servicio[] = [
  {
    id: 1,
    codigo: "SRV-001",
    nombre: "Blanqueamiento dental láser",
    categoria: "Estética Dental",
    descripcion: "Tratamiento fotoactivado de última generación para aclarar el tono dental de 2 a 4 tonos.",
    duracion: 60,
    precio: 80000,
    activo: true,
  },
  {
    id: 2,
    codigo: "SRV-002",
    nombre: "Restauración en resina fotocurada",
    categoria: "Operatoria / Resinas",
    descripcion: "Reconstrucción estética y funcional de cavidades dentales por caries o fractura.",
    duracion: 45,
    precio: 60000,
    activo: true,
  },
  {
    id: 3,
    codigo: "SRV-003",
    nombre: "Extracción dental simple",
    categoria: "Cirugía Oral",
    descripcion: "Procedimiento quirúrgico ambulatorio bajo anestesia local con técnica atraumática.",
    duracion: 30,
    precio: 50000,
    activo: true,
  },
  {
    id: 4,
    codigo: "SRV-004",
    nombre: "Profilaxis y detartraje con ultrasonido",
    categoria: "Higiene y Prevención",
    descripcion: "Eliminación supragingival y subgingival de cálculo bacteriano y pulido con pasta profiláctica.",
    duracion: 40,
    precio: 45000,
    activo: true,
  },
  {
    id: 5,
    codigo: "SRV-005",
    nombre: "Tratamiento de Endodoncia Unirradicular",
    categoria: "Endodoncia",
    descripcion: "Biopulpectomía e instrumentación rotatoria con obturación termoplástica tridimensional.",
    duracion: 90,
    precio: 180000,
    activo: true,
  },
];

export function ServiciosView() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [precioMaximo, setPrecioMaximo] = useState("");
  const [duracionMaxima, setDuracionMaxima] = useState("");
  const [estado, setEstado] = useState<"todos" | "activo" | "inactivo">("todos");
  const [orden, setOrden] = useState<"nombre" | "precio-asc" | "precio-desc" | "duracion">("nombre");

  // Vistas y Modales
  const [vista, setVista] = useState<"grid" | "table">("grid");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioAEditar, setServicioAEditar] = useState<Servicio | null>(null);

  // Carga de catálogo con sincronización a localStorage y backend
  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceCatalogService.getAll();
      if (data && data.length > 0) {
        const mapped: Servicio[] = data.map((item, idx) => ({
          id: item.id || (idx + 1),
          codigo: item.code || `SRV-${String(idx + 1).padStart(3, "0")}`,
          nombre: item.name,
          categoria: (item as any).category || "Odontología General",
          descripcion: item.description || "Procedimiento clínico odontológico.",
          duracion: item.durationMinutes || 45,
          precio: item.price ?? 50000,
          activo: item.isActive ?? true,
        }));
        setServicios(mapped);
        localStorage.setItem("nexus_servicios", JSON.stringify(mapped));
      } else {
        const guardados = localStorage.getItem("nexus_servicios");
        if (guardados) {
          try {
            setServicios(JSON.parse(guardados));
          } catch {
            setServicios(serviciosFallback);
          }
        } else {
          setServicios(serviciosFallback);
          localStorage.setItem("nexus_servicios", JSON.stringify(serviciosFallback));
        }
      }
    } catch (err) {
      console.warn("API Service Catalog no disponible, usando almacenamiento local:", err);
      const guardados = localStorage.getItem("nexus_servicios");
      if (guardados) {
        try {
          setServicios(JSON.parse(guardados));
        } catch {
          setServicios(serviciosFallback);
        }
      } else {
        setServicios(serviciosFallback);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  // Guardar servicio (Crear o Editar con persistencia en Backend)
  const handleGuardarServicio = async (
    servicioData: Omit<Servicio, "id"> & { id?: number | string }
  ) => {
    let actualizados: Servicio[];

    if (servicioData.id) {
      // Editar en backend
      try {
        await serviceCatalogService.update(String(servicioData.id), {
          code: servicioData.codigo || `SRV-${servicioData.id}`,
          name: servicioData.nombre,
          description: servicioData.descripcion,
          durationMinutes: servicioData.duracion,
          price: servicioData.precio,
          isActive: servicioData.activo,
        });
      } catch (err) {
        console.warn("No se pudo actualizar en API directamente, guardado local:", err);
      }

      actualizados = servicios.map((s) =>
        s.id === servicioData.id ? ({ ...s, ...servicioData } as Servicio) : s
      );
    } else {
      // Crear en backend
      const nuevoId = Date.now();
      const nuevo: Servicio = {
        id: nuevoId,
        codigo: servicioData.codigo || `SRV-${String(servicios.length + 1).padStart(3, "0")}`,
        nombre: servicioData.nombre,
        categoria: servicioData.categoria || "Odontología General",
        descripcion: servicioData.descripcion,
        duracion: servicioData.duracion,
        precio: servicioData.precio,
        activo: servicioData.activo,
      };

      try {
        const respuesta = await serviceCatalogService.create({
          code: nuevo.codigo || `SRV-${nuevo.id}`,
          name: nuevo.nombre,
          description: nuevo.descripcion,
          durationMinutes: nuevo.duracion,
          price: nuevo.precio,
          isActive: nuevo.activo,
          sortOrder: servicios.length + 1,
        });
        if (respuesta && respuesta.id) {
          nuevo.id = respuesta.id;
        }
      } catch (err) {
        console.warn("No se pudo persistir en API directamente, guardado en estado:", err);
      }

      actualizados = [nuevo, ...servicios];
    }

    setServicios(actualizados);
    localStorage.setItem("nexus_servicios", JSON.stringify(actualizados));
  };

  // Alternar estado activo / inactivo con persistencia en Backend
  const handleToggleActivo = async (servicio: Servicio) => {
    const nuevoEstado = !servicio.activo;

    try {
      await serviceCatalogService.update(String(servicio.id), {
        code: servicio.codigo || `SRV-${servicio.id}`,
        name: servicio.nombre,
        description: servicio.descripcion,
        durationMinutes: servicio.duracion,
        price: servicio.precio,
        isActive: nuevoEstado,
      });
    } catch (err) {
      console.warn("No se pudo actualizar estado en API directamente:", err);
    }

    const actualizados = servicios.map((s) =>
      s.id === servicio.id ? { ...s, activo: nuevoEstado } : s
    );
    setServicios(actualizados);
    localStorage.setItem("nexus_servicios", JSON.stringify(actualizados));
  };

  // Eliminar servicio con persistencia en Backend
  const handleEliminar = async (id: number | string) => {
    try {
      await serviceCatalogService.delete(String(id));
    } catch (err) {
      console.warn("No se pudo eliminar en API directamente:", err);
    }

    const actualizados = servicios.filter((s) => s.id !== id);
    setServicios(actualizados);
    localStorage.setItem("nexus_servicios", JSON.stringify(actualizados));
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
    setEstado("todos");
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
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-800 bg-cyan-500/15 border border-cyan-500/30 dark:text-cyan-300 dark:bg-cyan-500/20 dark:border-cyan-400/40 px-3 py-0.5 rounded-full shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
              NexusOdonto · Aranceles Clínicos
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            Catálogo de Servicios y Tarifas
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-2xl leading-relaxed">
            Gestión centralizada de tratamientos odontológicos, tiempos de sillón y aranceles oficiales de la clínica.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchServicios}
            className="p-3 rounded-2xl border border-slate-200/80 bg-white/80 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900/70 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-2xl active:scale-95 shadow-sm"
            title="Recargar catálogo"
          >
            <RefreshCw
              size={17}
              className={`text-cyan-600 dark:text-cyan-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={handleAbrirCrear}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-6 py-3 text-xs sm:text-sm font-black text-white dark:text-slate-950 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Plus size={19} strokeWidth={2.6} />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Métricas Clínicas Rápidas (KPIs) adaptables para Claro y Oscuro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideDown">
        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-cyan-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold flex-shrink-0 border border-cyan-500/30 group-hover:scale-105 transition-transform">
            <Layers size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Tratamientos
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {totalServicios}
            </p>
            <p className="text-[10px] text-cyan-700 dark:text-cyan-300 font-semibold mt-0.5">Catálogo general</p>
          </div>
        </div>

        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-emerald-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0 border border-emerald-500/30 group-hover:scale-105 transition-transform">
            <CheckCircle2 size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Servicios Activos
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">
              {activosServicios}
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">100% operativos</p>
          </div>
        </div>

        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-teal-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold flex-shrink-0 border border-teal-500/30 group-hover:scale-105 transition-transform">
            <Clock size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Duración Media
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {duracionPromedio} <span className="text-sm text-slate-500 font-sans">min</span>
            </p>
            <p className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold mt-0.5">Tiempo sillón medio</p>
          </div>
        </div>

        <div className="group relative p-4.5 rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-slate-900/5 dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] hover:border-purple-500/50 transition-all duration-300 flex items-center gap-4 overflow-hidden">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/15 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold flex-shrink-0 border border-purple-500/30 group-hover:scale-105 transition-transform">
            <DollarSign size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Tarifa Promedio
            </p>
            <p className="text-xl sm:text-2xl font-black text-teal-700 dark:text-emerald-300 font-mono tracking-tight truncate">
              {formatCurrency(precioPromedio)}
            </p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mt-0.5">Arancel base</p>
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
              className={`px-4 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer whitespace-nowrap border text-xs font-bold backdrop-blur-2xl ${
                isActive
                  ? "bg-cyan-600 text-white border-cyan-600 shadow-md dark:bg-cyan-500/30 dark:border-cyan-400/70 dark:text-cyan-100"
                  : "bg-white/80 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white dark:bg-slate-900/60 dark:border-white/10 dark:text-slate-300 dark:hover:text-white"
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
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Ordenar */}
          <div className="relative flex items-center">
            <ArrowUpDown size={14} className="absolute left-3.5 text-cyan-600 dark:text-cyan-400 pointer-events-none" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as any)}
              className="pl-9 pr-5 py-3 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/15 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition-all backdrop-blur-2xl shadow-sm cursor-pointer"
            >
              <option value="nombre" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nombre (A-Z)</option>
              <option value="precio-asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Menor precio</option>
              <option value="precio-desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mayor precio</option>
              <option value="duracion" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Menor duración</option>
            </select>
          </div>

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
        <div className="p-5 rounded-3xl border border-white/15 bg-slate-950/90 backdrop-blur-2xl shadow-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Precio Máximo ($ COP)
            </label>
            <input
              type="number"
              placeholder="Ej. 100000"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-white/15 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Duración Máxima (minutos)
            </label>
            <input
              type="number"
              placeholder="Ej. 60"
              value={duracionMaxima}
              onChange={(e) => setDuracionMaxima(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-white/15 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Estado del Procedimiento
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-white/15 rounded-xl text-xs text-white outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="todos" className="bg-slate-900 text-white">Todos los estados</option>
              <option value="activo" className="bg-slate-900 text-white">Solo Activos</option>
              <option value="inactivo" className="bg-slate-900 text-white">Solo Inactivos</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
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
            onEditar={handleAbrirEditar}
            onEliminar={handleEliminar}
            onToggleActivo={handleToggleActivo}
          />
        ) : (
          <ServiciosTable
            servicios={serviciosProcesados}
            onEditar={handleAbrirEditar}
            onEliminar={handleEliminar}
            onToggleActivo={handleToggleActivo}
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