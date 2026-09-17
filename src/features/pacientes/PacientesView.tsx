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
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";
import { Plus, LayoutGrid, List, Download } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const isSystemOrAdminAccount = (item: { nombre?: string; name?: string; correo?: string; email?: string; rol?: string; role?: string; documento?: string; documentNumber?: string; cedula?: string; isPatient?: boolean }) => {
  const role = (item.rol || item.role || "").toLowerCase().trim();
  const email = (item.correo || item.email || "").toLowerCase().trim();
  const doc = (item.documento || item.documentNumber || item.cedula || "").toUpperCase().trim();
  const name = (item.nombre || item.name || "").toLowerCase().trim();

  // Exclusión absoluta de roles administrativos, clínicos de staff o bots técnicos (BUG-12)
  const esStaffOBot = ["administrator", "admin", "dentist", "odontologo", "receptionist", "recepcionista", "bot service", "botservice", "asistente"].some(r => role.includes(r));
  const esDocBot = doc.startsWith("BOT-") || email.startsWith("bot@") || email.includes("service-01") || name.includes("bot-service");
  const esEmailStaff = email.startsWith("admin@") || email.startsWith("recepcion@") || email.startsWith("reception@");

  if (esStaffOBot || esDocBot || esEmailStaff) {
    return true;
  }
  return false;
};

export function PacientesView() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<"todos" | "activos" | "inactivos" | "citas">("todos");
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

      // 1. Mapear Patients de la API (entidades clínicas reales)
      if (patientsData && patientsData.length > 0) {
        patientsData.forEach((p, idx) => {
          const person = personsData.find((per) => areGuidsEqual(per.id, p.personId));
          const fullName = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : (p.firstName ? `${p.firstName} ${p.lastName}`.trim() : `Paciente #${idx + 1}`);
          const doc = person?.documentNumber || p.documentNumber || "";
          const tel = person?.phone || p.phone || p.emergencyContactPhone || "";
          const email = person?.email || p.email || "";

          if (isSystemOrAdminAccount({ nombre: fullName, email, documento: doc })) {
            return;
          }

          const rawIsActive = p.isActive !== undefined 
            ? p.isActive 
            : ((p as any).status !== undefined 
                ? ((p as any).status === 1 || (p as any).status === 'Activo' || (p as any).status === 'Active' || (p as any).status === true) 
                : (person?.isActive !== undefined 
                    ? person.isActive 
                    : ((p as any).estado ? String((p as any).estado).toLowerCase() === 'activo' : true)));
          const resolvedEstado = (rawIsActive === false || (p as any).estado === 'Inactivo' || (p as any).status === 'Inactive' || (p as any).status === 0 || p.isActive === false) ? 'Inactivo' : 'Activo';

          const key = (doc || email || fullName).toLowerCase();

          if (!seenIdentifiers.has(key)) {
            seenIdentifiers.add(key);
            combinedPacientes.push({
              id: p.id || combinedPacientes.length + 1,
              patientId: p.id,
              personId: p.personId,
              nombre: fullName,
              documento: doc,
              telefono: tel,
              estado: resolvedEstado,
              correo: email,
              fechaNacimiento: person?.dateOfBirth || p.dateOfBirth,
            });
          }
        });
      }

      // 2. Inspeccionar fuentes de almacenamiento local descartando staff / admin
      const storageKeys = [
        PACIENTES_STORAGE_KEY,
        "pacientes",
        "nexus_pacientes",
        "nexus_pacientes_v1",
      ];

      storageKeys.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
            list.forEach((item: any, itemIdx: number) => {
              const fullName = item.nombre || (item.nombres ? `${item.nombres} ${item.apellidos || ""}`.trim() : (item.name || (item.firstName ? `${item.firstName} ${item.lastName || ""}`.trim() : "")));
              const doc = item.documento || item.documentNumber || item.cedula || "";
              const tel = item.telefono || item.phone || item.mobile || "";
              const email = item.correo || item.email || "";

              if (isSystemOrAdminAccount({ nombre: fullName, email, rol: item.rol, role: item.role, documento: doc })) {
                return;
              }

              const rawIsActive = item.isActive !== undefined 
                ? item.isActive 
                : (item.status !== undefined 
                    ? (item.status === 1 || item.status === 'Activo' || item.status === 'Active' || item.status === true) 
                    : (item.estado ? item.estado.toLowerCase() === 'activo' : true));
              const resolvedEstado = (rawIsActive === false || item.estado === 'Inactivo' || item.status === 'Inactive' || item.status === 0 || item.isActive === false) ? 'Inactivo' : 'Activo';

              const key = (doc || email || fullName).toLowerCase();

              if (fullName && !seenIdentifiers.has(key)) {
                seenIdentifiers.add(key);
                combinedPacientes.unshift({
                  id: item.patientId || item.id || `local-pt-${itemIdx}-${Date.now()}`,
                  patientId: item.patientId || (typeof item.id === "string" && item.id.length > 8 ? item.id : undefined),
                  personId: item.personId,
                  nombre: fullName,
                  documento: doc,
                  telefono: tel,
                  estado: resolvedEstado,
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

      // 3. Establecer pacientes combinados reales sin inventar mocks ficticios (Sección 3.9)
      setPacientes(combinedPacientes);
    } catch (err) {
      console.warn("API Patients unavailable, using unified records:", err);
      setPacientes([]);
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

  const clinicalPatients = useMemo(() => {
    return pacientes.filter((p) => !isSystemOrAdminAccount(p));
  }, [pacientes]);

  const activosCount = useMemo(() => {
    return clinicalPatients.filter(
      (p) =>
        p.estado?.toLowerCase() === "activo" ||
        ((p as any).isActive !== false && p.estado?.toLowerCase() !== "inactivo")
    ).length;
  }, [clinicalPatients]);

  const inactivosCount = useMemo(() => {
    return clinicalPatients.filter(
      (p) =>
        p.estado?.toLowerCase() === "inactivo" ||
        (p as any).isActive === false
    ).length;
  }, [clinicalPatients]);

  const conCitasCount = useMemo(() => {
    return clinicalPatients.filter((p) => Boolean(p.proximaCita)).length;
  }, [clinicalPatients]);

  const pacientesFiltrados = useMemo(() => {
    let result = clinicalPatients;

    // Filtro por tab activo
    if (activeTab === "activos") {
      result = result.filter(
        (p) =>
          p.estado?.toLowerCase() === "activo" ||
          ((p as any).isActive !== false && p.estado?.toLowerCase() !== "inactivo")
      );
    } else if (activeTab === "inactivos") {
      result = result.filter(
        (p) =>
          p.estado?.toLowerCase() === "inactivo" ||
          (p as any).isActive === false
      );
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
  }, [clinicalPatients, debouncedSearch, activeTab]);

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

  const handleToggleEstado = async (paciente: Paciente) => {
    const isActivo =
      paciente.estado?.toLowerCase() === "activo" ||
      ((paciente as any).isActive !== false && paciente.estado?.toLowerCase() !== "inactivo");
    const nuevoEstado = isActivo ? "Inactivo" : "Activo";
    const nuevoIsActive = !isActivo;

    // Actualización optimista del estado local
    setPacientes((prev) =>
      prev.map((p) =>
        p.id === paciente.id || (p.patientId && p.patientId === paciente.patientId)
          ? { ...p, estado: nuevoEstado, isActive: nuevoIsActive }
          : p
      )
    );

    if (
      selectedPaciente &&
      (selectedPaciente.id === paciente.id || selectedPaciente.patientId === paciente.patientId)
    ) {
      setSelectedPaciente((prev) => (prev ? { ...prev, estado: nuevoEstado, isActive: nuevoIsActive } : null));
    }

    // Sincronizar con API
    if (paciente.patientId) {
      try {
        await patientService.update(paciente.patientId, { isActive: nuevoIsActive });
      } catch (err) {
        console.warn("No se pudo actualizar estado en API:", err);
      }
    }

    // Sincronizar con almacenamiento local
    try {
      const raw = localStorage.getItem(PACIENTES_STORAGE_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map((item: any) => {
            if (
              item.id === paciente.id ||
              item.patientId === paciente.patientId ||
              item.documento === paciente.documento
            ) {
              return { ...item, estado: nuevoEstado, isActive: nuevoIsActive };
            }
            return item;
          });
          localStorage.setItem(PACIENTES_STORAGE_KEY, JSON.stringify(updated));
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleExportCSV = () => {
    const headers = "ID,Nombre,Documento,Telefono,Estado,Proxima Cita,Correo\n";
    const rows = pacientesFiltrados
      .map(
        (p) =>
          `"${p.id}","${p.nombre}","${p.documento}","${p.telefono}","${p.estado}","${p.proximaCita || ""}","${p.correo || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pacientes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-10 animate-fadeIn">
      {/* HEADER DE PÁGINA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-white/10 pb-5 animate-slideDown">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Directorio de Pacientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gestión de fichas clínicas, contacto y estado de pacientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all text-xs sm:text-sm font-semibold cursor-pointer backdrop-blur-md active:scale-95 shadow-sm"
            title="Descargar lista en CSV"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            type="button"
            onClick={fetchPacientes}
            disabled={loading}
            className="group p-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 shadow-sm flex items-center justify-center disabled:opacity-60"
            title="Recargar pacientes"
          >
            <DentistryReloadIcon size={20} loading={loading} />
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
              Todos ({clinicalPatients.length})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("activos"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "activos"
                  ? "bg-emerald-500/15 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 dark:border-emerald-400/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Activos ({activosCount})
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab("inactivos"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "inactivos"
                  ? "bg-rose-500/15 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 border border-rose-500/30 dark:border-rose-400/40 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Inactivos ({inactivosCount})
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
              Con Citas ({conCitasCount})
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
          onToggleEstado={handleToggleEstado}
        />
      )}
    </div>
  );
}