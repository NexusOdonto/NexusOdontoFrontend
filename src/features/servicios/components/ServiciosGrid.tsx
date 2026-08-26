import { formatCurrency } from "../../../utils/currency";

interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: number;
  precio: number;
  activo: boolean;
}

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

interface ServiciosGridProps {
  servicios?: Servicio[];
}

export function ServiciosGrid({
  servicios = serviciosIniciales,
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

            <span
              className={`service-card-status ${
                servicio.activo
                  ? "service-card-status-active"
                  : "service-card-status-inactive"
              }`}
            >
              {servicio.activo
                ? "Activo"
                : "Inactivo"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}