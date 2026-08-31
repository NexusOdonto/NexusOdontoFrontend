import { useState, useEffect, useCallback } from "react";
import { ServiciosGrid } from "./components/ServiciosGrid";
import type { Servicio } from "../../types/servicios";
import { serviceCatalogService } from "../../api/serviceCatalogService";
import { Plus, RefreshCw, Filter, X } from "lucide-react";

const serviciosFallback: Servicio[] = [
  {
    id: 1,
    nombre: "Blanqueamiento dental",
    descripcion: "Tratamiento para mejorar el tono y apariencia de los dientes.",
    duracion: 60,
    precio: 80000,
    activo: true,
  },
  {
    id: 2,
    nombre: "Calza dental en resina",
    descripcion: "Restauración de una pieza dental afectada por caries.",
    duracion: 45,
    precio: 60000,
    activo: true,
  },
  {
    id: 3,
    nombre: "Extracción dental simple",
    descripcion: "Procedimiento quirúrgico menor para retirar una pieza dental.",
    duracion: 30,
    precio: 50000,
    activo: true,
  },
  {
    id: 4,
    nombre: "Limpieza y profilaxis dental",
    descripcion: "Limpieza profesional con ultrasonido para eliminar placa y sarro.",
    duracion: 40,
    precio: 45000,
    activo: true,
  },
  {
    id: 5,
    nombre: "Tratamiento de Endodoncia",
    descripcion: "Tratamiento de conductos radiculares para salvar piezas comprometidas.",
    duracion: 90,
    precio: 180000,
    activo: true,
  },
];

export function ServiciosView() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [precioMaximo, setPrecioMaximo] = useState("");
  const [duracionMaxima, setDuracionMaxima] = useState("");
  const [estado, setEstado] = useState("todos");

  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: "",
    descripcion: "",
    duracion: "",
    precio: "",
    activo: true,
  });

  const fetchServicios = useCallback(async () => {
    setLoading(true);
    try {
      // Consumir directamente /api/v1/Services del backend
      const data = await serviceCatalogService.getAll().catch(() => []);
      if (data && data.length > 0) {
        const mapped: Servicio[] = data.map((s, idx) => ({
          id: idx + 1,
          nombre: s.name,
          descripcion: s.description || "Servicio odontológico profesional.",
          duracion: s.durationMinutes || 45,
          precio: s.price || 50000,
          activo: s.isActive,
        }));
        setServicios(mapped);
      } else {
        setServicios(serviciosFallback);
      }
    } catch (err) {
      console.warn("API Services unavailable, using local fallback:", err);
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
      coincideBusqueda &&
      coincidePrecio &&
      coincideDuracion &&
      coincideEstado
    );
  });

  function limpiarFiltros() {
    setPrecioMaximo("");
    setDuracionMaxima("");
    setEstado("todos");
  }

  async function agregarServicio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Catálogo de Servicios y Tarifas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Administración de tratamientos, duraciones y precios de la clínica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchServicios}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Recargar desde la base de datos"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_4px_15px_rgba(20,184,166,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <input
          type="text"
          placeholder="Buscar servicio o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-teal-500 transition-colors"
        />

        <button
          type="button"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Filter size={15} />
          <span>Filtros avanzados</span>
        </button>
      </div>

      {/* Panel de Filtros Avanzados */}
      {mostrarFiltros && (
        <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Precio Máximo ($)
            </label>
            <input
              type="number"
              placeholder="Ej. 100000"
              value={precioMaximo}
              onChange={(e) => setPrecioMaximo(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Duración Máxima (min)
            </label>
            <input
              type="number"
              placeholder="Ej. 60"
              value={duracionMaxima}
              onChange={(e) => setDuracionMaxima(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Estado del Servicio
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Solo Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        </div>
      )}

      {/* Modal / Formulario Nuevo Servicio */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Nuevo Servicio Odontológico
              </h3>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={agregarServicio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Profilaxis y Detartraje"
                  value={nuevoServicio.nombre}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción Clínica *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalle del procedimiento..."
                  value={nuevoServicio.descripcion}
                  onChange={(e) => setNuevoServicio({ ...nuevoServicio, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    placeholder="45"
                    value={nuevoServicio.duracion}
                    onChange={(e) => setNuevoServicio({ ...nuevoServicio, duracion: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Precio ($ COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="80000"
                    value={nuevoServicio.precio}
                    onChange={(e) => setNuevoServicio({ ...nuevoServicio, precio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                >
                  Guardar en Base de Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de Servicios */}
      <ServiciosGrid servicios={serviciosFiltrados} />
    </div>
  );
}