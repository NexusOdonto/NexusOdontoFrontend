import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PacientesTable } from "../components/pacientes/PacientesTable";
import "../pages/PacienteRegistroView.css";

export interface Paciente {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  estado: string;
}

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

const STORAGE_KEY = "nexusodontopacientes";

const ITEMS_PER_PAGE = 5;
const DEBOUNCE_TIME = 400;
const INITIAL_LOADING_TIME = 800;

export function PacientesView() {
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pacientesGuardados =
      localStorage.getItem(STORAGE_KEY);

    if (pacientesGuardados) {
      try {
        const pacientesParseados = JSON.parse(
          pacientesGuardados,
        ) as Paciente[];

        setPacientes(pacientesParseados);
      } catch {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(pacientesIniciales),
        );

        setPacientes(pacientesIniciales);
      }
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(pacientesIniciales),
      );

      setPacientes(pacientesIniciales);
    }

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
    <div className="patients-page">
      <div className="patients-content">
        <div className="patients-page-title">
          <div>
            <h1>Pacientes</h1>

            <p>
              Consulta y administra los pacientes activos del
              consultorio.
            </p>
          </div>

          <button
            type="button"
            className="patients-primary-button"
            onClick={() => navigate("/pacientes/nuevo")}
          >
            + Nuevo paciente
          </button>
        </div>

        <section className="patients-search">
          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              handleSearch(event.target.value)
            }
            placeholder="Buscar por nombre o número de documento..."
            aria-label="Buscar pacientes"
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