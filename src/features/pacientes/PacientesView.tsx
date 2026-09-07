import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PacientesTable } from "./components/PacientesTable";
import { PacientesGrid } from "./components/PacientesGrid";
import { PacienteDetailModal } from "./components/PacienteDetailModal";
import {
  PACIENTES_STORAGE_KEY,
  type Paciente,
} from "../../types/pacientes";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { areGuidsEqual } from "../../utils/roleUtils";
import { Plus, RefreshCw, LayoutGrid, List, Download } from "lucide-react";

const ITEMS_PER_PAGE = 6;

export function PacientesView() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<"todos" | "activos" | "citas">("todos");
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsRes, personsRes] = await Promise.allSettled([
        patientService.getAll(),
        personService.getAll()
      ]);

      const patientsData = patientsRes.status === "fulfilled" && Array.isArray(patientsRes.value) ? patientsRes.value : [];
      const personsData = personsRes.status === "fulfilled" && Array.isArray(personsRes.value) ? personsRes.value : [];

      const combinedPacientes: Paciente[] = [];
      const seenIdentifiers = new Set<string>();

      // 1. Mapear Patients de la API
      if (patientsData && patientsData.length > 0) {
        patientsData.forEach((p, idx) => {
          const person = personsData.find((per) => areGuidsEqual(per.id, p.personId));
          const fullName = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : (p.firstName ? `${p.firstName} ${p.lastName}`.trim() : `Paciente #${idx + 1}`);
          const doc = person?.documentNumber || p.documentNumber || "";
          const tel = person?.phone || p.phone || p.emergencyContactPhone || "";
          const email = person?.email || p.email || "";
          const key = (doc || email || fullName).toLowerCase();

          if (!seenIdentifiers.has(key)) {
            seenIdentifiers.add(key);
            combinedPacientes.push({
              id: combinedPacientes.length + 1,
              nombre: fullName,
              documento: doc,
              telefono: tel,
              estado: "Activo",
              correo: email,
              fechaNacimiento: person?.dateOfBirth || p.dateOfBirth,
            });
          }
        });
      }

      // 2. Mapear Personas de la API (incluyendo usuarios registrados por Google o por endpoint)
      if (personsData && Array.isArray(personsData)) {
        personsData.forEach((person) => {
          const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim();
          const doc = person.documentNumber || "";
          const email = person.email || "";
          const key = (doc || email || fullName).toLowerCase();

          if (fullName && !seenIdentifiers.has(key)) {
            seenIdentifiers.add(key);
            combinedPacientes.push({
              id: combinedPacientes.length + 1,
              nombre: fullName,
              documento: doc,
              telefono: person.phone || "",
              estado: "Activo",
              correo: email,
              fechaNacimiento: person.dateOfBirth,
            });
          }
        });
      }

      // 3. Inspeccionar todas las fuentes de almacenamiento local (Google Auth, usuarios registrados, formularios)
      const storageKeys = [
        PACIENTES_STORAGE_KEY,
        "pacientes",
        "nexus_pacientes",
        "nexus_pacientes_v1",
        "nexus_users",
        "auth_user",
      ];

      storageKeys.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
            list.forEach((item: any) => {
              const fullName = item.nombre || (item.nombres ? `${item.nombres} ${item.apellidos || ""}`.trim() : (item.name || (item.firstName ? `${item.firstName} ${item.lastName || ""}`.trim() : "")));
              const doc = item.documento || item.documentNumber || item.cedula || "";
              const tel = item.telefono || item.phone || item.mobile || "";
              const email = item.correo || item.email || "";
              const key = (doc || email || fullName).toLowerCase();

              // Si es un paciente (o usuario con rol paciente/registrado) y no está en la lista
              if (fullName && !seenIdentifiers.has(key) && item.rol !== "ODONTOLOGO" && item.rol !== "ADMINISTRADOR") {
                seenIdentifiers.add(key);
                combinedPacientes.unshift({
                  id: combinedPacientes.length + 1,
                  nombre: fullName,
                  documento: doc,
                  telefono: tel,
                  estado: "Activo",
                  correo: email,
                  fechaNacimiento: item.fechaNacimiento || item.dateOfBirth,
                });
              }
            });
          } catch {
            // Ignore
          }
        }
      });

      // 4. Si la lista está vacía, incluir seeders de Oracle
      if (combinedPacientes.length === 0) {
        const seedDefaults: Paciente[] = [
          { id: 1, nombre: "Andrés Pérez", documento: "1076543210", telefono: "+573101234567", correo: "paciente@nexusodonto.com", estado: "Activo" },
          { id: 2, nombre: "Camila López", documento: "1098765436", telefono: "+573112345678", correo: "camila.lopez@correo.com", estado: "Activo" },
          { id: 3, nombre: "Felipe Torres", documento: "1098765437", telefono: "+573123456789", correo: "felipe.torres@correo.com", estado: "Activo" },
          { id: 4, nombre: "Valentina Mendoza", documento: "1098765438", telefono: "+573134567890", correo: "valentina.mendoza@correo.com", estado: "Activo" },
        ];
        setPacientes(seedDefaults);
      } else {
        setPacientes(combinedPacientes);
      }
    } catch (err) {
      console.warn("API Patients unavailable, using unified records:", err);
      const seedDefaults: Paciente[] = [
        { id: 1, nombre: "Andrés Pérez", documento: "1076543210", telefono: "+573101234567", correo: "paciente@nexusodonto.com", estado: "Activo" },
      ];
      setPacientes(seedDefaults);
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
    let result = pacientes;

    // Filtro por tab activo
    if (activeTab === "activos") {
      result = result.filter((p) => p.estado?.toLowerCase() === "activo");
    } else if (activeTab === "citas") {
      result = result.filter((p) => Boolean(p.proximaCita));
    }

    const query = debouncedSearch.toLowerCase().trim();
    if (!query) return result;

    return result.filter(
      (paciente) =>
        paciente.nombre.toLowerCase().includes(query) ||
        paciente.documento.includes(query) ||
        paciente.telefono.includes(query)
    );
  }, [pacientes, debouncedSearch, activeTab]);

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

  const handleExportCSV = () => {
    const headers = ["Nombre", "Documento", "Telefono", "Estado"];
    const rows = pacientes.map((p) => [p.nombre, p.documento, p.telefono, p.estado]);
    const content = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "directorio_pacientes_nexusodonto.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Directorio de Pacientes
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Gestión integral de expediente clínico y catálogo de pacientes.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 text-xs font-semibold shadow-sm"
            title="Exportar CSV"
          >
            <Download size={15} className="text-cyan-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchPacientes}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            title="Recargar datos"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/pacientes/nuevo")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA + FILTROS RÁPIDOS + CONMUTADOR DE VISTA */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 animate-slideUp animate-stagger-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:max-w-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="currentColor"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 pointer-events-none"
            >
              <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 dark:bg-slate-950/65 border border-slate-200 dark:border-white/20 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-cyan-500 dark:focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 dark:focus:ring-cyan-400/40 transition-all backdrop-blur-xl shadow-md"
            />
          </div>

          {/* Pestañas de filtrado rápido */}
          <div className="flex items-center rounded-2xl bg-white/90 dark:bg-slate-950/65 p-1 border border-slate-200 dark:border-white/20 backdrop-blur-xl shadow-md overflow-x-auto">
            <button
              type="button"
              onClick={() => { setActiveTab("todos"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "todos"
                  ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Todos ({pacientes.length})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("activos"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "activos"
                  ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Activos
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("citas"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "citas"
                  ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Con Citas
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mr-1 hidden sm:inline">Vista:</span>
          <div className="flex rounded-xl bg-white/90 dark:bg-slate-950/65 p-1 border border-slate-200 dark:border-white/20 backdrop-blur-xl shadow-md">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Tarjetas</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List size={14} />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDERIZADO SEGÚN VISTA SELECCIONADA */}
      <div className="pt-2 animate-slideUp animate-stagger-2">
        {viewMode === "grid" ? (
          <PacientesGrid
            pacientes={paginatedPacientes}
            loading={loading}
            totalItems={pacientesFiltrados.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onSelectPaciente={(p) => setSelectedPaciente(p)}
          />
        ) : (
          <PacientesTable
            pacientes={paginatedPacientes}
            loading={loading}
            totalItems={pacientesFiltrados.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onSelectPaciente={(p) => setSelectedPaciente(p)}
          />
        )}
      </div>

      {/* MODAL FICHA CLÍNICA DEL PACIENTE */}
      {selectedPaciente && (
        <PacienteDetailModal
          paciente={selectedPaciente}
          onClose={() => setSelectedPaciente(null)}
        />
      )}
    </div>
  );
}
