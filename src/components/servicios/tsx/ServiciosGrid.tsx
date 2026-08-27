import { MoreVertical } from "lucide-react";

import { formatCurrency } from "../../../utils/currency";
import "../styles/ServiciosGrid.css";

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  activo: boolean;
}

interface ServiciosGridProps {
  servicios: Servicio[];
}

export function ServiciosGrid({
  servicios,
}: ServiciosGridProps) {
  return (
    <div className="services-grid">
      {servicios.map((servicio) => (
        <article
          key={servicio.id}
          className={`service-card ${
            !servicio.activo
              ? "service-card-inactive"
              : ""
          }`}
        >
          <div className="service-card-top">
            <span
              className={`service-card-status ${
                servicio.activo
                  ? "service-card-status-active"
                  : "service-card-status-inactive"
              }`}
            >
              {servicio.activo
                ? "ACTIVO"
                : "INACTIVO"}
            </span>

            <button
              type="button"
              className="service-card-menu"
              aria-label={`Opciones de ${servicio.nombre}`}
            >
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="service-card-icon">
            🦷
          </div>

          <div className="service-card-content">
            <h2>{servicio.nombre}</h2>

            <p>{servicio.descripcion}</p>

            <div className="service-card-info">
              <span>
                ⏱ {servicio.duracion} min
              </span>

              <span>
                {formatCurrency(servicio.precio)}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}