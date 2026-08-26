import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Paciente } from "./PacientesView";
import "../pages/PacientesView.css";

interface FormData {
  nombre: string;
  documento: string;
  fechaNacimiento: string;
  genero: string;
  correo: string;
  telefono: string;
  tutor: string;
  vinculo: string;
  alergias: boolean;
  medicacion: boolean;
  observaciones: string;
}

const STORAGE_KEY = "nexusodontopacientes";

const initialForm: FormData = {
  nombre: "",
  documento: "",
  fechaNacimiento: "",
  genero: "",
  correo: "",
  telefono: "",
  tutor: "",
  vinculo: "",
  alergias: false,
  medicacion: false,
  observaciones: "",
};

export function PacienteRegistroView() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>(initialForm);
  const [tutorEnabled, setTutorEnabled] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (
    field: keyof FormData,
    value: string | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors([]);
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!form.nombre.trim()) {
      newErrors.push("El nombre completo es obligatorio.");
    }

    if (!form.documento.trim()) {
      newErrors.push("El documento es obligatorio.");
    }

    if (!form.fechaNacimiento) {
      newErrors.push(
        "La fecha de nacimiento es obligatoria.",
      );
    }

    if (!form.genero) {
      newErrors.push("Debes seleccionar un género.");
    }

    if (!form.telefono.trim()) {
      newErrors.push(
        "El teléfono celular es obligatorio.",
      );
    }

    if (
      form.correo.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)
    ) {
      newErrors.push(
        "El correo electrónico no tiene un formato válido.",
      );
    }

    if (tutorEnabled && !form.tutor.trim()) {
      newErrors.push(
        "Debes ingresar el nombre del tutor.",
      );
    }

    if (tutorEnabled && !form.vinculo) {
      newErrors.push(
        "Debes seleccionar el vínculo del tutor.",
      );
    }

    return newErrors;
  };

  const handleTutorToggle = (enabled: boolean) => {
    setTutorEnabled(enabled);

    if (!enabled) {
      setForm((prev) => ({
        ...prev,
        tutor: "",
        vinculo: "",
      }));
    }

    setErrors([]);
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();

    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    const pacientesGuardados =
      localStorage.getItem(STORAGE_KEY);

    let pacientes: Paciente[] = [];

    if (pacientesGuardados) {
      try {
        pacientes = JSON.parse(
          pacientesGuardados,
        ) as Paciente[];
      } catch {
        pacientes = [];
      }
    }

    const nuevoPaciente: Paciente = {
      id: Date.now(),
      nombre: form.nombre.trim(),
      documento: form.documento.trim(),
      telefono: form.telefono.trim(),
      estado: "Activo",
    };

    const pacientesActualizados = [
      ...pacientes,
      nuevoPaciente,
    ];

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(pacientesActualizados),
    );

    navigate("/pacientes");
  };

  return (
    <div className="patient-register-page">
      <div className="patient-register-content">
        <button
          type="button"
          className="patient-register-back"
          onClick={() => navigate("/pacientes")}
        >
          ← Volver a Pacientes
        </button>

        <div className="patient-register-card">
          <div className="patient-register-header">
            <h1>Alta Rápida de Paciente</h1>

            <p>
              Complete los datos fundamentales para registrar
              un nuevo paciente en el sistema.
            </p>
          </div>

          {errors.length > 0 && (
            <div className="patient-register-alert patient-register-alert-error">
              <strong>
                Revisa la información ingresada
              </strong>

              <ul>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <section className="patient-register-section">
            <h2>Datos personales</h2>

            <div className="patient-register-grid">
              <div className="patient-register-field">
                <label htmlFor="nombre">
                  Nombre completo *
                </label>

                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(event) =>
                    handleChange(
                      "nombre",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="patient-register-field">
                <label htmlFor="documento">
                  DNI / Documento *
                </label>

                <input
                  id="documento"
                  type="text"
                  value={form.documento}
                  onChange={(event) =>
                    handleChange(
                      "documento",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. 12345678"
                />
              </div>

              <div className="patient-register-field">
                <label htmlFor="fechaNacimiento">
                  Fecha de nacimiento *
                </label>

                <input
                  id="fechaNacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(event) =>
                    handleChange(
                      "fechaNacimiento",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="patient-register-field">
                <label htmlFor="genero">
                  Género *
                </label>

                <select
                  id="genero"
                  value={form.genero}
                  onChange={(event) =>
                    handleChange(
                      "genero",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Seleccione...
                  </option>

                  <option value="femenino">
                    Femenino
                  </option>

                  <option value="masculino">
                    Masculino
                  </option>

                  <option value="otro">
                    Otro
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="patient-register-section">
            <h2>Información de contacto</h2>

            <div className="patient-register-grid">
              <div className="patient-register-field">
                <label htmlFor="correo">
                  Correo electrónico
                </label>

                <input
                  id="correo"
                  type="email"
                  value={form.correo}
                  onChange={(event) =>
                    handleChange(
                      "correo",
                      event.target.value,
                    )
                  }
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div className="patient-register-field">
                <label htmlFor="telefono">
                  Teléfono celular *
                </label>

                <input
                  id="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={(event) =>
                    handleChange(
                      "telefono",
                      event.target.value,
                    )
                  }
                  placeholder="300 123 4567"
                />
              </div>
            </div>
          </section>

          <section className="patient-register-tutor">
            <div className="patient-register-tutor-header">
              <h2>Tutor legal</h2>

              <label className="patient-register-checkbox">
                <input
                  type="checkbox"
                  checked={tutorEnabled}
                  onChange={(event) =>
                    handleTutorToggle(
                      event.target.checked,
                    )
                  }
                />

                <span>Habilitar</span>
              </label>
            </div>

            <div className="patient-register-grid">
              <div className="patient-register-field">
                <label htmlFor="tutor">
                  Nombre del tutor
                </label>

                <input
                  id="tutor"
                  type="text"
                  value={form.tutor}
                  onChange={(event) =>
                    handleChange(
                      "tutor",
                      event.target.value,
                    )
                  }
                  placeholder="Nombre completo"
                  disabled={!tutorEnabled}
                />
              </div>

              <div className="patient-register-field">
                <label htmlFor="vinculo">
                  Vínculo
                </label>

                <select
                  id="vinculo"
                  value={form.vinculo}
                  onChange={(event) =>
                    handleChange(
                      "vinculo",
                      event.target.value,
                    )
                  }
                  disabled={!tutorEnabled}
                >
                  <option value="">
                    Seleccione...
                  </option>

                  <option value="madre">
                    Madre
                  </option>

                  <option value="padre">
                    Padre
                  </option>

                  <option value="acudiente">
                    Acudiente
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="patient-register-section">
            <h2>Antecedentes básicos</h2>

            <label className="patient-register-check-row">
              <input
                type="checkbox"
                checked={form.alergias}
                onChange={(event) =>
                  handleChange(
                    "alergias",
                    event.target.checked,
                  )
                }
              />

              <span>
                ¿Es alérgico a algún medicamento?
              </span>
            </label>

            <label className="patient-register-check-row">
              <input
                type="checkbox"
                checked={form.medicacion}
                onChange={(event) =>
                  handleChange(
                    "medicacion",
                    event.target.checked,
                  )
                }
              />

              <span>
                ¿Toma medicación de forma crónica?
              </span>
            </label>

            <div className="patient-register-field patient-register-observations">
              <label htmlFor="observaciones">
                Observaciones clínicas previas
              </label>

              <textarea
                id="observaciones"
                rows={4}
                value={form.observaciones}
                onChange={(event) =>
                  handleChange(
                    "observaciones",
                    event.target.value,
                  )
                }
                placeholder="Breve nota sobre el estado inicial del paciente..."
              />
            </div>
          </section>

          <div className="patient-register-actions">
            <button
              type="button"
              className="patient-register-cancel"
              onClick={() => navigate("/pacientes")}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="patient-register-submit"
              onClick={handleSubmit}
            >
              Registrar paciente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}