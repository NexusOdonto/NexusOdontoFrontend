import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  Hourglass,
  X,
  Save,
  Check,
  Trash2,
  CalendarDays,
  Plus,
  AlertCircle,
} from "lucide-react";
import { DentistryReloadIcon } from "../../components/common/DentistryReloadIcon";

import {
  type Cita,
  type EstadoCita,
  nombresDias,
  odontologos as odontologosFallback,
  sumarDias,
  obtenerInicioSemana,
  formatoFechaInput,
  obtenerNombreMes,
  obtenerRangoSemana,
  obtenerColorEvento,
} from "./AgendaData";

import { useAuth } from "../auth/AuthContext";
import { getUserRole } from "../../utils/routePermissions";
import { appointmentService, type AppointmentResponseDto } from "../../api/appointmentService";
import { professionalService } from "../../api/professionalService";
import { serviceCatalogService, type ServiceResponseDto } from "../../api/serviceCatalogService";
import { patientService } from "../../api/patientService";
import { personService } from "../../api/personService";
import { SelectOrWriteInput, type SelectOption } from "../../components/common/SelectOrWriteInput";
import { areGuidsEqual } from "../../utils/roleUtils";
import { resolveOrCreatePatient } from "../../utils/patientResolution";

export function AgendaView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isPaciente = role === "PACIENTE";

  // Citas locales y de la base de datos
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fechaActual, setFechaActual] = useState(new Date());

  // Catálogos reales del backend
  const [profesionalesEntities, setProfesionalesEntities] = useState<any[]>([]);
  const [serviciosEntities, setServiciosEntities] = useState<ServiceResponseDto[]>([]);
  const [pacientesEntities, setPacientesEntities] = useState<any[]>([]);
  const [personsEntities, setPersonsEntities] = useState<any[]>([]);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>([]);
  const [listaOdontologos, setListaOdontologos] = useState(odontologosFallback);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [odontologosSeleccionados, setOdontologosSeleccionados] = useState<string[]>([
    "Todos los odontólogos",
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [citaDetalle, setCitaDetalle] = useState<Cita | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    const actualizarHora = () => {
      setHoraActual(new Date());
    };
    actualizarHora();
    const intervalo = setInterval(actualizarHora, 60000);
    return () => {
      clearInterval(intervalo);
    };
  }, []);

  const [nuevaCita, setNuevaCita] = useState({
    paciente: isPaciente ? (user?.name || "Paciente") : "",
    patientId: isPaciente ? (user?.id || "") : "",
    servicio: "Valoración General",
    odontologo: "Dra. Laura Gómez",
    horaInicio: "09:00",
    horaFin: "10:00",
    estado: "Confirmada" as EstadoCita,
  });

  // Cargar citas reales y catálogos de backend
  const fetchAgendaData = useCallback(async () => {
    try {
      const [apiApps, profs, srvs, pts, pers] = await Promise.allSettled([
        appointmentService.getAll(),
        professionalService.getAll(),
        serviceCatalogService.getAll(),
        patientService.getAll(),
        personService.getAll(),
      ]);

      // 1. Odontólogos
      if (profs.status === "fulfilled" && Array.isArray(profs.value) && profs.value.length > 0) {
        setProfesionalesEntities(profs.value);
        const colores = ["bg-cyan-400", "bg-blue-400", "bg-amber-400", "bg-purple-400", "bg-emerald-400"];
        const docsMapeados = profs.value.map((p: any, idx: number) => {
          const nombre =
            p.firstName || p.lastName
              ? `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim()
              : `Dr. Especialista #${idx + 1}`;
          return {
            nombre,
            color: colores[idx % colores.length],
          };
        });

        // Filtrar nombres únicos
        const uniqueDocs: { nombre: string; color: string }[] = [];
        docsMapeados.forEach((d) => {
          if (!uniqueDocs.some((u) => u.nombre === d.nombre)) {
            uniqueDocs.push(d);
          }
        });

        setListaOdontologos([
          { nombre: "Todos los odontólogos", color: "bg-cyan-400" },
          ...uniqueDocs,
        ]);

        if (uniqueDocs.length > 0) {
          setNuevaCita((prev) => ({ ...prev, odontologo: uniqueDocs[0].nombre }));
        }
      }

      // 2. Servicios
      if (srvs.status === "fulfilled" && Array.isArray(srvs.value) && srvs.value.length > 0) {
        setServiciosEntities(srvs.value);
        setNuevaCita((prev) => ({ ...prev, servicio: srvs.value[0].name }));
      } else {
        const fallbackOracleServices: any[] = [
          { id: "30000000-0000-0000-0000-000000000001", name: "Valoración General Odontológica", durationMinutes: 45 },
          { id: "30000000-0000-0000-0000-000000000002", name: "Profilaxis y Limpieza Dental", durationMinutes: 45 },
          { id: "30000000-0000-0000-0000-000000000003", name: "Blanqueamiento Dental Clínico", durationMinutes: 60 },
          { id: "30000000-0000-0000-0000-000000000004", name: "Restauración en Resina Compuesta", durationMinutes: 45 },
          { id: "30000000-0000-0000-0000-000000000005", name: "Control de Ortodoncia", durationMinutes: 30 },
          { id: "30000000-0000-0000-0000-000000000006", name: "Extracción Dental Simple", durationMinutes: 45 },
          { id: "30000000-0000-0000-0000-000000000007", name: "Endodoncia / Tratamiento de Conductos", durationMinutes: 60 },
        ];
        setServiciosEntities(fallbackOracleServices);
        setNuevaCita((prev) => ({ ...prev, servicio: fallbackOracleServices[0].name }));
      }

      // 3. Pacientes y Personas (Autocomplete interactivo)
      const ptsList = pts.status === "fulfilled" && Array.isArray(pts.value) ? pts.value : [];
      const persList = pers.status === "fulfilled" && Array.isArray(pers.value) ? pers.value : [];
      setPacientesEntities(ptsList);
      setPersonsEntities(persList);

      const personsMap: Record<string, any> = {};
      persList.forEach((p: any) => {
        if (p.id) personsMap[String(p.id).toLowerCase()] = p;
      });

      const opts: SelectOption[] = [];
      const seenNames = new Set<string>();

      ptsList.forEach((pt: any) => {
        const person = pt.personId ? personsMap[String(pt.personId).toLowerCase()] : undefined;
        const name = person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : (pt.name || "Paciente Registrado");
        const doc = person?.documentNumber || pt.documentNumber || "";
        const email = person?.email || pt.email || "";
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          opts.push({
            id: pt.id,
            label: name,
            subLabel: doc ? `Cédula: ${doc}${email ? ` • ${email}` : ""}` : email,
            data: { patientId: pt.id, personId: pt.personId, doc, email },
          });
        }
      });

      persList.forEach((per: any) => {
        const name = `${per.firstName || ""} ${per.lastName || ""}`.trim();
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          opts.push({
            id: per.id,
            label: name,
            subLabel: per.documentNumber ? `Cédula: ${per.documentNumber}${per.email ? ` • ${per.email}` : ""}` : per.email,
            data: { personId: per.id, doc: per.documentNumber, email: per.email },
          });
        }
      });

      if (opts.length === 0) {
        opts.push(
          { label: "Andrés Pérez", subLabel: "Cédula: 1076543210 • paciente@nexusodonto.com", id: "1e000000-0000-0000-0000-000000000001", data: { patientId: "1e000000-0000-0000-0000-000000000001" } },
          { label: "Camila López", subLabel: "Cédula: 1098765436", id: "1e000000-0000-0000-0000-000000000002", data: { patientId: "1e000000-0000-0000-0000-000000000002" } },
          { label: "Felipe Torres", subLabel: "Cédula: 1098765437", id: "1e000000-0000-0000-0000-000000000003", data: { patientId: "1e000000-0000-0000-0000-000000000003" } },
          { label: "Valentina Mendoza", subLabel: "Cédula: 1098765438", id: "1e000000-0000-0000-0000-000000000004", data: { patientId: "1e000000-0000-0000-0000-000000000004" } }
        );
      }
      setPatientOptions(opts);

      // 4. Citas guardadas en API backend
      if (apiApps.status === "fulfilled" && Array.isArray(apiApps.value) && apiApps.value.length > 0) {
        const mappedFromBackend: Cita[] = apiApps.value
          .filter((a: AppointmentResponseDto) => !a.cancelledAt)
          .map((a: AppointmentResponseDto, idx: number) => {
            let fechaStr = formatoFechaInput(new Date());
            let inicio = "09:00";
            let fin = "10:00";

            if (a.startsAt) {
              const startDate = new Date(a.startsAt);
              if (!isNaN(startDate.getTime())) {
                fechaStr = formatoFechaInput(startDate);
                inicio = startDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
              } else {
                fechaStr = a.startsAt.split("T")[0] || fechaStr;
              }
            }

            if (a.endsAt) {
              const endDate = new Date(a.endsAt);
              if (!isNaN(endDate.getTime())) {
                fin = endDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
              }
            }

            // Enriquecimiento de nombres reales a partir de los catálogos y entidades
            let resolvedPatientName = a.patientName;
            if (!resolvedPatientName || resolvedPatientName === "Paciente Agendado") {
              const ptEntity = ptsList.find((p: any) => areGuidsEqual(p.id, a.patientId));
              const perEntity = persList.find((per: any) => 
                (ptEntity && areGuidsEqual(per.id, ptEntity.personId)) ||
                areGuidsEqual(per.id, a.patientId)
              );
              if (perEntity) {
                resolvedPatientName = `${perEntity.firstName || ""} ${perEntity.lastName || ""}`.trim();
              } else if (ptEntity?.firstName || ptEntity?.lastName) {
                resolvedPatientName = `${ptEntity.firstName || ""} ${ptEntity.lastName || ""}`.trim();
              }
            }

            let resolvedProfName = a.professionalName;
            if (!resolvedProfName || resolvedProfName.includes("Especialista")) {
              const profsList = profs.status === "fulfilled" && Array.isArray(profs.value) ? profs.value : [];
              const profEntity = profsList.find((pr: any) => areGuidsEqual(pr.id, a.professionalId));
              if (profEntity) {
                resolvedProfName = `Dr(a). ${profEntity.firstName || ""} ${profEntity.lastName || ""}`.trim();
              }
            }

            let resolvedServiceName = a.serviceName;
            if (!resolvedServiceName || resolvedServiceName === "Consulta Odontológica") {
              const srvsList = srvs.status === "fulfilled" && Array.isArray(srvs.value) ? srvs.value : [];
              const srvEntity = srvsList.find((s: any) => areGuidsEqual(s.id, a.serviceId));
              if (srvEntity?.name) {
                resolvedServiceName = srvEntity.name;
              }
            }

            let estadoMapeado: EstadoCita = "Confirmada";
            const sn = (a.statusName || "").toUpperCase();
            if (sn.includes("COMPLET") || sn.includes("ATENDIDA") || sn.includes("FINALIZ")) {
              estadoMapeado = "Completada";
            } else if (sn.includes("ATEN") || sn.includes("ATTEND") || sn.includes("PROCESO")) {
              estadoMapeado = "En Atención";
            } else if (sn.includes("PEND") || sn.includes("AGEN") || sn.includes("SCHEDULED")) {
              estadoMapeado = "Pendiente";
            } else if (sn.includes("CONFIRM") || sn.includes("ACEPT")) {
              estadoMapeado = "Confirmada";
            } else if (sn.includes("CANCEL")) {
              estadoMapeado = "No disponible";
            }

            const profsList = profs.status === "fulfilled" && Array.isArray(profs.value) ? profs.value : [];
            const fallbackDoc = profsList.length > 0 && profsList[0]?.firstName 
              ? `Dr(a). ${profsList[0].firstName} ${profsList[0].lastName || ""}`.trim()
              : "Dra. Laura Gómez";

            return {
              id: idx + 1000,
              rawGuid: a.id,
              paciente: resolvedPatientName || "Paciente Registrado",
              servicio: resolvedServiceName || "Consulta Odontológica",
              odontologo: resolvedProfName || fallbackDoc,
              fecha: fechaStr,
              horaInicio: inicio,
              horaFin: fin,
              estado: estadoMapeado,
            };
          });

        setCitas((prev) => {
          const combinadas = [...mappedFromBackend];
          prev.forEach((p) => {
            if (
              !combinadas.some(
                (c) =>
                  c.fecha === p.fecha &&
                  c.horaInicio === p.horaInicio &&
                  c.odontologo === p.odontologo
              )
            ) {
              combinadas.push(p);
            }
          });
          return combinadas;
        });
      }
    } catch (err) {
      console.warn("Sincronización inicial de agenda con backend:", err);
    }
  }, []);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  const inicioSemana = useMemo(() => {
    return obtenerInicioSemana(fechaActual);
  }, [fechaActual]);

  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      sumarDias(inicioSemana, index)
    );
  }, [inicioSemana]);

  const citasFiltradas = useMemo(() => {
    if (odontologosSeleccionados.includes("Todos los odontólogos")) {
      return citas;
    }
    return citas.filter((cita) =>
      odontologosSeleccionados.includes(cita.odontologo)
    );
  }, [citas, odontologosSeleccionados]);

  const fechasSemanaStr = useMemo(() => {
    return diasSemana.map((d) => formatoFechaInput(d));
  }, [diasSemana]);

  const citasSemana = useMemo(() => {
    return citasFiltradas.filter((cita) => fechasSemanaStr.includes(cita.fecha));
  }, [citasFiltradas, fechasSemanaStr]);

  const citasHoy = useMemo(() => {
    const hoy = formatoFechaInput(new Date());
    return citasFiltradas.filter((cita) => cita.fecha === hoy).length;
  }, [citasFiltradas]);

  const confirmadas = useMemo(() => {
    return citasSemana.filter(
      (cita) =>
        (cita.estado || "").toLowerCase() === "confirmada" ||
        (cita.estado || "").toLowerCase() === "confirmed"
    ).length;
  }, [citasSemana]);

  const pendientes = useMemo(() => {
    return citasSemana.filter(
      (cita) =>
        (cita.estado || "").toLowerCase() === "pendiente" ||
        (cita.estado || "").toLowerCase() === "pending"
    ).length;
  }, [citasSemana]);

  const espaciosDisponibles = useMemo(() => {
    const activeProfs = odontologosSeleccionados.includes("Todos los odontólogos")
      ? listaOdontologos.filter((o) => o.nombre !== "Todos los odontólogos")
      : listaOdontologos.filter((o) => odontologosSeleccionados.includes(o.nombre));
    const numOdontologos = activeProfs.length;
    if (numOdontologos === 0) return 0;

    // F-09: Calcular franjas laborales reales por semana (L-V: 10 franjas útiles, Sáb: 5 franjas, Dom: 0)
    let totalSlotsSemana = 0;
    diasSemana.forEach((d) => {
      const dayOfWeek = d.getDay(); // 0 = Domingo, 6 = Sábado
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        totalSlotsSemana += 10 * numOdontologos;
      } else if (dayOfWeek === 6) {
        totalSlotsSemana += 5 * numOdontologos;
      }
    });

    // Citas activas de la semana que ocupan franjas
    const ocupadasSemana = citasSemana.filter((cita) => {
      const st = (cita.estado || "").toLowerCase();
      return st !== "cancelada" && st !== "no disponible" && st !== "cancelled";
    }).length;

    return Math.max(0, totalSlotsSemana - ocupadasSemana);
  }, [diasSemana, citasSemana, odontologosSeleccionados, listaOdontologos]);

  const cambiarSemana = (direccion: number) => {
    setFechaActual((fecha) => sumarDias(fecha, direccion * 7));
  };

  const irHoy = () => {
    setFechaActual(new Date());
  };

  const cambiarOdontologo = (nombre: string) => {
    if (nombre === "Todos los odontólogos") {
      setOdontologosSeleccionados(["Todos los odontólogos"]);
      return;
    }

    setOdontologosSeleccionados((actuales) => {
      const sinTodos = actuales.filter(
        (odontologo) => odontologo !== "Todos los odontólogos"
      );

      if (sinTodos.includes(nombre)) {
        const nuevos = sinTodos.filter(
          (odontologo) => odontologo !== nombre
        );
        return nuevos.length > 0 ? nuevos : ["Todos los odontólogos"];
      }

      return [...sinTodos, nombre];
    });
  };

  const obtenerCitasDia = (fecha: Date) => {
    const fechaTexto = formatoFechaInput(fecha);
    return citasFiltradas.filter((cita) => cita.fecha === fechaTexto);
  };

  const abrirNuevaCita = (fecha: Date, hora: string) => {
    const horaNumero = Number(hora.split(":")[0]);
    const horaFin = `${String(horaNumero + 1).padStart(2, "0")}:00`;

    setFormError(null);
    setFechaSeleccionada(formatoFechaInput(fecha));
    setNuevaCita({
      paciente: isPaciente ? (user?.name || "Paciente") : "",
      patientId: isPaciente ? (user?.id || "") : "",
      servicio: serviciosEntities.length > 0 ? serviciosEntities[0].name : "Valoración General",
      odontologo:
        listaOdontologos.length > 1
          ? listaOdontologos[1].nombre
          : "Dra. Laura Gómez",
      horaInicio: hora,
      horaFin,
      estado: isPaciente ? "Pendiente" : "Confirmada",
    });

    setMostrarModal(true);
  };

  const guardarCita = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("-> Iniciando guardado de cita en Agenda...");
    console.log("Paciente seleccionado:", nuevaCita.paciente, "ID:", nuevaCita.patientId);
    console.log("Formulario:", { fechaSeleccionada, horaInicio: nuevaCita.horaInicio, servicio: nuevaCita.servicio, odontologo: nuevaCita.odontologo });

    if (!nuevaCita.paciente?.trim()) {
      setFormError("Debes seleccionar o ingresar un paciente válido.");
      setErrorMessage("Debes seleccionar un paciente válido.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    if (!nuevaCita.servicio?.trim()) {
      setFormError("Debes seleccionar un servicio o tratamiento.");
      setErrorMessage("Debes seleccionar un servicio.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    if (!nuevaCita.odontologo?.trim() && !isPaciente) {
      setFormError("Debes seleccionar un odontólogo.");
      setErrorMessage("Debes seleccionar un profesional.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const matchedService = serviciosEntities.find((s) => s.name === nuevaCita.servicio || areGuidsEqual(s.id, nuevaCita.servicio));
      const serviceIdToUse = matchedService?.id || (serviciosEntities.length > 0 ? serviciosEntities[0].id : "30000000-0000-0000-0000-000000000001");

      const matchedProf = profesionalesEntities.find((p) => {
        const pFullName = `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim();
        return pFullName === nuevaCita.odontologo || p.firstName === nuevaCita.odontologo || areGuidsEqual(p.id, nuevaCita.odontologo);
      });
      const profIdToUse = matchedProf?.id;
      if (!profIdToUse && !isPaciente) {
        setFormError("Debes seleccionar un odontólogo válido del listado de profesionales.");
        setErrorMessage("Debes seleccionar un profesional válido.");
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSubmitting(false);
        return;
      }

      const finalProfId = profIdToUse || (profesionalesEntities.length > 0 ? profesionalesEntities[0].id : null);
      if (!finalProfId) {
        setFormError("No hay un profesional activo disponible en el sistema.");
        setErrorMessage("No hay un profesional disponible.");
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSubmitting(false);
        return;
      }

      // Resolución dinámica de paciente (búsqueda o creación al vuelo para evitar fallbacks erróneos)
      const resolvedPatient = await resolveOrCreatePatient({
        identifierOrName: nuevaCita.patientId || nuevaCita.paciente,
        patientsEntities: pacientesEntities,
        personsEntities: personsEntities,
        currentUser: user,
        isPacienteRole: isPaciente,
      });

      const patientIdToUse = resolvedPatient.patientId;
      const patientNameToUse = resolvedPatient.patientName || nuevaCita.paciente;

      if (!patientIdToUse) {
        setFormError("Debes seleccionar o ingresar un paciente válido.");
        setErrorMessage("Debes ingresar un paciente válido.");
        setTimeout(() => setErrorMessage(null), 5000);
        setIsSubmitting(false);
        return;
      }

      const [h, m] = (nuevaCita.horaInicio || "09:00").split(":").map(Number);
      const safeH = String(isNaN(h) ? 9 : h).padStart(2, "0");
      const safeM = String(isNaN(m) ? 0 : m).padStart(2, "0");

      const [eh, em] = (nuevaCita.horaFin || "10:00").split(":").map(Number);
      const safeEH = String(isNaN(eh) ? 10 : eh).padStart(2, "0");
      const safeEM = String(isNaN(em) ? 0 : em).padStart(2, "0");

      const startsAtLocal = `${fechaSeleccionada}T${safeH}:${safeM}:00`;
      const endsAtLocal = `${fechaSeleccionada}T${safeEH}:${safeEM}:00`;

      const payload = {
        patientId: patientIdToUse,
        professionalId: finalProfId,
        serviceId: serviceIdToUse,
        startsAt: startsAtLocal,
        endsAt: endsAtLocal,
        appointmentStatusId:
          nuevaCita.estado === "Pendiente"
            ? "10000000-0000-0000-0000-000000000001"
            : "10000000-0000-0000-0000-000000000002",
        appointmentOriginId: "20000000-0000-0000-0000-000000000003",
        reasonForVisit: `Agendado desde agenda interactiva para ${patientNameToUse}`,
        notes: `Servicio: ${nuevaCita.servicio}. Odontólogo: ${nuevaCita.odontologo}`,
      };

      console.log("Payload enviado a la API:", payload);
      const res = await appointmentService.create(payload);
      console.log("Respuesta backend:", res);

      setSuccessToast("¡Cita agendada exitosamente en el servidor!");
      setTimeout(() => setSuccessToast(null), 3500);

      // Cierre del modal y refresco de agenda
      setMostrarModal(false);
      await fetchAgendaData();
    } catch (error: any) {
      console.error("Error capturado al guardar cita en /agenda:", error.response?.data || error);
      const serverMsg = String(error?.response?.data?.message || error?.message || "").toLowerCase();
      const details = error?.response?.data?.details;
      let detailsMsg = "";
      if (details && typeof details === "object") {
        const allDetails = Object.values(details).flat().filter(Boolean);
        if (allDetails.length > 0) {
          detailsMsg = allDetails.join(". ");
        }
      }

      let errorMsg = "No se pudo registrar la cita en el servidor.";
      if (serverMsg.includes("outside the professional's active availability") || serverMsg.includes("availability")) {
        errorMsg = "El horario seleccionado está fuera de la jornada de atención (08:00 a 12:00 y 14:00 a 17:00). Por favor selecciona una hora de inicio válida (ej. 08:00 a 11:30 o 14:00 a 16:30).";
      } else if (error?.response?.status === 409 || serverMsg.includes("conflict") || serverMsg.includes("overlap")) {
        errorMsg = "El odontólogo ya tiene una cita asignada en ese rango horario. Por favor selecciona otra hora u otro profesional.";
      } else if (detailsMsg) {
        errorMsg = detailsMsg;
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      setFormError(errorMsg);
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarCita = async (id: number, rawGuid?: string) => {
    try {
      if (rawGuid && rawGuid.length > 10) {
        await appointmentService.delete(rawGuid);
      }
      // A-08: Filtrar por rawGuid solo si existe; de lo contrario, filtrar exclusivamente por id
      setCitas((actuales) =>
        actuales.filter((cita) => {
          if (rawGuid) {
            return !cita.rawGuid || cita.rawGuid !== rawGuid;
          }
          return cita.id !== id;
        })
      );
      setSuccessToast("Cita eliminada correctamente");
      setTimeout(() => setSuccessToast(null), 3500);
      await fetchAgendaData();
    } catch (error: any) {
      console.error("Error al eliminar cita:", error);
      const errorMsg = error?.response?.data?.message || "No se pudo eliminar la cita en el servidor";
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const HORA_ALTURA_PX = 80;

  interface CitaPosicionada extends Cita {
    top: number;
    height: number;
    leftStyle: string;
    widthStyle: string;
  }

  const calcularPosicionesDia = (citasList: Cita[]): CitaPosicionada[] => {
    if (citasList.length === 0) return [];

    const parseadas = citasList.map((cita) => {
      const [hIni, mIni] = (cita.horaInicio || "07:00").split(":").map(Number);
      const [hFin, mFin] = (cita.horaFin || "08:00").split(":").map(Number);
      const safeHIni = isNaN(hIni) ? 7 : hIni;
      const safeMIni = isNaN(mIni) ? 0 : mIni;
      const safeHFin = isNaN(hFin) ? safeHIni + 1 : hFin;
      const safeMFin = isNaN(mFin) ? 0 : mFin;

      const inicioMinutos = (safeHIni - 7) * 60 + safeMIni;
      const finMinutos = (safeHFin - 7) * 60 + safeMFin;
      const duracion = Math.max(finMinutos - inicioMinutos, 20);

      return {
        ...cita,
        inicioMinutos,
        finMinutos: inicioMinutos + duracion,
        duracionMinutos: duracion,
      };
    });

    parseadas.sort((a, b) => {
      if (a.inicioMinutos !== b.inicioMinutos) {
        return a.inicioMinutos - b.inicioMinutos;
      }
      return b.duracionMinutos - a.duracionMinutos;
    });

    // Agrupar en clusters que se solapan en tiempo
    const clusters: typeof parseadas[] = [];
    let clusterActual: typeof parseadas = [];
    let clusterFinMax = -1;

    parseadas.forEach((cita) => {
      if (clusterActual.length === 0) {
        clusterActual.push(cita);
        clusterFinMax = cita.finMinutos;
      } else {
        if (cita.inicioMinutos < clusterFinMax) {
          clusterActual.push(cita);
          clusterFinMax = Math.max(clusterFinMax, cita.finMinutos);
        } else {
          clusters.push(clusterActual);
          clusterActual = [cita];
          clusterFinMax = cita.finMinutos;
        }
      }
    });
    if (clusterActual.length > 0) {
      clusters.push(clusterActual);
    }

    const resultado: CitaPosicionada[] = [];

    clusters.forEach((cluster) => {
      const columnasFin: number[] = [];
      const asignaciones: { cita: (typeof parseadas)[0]; colIndex: number }[] = [];

      cluster.forEach((cita) => {
        let colIndex = columnasFin.findIndex((fin) => fin <= cita.inicioMinutos);
        if (colIndex === -1) {
          colIndex = columnasFin.length;
          columnasFin.push(cita.finMinutos);
        } else {
          columnasFin[colIndex] = cita.finMinutos;
        }
        asignaciones.push({ cita, colIndex });
      });

      const totalColumnas = Math.max(columnasFin.length, 1);

      asignaciones.forEach(({ cita, colIndex }) => {
        // Separación vertical limpia usando escala HORA_ALTURA_PX
        const top = (cita.inicioMinutos / 60) * HORA_ALTURA_PX + 1;
        const height = Math.max((cita.duracionMinutos / 60) * HORA_ALTURA_PX - 2, 38);

        let leftStyle: string;
        let widthStyle: string;

        if (totalColumnas === 1) {
          leftStyle = "4px";
          widthStyle = "calc(100% - 8px)";
        } else {
          const colWidthPct = 100 / totalColumnas;
          leftStyle = `calc(${colIndex * colWidthPct}% + 2px)`;
          widthStyle = `calc(${colWidthPct}% - 4px)`;
        }

        resultado.push({
          ...cita,
          top,
          height,
          leftStyle,
          widthStyle,
        });
      });
    });

    return resultado;
  };

  const obtenerPosicionHoraActual = () => {
    const fechaHoy = formatoFechaInput(horaActual);
    const estaSemana = diasSemana.some(
      (dia) => formatoFechaInput(dia) === fechaHoy
    );
    if (!estaSemana) {
      return null;
    }
    const hora = horaActual.getHours();
    const minutos = horaActual.getMinutes();
    if (hora < 7 || hora > 18) {
      return null;
    }
    return ((hora - 7) + minutos / 60) * HORA_ALTURA_PX;
  };

  const posicionHoraActual = obtenerPosicionHoraActual();

  const gridTemplateColumns = "48px repeat(7, minmax(100px, 1fr))";

  return (
    <>
      {/* Toast Notificación (CAPA SUPERIOR ABSOLUTA z-[99999] EN ESQUINA INFERIOR DERECHA) */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/95 text-cyan-300 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-slideUp">
          <Check size={18} className="text-cyan-400 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Toast Error Notificación */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-950/95 text-rose-300 border border-rose-500/40 shadow-2xl backdrop-blur-xl animate-slideUp">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      <div className="min-h-full w-full overflow-hidden px-4 pb-6 pt-4 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <main className="min-w-0 space-y-4">
              {/* Tarjetas KPI Superiores */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-cyan-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                    <CalendarDays size={20} className="group-hover:animate-icon-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Citas hoy</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{citasHoy}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Total programadas</p>
                  </div>
                </div>

                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-cyan-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                    <Clock3 size={20} className="group-hover:animate-icon-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Espacios disponibles</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{espaciosDisponibles}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Para agendar</p>
                  </div>
                </div>

                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-blue-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                    <CheckCircle2 size={20} className="group-hover:animate-icon-wiggle" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Confirmadas</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{confirmadas}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Citas confirmadas</p>
                  </div>
                </div>

                <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm hover:border-amber-500/40 transition-all">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 icon-animated-interactive group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                    <Hourglass size={20} className="group-hover:animate-icon-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pendientes</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{pendientes}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Por confirmar</p>
                  </div>
                </div>
              </section>

              {/* Calendario Principal */}
              <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 shadow-md backdrop-blur-sm">
                {/* Cabecera y Controles */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={irHoy}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Hoy
                    </button>

                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => cambiarSemana(-1)}
                        className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => cambiarSemana(1)}
                        className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {obtenerRangoSemana(inicioSemana)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchAgendaData}
                      className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-400 transition hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                      title="Sincronizar con backend"
                    >
                      <DentistryReloadIcon size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const nextHour = now.getHours() + 1;
                        const horaStr = nextHour >= 7 && nextHour <= 18 ? `${String(nextHour).padStart(2, "0")}:00` : "09:00";
                        abrirNuevaCita(now, horaStr);
                      }}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <Plus size={16} />
                      <span>Nueva Cita</span>
                    </button>
                  </div>
                </div>

                {/* Filtro Rápido Odontólogos */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 text-xs">
                  {listaOdontologos.map((doc) => {
                    const seleccionado = odontologosSeleccionados.includes(doc.nombre);
                    return (
                      <button
                        key={doc.nombre}
                        type="button"
                        onClick={() => cambiarOdontologo(doc.nombre)}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-medium transition cursor-pointer whitespace-nowrap ${
                          seleccionado
                            ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
                            : "border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${doc.color}`} />
                        <span>{doc.nombre}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Matriz Calendario */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60">
                  <div className="min-w-190">
                    {/* Encabezado Columnas Días */}
                    <div
                      className="grid border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50/80 dark:bg-slate-900/60"
                      style={{ gridTemplateColumns }}
                    >
                      <div className="py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        GMT-5
                      </div>

                      {diasSemana.map((dia, idx) => {
                        const esHoy =
                          formatoFechaInput(dia) === formatoFechaInput(horaActual);
                        return (
                          <div
                            key={idx}
                            className={`py-2 text-center border-l border-slate-200 dark:border-slate-800/60 ${
                              esHoy ? "bg-cyan-500/10 dark:bg-cyan-500/15" : ""
                            }`}
                          >
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {nombresDias[dia.getDay()]}
                            </p>
                            <p
                              className={`mt-0.5 text-sm font-bold inline-flex items-center justify-center h-6 w-6 rounded-full ${
                                esHoy
                                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                                  : "text-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {dia.getDate()}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cuerpo de Horas y Eventos */}
                    <div
                      className="relative grid bg-white/70 dark:bg-slate-900/40"
                      style={{
                        gridTemplateColumns,
                        height: `${12 * HORA_ALTURA_PX}px`,
                      }}
                    >
                      {/* Línea Hora Actual */}
                      {posicionHoraActual !== null && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
                          style={{ top: `${posicionHoraActual}px` }}
                        >
                          <div className="h-2 w-2 rounded-full bg-rose-500 -ml-1" />
                          <div className="h-0.5 w-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                        </div>
                      )}

                      {/* Columna Horas Eje Y */}
                      <div className="relative border-r border-slate-200 dark:border-slate-800 text-right pr-2 bg-slate-50/50 dark:bg-slate-900/30">
                        {Array.from({ length: 12 }, (_, i) => {
                          const hora = i + 7;
                          return (
                            <div
                              key={hora}
                              className="absolute right-2 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400"
                              style={{ top: `${i * HORA_ALTURA_PX - 7}px` }}
                            >
                              {`${String(hora).padStart(2, "0")}:00`}
                            </div>
                          );
                        })}
                      </div>

                      {/* 7 Columnas de Días */}
                      {diasSemana.map((dia, idx) => {
                        const citasDia = obtenerCitasDia(dia);
                        const citasPosicionadas = calcularPosicionesDia(citasDia);
                        const esHoy =
                          formatoFechaInput(dia) === formatoFechaInput(horaActual);

                        return (
                          <div
                            key={idx}
                            className={`relative border-r border-slate-200 dark:border-slate-800/60 ${
                              esHoy ? "bg-cyan-500/3 dark:bg-cyan-500/2" : ""
                            }`}
                          >
                            {/* Líneas Horarias */}
                            {Array.from({ length: 12 }, (_, i) => (
                              <div
                                key={i}
                                onClick={() =>
                                  abrirNuevaCita(
                                    dia,
                                    `${String(i + 7).padStart(2, "0")}:00`
                                  )
                                }
                                className="absolute left-0 right-0 border-b border-slate-200/70 dark:border-slate-800/40 hover:bg-cyan-500/10 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                style={{
                                  top: `${i * HORA_ALTURA_PX}px`,
                                  height: `${HORA_ALTURA_PX}px`,
                                }}
                              />
                            ))}

                            {/* Citas / Eventos */}
                            {citasPosicionadas.map((cita) => {
                              const colorEvento = obtenerColorEvento(cita.estado);

                              return (
                                <div
                                  key={cita.id}
                                  onClick={() => setCitaDetalle(cita)}
                                  style={{
                                    top: `${cita.top}px`,
                                    height: `${cita.height}px`,
                                    left: cita.leftStyle,
                                    width: cita.widthStyle,
                                  }}
                                  title={`${cita.paciente} • ${cita.servicio} (${cita.horaInicio} - ${cita.horaFin}) • ${cita.odontologo}`}
                                  className={`group absolute z-20 overflow-hidden rounded-xl border shadow-xs transition-all hover:scale-[1.01] hover:z-30 cursor-pointer ${colorEvento.contenedor}`}
                                >
                                  {cita.height < 52 ? (
                                    // Modo Compacto (30-40 min)
                                    <div className="flex h-full flex-col justify-between px-2.5 py-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1 min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${colorEvento.punto}`} />
                                          <p className="truncate text-xs font-bold leading-tight">
                                            {cita.paciente}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            eliminarCita(cita.id, cita.rawGuid);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-rose-500 shrink-0 cursor-pointer"
                                          title="Eliminar cita"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>

                                      <div className="flex items-center justify-between gap-1 min-w-0 text-[10px] leading-tight">
                                        <span className="truncate opacity-90 font-medium">
                                          {cita.servicio}
                                        </span>
                                        <span className="font-mono text-[9px] opacity-80 shrink-0 font-medium">
                                          {cita.horaInicio} - {cita.horaFin}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    // Modo Completo (>= 45 min)
                                    <div className="flex h-full flex-col justify-between px-2.5 py-1.5 min-w-0">
                                      <div className="min-w-0">
                                        <div className="flex items-start justify-between gap-1 min-w-0">
                                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${colorEvento.punto}`} />
                                            <p className="truncate text-xs font-bold leading-tight">
                                              {cita.paciente}
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              eliminarCita(cita.id, cita.rawGuid);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-rose-500 shrink-0 cursor-pointer"
                                            title="Eliminar cita"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                        <p className="truncate text-[10.5px] opacity-90 leading-tight mt-1">
                                          {cita.servicio}
                                        </p>
                                      </div>
                                      <p className="text-[10px] opacity-80 font-mono font-medium leading-none shrink-0 pb-0.5">
                                        {cita.horaInicio} - {cita.horaFin}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </main>

            {/* Barra Lateral Derecha */}
            <aside className="space-y-4">
              {/* Calendario Miniatura */}
              <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 shadow-md backdrop-blur-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {obtenerNombreMes(fechaActual)} {fechaActual.getFullYear()}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFechaActual(
                          new Date(
                            fechaActual.getFullYear(),
                            fechaActual.getMonth() - 1,
                            1
                          )
                        )
                      }
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFechaActual(
                          new Date(
                            fechaActual.getFullYear(),
                            fechaActual.getMonth() + 1,
                            1
                          )
                        )
                      }
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Días Mini Calendario */}
                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px]">
                  {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                    <span key={i} className="font-semibold text-slate-400 dark:text-slate-500">
                      {d}
                    </span>
                  ))}
                  {Array.from({ length: 31 }, (_, i) => {
                    const diaNum = i + 1;
                    const esSeleccionado = diaNum === fechaActual.getDate();
                    return (
                      <button
                        key={diaNum}
                        type="button"
                        onClick={() =>
                          setFechaActual(
                            new Date(
                              fechaActual.getFullYear(),
                              fechaActual.getMonth(),
                              diaNum
                            )
                          )
                        }
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition cursor-pointer mx-auto ${
                          esSeleccionado
                            ? "bg-cyan-500 font-bold text-slate-950 shadow-sm"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {diaNum}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Convenciones y Leyenda */}
              <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 shadow-md backdrop-blur-sm space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200 dark:border-slate-800">
                  Estados de Cita
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-cyan-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Confirmada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">En Atención</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Pendiente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Disponible</span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Modal Detalle de Cita */}
      {citaDetalle && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-scaleIn text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detalle de la Cita</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {citaDetalle.fecha} · {citaDetalle.horaInicio} - {citaDetalle.horaFin}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCitaDetalle(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Paciente</span>
                  <span className="font-bold text-slate-900 dark:text-white">{citaDetalle.paciente}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Servicio</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{citaDetalle.servicio}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Odontólogo</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{citaDetalle.odontologo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Horario</span>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {citaDetalle.horaInicio} a {citaDetalle.horaFin}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estado</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                    {citaDetalle.estado}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => {
                  eliminarCita(citaDetalle.id, citaDetalle.rawGuid);
                  setCitaDetalle(null);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Eliminar Cita</span>
              </button>

              <button
                type="button"
                onClick={() => setCitaDetalle(null)}
                className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agendar Cita */}
      {mostrarModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-scaleIn text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Agendar Cita en Agenda</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {fechaSeleccionada} · {nuevaCita.horaInicio}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={19} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Fecha de la Cita *
                </label>
                <input
                  type="date"
                  required
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 transition-all"
                />
              </div>

              <SelectOrWriteInput
                label="Paciente"
                required
                value={nuevaCita.paciente}
                onChange={(val, opt) =>
                  setNuevaCita((actual) => ({
                    ...actual,
                    paciente: val,
                    patientId: opt?.data?.patientId || opt?.id || actual.patientId,
                  }))
                }
                options={patientOptions}
                placeholder="Escribe o busca por nombre o documento..."
                type="paciente"
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tratamiento / Servicio *
                </label>
                {serviciosEntities.length > 0 ? (
                  <select
                    value={nuevaCita.servicio}
                    onChange={(event) =>
                      setNuevaCita((actual) => ({
                        ...actual,
                        servicio: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 cursor-pointer transition-all"
                  >
                    {serviciosEntities.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={nuevaCita.servicio}
                    onChange={(event) =>
                      setNuevaCita((actual) => ({
                        ...actual,
                        servicio: event.target.value,
                      }))
                    }
                    placeholder="Ej: Limpieza dental y valoración"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500"
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Odontólogo *
                </label>
                <select
                  value={nuevaCita.odontologo}
                  onChange={(event) =>
                    setNuevaCita((actual) => ({
                      ...actual,
                      odontologo: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 cursor-pointer transition-all"
                >
                  {listaOdontologos
                    .filter((o) => o.nombre !== "Todos los odontólogos")
                    .map((o) => (
                      <option key={o.nombre} value={o.nombre}>
                        {o.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevaCita.horaInicio}
                    onChange={(event) => {
                      const val = event.target.value;
                      const [h, m] = val.split(":").map(Number);
                      const endMinutesTotal = (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m) + 45;
                      const endH = Math.floor(endMinutesTotal / 60) % 24;
                      const endM = endMinutesTotal % 60;
                      const endStr = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
                      setNuevaCita((actual) => ({
                        ...actual,
                        horaInicio: val,
                        horaFin: endStr,
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hora Finalización *
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevaCita.horaFin}
                    onChange={(event) =>
                      setNuevaCita((actual) => ({
                        ...actual,
                        horaFin: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estado de la Cita
                </label>
                <select
                  value={nuevaCita.estado}
                  onChange={(event) =>
                    setNuevaCita((actual) => ({
                      ...actual,
                      estado: event.target.value as EstadoCita,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 cursor-pointer transition-all"
                >
                  <option value="Confirmada">Confirmada</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Atención">En Atención</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarCita}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {isSubmitting ? "Guardando..." : "Guardar Cita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AgendaView;
