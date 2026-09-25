import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ServiciosGrid } from "./components/ServiciosGrid";
import type { Servicio } from "../../types/servicios";
import { GlassSelect } from "../../components/common/GlassSelect";

const SERVICIOS_STORAGE_KEY = "nexus_odontologia_servicios";

const serviciosIniciales: Servicio[] = [
  {
    id: 1,
    nombre: "Blanqueamiento dental",
    descripcion:
      "Tratamiento para mejorar el tono y apariencia de los dientes.",
    duracion: 60,
    precio: 80000,
    activo: true,
  },
  {
    id: 2,
    nombre: "Calza dental",
    descripcion:
      "Restauración de una pieza dental afectada por caries.",
    duracion: 45,
    precio: 60000,
    activo: true,
  },
  {
    id: 3,
    nombre: "Extracción dental",
    descripcion:
      "Procedimiento para retirar una pieza dental.",
    duracion: 30,
    precio: 50000,
    activo: false,
  },
  {
    id: 4,
    nombre: "Limpieza dental",
    descripcion:
      "Limpieza profesional para eliminar placa y sarro.",
    duracion: 40,
    precio: 45000,
    activo: true,
  },
  {
    id: 5,
    nombre: "Fluorización",
    descripcion:
      "Aplicación de flúor para ayudar a prevenir caries.",
    duracion: 20,
    precio: 30000,
    activo: true,
  },
];

function cargarServicios(): Servicio[] {
  const serviciosGuardados = localStorage.getItem(
    SERVICIOS_STORAGE_KEY,
  );

  if (!serviciosGuardados) {
    localStorage.setItem(
      SERVICIOS_STORAGE_KEY,
      JSON.stringify(serviciosIniciales),
    );

    return serviciosIniciales;
  }

  try {
    const servicios = JSON.parse(
      serviciosGuardados,
    ) as Servicio[];

    if (Array.isArray(servicios)) {
      return servicios;
    }

    localStorage.setItem(
      SERVICIOS_STORAGE_KEY,
      JSON.stringify(serviciosIniciales),
    );

    return serviciosIniciales;
  } catch {
    localStorage.setItem(
      SERVICIOS_STORAGE_KEY,
      JSON.stringify(serviciosIniciales),
    );

    return serviciosIniciales;
  }
}

export function ServiciosView() {
  const navigate = useNavigate();

  const [servicios] = useState<Servicio[]>(cargarServicios);

  const [search, setSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [estado, setEstado] = useState("todos");

  const [precioMin, setPrecioMin] = useState("");

  const [precioMax, setPrecioMax] = useState("");

  const [duracionMin, setDuracionMin] = useState("");

  const [duracionMax, setDuracionMax] = useState("");

  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((servicio) => {
      const searchValue = search.trim().toLowerCase();

      const coincideBusqueda =
        !searchValue ||
        servicio.nombre
          .toLowerCase()
          .includes(searchValue) ||
        servicio.descripcion
          .toLowerCase()
          .includes(searchValue);

      const coincideEstado =
        estado === "todos" ||
        (estado === "activo" && servicio.activo) ||
        (estado === "inactivo" && !servicio.activo);

      const precioMinimo =
        !precioMin ||
        servicio.precio >= Number(precioMin);

      const precioMaximo =
        !precioMax ||
        servicio.precio <= Number(precioMax);

      const duracionMinima =
        !duracionMin ||
        servicio.duracion >= Number(duracionMin);

      const duracionMaxima =
        !duracionMax ||
        servicio.duracion <= Number(duracionMax);

      return (
        coincideBusqueda &&
        coincideEstado &&
        precioMinimo &&
        precioMaximo &&
        duracionMinima &&
        duracionMaxima
      );
    });
  }, [
    servicios,
    search,
    estado,
    precioMin,
    precioMax,
    duracionMin,
    duracionMax,
  ]);

  const limpiarFiltros = () => {
    setEstado("todos");
    setPrecioMin("");
    setPrecioMax("");
    setDuracionMin("");
    setDuracionMax("");
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Servicios
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Consulta los servicios disponibles del
            consultorio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/servicios/nuevo")}
          className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-700 px-4 py-2.5 font-medium text-white transition-all hover:from-primary-600 hover:to-primary-800 active:scale-[0.98]"
        >
          + Agregar servicio
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Buscar servicio..."
          aria-label="Buscar servicios"
          className="w-full flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />

        <button
          type="button"
          onClick={() =>
            setShowFilters((prev) => !prev)
          }
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Estado
              </label>

              <GlassSelect
                value={estado}
                onChange={(val) => setEstado(val)}
                variant="form"
                fullWidth
                options={[
                  { value: "todos", label: "Todos los estados" },
                  { value: "activo", label: "Activo" },
                  { value: "inactivo", label: "Inactivo" },
                ]}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Precio mínimo
              </label>

              <input
                type="number"
                value={precioMin}
                onChange={(event) =>
                  setPrecioMin(event.target.value)
                }
                placeholder="Ej: 30000"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Precio máximo
              </label>

              <input
                type="number"
                value={precioMax}
                onChange={(event) =>
                  setPrecioMax(event.target.value)
                }
                placeholder="Ej: 80000"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Duración mínima
              </label>

              <input
                type="number"
                value={duracionMin}
                onChange={(event) =>
                  setDuracionMin(event.target.value)
                }
                placeholder="Minutos"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Duración máxima
              </label>

              <input
                type="number"
                value={duracionMax}
                onChange={(event) =>
                  setDuracionMax(event.target.value)
                }
                placeholder="Minutos"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        {serviciosFiltrados.length}{" "}
        {serviciosFiltrados.length === 1
          ? "servicio encontrado"
          : "servicios encontrados"}
      </p>

      <div className="mt-4">
        <ServiciosGrid
          servicios={serviciosFiltrados}
        />
      </div>
    </div>
  );
}