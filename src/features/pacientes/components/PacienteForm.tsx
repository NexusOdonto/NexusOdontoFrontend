import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import {
  PACIENTES_STORAGE_KEY,
  type Paciente,
} from "../../../types/pacientes";

const pacienteSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(1, "Los nombres son obligatorios.")
    .max(
      100,
      "Los nombres no pueden superar los 100 caracteres.",
    ),

  apellidos: z
    .string()
    .trim()
    .min(1, "Los apellidos son obligatorios.")
    .max(
      100,
      "Los apellidos no pueden superar los 100 caracteres.",
    ),

  numeroDocumento: z
    .string()
    .trim()
    .min(
      1,
      "El número de documento es obligatorio.",
    ),

  fechaNacimiento: z
    .string()
    .min(
      1,
      "La fecha de nacimiento es obligatoria.",
    )
    .refine(
      (fecha) => {
        const fechaIngresada = new Date(
          `${fecha}T00:00:00`,
        );

        const hoy = new Date();

        hoy.setHours(0, 0, 0, 0);

        return fechaIngresada <= hoy;
      },
      {
        message:
          "La fecha de nacimiento no puede ser futura.",
      },
    ),

  genero: z
    .string()
    .min(1, "Debes seleccionar un género."),

  correo: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      {
        message:
          "Ingresa un correo electrónico válido.",
      },
    ),

  telefono: z
    .string()
    .trim()
    .min(
      1,
      "El teléfono celular es obligatorio.",
    ),
});

type PacienteFormData = z.infer<typeof pacienteSchema>;

export function PacienteForm() {
  const navigate = useNavigate();

  const [tutorEnabled, setTutorEnabled] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    mode: "onChange",
    defaultValues: {
      nombres: "",
      apellidos: "",
      numeroDocumento: "",
      fechaNacimiento: "",
      genero: "",
      correo: "",
      telefono: "",
    },
  });

  const onSubmit = async (
    data: PacienteFormData,
  ) => {
    setSubmitError("");

    await new Promise((resolve) =>
      setTimeout(resolve, 700),
    );

    const pacientesGuardados =
      localStorage.getItem(
        PACIENTES_STORAGE_KEY,
      );

    let pacientes: Paciente[] = [];

    if (pacientesGuardados) {
      try {
        const parsed = JSON.parse(
          pacientesGuardados,
        );

        if (Array.isArray(parsed)) {
          pacientes = parsed;
        }
      } catch {
        pacientes = [];
      }
    }

    const documentoIngresado =
      data.numeroDocumento.trim();

    const pacienteDuplicado = pacientes.some(
      (paciente) =>
        paciente.documento.trim() ===
        documentoIngresado,
    );

    if (pacienteDuplicado) {
      setSubmitError(
        "Ya existe un paciente registrado con este número de documento.",
      );

      return;
    }

    const nuevoId =
      pacientes.length > 0
        ? Math.max(
            ...pacientes.map(
              (paciente) => paciente.id,
            ),
          ) + 1
        : 1;

    const nuevoPaciente: Paciente = {
      id: nuevoId,
      nombre: `${data.nombres} ${data.apellidos}`.trim(),
      documento: documentoIngresado,
      telefono: data.telefono.trim(),
      estado: "Activo",
    };

    const pacientesActualizados = [
      nuevoPaciente,
      ...pacientes,
    ];

    localStorage.setItem(
      PACIENTES_STORAGE_KEY,
      JSON.stringify(pacientesActualizados),
    );

    setTutorEnabled(false);

    navigate("/pacientes");
  };

  return (
    <form
      className="patient-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {submitError && (
        <div className="patient-form-submit-error">
          {submitError}
        </div>
      )}

      <section className="patient-form-section">
        <h2>Datos personales</h2>

        <div className="patient-form-grid">
          <div className="patient-form-field">
            <label htmlFor="nombres">
              Nombres *
            </label>

            <input
              id="nombres"
              type="text"
              placeholder="Ej. Juan"
              {...register("nombres")}
            />

            {errors.nombres && (
              <span className="patient-form-error">
                {errors.nombres.message}
              </span>
            )}
          </div>

          <div className="patient-form-field">
            <label htmlFor="apellidos">
              Apellidos *
            </label>

            <input
              id="apellidos"
              type="text"
              placeholder="Ej. Pérez"
              {...register("apellidos")}
            />

            {errors.apellidos && (
              <span className="patient-form-error">
                {errors.apellidos.message}
              </span>
            )}
          </div>

          <div className="patient-form-field">
            <label htmlFor="numeroDocumento">
              Número de documento *
            </label>

            <input
              id="numeroDocumento"
              type="text"
              placeholder="Ej. 12345678"
              {...register("numeroDocumento")}
            />

            {errors.numeroDocumento && (
              <span className="patient-form-error">
                {errors.numeroDocumento.message}
              </span>
            )}
          </div>

          <div className="patient-form-field">
            <label htmlFor="fechaNacimiento">
              Fecha de nacimiento *
            </label>

            <input
              id="fechaNacimiento"
              type="date"
              {...register("fechaNacimiento")}
            />

            {errors.fechaNacimiento && (
              <span className="patient-form-error">
                {errors.fechaNacimiento.message}
              </span>
            )}
          </div>

          <div className="patient-form-field">
            <label htmlFor="genero">
              Género *
            </label>

            <select
              id="genero"
              defaultValue=""
              {...register("genero")}
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

            {errors.genero && (
              <span className="patient-form-error">
                {errors.genero.message}
              </span>
            )}
          </div>

          <div className="patient-form-field">
            <label htmlFor="telefono">
              Teléfono celular *
            </label>

            <input
              id="telefono"
              type="tel"
              placeholder="300 123 4567"
              {...register("telefono")}
            />

            {errors.telefono && (
              <span className="patient-form-error">
                {errors.telefono.message}
              </span>
            )}
          </div>

          <div className="patient-form-field patient-form-field-full">
            <label htmlFor="correo">
              Correo electrónico
            </label>

            <input
              id="correo"
              type="email"
              placeholder="ejemplo@correo.com"
              {...register("correo")}
            />

            {errors.correo && (
              <span className="patient-form-error">
                {errors.correo.message}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="patient-form-tutor">
        <div className="patient-form-tutor-header">
          <h2>Tutor legal</h2>

          <label className="patient-form-checkbox">
            <input
              type="checkbox"
              checked={tutorEnabled}
              onChange={(event) =>
                setTutorEnabled(
                  event.target.checked,
                )
              }
            />

            <span>Habilitar</span>
          </label>
        </div>

        <div className="patient-form-grid">
          <div className="patient-form-field">
            <label htmlFor="tutor">
              Nombre del tutor
            </label>

            <input
              id="tutor"
              type="text"
              placeholder="Nombre completo"
              disabled={!tutorEnabled}
            />
          </div>

          <div className="patient-form-field">
            <label htmlFor="vinculo">
              Vínculo
            </label>

            <select
              id="vinculo"
              defaultValue=""
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

      <section className="patient-form-section">
        <h2>Antecedentes básicos</h2>

        <label className="patient-form-check-row">
          <input type="checkbox" />

          <span>
            ¿Es alérgico a algún medicamento?
          </span>
        </label>

        <label className="patient-form-check-row">
          <input type="checkbox" />

          <span>
            ¿Toma medicación de forma crónica?
          </span>
        </label>

        <div className="patient-form-field patient-form-observations">
          <label htmlFor="observaciones">
            Observaciones clínicas previas
          </label>

          <textarea
            id="observaciones"
            rows={4}
            placeholder="Breve nota sobre el estado inicial del paciente..."
          />
        </div>
      </section>

      <div className="patient-form-actions">
        <button
          type="button"
          className="patient-form-cancel"
          onClick={() => navigate("/pacientes")}
          disabled={isSubmitting}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="patient-form-submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Procesando..."
            : "Registrar paciente"}
        </button>
      </div>
    </form>
  );
}