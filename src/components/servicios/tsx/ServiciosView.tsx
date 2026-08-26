import { ServiciosGrid } from "../styles/ServiciosGrid.tsx";

export function ServiciosView() {
  return (
    <div className="services-page">
      <div className="services-content">
        <div className="services-page-header">
          <div>
            <h1>Servicios</h1>

            <p>
              Consulta los servicios disponibles del
              consultorio.
            </p>
          </div>
        </div>

        <ServiciosGrid />
      </div>
    </div>
  );
}