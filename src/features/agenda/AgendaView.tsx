import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CheckCircle2,
  Hourglass,
  Users,
  Stethoscope,
  Settings2,
  X,
  Save,
} from "lucide-react";

import {
  type Cita,
  type EstadoCita,
  citasIniciales,
  nombresDias,
  odontologos,
  tiposCita,
  sumarDias,
  obtenerInicioSemana,
  formatoFechaInput,
  obtenerNombreMes,
  obtenerRangoSemana,
  obtenerColorEvento,
} from "./AgendaData";

export function AgendaView() {
  const [citas, setCitas] = useState<Cita[]>(citasIniciales);

  const [vista, setVista] = useState<"Día" | "Semana" | "Mes">(
    "Semana"
  );

  const [fechaActual, setFechaActual] = useState(
    new Date(2026, 8, 1)
  );

  const [odontologosSeleccionados, setOdontologosSeleccionados] =
    useState<string[]>(["Todos los odontólogos"]);

  const [mostrarModal, setMostrarModal] = useState(false);

  const [fechaSeleccionada, setFechaSeleccionada] = useState("");

  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  const [nuevaCita, setNuevaCita] = useState({
    paciente: "",
    servicio: "",
    odontologo: "Dra. Laura Gómez",
    horaInicio: "",
    horaFin: "",
    estado: "Pendiente" as EstadoCita,
  });

  const inicioSemana = useMemo(() => {
    return obtenerInicioSemana(fechaActual);
  }, [fechaActual]);

  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) =>
      sumarDias(inicioSemana, index)
    );
  }, [inicioSemana]);

  const horasGrid = useMemo(() => {
    return Array.from({ length: 22 }, (_, index) => {
      const totalMinutos = 7 * 60 + index * 30;

      const hora = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;

      return `${String(hora).padStart(2, "0")}:${String(
        minutos
      ).padStart(2, "0")}`;
    });
  }, []);

  const citasFiltradas = useMemo(() => {
    if (
      odontologosSeleccionados.includes(
        "Todos los odontólogos"
      )
    ) {
      return citas;
    }

    return citas.filter((cita) =>
      odontologosSeleccionados.includes(cita.odontologo)
    );
  }, [citas, odontologosSeleccionados]);

  const citasHoy = useMemo(() => {
    const hoy = formatoFechaInput(fechaActual);

    return citas.filter((cita) => cita.fecha === hoy).length;
  }, [citas, fechaActual]);

  const confirmadas = useMemo(() => {
    return citas.filter(
      (cita) => cita.estado === "Confirmada"
    ).length;
  }, [citas]);

  const pendientes = useMemo(() => {
    return citas.filter(
      (cita) => cita.estado === "Pendiente"
    ).length;
  }, [citas]);

  const espaciosDisponibles = useMemo(() => {
    return (
      citas.filter(
        (cita) => cita.estado === "Disponible"
      ).length + 20
    );
  }, [citas]);

  const cambiarSemana = (direccion: number) => {
    setFechaActual((fecha) =>
      sumarDias(fecha, direccion * 7)
    );
  };

  const irHoy = () => {
    setFechaActual(new Date());
  };

  const cambiarOdontologo = (nombre: string) => {
    if (nombre === "Todos los odontólogos") {
      setOdontologosSeleccionados([
        "Todos los odontólogos",
      ]);

      return;
    }

    setOdontologosSeleccionados((actuales) => {
      const sinTodos = actuales.filter(
        (odontologo) =>
          odontologo !== "Todos los odontólogos"
      );

      if (sinTodos.includes(nombre)) {
        const nuevos = sinTodos.filter(
          (odontologo) => odontologo !== nombre
        );

        return nuevos.length > 0
          ? nuevos
          : ["Todos los odontólogos"];
      }

      return [...sinTodos, nombre];
    });
  };

  const obtenerCitasDia = (fecha: Date) => {
    const fechaTexto = formatoFechaInput(fecha);

    return citasFiltradas.filter(
      (cita) => cita.fecha === fechaTexto
    );
  };

  const abrirNuevaCita = (fecha: Date, hora: string) => {
    const horaNumero = Number(hora.split(":")[0]);

    const horaFin = `${String(
      horaNumero + 1
    ).padStart(2, "0")}:00`;

    setFechaSeleccionada(formatoFechaInput(fecha));

    setHoraSeleccionada(hora);

    setNuevaCita({
      paciente: "",
      servicio: "",
      odontologo: "Dra. Laura Gómez",
      horaInicio: hora,
      horaFin,
      estado: "Pendiente",
    });

    setMostrarModal(true);
  };

  const guardarCita = () => {
    if (
      !nuevaCita.paciente.trim() ||
      !nuevaCita.servicio.trim() ||
      !fechaSeleccionada
    ) {
      return;
    }

    const cita: Cita = {
      id:
        citas.length > 0
          ? Math.max(...citas.map((item) => item.id)) + 1
          : 1,
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

  const obtenerPosicionEvento = (cita: Cita) => {
    const [horaInicio, minutosInicio] =
      cita.horaInicio.split(":").map(Number);

    const [horaFin, minutosFin] =
      cita.horaFin.split(":").map(Number);

    const inicioMinutos =
      (horaInicio - 7) * 60 + minutosInicio;

    const finMinutos =
      (horaFin - 7) * 60 + minutosFin;

    return {
      top: `${inicioMinutos}px`,
      height: `${Math.max(
        finMinutos - inicioMinutos,
        54
      )}px`,
    };
  };

  const gridTemplateColumns =
    "48px repeat(7, minmax(100px, 1fr))";

  return (
    <>
      <div className="min-h-full w-full overflow-hidden px-4 pb-6 pt-4 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1700px]">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_235px]">
            <main className="min-w-0 space-y-4">
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/85 px-4 py-4 shadow-lg backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
                    <CalendarDays
                      size={20}
                      className="text-cyan-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Citas hoy
                    </p>

                    <p className="mt-1 text-2xl font-bold text-white">
                      {citasHoy}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Total programadas
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/85 px-4 py-4 shadow-lg backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
                    <Clock3
                      size={20}
                      className="text-cyan-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Espacios disponibles
                    </p>

                    <p className="mt-1 text-2xl font-bold text-white">
                      {espaciosDisponibles}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Para agendar
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/85 px-4 py-4 shadow-lg backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10">
                    <CheckCircle2
                      size={20}
                      className="text-blue-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Confirmadas
                    </p>

                    <p className="mt-1 text-2xl font-bold text-white">
                      {confirmadas}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Citas confirmadas
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/85 px-4 py-4 shadow-lg backdrop-blur-sm">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10">
                    <Hourglass
                      size={20}
                      className="text-amber-400"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Pendientes
                    </p>

                    <p className="mt-1 text-2xl font-bold text-white">
                      {pendientes}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Por confirmar
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-3 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col gap-3 px-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={irHoy}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
                    >
                      Hoy
                    </button>

                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                      <button
                        type="button"
                        onClick={() => cambiarSemana(-1)}
                        className="flex h-9 w-9 items-center justify-center text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      >
                        <ChevronLeft size={17} />
                      </button>

                      <div className="h-5 w-px bg-slate-700" />

                      <button
                        type="button"
                        onClick={() => cambiarSemana(1)}
                        className="flex h-9 w-9 items-center justify-center text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pl-1">
                      <CalendarDays
                        size={16}
                        className="text-cyan-400"
                      />

                      <span className="text-sm font-semibold text-slate-200">
                        {obtenerRangoSemana(inicioSemana)}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full rounded-xl border border-slate-700 bg-slate-950 p-1 sm:w-auto">
                    {(["Día", "Semana", "Mes"] as const).map(
                      (opcion) => (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => setVista(opcion)}
                          className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                            vista === opcion
                              ? "bg-cyan-500/15 text-cyan-300"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {opcion}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      className="ml-1 flex w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-slate-300"
                    >
                      <Settings2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700/80">
                  <div className="min-w-[860px]">
                    <div className="h-[560px] overflow-y-auto">
                      <div className="sticky top-0 z-30 border-b border-slate-700/80 bg-slate-900">
                        <div
                          className="grid"
                          style={{
                            gridTemplateColumns,
                          }}
                        >
                          <div className="h-[72px] border-r border-slate-700/80 bg-slate-900" />

                          {diasSemana.map((dia, index) => {
                            const fechaDia =
                              formatoFechaInput(dia);

                            const esHoy =
                              fechaDia ===
                              formatoFechaInput(new Date());

                            const esSeleccionado =
                              fechaDia ===
                              formatoFechaInput(fechaActual);

                            return (
                              <button
                                key={fechaDia}
                                type="button"
                                onClick={() =>
                                  setFechaActual(
                                    new Date(dia)
                                  )
                                }
                                className={`flex h-[72px] min-w-0 flex-col items-center justify-center border-r border-slate-700/80 last:border-r-0 ${
                                  esSeleccionado
                                    ? "bg-slate-800/90"
                                    : "bg-slate-900"
                                }`}
                              >
                                <span
                                  className={`text-[9px] font-bold tracking-[0.16em] ${
                                    esSeleccionado
                                      ? "text-cyan-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {nombresDias[index]}
                                </span>

                                <span
                                  className={`mt-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                    esHoy
                                      ? "bg-cyan-500 text-slate-950"
                                      : esSeleccionado
                                      ? "border border-cyan-400/40 bg-cyan-500/10 text-cyan-300"
                                      : "text-slate-300"
                                  }`}
                                >
                                  {dia.getDate()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns,
                        }}
                      >
                        <div className="border-r border-slate-700/80 bg-slate-950">
                          {horasGrid.map(
                            (hora, index) => (
                              <div
                                key={hora}
                                className={`relative h-[30px] ${
                                  index % 2 === 0
                                    ? "border-t border-slate-700/80"
                                    : "border-t border-slate-800/70"
                                }`}
                              >
                                {index % 2 === 0 && (
                                  <span className="absolute right-2 top-[6px] whitespace-nowrap text-[9px] text-slate-500">
                                    {hora}
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {diasSemana.map((dia) => {
                          const citasDia =
                            obtenerCitasDia(dia);

                          const fechaDia =
                            formatoFechaInput(dia);

                          return (
                            <div
                              key={fechaDia}
                              className="relative min-w-0 border-r border-slate-700/80 last:border-r-0"
                            >
                              {horasGrid.map(
                                (hora, index) => (
                                  <button
                                    key={hora}
                                    type="button"
                                    onClick={() => {
                                      if (
                                        index % 2 ===
                                        0
                                      ) {
                                        abrirNuevaCita(
                                          dia,
                                          hora
                                        );
                                      }
                                    }}
                                    className={`block h-[30px] w-full text-left transition ${
                                      index % 2 === 0
                                        ? "border-t border-slate-700/80 hover:bg-cyan-500/5"
                                        : "border-t border-slate-800/70"
                                    }`}
                                  />
                                )
                              )}

                              {citasDia.map((cita) => {
                                const colores =
                                  obtenerColorEvento(
                                    cita.estado
                                  );

                                const posicion =
                                  obtenerPosicionEvento(
                                    cita
                                  );

                                return (
                                  <button
                                    key={cita.id}
                                    type="button"
                                    style={{
                                      top: posicion.top,
                                      height:
                                        posicion.height,
                                    }}
                                    className={`absolute left-1 right-1 z-20 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-md transition hover:z-30 hover:scale-[1.01] ${colores.contenedor}`}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="text-[9px] font-medium text-slate-400">
                                        {cita.horaInicio} -{" "}
                                        {cita.horaFin}
                                      </span>

                                      <span
                                        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${colores.punto}`}
                                      />
                                    </div>

                                    <p
                                      className={`mt-1 truncate text-[11px] font-bold ${colores.titulo}`}
                                    >
                                      {cita.paciente}
                                    </p>

                                    <p
                                      className={`mt-0.5 truncate text-[9px] ${colores.texto}`}
                                    >
                                      {cita.servicio}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-xl backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold capitalize text-slate-200">
                    {obtenerNombreMes(fechaActual)}
                  </h3>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFechaActual(
                          (fecha) =>
                            new Date(
                              fecha.getFullYear(),
                              fecha.getMonth() - 1,
                              fecha.getDate()
                            )
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-white"
                    >
                      <ChevronLeft size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFechaActual(
                          (fecha) =>
                            new Date(
                              fecha.getFullYear(),
                              fecha.getMonth() + 1,
                              fecha.getDate()
                            )
                        )
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900 hover:text-white"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-y-2 text-center">
                  {[
                    "D",
                    "L",
                    "M",
                    "M",
                    "J",
                    "V",
                    "S",
                  ].map((dia, index) => (
                    <span
                      key={`${dia}-${index}`}
                      className="text-[9px] font-bold text-slate-500"
                    >
                      {dia}
                    </span>
                  ))}

                  {Array.from(
                    {
                      length: new Date(
                        fechaActual.getFullYear(),
                        fechaActual.getMonth(),
                        1
                      ).getDay(),
                    },
                    (_, index) => (
                      <span key={`vacio-${index}`} />
                    )
                  )}

                  {Array.from(
                    {
                      length: new Date(
                        fechaActual.getFullYear(),
                        fechaActual.getMonth() + 1,
                        0
                      ).getDate(),
                    },
                    (_, index) => {
                      const diaNumero = index + 1;

                      const fechaDia = new Date(
                        fechaActual.getFullYear(),
                        fechaActual.getMonth(),
                        diaNumero
                      );

                      const esSeleccionado =
                        formatoFechaInput(fechaDia) ===
                        formatoFechaInput(fechaActual);

                      return (
                        <button
                          key={diaNumero}
                          type="button"
                          onClick={() =>
                            setFechaActual(fechaDia)
                          }
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition ${
                            esSeleccionado
                              ? "bg-cyan-500 text-slate-950"
                              : "text-slate-400 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          {diaNumero}
                        </button>
                      );
                    }
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-xl backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Users
                    size={17}
                    className="text-cyan-400"
                  />

                  <h3 className="text-sm font-bold text-slate-200">
                    Odontólogos
                  </h3>
                </div>

                <div className="space-y-3">
                  {odontologos.map((odontologo) => {
                    const seleccionado =
                      odontologosSeleccionados.includes(
                        odontologo.nombre
                      );

                    return (
                      <button
                        key={odontologo.nombre}
                        type="button"
                        onClick={() =>
                          cambiarOdontologo(
                            odontologo.nombre
                          )
                        }
                        className="flex w-full items-center gap-2 text-left"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                            seleccionado
                              ? "border-cyan-400 bg-cyan-500/20"
                              : "border-slate-600"
                          }`}
                        >
                          {seleccionado && (
                            <span className="h-2 w-2 rounded-sm bg-cyan-400" />
                          )}
                        </span>

                        <span
                          className={`h-2 w-2 rounded-full ${odontologo.color}`}
                        />

                        <span className="text-xs text-slate-400">
                          {odontologo.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-700/80 bg-slate-950/90 p-4 shadow-xl backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Stethoscope
                    size={17}
                    className="text-cyan-400"
                  />

                  <h3 className="text-sm font-bold text-slate-200">
                    Tipos de cita
                  </h3>
                </div>

                <div className="space-y-3">
                  {tiposCita.map((tipo) => (
                    <div
                      key={tipo.nombre}
                      className="flex items-center gap-2"
                    >
                      <span className="h-4 w-4 rounded border border-slate-600" />

                      <span
                        className={`h-2 w-2 rounded-full ${tipo.color}`}
                      />

                      <span className="text-xs text-slate-400">
                        {tipo.nombre}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-slate-800 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="relative block h-px w-9 bg-red-400">
                      <span className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-red-400" />
                    </span>

                    <span className="text-[10px] text-slate-500">
                      Hora actual
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-4 w-7 rounded border border-slate-700 bg-slate-900" />

                    <span className="text-[10px] text-slate-500">
                      No disponible
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Agendar cita
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {fechaSeleccionada} · {horaSeleccionada}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarModal(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-900 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Paciente
                </label>

                <input
                  value={nuevaCita.paciente}
                  onChange={(event) =>
                    setNuevaCita((actual) => ({
                      ...actual,
                      paciente: event.target.value,
                    }))
                  }
                  placeholder="Nombre del paciente"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Servicio
                </label>

                <input
                  value={nuevaCita.servicio}
                  onChange={(event) =>
                    setNuevaCita((actual) => ({
                      ...actual,
                      servicio: event.target.value,
                    }))
                  }
                  placeholder="Ej: Limpieza dental"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Odontólogo
                </label>

                <select
                  value={nuevaCita.odontologo}
                  onChange={(event) =>
                    setNuevaCita((actual) => ({
                      ...actual,
                      odontologo: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option>Dra. Laura Gómez</option>
                  <option>Dr. Juan Martínez</option>
                  <option>Dra. Patricia Silva</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Inicio
                  </label>

                  <input
                    type="time"
                    value={nuevaCita.horaInicio}
                    onChange={(event) =>
                      setNuevaCita((actual) => ({
                        ...actual,
                        horaInicio: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Finaliza
                  </label>

                  <input
                    type="time"
                    value={nuevaCita.horaFin}
                    onChange={(event) =>
                      setNuevaCita((actual) => ({
                        ...actual,
                        horaFin: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-400">
                  Estado
                </label>

                <select
                  value={nuevaCita.estado}
                  onChange={(event) =>
                    setNuevaCita((actual) => ({
                      ...actual,
                      estado: event.target
                        .value as EstadoCita,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="Confirmada">
                    Confirmada
                  </option>

                  <option value="Pendiente">
                    Pendiente
                  </option>

                  <option value="En Atención">
                    En Atención
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() =>
                  setMostrarModal(false)
                }
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarCita}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
              >
                <Save size={16} />
                Guardar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}