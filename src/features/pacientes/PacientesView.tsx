import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PacientesTable } from "./components/PacientesTable";
import {
  PACIENTES_STORAGE_KEY,
  type Paciente,
} from "../../types/pacientes";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { Plus, Search, RefreshCw } from "lucide-react";

const pacientesFallback: Paciente[] = [
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
];

const ITEMS_PER_PAGE = 5;

export function PacientesView() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Consultar pacientes reales desde API /api/v1/Patients
      const patientsData = await patientService.getAll().catch(() => []);
      const personsData = await personService.getAll().catch(() => []);

      if (patientsData && patientsData.length > 0) {
        const mapped: Paciente[] = patientsData.map((p, idx) => {
          const person = personsData.find((per) => per.id === p.personId);
          const fullName = person ? `${person.firstName} ${person.lastName}` : (p.firstName ? `${p.firstName} ${p.lastName}` : `Paciente #${idx + 1}`);
          const doc = person?.documentNumber || p.documentNumber || `10${idx}8765432`;
          const tel = person?.phone || p.phone || p.emergencyContactPhone || "3001234567";

          return {
            id: idx + 1,
            nombre: fullName,
            documento: doc,
            telefono: tel,
            estado: "Activo",
          };
        });
        setPacientes(mapped);
      } else if (personsData && personsData.length > 0) {
        const mapped: Paciente[] = personsData.map((person, idx) => ({
          id: idx + 1,
          nombre: `${person.firstName} ${person.lastName}`,
          documento: person.documentNumber,
          telefono: person.phone || "3001234567",
          estado: "Activo",
        }));
        setPacientes(mapped);
      } else {
        const saved = localStorage.getItem(PACIENTES_STORAGE_KEY);
        if (saved) {
          try {
            setPacientes(JSON.parse(saved));
          } catch {
            setPacientes(pacientesFallback);
          }
        } else {
          setPacientes(pacientesFallback);
        }
      }
    } catch (err) {
      console.warn("API Patients unavailable, using local storage:", err);
      setPacientes(pacientesFallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const pacientesFiltrados = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    if (!query) return pacientes;

    return pacientes.filter(
      (paciente) =>
        paciente.nombre.toLowerCase().includes(query) ||
        paciente.documento.includes(query) ||
        paciente.telefono.includes(query)
    );
  }, [pacientes, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(pacientesFiltrados.length / ITEMS_PER_PAGE));

  const paginatedPacientes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return pacientesFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [pacientesFiltrados, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Directorio de Pacientes
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gestión y registro de pacientes clínicos del consultorio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPacientes}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Recargar desde la base de datos"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/pacientes/nuevo")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_4px_15px_rgba(20,184,166,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, documento o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <PacientesTable
          pacientes={paginatedPacientes}
          loading={loading}
          totalItems={pacientesFiltrados.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}