import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PacientesTable } from "./components/PacientesTable";
import { PACIENTES_STORAGE_KEY, type Paciente } from "../../types/pacientes";

const pacientesIniciales: Paciente[] = [
  {
    id: 1,
    nombre: "Ana María Rodríguez",
    documento: "1098765432",
    telefono: "3001234567",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Carlos Andrés Pérez",
    documento: "1023456789",
    telefono: "3012345678",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "María Fernanda López",
    documento: "1009876543",
    telefono: "3023456789",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Juan David Gómez",
    documento: "1091234567",
    telefono: "3034567890",
    estado: "Activo",
  },
  {
    id: 5,
    nombre: "Laura Daniela Torres",
    documento: "1012345678",
    telefono: "3045678901",
    estado: "Activo",
  },
  {
    id: 6,
    nombre: "Sebastián Martínez",
    documento: "1087654321",
    telefono: "3056789012",
    estado: "Activo",
  },
];

const ITEMS_PER_PAGE = 5;
const DEBOUNCE_TIME = 400;
const INITIAL_LOADING_TIME = 800;

function cargarPacientes(): Paciente[] {
  const pacientesGuardados = localStorage.getItem(
    PACIENTES_STORAGE_KEY,
  );

  if (!pacientesGuardados) {
    localStorage.setItem(
      PACIENTES_STORAGE_KEY,
      JSON.stringify(pacientesIniciales),
    );

    return pacientesIniciales;
  }

  try {
    const pacientes = JSON.parse(
      pacientesGuardados,
    ) as Paciente[];

    if (Array.isArray(pacientes)) {
      return pacientes;
    }

    localStorage.setItem(
      PACIENTES_STORAGE_KEY,
      JSON.stringify(pacientesIniciales),
    );

    return pacientesIniciales;
  } catch {
    localStorage.setItem(
      PACIENTES_STORAGE_KEY,
      JSON.stringify(pacientesIniciales),
    );

    return pacientesIniciales;
  }
}

export function PacientesView() {
  const navigate = useNavigate();

  const [pacientes] = useState<Paciente[]>(cargarPacientes);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, INITIAL_LOADING_TIME);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, DEBOUNCE_TIME);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchInput]);

  const pacientesFiltrados = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return pacientes;
    }

    return pacientes.filter(
      (paciente) =>
        paciente.nombre
          .toLowerCase()
          .includes(searchValue) ||
        paciente.documento.includes(searchValue),
    );
  }, [pacientes, search]);

  const totalItems = pacientesFiltrados.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / ITEMS_PER_PAGE),
  );

  const pacientesPagina = pacientesFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Pacientes
            </h1>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Consulta y administra los pacientes activos del
              consultorio.
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-800 transition-all active:scale-[0.98]"
            onClick={() => navigate("/pacientes/nuevo")}
          >
            + Nuevo paciente
          </button>
        </div>

        <section className="mb-6">
          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              handleSearch(event.target.value)
            }
            placeholder="Buscar por nombre o número de documento..."
            aria-label="Buscar pacientes"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </section>

        <PacientesTable
          pacientes={pacientesPagina}
          loading={loading}
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}