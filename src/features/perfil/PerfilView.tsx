import { useState } from "react";
import {
  Camera,
  Pencil,
  Save,
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Stethoscope,
  Key,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { ROLE_GUIDS } from "../../utils/routePermissions";

export default function PerfilView() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Normalize initial data
  const initialNombre = user?.nombre || (user?.name ? user.name.split(" ")[0] : "Usuario");
  const initialApellido = user?.apellido || (user?.name ? user.name.split(" ").slice(1).join(" ") : "");

  const [profileData, setProfileData] = useState({
    nombre: initialNombre,
    apellido: initialApellido,
    email: user?.email || "",
    telefono: user?.telefono || "+57 300 123 4567",
    cedula: user?.cedula || "1234567890",
    avatar: user?.avatar || "",
    direccion: user?.direccion || "Calle 100 # 15-20, Bogotá",
    sexo: user?.sexo || "Masculino",
    rol: user?.rol || user?.roleIds?.[0] || "PACIENTE",
  });

  if (!user) {
    return null;
  }

  // Detect current role
  const userRole = (user.rol || user.roleIds?.[0] || "PACIENTE").toUpperCase();
  const isAdmin =
    userRole === "ADMINISTRADOR" ||
    userRole === "ADMIN" ||
    user.roleIds?.includes(ROLE_GUIDS.ADMINISTRADOR) ||
    user.permissions?.includes("USERS:VIEW");

  const isPaciente =
    userRole === "PACIENTE" ||
    user.roleIds?.includes(ROLE_GUIDS.PACIENTE);

  const isOdontologo =
    userRole === "ODONTOLOGO" ||
    userRole === "DENTIST" ||
    user.roleIds?.includes(ROLE_GUIDS.ODONTOLOGO);

  const isRecepcionista =
    userRole === "RECEPCIONISTA" ||
    userRole === "RECEPTIONIST" ||
    user.roleIds?.includes(ROLE_GUIDS.RECEPCIONISTA);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    updateUser({
      name: `${profileData.nombre} ${profileData.apellido}`.trim(),
      nombre: profileData.nombre,
      apellido: profileData.apellido,
      email: profileData.email,
      telefono: profileData.telefono,
      cedula: profileData.cedula,
      direccion: profileData.direccion,
      sexo: profileData.sexo,
      rol: profileData.rol,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleCancel = () => {
    setProfileData({
      nombre: initialNombre,
      apellido: initialApellido,
      email: user.email || "",
      telefono: user.telefono || "+57 300 123 4567",
      cedula: user.cedula || "1234567890",
      avatar: user.avatar || "",
      direccion: user.direccion || "Calle 100 # 15-20, Bogotá",
      sexo: user.sexo || "Masculino",
      rol: user.rol || user.roleIds?.[0] || "PACIENTE",
    });
    setIsEditing(false);
  };

  const fullName = `${profileData.nombre} ${profileData.apellido}`.trim() || user.name || "Usuario";

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* ALERTA DE GUARDADO EXITOSO */}
      {savedSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
          <span className="text-sm font-medium">
            ¡Tu perfil ha sido actualizado y guardado correctamente!
          </span>
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Mi Cuenta NexusOdonto
          </p>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Perfil de Usuario
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {isPaciente && "Consulta y actualiza tus datos de contacto y revisa tus citas odontológicas."}
            {(isOdontologo || isRecepcionista) && "Gestiona tu información laboral, permisos y canales de contacto."}
            {isAdmin && "Panel completo de administración de perfil, permisos y seguridad."}
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-cyan-600 active:scale-95 cursor-pointer"
          >
            <Pencil size={18} />
            <span>Editar perfil</span>
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
              <span>Cancelar</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-cyan-600 active:scale-95 cursor-pointer"
            >
              <Save size={18} />
              <span>Guardar cambios</span>
            </button>
          </div>
        )}
      </div>

      {/* TARJETA PRINCIPAL */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* CABECERA DEL PERFIL */}
        <div className="relative border-b border-slate-200 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent px-6 py-8 dark:border-slate-800">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* FOTO */}
            <div className="relative h-28 w-28 shrink-0">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt={fullName}
                  className="h-28 w-28 rounded-3xl border-4 border-white object-cover shadow-lg dark:border-slate-900"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-cyan-500 text-4xl font-bold text-white shadow-lg">
                  {profileData.nombre.charAt(0)}
                </div>
              )}

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const newSeed = Math.random().toString(36).substring(7);
                    setProfileData((prev) => ({
                      ...prev,
                      avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${newSeed}`,
                    }));
                  }}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition-colors hover:bg-cyan-600 cursor-pointer"
                  title="Cambiar avatar aleatorio"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>

            {/* INFORMACIÓN PRINCIPAL */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                {fullName}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {profileData.email}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  <Briefcase className="w-3 h-3" />
                  {profileData.rol}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  CC: {profileData.cedula}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIONES SEGÚN ROL */}
        <div className="p-6 lg:p-8 space-y-8">
          {/* 1. INFORMACIÓN PERSONAL Y DE CONTACTO */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-500" />
                Información Personal y Contacto
              </h3>
              {isPaciente && !isEditing && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  (Puedes editar tu teléfono, correo y dirección)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* NOMBRE */}
              <ProfileField
                label="Nombre"
                name="nombre"
                value={profileData.nombre}
                icon={<User size={18} />}
                isEditing={isEditing && isAdmin}
                isReadOnly={!isAdmin}
                onChange={handleChange}
              />

              {/* APELLIDO */}
              <ProfileField
                label="Apellido"
                name="apellido"
                value={profileData.apellido}
                icon={<User size={18} />}
                isEditing={isEditing && isAdmin}
                isReadOnly={!isAdmin}
                onChange={handleChange}
              />

              {/* CORREO (Editable para todos) */}
              <ProfileField
                label="Correo electrónico"
                name="email"
                type="email"
                value={profileData.email}
                icon={<Mail size={18} />}
                isEditing={isEditing}
                onChange={handleChange}
              />

              {/* TELÉFONO (Editable para todos) */}
              <ProfileField
                label="Teléfono de contacto"
                name="telefono"
                type="tel"
                value={profileData.telefono}
                icon={<Phone size={18} />}
                isEditing={isEditing}
                onChange={handleChange}
              />

              {/* CÉDULA */}
              <ProfileField
                label="Número de Documento / Cédula"
                name="cedula"
                value={profileData.cedula}
                icon={<CreditCard size={18} />}
                isEditing={isEditing && isAdmin}
                isReadOnly={!isAdmin}
                onChange={handleChange}
              />

              {/* DIRECCIÓN */}
              <ProfileField
                label="Dirección de Residencia"
                name="direccion"
                value={profileData.direccion}
                icon={<MapPin size={18} />}
                isEditing={isEditing}
                onChange={handleChange}
              />

              {/* SEXO */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sexo / Género
                </label>
                {isEditing ? (
                  <select
                    name="sexo"
                    value={profileData.sexo}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                ) : (
                  <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                    {profileData.sexo || "No especificado"}
                  </div>
                )}
              </div>

              {/* ROL */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rol del Sistema
                </label>
                {isEditing && isAdmin ? (
                  <select
                    name="rol"
                    value={profileData.rol}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    <option value="ODONTOLOGO">ODONTOLOGO</option>
                    <option value="RECEPCIONISTA">RECEPCIONISTA</option>
                    <option value="PACIENTE">PACIENTE</option>
                  </select>
                ) : (
                  <div className="flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
                    <Briefcase size={16} className="text-slate-400" />
                    <span>{profileData.rol}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. VISTA ESPECÍFICA: PACIENTE -> MIS CITAS MÉDICAS */}
          {isPaciente && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-500" />
                  Mis Citas Odontológicas Programadas
                </h3>
                <span className="text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full">
                  1 Cita Activa
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/20 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        Próxima Consulta
                      </span>
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                        Limpieza y Valoración General
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-500" />
                        Dr. Laura Gómez (Odontología General)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      Confirmada
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-teal-500/20">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      15 Septiembre, 2026
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      10:00 AM - 11:00 AM
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Último Procedimiento
                      </span>
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        Calza en Resina Pieza #16
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Tratamiento completado con éxito
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Finalizada
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>10 Agosto, 2026</span>
                    <span>Sede Principal - Consultorio 3</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. VISTA ESPECÍFICA: ODONTÓLOGO / RECEPCIONISTA -> INFORMACIÓN LABORAL */}
          {(isOdontologo || isRecepcionista) && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-500" />
                Información Profesional y Asignación Laboral
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Especialidad / Área</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {isOdontologo ? "Odontología Integral y Ortodoncia" : "Recepción, Citas y Admisiones"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Turno y Horario</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    Lunes a Viernes (8:00 AM - 5:00 PM)
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Módulos Habilitados</p>
                  <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mt-1">
                    {isOdontologo ? "Citas, Pacientes, Odontograma" : "Citas, Agenda, Pacientes, Servicios"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. VISTA ESPECÍFICA: ADMINISTRADOR -> OPCIONES AVANZADAS */}
          {isAdmin && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-500" />
                Control y Seguridad de Administrador
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                  <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Nivel de Autorización</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">Super Administrador (12 Módulos)</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <p className="text-xs font-medium text-slate-500">Sesiones y Auditoría</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">Registro de actividad activo</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <p className="text-xs font-medium text-slate-500">Seguridad de Cuenta</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Token JWT Válido y Activo</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProfileFieldProps {
  label: string;
  name: string;
  value: string;
  type?: string;
  icon: React.ReactNode;
  isEditing: boolean;
  isReadOnly?: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}

function ProfileField({
  label,
  name,
  value,
  type = "text",
  icon,
  isEditing,
  isReadOnly = false,
  onChange,
}: ProfileFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {isEditing && !isReadOnly ? (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>

          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
      ) : (
        <div className="flex h-[42px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300">
          <span className="text-slate-400">{icon}</span>
          <span className="truncate">{value || "No especificado"}</span>
          {isReadOnly && isEditing && (
            <span className="ml-auto text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Solo lectura
            </span>
          )}
        </div>
      )}
    </div>
  );
}