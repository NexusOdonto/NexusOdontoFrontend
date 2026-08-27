import {
  ChevronDown,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ServiciosGrid } from "../../servicios/tsx/ServiciosGrid";
import "../../servicios/styles/ServicioView.css";

export interface Servicio {
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

export function ServiciosView() {
  const [servicios, setServicios] =
    useState<Servicio[]>(serviciosIniciales);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("todos");

  const [priceFilter, setPriceFilter] =
    useState("todos");

  const [showNewService, setShowNewService] =
    useState(false);

  const [newServiceName, setNewServiceName] =
    useState("");

  const [
    newServiceDescription,
    setNewServiceDescription,
  ] = useState("");

  const [
    newServiceDuration,
    setNewServiceDuration,
  ] = useState("");

  const [newServicePrice, setNewServicePrice] =
    useState("");

  const serviciosFiltrados = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return servicios.filter((servicio) => {
      const matchesSearch =
        !searchValue ||
        servicio.nombre
          .toLowerCase()
          .includes(searchValue) ||
        servicio.descripcion
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" &&
          servicio.activo) ||
        (statusFilter === "inactivos" &&
          !servicio.activo);

      const matchesPrice =
        priceFilter === "todos" ||
        (priceFilter === "low" &&
          servicio.precio < 50000) ||
        (priceFilter === "medium" &&
          servicio.precio >= 50000 &&
          servicio.precio <= 80000) ||
        (priceFilter === "high" &&
          servicio.precio > 80000);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPrice
      );
    });
  }, [
    servicios,
    search,
    statusFilter,
    priceFilter,
  ]);

  const handleCreateService = () => {
    const nombre = newServiceName.trim();
    const descripcion =
      newServiceDescription.trim();

    const duracion =
      Number(newServiceDuration);

    const precio = Number(newServicePrice);

    if (
      !nombre ||
      !descripcion ||
      !Number.isFinite(duracion) ||
      duracion <= 0 ||
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      return;
    }

    const nuevoId =
      servicios.length > 0
        ? Math.max(
            ...servicios.map(
              (servicio) => servicio.id,
            ),
          ) + 1
        : 1;

    const nuevoServicio: Servicio = {
      id: nuevoId,
      nombre,
      descripcion,
      duracion,
      precio,
      activo: true,
    };

    setServicios((prev) => [
      ...prev,
      nuevoServicio,
    ]);

    setNewServiceName("");
    setNewServiceDescription("");
    setNewServiceDuration("");
    setNewServicePrice("");
    setShowNewService(false);
  };

  return (
    <div className="services-page">
      <div className="services-content">
        <header className="services-page-header">
          <div className="services-page-heading">
            <h1>Servicios Odontológicos</h1>

            <p>
              Gestión y catálogo de procedimientos
              clínicos
            </p>
          </div>

          <button
            type="button"
            className="services-new-button"
            onClick={() =>
              setShowNewService(true)
            }
          >
            <Plus size={17} />

            <span>Nuevo Servicio</span>
          </button>
        </header>

        <section className="services-toolbar">
          <div className="services-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar servicios..."
              aria-label="Buscar servicios"
            />
          </div>

          <label className="services-filter-select">
            <span>
              {statusFilter === "todos"
                ? "Todos los estados"
                : statusFilter === "activos"
                  ? "Activos"
                  : "Inactivos"}
            </span>

            <ChevronDown size={15} />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
              }
              aria-label="Filtrar por estado"
            >
              <option value="todos">
                Todos los estados
              </option>

              <option value="activos">
                Activos
              </option>

              <option value="inactivos">
                Inactivos
              </option>
            </select>
          </label>

          <label className="services-filter-select">
            <span>
              {priceFilter === "todos"
                ? "Todos los precios"
                : priceFilter === "low"
                  ? "Menos de $50.000"
                  : priceFilter === "medium"
                    ? "$50.000 - $80.000"
                    : "Más de $80.000"}
            </span>

            <ChevronDown size={15} />

            <select
              value={priceFilter}
              onChange={(event) =>
                setPriceFilter(
                  event.target.value,
                )
              }
              aria-label="Filtrar por precio"
            >
              <option value="todos">
                Todos los precios
              </option>

              <option value="low">
                Menos de $50.000
              </option>

              <option value="medium">
                $50.000 - $80.000
              </option>

              <option value="high">
                Más de $80.000
              </option>
            </select>
          </label>
        </section>

        <div className="services-results-info">
          <span>
            {serviciosFiltrados.length} servicios
            encontrados
          </span>

          {(search ||
            statusFilter !== "todos" ||
            priceFilter !== "todos") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("todos");
                setPriceFilter("todos");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {serviciosFiltrados.length > 0 ? (
          <ServiciosGrid
            servicios={serviciosFiltrados}
          />
        ) : (
          <div className="services-empty">
            <div className="services-empty-icon">
              <Search size={20} />
            </div>

            <h2>
              No se encontraron servicios
            </h2>

            <p>
              Prueba con otro nombre o cambia
              los filtros seleccionados.
            </p>
          </div>
        )}
      </div>

      {showNewService && (
        <div
          className="services-modal-overlay"
          onClick={() =>
            setShowNewService(false)
          }
        >
          <div
            className="services-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="services-modal-header">
              <div>
                <span>NUEVO SERVICIO</span>

                <h2>Crear servicio</h2>
              </div>

              <button
                type="button"
                className="services-modal-close"
                onClick={() =>
                  setShowNewService(false)
                }
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="services-modal-form">
              <div className="services-modal-field">
                <label htmlFor="serviceName">
                  Nombre
                </label>

                <input
                  id="serviceName"
                  type="text"
                  value={newServiceName}
                  onChange={(event) =>
                    setNewServiceName(
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Limpieza dental"
                />
              </div>

              <div className="services-modal-field">
                <label htmlFor="serviceDescription">
                  Descripción
                </label>

                <textarea
                  id="serviceDescription"
                  value={newServiceDescription}
                  onChange={(event) =>
                    setNewServiceDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe brevemente el servicio..."
                  rows={3}
                />
              </div>

              <div className="services-modal-row">
                <div className="services-modal-field">
                  <label htmlFor="serviceDuration">
                    Duración
                  </label>

                  <input
                    id="serviceDuration"
                    type="number"
                    min="1"
                    value={newServiceDuration}
                    onChange={(event) =>
                      setNewServiceDuration(
                        event.target.value,
                      )
                    }
                    placeholder="60"
                  />
                </div>

                <div className="services-modal-field">
                  <label htmlFor="servicePrice">
                    Precio
                  </label>

                  <input
                    id="servicePrice"
                    type="number"
                    min="0"
                    value={newServicePrice}
                    onChange={(event) =>
                      setNewServicePrice(
                        event.target.value,
                      )
                    }
                    placeholder="80000"
                  />
                </div>
              </div>

              <div className="services-modal-actions">
                <button
                  type="button"
                  className="services-modal-cancel"
                  onClick={() =>
                    setShowNewService(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="services-modal-submit"
                  onClick={handleCreateService}
                >
                  Crear servicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}