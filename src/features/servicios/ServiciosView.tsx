import { useState, useEffect, useCallback } from "react";
import { ServiciosGrid } from "./components/ServiciosGrid";
import type { Servicio } from "../../types/servicios";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { Plus, RefreshCw, Filter, X, Sparkles, Search } from "lucide-react";

const serviciosFallback: Servicio[] = [];

export function ServiciosView() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [precioMaximo, setPrecioMaximo] = useState("");
  const [duracionMaxima, setDuracionMaxima] = useState("");
  const [estado, setEstado] = useState<"todos" | "activo" | "inactivo">("todos");

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: "",
    descripcion: "",
    duracion: "",
    precio: "",
    activo: true,
  });

  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceCatalogService.getAll();
      if (data && data.length > 0) {
        const mapped: Servicio[] = data.map((item, idx) => ({
          id: idx + 1,
          nombre: item.name,
          descripcion: item.description || "Procedimiento clínico odontológico.",
          duracion: item.durationMinutes,
          precio: item.price ?? 50000,
          activo: item.isActive,
        }));
        setServicios(mapped);
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
        }
      }
    } catch (err) {
      console.warn("API Service Catalog unavailable, using fallback:", err);
      setServicios(serviciosFallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  const serviciosFiltrados = servicios.filter((servicio) => {
    const coincideBusqueda =
      servicio.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      servicio.descripcion.toLowerCase().includes(busqueda.toLowerCase());

    const coincidePrecio =
      precioMaximo === "" || servicio.precio <= Number(precioMaximo);

    const coincideDuracion =
      duracionMaxima === "" || servicio.duracion <= Number(duracionMaxima);

    const coincideEstado =
      estado === "todos" ||
      (estado === "activo" && servicio.activo) ||
      (estado === "inactivo" && !servicio.activo);

    return (
      coincideBusqueda && coincidePrecio && coincideDuracion && coincideEstado
    );
  });

  function limpiarFiltros() {
    setBusqueda("");
    setPrecioMaximo("");
    setDuracionMaxima("");
    setEstado("todos");
  }

  async function agregarServicio(e: React.FormEvent) {
    e.preventDefault();

    const duracionNumero = Number(nuevoServicio.duracion);
    const precioNumero = Number(nuevoServicio.precio);

    if (
      !nuevoServicio.nombre.trim() ||
      !nuevoServicio.descripcion.trim() ||
      duracionNumero <= 0 ||
      precioNumero <= 0
    ) {
      alert("Completa todos los campos correctamente.");
      return;
    }

    const nuevoObj: Servicio = {
      id: Date.now(),
      nombre: nuevoServicio.nombre.trim(),
      descripcion: nuevoServicio.descripcion.trim(),
      duracion: duracionNumero,
      precio: precioNumero,
      activo: nuevoServicio.activo,
    };

    // Intentar persistir en API /api/v1/Services
    try {
      await serviceCatalogService.create({
        code: `SRV-${Date.now().toString().slice(-4)}`,
        name: nuevoServicio.nombre.trim(),
        description: nuevoServicio.descripcion.trim(),
        durationMinutes: duracionNumero,
        price: precioNumero,
        isActive: nuevoServicio.activo,
        sortOrder: servicios.length + 1,
      });
    } catch (err) {
      console.warn("Could not save to API Services directly, saved in state:", err);
    }

    setServicios((prev) => [nuevoObj, ...prev]);

    setNuevoServicio({
      nombre: "",
      descripcion: "",
      duracion: "",
      precio: "",
      activo: true,
    });

    setMostrarFormulario(false);
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Encabezado Principal estilo Pacientes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Catálogo de Servicios y Tarifas
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Administración de tratamientos, duraciones y precios de la clínica.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchServicios}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            title="Recargar catálogo"
          >
            <RefreshCw size={16} className={`text-cyan-600 dark:text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 animate-slideUp animate-stagger-1">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar servicio o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 dark:focus:ring-cyan-400/40 transition-all backdrop-blur-xl shadow-md"
          />
        </div>

        <button
          type="button"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl shadow-md text-xs font-semibold ${
            mostrarFiltros
              ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border-cyan-500/30 dark:border-cyan-400/40"
              : "border-slate-200 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-950/80"
          }`}
        >
          <Filter size={15} />
          <span>Filtros avanzados</span>
        </button>
      </div>

      {/* Panel de Filtros Avanzados */}
      {mostrarFiltros && (
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Precio Máximo ($)
            </label>
            <input
              type="number"
              placeholder="Ej. 100000"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(e.target.value)}
              className="w-full px-4 py-2 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Duración Máxima (min)
            </label>
            <input
              type="number"
              placeholder="Ej. 60"
              value={duracionMaxima}
              onChange={(e) => setDuracionMaxima(e.target.value)}
              className="w-full px-4 py-2 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Estado del Servicio
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full px-4 py-2 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-cyan-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Solo Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex justify-end pt-1">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        </div>
      )}

      {/* Modal / Formulario Nuevo Servicio */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-slate-200 dark:border-cyan-400/20 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80 dark:border-white/15">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Nuevo Servicio Odontológico
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ingresa el nombre, duración y tarifa del procedimiento.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={agregarServicio} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Profilaxis y Detartraje"
                  value={nuevoServicio.nombre}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Descripción Clínica *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalle del procedimiento..."
                  value={nuevoServicio.descripcion}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-none transition-all backdrop-blur-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    placeholder="45"
                    value={nuevoServicio.duracion}
                    onChange={(e) => setNuevoServicio({ ...nuevoServicio, duracion: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Precio ($ COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="80000"
                    value={nuevoServicio.precio}
                    onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 transition-all backdrop-blur-md font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de Servicios */}
      <div className="pt-2 animate-slideUp animate-stagger-2">
        <ServiciosGrid servicios={serviciosFiltrados} />
      </div>
    </div>
  );
}