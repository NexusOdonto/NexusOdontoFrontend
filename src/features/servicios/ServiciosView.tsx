import { useState } from "react";
import { ServiciosGrid } from "./components/ServiciosGrid";
import type { Servicio } from "../../types/servicios";

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

export function ServiciosView() {
  const [servicios, setServicios] =
    useState<Servicio[]>(serviciosIniciales);

  const [busqueda, setBusqueda] =
    useState("");

  const [mostrarFiltros, setMostrarFiltros] =
    useState(false);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [precioMaximo, setPrecioMaximo] =
    useState("");

  const [duracionMaxima, setDuracionMaxima] =
    useState("");

  const [estado, setEstado] =
    useState("todos");

  const [nuevoServicio, setNuevoServicio] =
    useState({
      nombre: "",
      descripcion: "",
      duracion: "",
      precio: "",
      activo: true,
    });

  const serviciosFiltrados =
    servicios.filter((servicio) => {
      const coincideBusqueda =
        servicio.nombre
          .toLowerCase()
          .includes(busqueda.toLowerCase()) ||
        servicio.descripcion
          .toLowerCase()
          .includes(busqueda.toLowerCase());

      const coincidePrecio =
        precioMaximo === "" ||
        servicio.precio <= Number(precioMaximo);

      const coincideDuracion =
        duracionMaxima === "" ||
        servicio.duracion <= Number(duracionMaxima);

      const coincideEstado =
        estado === "todos" ||
        (estado === "activo" &&
          servicio.activo) ||
        (estado === "inactivo" &&
          !servicio.activo);

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

  function agregarServicio(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const duracionNumero =
      Number(nuevoServicio.duracion);

    const precioNumero =
      Number(nuevoServicio.precio);

    if (
      !nuevoServicio.nombre.trim() ||
      !nuevoServicio.descripcion.trim() ||
      duracionNumero <= 0 ||
      precioNumero <= 0
    ) {
      alert(
        "Completa todos los campos correctamente.",
      );

      return;
    }

    const servicio: Servicio = {
      id:
        servicios.length > 0
          ? Math.max(
              ...servicios.map(
                (item) => item.id,
              ),
            ) + 1
          : 1,

      nombre:
        nuevoServicio.nombre.trim(),

      descripcion:
        nuevoServicio.descripcion.trim(),

      duracion:
        duracionNumero,

      precio:
        precioNumero,

      activo:
        nuevoServicio.activo,
    };

    setServicios((prevServicios) => [
      ...prevServicios,
      servicio,
    ]);

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
    <div className="p-6">

      {/* ENCABEZADO */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Servicios
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Consulta y administra los servicios disponibles
              del consultorio.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarFormulario(true)
            }
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            + Agregar servicio
          </button>

        </div>
      </div>

      {/* BUSCADOR */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row">

        <input
          type="text"
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
          placeholder="Buscar servicio..."
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />

        <button
          type="button"
          onClick={() =>
            setMostrarFiltros(
              !mostrarFiltros,
            )
          }
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Filtros
        </button>

      </div>

      {/* PANEL DE FILTROS */}
      {mostrarFiltros && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Precio máximo
              </label>

              <input
                type="number"
                value={precioMaximo}
                onChange={(event) =>
                  setPrecioMaximo(
                    event.target.value,
                  )
                }
                placeholder="Ej: 80000"
                min="0"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Duración máxima
              </label>

              <input
                type="number"
                value={duracionMaxima}
                onChange={(event) =>
                  setDuracionMaxima(
                    event.target.value,
                  )
                }
                placeholder="Minutos"
                min="0"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Estado
              </label>

              <select
                value={estado}
                onChange={(event) =>
                  setEstado(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="todos">
                  Todos
                </option>

                <option value="activo">
                  Activos
                </option>

                <option value="inactivo">
                  Inactivos
                </option>

              </select>
            </div>

          </div>

          <div className="mt-4 flex justify-end">

            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Limpiar filtros
            </button>

          </div>

        </div>
      )}

      {/* CONTADOR */}
      <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
        {serviciosFiltrados.length}{" "}
        {serviciosFiltrados.length === 1
          ? "servicio encontrado"
          : "servicios encontrados"}
      </p>

      {/* SERVICIOS */}
      <ServiciosGrid
        servicios={serviciosFiltrados}
      />

      {/* MODAL AGREGAR SERVICIO */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Agregar servicio
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Registra un nuevo servicio.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarFormulario(false)
                }
                className="text-2xl text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={agregarServicio}
              className="space-y-4"
            >

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nuevoServicio.nombre}
                  onChange={(event) =>
                    setNuevoServicio({
                      ...nuevoServicio,
                      nombre:
                        event.target.value,
                    })
                  }
                  placeholder="Nombre del servicio"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Descripción
                </label>

                <textarea
                  value={
                    nuevoServicio.descripcion
                  }
                  onChange={(event) =>
                    setNuevoServicio({
                      ...nuevoServicio,
                      descripcion:
                        event.target.value,
                    })
                  }
                  placeholder="Descripción del servicio"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Duración
                  </label>

                  <input
                    type="number"
                    value={
                      nuevoServicio.duracion
                    }
                    onChange={(event) =>
                      setNuevoServicio({
                        ...nuevoServicio,
                        duracion:
                          event.target.value,
                      })
                    }
                    placeholder="Minutos"
                    min="1"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Precio
                  </label>

                  <input
                    type="number"
                    value={
                      nuevoServicio.precio
                    }
                    onChange={(event) =>
                      setNuevoServicio({
                        ...nuevoServicio,
                        precio:
                          event.target.value,
                      })
                    }
                    placeholder="Precio"
                    min="1"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Estado
                </label>

                <select
                  value={
                    nuevoServicio.activo
                      ? "activo"
                      : "inactivo"
                  }
                  onChange={(event) =>
                    setNuevoServicio({
                      ...nuevoServicio,
                      activo:
                        event.target.value ===
                        "activo",
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="activo">
                    Activo
                  </option>

                  <option value="inactivo">
                    Inactivo
                  </option>

                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setMostrarFormulario(false)
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                >
                  Guardar servicio
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}