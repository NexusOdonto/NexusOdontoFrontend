import "../css/PacientesTable.css";

interface Paciente {
  id: number | string;
  nombre: string;
  documento: string;
  telefono?: string;
  estado?: string;
}

interface PacientesTableProps {
  pacientes: Paciente[];
  loading: boolean;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PacientesTable({
  pacientes,
  loading,
  totalItems,
  totalPages,
  currentPage,
  onPageChange,
}: PacientesTableProps) {
  return (
    <section className="patients-table-container">
      <div className="patients-table-header">
        <div>
          <h2>Pacientes</h2>

          <p>
            {totalItems} paciente
            {totalItems !== 1 ? "s" : ""} registrado
            {totalItems !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="patients-table-wrapper">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map(
                (_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td>
                      <span className="patients-skeleton patients-skeleton-name" />
                    </td>

                    <td>
                      <span className="patients-skeleton" />
                    </td>

                    <td>
                      <span className="patients-skeleton" />
                    </td>

                    <td>
                      <span className="patients-skeleton patients-skeleton-status" />
                    </td>
                  </tr>
                ),
              )
            ) : pacientes.length > 0 ? (
              pacientes.map((paciente) => (
                <tr key={paciente.id}>
                  <td className="patient-name">
                    {paciente.nombre}
                  </td>

                  <td>{paciente.documento}</td>

                  <td>
                    {paciente.telefono ||
                      "No registrado"}
                  </td>

                  <td>
                    <span
                      className={`patient-status ${
                        paciente.estado?.toLowerCase() ===
                        "activo"
                          ? "patient-status-active"
                          : "patient-status-inactive"
                      }`}
                    >
                      {paciente.estado || "Activo"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="patients-empty"
                >
                  <div className="patients-empty-content">
                    <span className="patients-empty-icon">
                      ⌕
                    </span>

                    <strong>
                      No se encontraron pacientes
                    </strong>

                    <p>
                      Intenta buscar por otro nombre o
                      número de documento.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading &&
        pacientes.length > 0 &&
        totalPages > 1 && (
          <div className="patients-pagination">
            <span>
              Página {currentPage} de {totalPages}
            </span>

            <div className="patients-pagination-buttons">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  onPageChange(currentPage - 1)
                }
              >
                Anterior
              </button>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  onPageChange(currentPage + 1)
                }
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
    </section>
  );
}