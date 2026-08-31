import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import {
  PACIENTES_STORAGE_KEY,
  type Paciente,
} from "../../../types/pacientes";
import { personService } from "../../../api/personService";
import { patientService } from "../../../api/patientService";

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

    // Intentar persistir directamente en API /api/v1/Persons y /api/v1/Patients
    try {
      const createdPerson = await personService.create({
        documentTypeId: "10000000-0000-0000-0000-000000000001",
        documentNumber: documentoIngresado,
        firstName: data.nombres.trim(),
        lastName: data.apellidos.trim(),
        email: data.correo?.trim() || `${documentoIngresado}@paciente.com`,
        phone: data.telefono.trim(),
        dateOfBirth: data.fechaNacimiento,
        sexId: "11000000-0000-0000-0000-000000000001",
      });

      if (createdPerson?.id) {
        await patientService.create({
          personId: createdPerson.id,
          emergencyContactName: tutorEnabled ? "Tutor Legal" : undefined,
          emergencyContactPhone: tutorEnabled ? data.telefono.trim() : undefined,
        });
      }
    } catch (apiErr) {
      console.warn("Backend API sync failed, stored in local cache:", apiErr);
    }

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
      className="space-y-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {submitError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {submitError}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Datos personales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="nombres" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Nombres *
            </label>

            <input
              id="nombres"
              type="text"
              placeholder="Ej. Juan"
              {...register("nombres")}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />

            {errors.nombres && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {errors.nombres.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="apellidos" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Apellidos *
            </label>

            <input
              id="apellidos"
              type="text"
              placeholder="Ej. Pérez"
              {...register("apellidos")}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />

            {errors.apellidos && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {errors.apellidos.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="numeroDocumento" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Número de documento *
            </label>

            <input
              id="numeroDocumento"
              type="text"
              placeholder="Ej. 12345678"
              {...register("numeroDocumento")}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />

            {errors.numeroDocumento && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {errors.numeroDocumento.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Fecha de nacimiento *
            </label>

            <input
              id="fechaNacimiento"
              type="date"
              {...register("fechaNacimiento")}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />

            {errors.fechaNacimiento && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {errors.fechaNacimiento.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="genero" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Género *
            </label>

            <select
              id="genero"
              defaultValue=""
              {...register("genero")}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
              <span className="text-sm text-red-500 dark:text-red-400">
                {errors.genero.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="telefono" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Teléfono celular *
            </label>

            <input
              id="telefono"
              type="tel"
              placeholder="300 123 4567"
              {...register("telefono")}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />

            {errors.telefono && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {errors.telefono.message}
              </span>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="correo" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Correo electrónico
            </label>

            <input
              id="correo"
              type="email"
              placeholder="ejemplo@correo.com"
              {...register("correo")}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />

            {errors.correo && (
              <span className="text-sm text-red-500 dark:text-red-400">
                {errors.correo.message}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Tutor legal
          </h2>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tutorEnabled}
              onChange={(event) =>
                setTutorEnabled(
                  event.target.checked,
                )
              }
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
            />

            <span className="text-sm text-slate-600 dark:text-slate-400">Habilitar</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="tutor" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Nombre del tutor
            </label>

            <input
              id="tutor"
              type="text"
              placeholder="Nombre completo"
              disabled={!tutorEnabled}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="vinculo" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Vínculo
            </label>

            <select
              id="vinculo"
              defaultValue=""
              disabled={!tutorEnabled}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Antecedentes básicos
        </h2>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500" />

          <span className="text-sm text-slate-600 dark:text-slate-400">
            ¿Es alérgico a algún medicamento?
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500" />

          <span className="text-sm text-slate-600 dark:text-slate-400">
            ¿Toma medicación de forma crónica?
          </span>
        </label>

        <div className="space-y-2">
          <label htmlFor="observaciones" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
            Observaciones clínicas previas
          </label>

          <textarea
            id="observaciones"
            rows={4}
            placeholder="Breve nota sobre el estado inicial del paciente..."
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          />
        </div>
      </section>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => navigate("/pacientes")}
          disabled={isSubmitting}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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