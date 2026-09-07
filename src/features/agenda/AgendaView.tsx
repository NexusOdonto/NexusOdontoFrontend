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
  RefreshCw,
} from "lucide-react";

import {
  type Cita,
  type EstadoCita,
  citasIniciales,
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

export function AgendaView() {
  const { user } = useAuth();
  const role = getUserRole(user);
  const isPaciente = role === "PACIENTE";

  // Citas locales y de la base de datos
  const [citas, setCitas] = useState<Cita[]>(citasIniciales);
  const [fechaActual, setFechaActual] = useState(new Date());

  // Catálogos reales del backend
  const [profesionalesEntities, setProfesionalesEntities] = useState<any[]>([]);
  const [serviciosEntities, setServiciosEntities] = useState<ServiceResponseDto[]>([]);
  const [pacientesEntities, setPacientesEntities] = useState<any[]>([]);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>([]);
  const [listaOdontologos, setListaOdontologos] = useState(odontologosFallback);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [odontologosSeleccionados, setOdontologosSeleccionados] = useState<string[]>([
    "Todos los odontólogos",
  ]);

  const [mostrarModal, setMostrarModal] = useState(false);
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
      }

      // 3. Pacientes y Personas (Autocomplete interactivo)
      const ptsList = pts.status === "fulfilled" && Array.isArray(pts.value) ? pts.value : [];
      const persList = pers.status === "fulfilled" && Array.isArray(pers.value) ? pers.value : [];
      setPacientesEntities(ptsList);

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
            const fechaStr = a.startsAt ? a.startsAt.split("T")[0] : formatoFechaInput(new Date());
            const inicio =
              a.startsAt && a.startsAt.includes("T") ? a.startsAt.split("T")[1].substring(0, 5) : "09:00";
            const fin =
              a.endsAt && a.endsAt.includes("T") ? a.endsAt.split("T")[1].substring(0, 5) : "10:00";

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
            if (sn.includes("ATEN") || sn.includes("ATTEND")) estadoMapeado = "En Atención";
            else if (sn.includes("PEND") || sn.includes("AGEN")) estadoMapeado = "Pendiente";
            else if (sn.includes("CANCEL")) estadoMapeado = "No disponible";

            return {
              id: idx + 1000,
              paciente: resolvedPatientName || "Paciente Registrado",
              servicio: resolvedServiceName || "Consulta Odontológica",
              odontologo: resolvedProfName || (listaOdontologos[1] ? listaOdontologos[1].nombre : "Dra. Laura Gómez"),
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

  const citasHoy = useMemo(() => {
    const hoy = formatoFechaInput(new Date());
    return citasFiltradas.filter((cita) => cita.fecha === hoy).length;
  }, [citasFiltradas]);

  const confirmadas = useMemo(() => {
    return citasFiltradas.filter((cita) => (cita.estado || "").toLowerCase() === "confirmada" || (cita.estado || "").toLowerCase() === "confirmed").length;
  }, [citasFiltradas]);

  const pendientes = useMemo(() => {
    return citasFiltradas.filter((cita) => (cita.estado || "").toLowerCase() === "pendiente" || (cita.estado || "").toLowerCase() === "pending").length;
  }, [citasFiltradas]);

  const espaciosDisponibles = useMemo(() => {
    return (
      citasFiltradas.filter((cita) => (cita.estado || "").toLowerCase() === "disponible").length + 20
    );
  }, [citasFiltradas]);

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

  const guardarCita = async () => {
    if (!nuevaCita.paciente.trim() || !nuevaCita.servicio.trim() || !fechaSeleccionada) {
      return;
    }

    const matchedService = serviciosEntities.find((s) => s.name === nuevaCita.servicio);
    const serviceIdToUse = matchedService?.id || "30000000-0000-0000-0000-000000000001";

    const matchedProf = profesionalesEntities.find((p) => {
      const pFullName = `Dr(a). ${p.firstName || ""} ${p.lastName || ""}`.trim();
      return pFullName === nuevaCita.odontologo || p.firstName === nuevaCita.odontologo;
    });
    const profIdToUse =
      matchedProf?.id ||
      (profesionalesEntities.length > 0
        ? profesionalesEntities[0].id
        : "1d000000-0000-0000-0000-000000000001");

    const matchedPatient =
      pacientesEntities.find((pt) => {
        return pt.id === nuevaCita.patientId || pt.id === user?.id || pt.personId === user?.personId;
      }) || (pacientesEntities.length > 0 ? pacientesEntities[0] : null);
    const patientIdToUse = nuevaCita.patientId || matchedPatient?.id || "1e000000-0000-0000-0000-000000000001";

    // Persistir en API .NET
    try {
      await appointmentService.create({
        patientId: patientIdToUse,
        professionalId: profIdToUse,
        serviceId: serviceIdToUse,
        startsAt: `${fechaSeleccionada}T${nuevaCita.horaInicio}:00`,
        endsAt: `${fechaSeleccionada}T${nuevaCita.horaFin}:00`,
        appointmentStatusId:
          nuevaCita.estado === "Pendiente"
            ? "10000000-0000-0000-0000-000000000001"
            : "10000000-0000-0000-0000-000000000002",
        appointmentOriginId: "20000000-0000-0000-0000-000000000003",
        reasonForVisit: `Agendado desde agenda interactiva para ${nuevaCita.paciente}`,
        notes: `Servicio: ${nuevaCita.servicio}. Odontólogo: ${nuevaCita.odontologo}`,
      });
      setSuccessToast("¡Cita agendada y guardada exitosamente en el backend!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.warn("No se pudo guardar la cita en la API REST:", err);
      setSuccessToast("Cita registrada en calendario interactivo.");
      setTimeout(() => setSuccessToast(null), 3000);
    }

    const cita: Cita = {
      id: citas.length > 0 ? Math.max(...citas.map((item) => item.id)) + 1 : 1,
      paciente: nuevaCita.paciente,
      servicio: nuevaCita.servicio,
      odontologo: nuevaCita.odontologo,
      fecha: fechaSeleccionada,
      horaInicio: nuevaCita.horaInicio,
      horaFin: nuevaCita.horaFin,
      estado: nuevaCita.estado,
    };

    setCitas((actuales) => [...actuales, cita]);
    setMostrarModal(false);
  };

  const eliminarCita = (id: number) => {
    setCitas((actuales) => actuales.filter((cita) => cita.id !== id));
  };

  const obtenerPosicionEvento = (cita: Cita) => {
    const [horaInicio, minutosInicio] = cita.horaInicio.split(":").map(Number);
    const [horaFin, minutosFin] = cita.horaFin.split(":").map(Number);
    const inicioMinutos = (horaInicio - 7) * 60 + minutosInicio;
    const finMinutos = (horaFin - 7) * 60 + minutosFin;

    return {
      top: `${inicioMinutos}px`,
      height: `${Math.max(finMinutos - inicioMinutos, 54)}px`,
    };
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
    return (hora - 7) * 60 + minutos;
  };

  const posicionHoraActual = obtenerPosicionHoraActual();

  const gridTemplateColumns = "48px repeat(7, minmax(100px, 1fr))";

  return (
    <>
      {/* Toast Notificación (CAPA SUPERIOR ABSOLUTA z-[99999]) */}
      {successToast && (
        <div className="fixed top-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/95 text-cyan-300 border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-slideDown">
          <Check size={18} className="text-cyan-400" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      <div className="min-h-full w-full overflow-hidden px-4 pb-6 pt-4 text-slate-900 dark:text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
            <main className="min-w-0 space-y-4">
              {/* Tarjetas KPI Superiores */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Citas hoy</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{citasHoy}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Total programadas</p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    <Clock3 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Espacios disponibles</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{espaciosDisponibles}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Para agendar</p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Confirmadas</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{confirmadas}</p>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Citas confirmadas</p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-4 shadow-sm backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Hourglass size={20} />
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
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-400 transition hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      title="Sincronizar con backend"
                    >
                      <RefreshCw size={16} />
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
                  <div className="min-w-[760px]">
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
                        height: "720px",
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
                              style={{ top: `${i * 60 - 7}px` }}
                            >
                              {`${String(hora).padStart(2, "0")}:00`}
                            </div>
                          );
                        })}
                      </div>

                      {/* 7 Columnas de Días */}
                      {diasSemana.map((dia, idx) => {
                        const citasDia = obtenerCitasDia(dia);
                        const esHoy =
                          formatoFechaInput(dia) === formatoFechaInput(horaActual);

                        return (
                          <div
                            key={idx}
                            className={`relative border-r border-slate-200 dark:border-slate-800/60 ${
                              esHoy ? "bg-cyan-500/[0.03] dark:bg-cyan-500/[0.02]" : ""
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
                                  top: `${i * 60}px`,
                                  height: "60px",
                                }}
                              />
                            ))}

                            {/* Citas / Eventos */}
                            {citasDia.map((cita) => {
                              const posicion = obtenerPosicionEvento(cita);
                              const colorEvento = obtenerColorEvento(cita.estado);

                              return (
                                <div
                                  key={cita.id}
                                  style={{
                                    top: posicion.top,
                                    height: posicion.height,
                                  }}
                                  className={`group absolute left-1 right-1 z-20 overflow-hidden rounded-xl border p-2 shadow-sm transition hover:scale-[1.01] hover:z-30 cursor-pointer ${colorEvento.contenedor}`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <p className="truncate text-xs font-bold leading-tight">
                                      {cita.paciente}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarCita(cita.id);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:text-rose-500"
                                      title="Eliminar cita"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <p className="truncate text-[11px] opacity-90 mt-0.5">
                                    {cita.servicio}
                                  </p>
                                  <p className="text-[10px] opacity-75 mt-0.5 font-mono">
                                    {cita.horaInicio} - {cita.horaFin}
                                  </p>
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

      {/* Modal Agendar Cita */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fadeIn">
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
                className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <Save size={16} />
                Guardar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AgendaView;
