import {
  CalendarDays,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  CitasTable,
  type Cita,
  type EstadoCita,
} from "../components/citas/CitasTable";

const citasIniciales: Cita[] = [
  {
    id: 1,
    paciente: "Ana María Rodríguez",
    profesional: "Dra. Laura Gómez",
    servicio: "Limpieza dental",
    fecha: "2026-08-27",
    hora: "08:30",
    estado: "Confirmada",
  },
  {
    id: 2,
    paciente: "Carlos Andrés Pérez",
    profesional: "Dr. Juan Martínez",
    servicio: "Blanqueamiento dental",
    fecha: "2026-08-27",
    hora: "09:30",
    estado: "Agendada",
  },
  {
    id: 3,
    paciente: "María Fernanda López",
    profesional: "Dra. Laura Gómez",
    servicio: "Calza dental",
    fecha: "2026-08-27",
    hora: "10:30",
    estado: "Atendida",
  },
  {
    id: 4,
    paciente: "Juan David Gómez",
    profesional: "Dr. Andrés Silva",
    servicio: "Extracción dental",
    fecha: "2026-08-27",
    hora: "11:30",
    estado: "Cancelada",
  },
];

export function CitasView() {
  const [citas, setCitas] =
    useState<Cita[]>(citasIniciales);

  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState("");

  const [estado, setEstado] = useState<
    "Todos" | EstadoCita
  >("Todos");

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] =
    useState(false);

  const [nuevoPaciente, setNuevoPaciente] =
    useState("");

  const [nuevoProfesional, setNuevoProfesional] =
    useState("");

  const [nuevoServicio, setNuevoServicio] =
    useState("");

  const [nuevaFecha, setNuevaFecha] =
    useState("");

  const [nuevaHora, setNuevaHora] =
    useState("");

  const [nuevoEstado, setNuevoEstado] =
    useState<EstadoCita>("Agendada");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setLoading(false);
    }, 700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, []);

  const citasFiltradas = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return citas.filter((cita) => {
      const matchSearch =
        !searchValue ||
        cita.paciente
          .toLowerCase()
          .includes(searchValue) ||
        cita.profesional
          .toLowerCase()
          .includes(searchValue) ||
        cita.servicio
          .toLowerCase()
          .includes(searchValue);

      const matchFecha =
        !fecha || cita.fecha === fecha;

      const matchEstado =
        estado === "Todos" ||
        cita.estado === estado;

      return (
        matchSearch &&
        matchFecha &&
        matchEstado
      );
    });
  }, [
    citas,
    search,
    fecha,
    estado,
  ]);

  const crearCita = () => {
    if (
      !nuevoPaciente.trim() ||
      !nuevoProfesional.trim() ||
      !nuevoServicio.trim() ||
      !nuevaFecha ||
      !nuevaHora
    ) {
      return;
    }

    const nuevoId =
      citas.length > 0
        ? Math.max(
            ...citas.map(
              (cita) => cita.id,
            ),
          ) + 1
        : 1;

    const nuevaCita: Cita = {
      id: nuevoId,
      paciente: nuevoPaciente.trim(),
      profesional:
        nuevoProfesional.trim(),
      servicio: nuevoServicio.trim(),
      fecha: nuevaFecha,
      hora: nuevaHora,
      estado: nuevoEstado,
    };

    setCitas((actuales) => [
      ...actuales,
      nuevaCita,
    ]);

    setNuevoPaciente("");
    setNuevoProfesional("");
    setNuevoServicio("");
    setNuevaFecha("");
    setNuevaHora("");
    setNuevoEstado("Agendada");
    setShowForm(false);
  };

  const limpiarFiltros = () => {
    setSearch("");
    setFecha("");
    setEstado("Todos");
  };

  return (
    <div className="min-h-full w-full bg-slate-50 p-6 transition-colors duration-300 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
          <header className="mb-7 flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Citas
              </h1>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Consulta y gestiona todas las
                citas del consultorio.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowForm(true)
              }
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <Plus size={18} />
              Nueva cita
            </button>
          </header>

          <section className="mb-7 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 transition-colors duration-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800">
              <Search
                size={18}
                className="shrink-0 text-slate-500 dark:text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar paciente..."
                className="h-full w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
              />

              <input
                type="date"
                value={fecha}
                onChange={(event) =>
                  setFecha(
                    event.target.value,
                  )
                }
                className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={estado}
              onChange={(event) =>
                setEstado(
                  event.target
                    .value as
                    | "Todos"
                    | EstadoCita,
                )
              }
              className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Todos">
                Todos los estados
              </option>

              <option value="Agendada">
                Agendada
              </option>

              <option value="Confirmada">
                Confirmada
              </option>

              <option value="Atendida">
                Atendida
              </option>

              <option value="Cancelada">
                Cancelada
              </option>
            </select>
          </section>

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Citas programadas
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {citasFiltradas.length}{" "}
                {citasFiltradas.length === 1
                  ? "cita encontrada"
                  : "citas encontradas"}
              </p>
            </div>

            {(search ||
              fecha ||
              estado !== "Todos") && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <CitasTable
            citas={citasFiltradas}
            loading={loading}
          />
        </div>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 transition-colors duration-300 dark:bg-slate-950/60"
          onClick={() =>
            setShowForm(false)
          }
        >
          <div
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Nueva cita
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Registra una nueva cita.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Cerrar formulario"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="paciente"
                  className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Paciente
                </label>

                <input
                  id="paciente"
                  type="text"
                  value={nuevoPaciente}
                  onChange={(event) =>
                    setNuevoPaciente(
                      event.target.value,
                    )
                  }
                  placeholder="Nombre del paciente"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="profesional"
                  className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Profesional
                </label>

                <input
                  id="profesional"
                  type="text"
                  value={nuevoProfesional}
                  onChange={(event) =>
                    setNuevoProfesional(
                      event.target.value,
                    )
                  }
                  placeholder="Profesional"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="servicio"
                  className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Servicio
                </label>

                <input
                  id="servicio"
                  type="text"
                  value={nuevoServicio}
                  onChange={(event) =>
                    setNuevoServicio(
                      event.target.value,
                    )
                  }
                  placeholder="Servicio"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="fecha-cita"
                  className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Fecha
                </label>

                <input
                  id="fecha-cita"
                  type="date"
                  value={nuevaFecha}
                  onChange={(event) =>
                    setNuevaFecha(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="hora-cita"
                  className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Hora
                </label>

                <input
                  id="hora-cita"
                  type="time"
                  value={nuevaHora}
                  onChange={(event) =>
                    setNuevaHora(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="estado-cita"
                  className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  Estado
                </label>

                <select
                  id="estado-cita"
                  value={nuevoEstado}
                  onChange={(event) =>
                    setNuevoEstado(
                      event.target
                        .value as EstadoCita,
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="Agendada">
                    Agendada
                  </option>

                  <option value="Confirmada">
                    Confirmada
                  </option>

                  <option value="Atendida">
                    Atendida
                  </option>

                  <option value="Cancelada">
                    Cancelada
                  </option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={crearCita}
                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
              >
                Crear cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}