import { useState, type ChangeEvent } from "react";

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
  FileText,
  Calendar,
  MapPin,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

export default function PerfilView() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || user?.name || "",
    apellido: user?.apellido || "",
    email: user?.email || "",
    telefono: user?.telefono || "",
    tipoDocumento: user?.tipoDocumento || "",
    cedula: user?.cedula || "",
    fechaNacimiento: user?.fechaNacimiento || "",
    sexo: user?.sexo || "",
    direccion: user?.direccion || "",
    rol: user?.rol || "",
    avatar: user?.avatar || "",
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setProfileData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setProfileData({
      nombre: user?.nombre || user?.name || "",
      apellido: user?.apellido || "",
      email: user?.email || "",
      telefono: user?.telefono || "",
      tipoDocumento: user?.tipoDocumento || "",
      cedula: user?.cedula || "",
      fechaNacimiento: user?.fechaNacimiento || "",
      sexo: user?.sexo || "",
      direccion: user?.direccion || "",
      rol: user?.rol || "",
      avatar: user?.avatar || "",
    });

    setIsEditing(false);
  };

  const handleSave = () => {
    console.log(profileData);

    setIsEditing(false);
  };

  const fullName = `${profileData.nombre} ${profileData.apellido}`.trim();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-cyan-600 dark:text-cyan-400">
            Mi cuenta
          </p>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            Gestionar tu cuenta
          </h1>

          <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Consulta y actualiza la información de tu perfil.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-medium text-white transition-colors hover:bg-cyan-600"
          >
            <Pencil size={18} />
            Editar perfil
          </button>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X size={18} />
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-medium text-white transition-colors hover:bg-cyan-600"
            >
              <Save size={18} />
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-6 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="relative">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt={fullName}
                  className="h-20 w-20 rounded-2xl object-cover ring-2 ring-cyan-500/20"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-500 text-2xl font-bold text-white">
                  {profileData.nombre.charAt(0) || "U"}
                </div>
              )}

              {isEditing && (
                <button
                  type="button"
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg transition-colors hover:bg-cyan-600"
                  aria-label="Cambiar foto"
                >
                  <Camera size={17} />
                </button>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {fullName}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {profileData.email}
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                <Briefcase size={16} />
                {profileData.rol || "Sin cargo"}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <h3 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
            Información personal
          </h3>

          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
            <ProfileField
              label="Nombre"
              icon={<User size={18} />}
            >
              <input
                type="text"
                name="nombre"
                value={profileData.nombre}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>

            <ProfileField
              label="Apellido"
              icon={<User size={18} />}
            >
              <input
                type="text"
                name="apellido"
                value={profileData.apellido}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>

            <ProfileField
              label="Correo electrónico"
              icon={<Mail size={18} />}
            >
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>

            <ProfileField
              label="Teléfono"
              icon={<Phone size={18} />}
            >
              <input
                type="tel"
                name="telefono"
                value={profileData.telefono}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>

            <ProfileField
              label="Tipo de documento"
              icon={<FileText size={18} />}
            >
              <select
                name="tipoDocumento"
                value={profileData.tipoDocumento}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              >
                <option value="">No especificado</option>
                <option value="CC">
                  Cédula de Ciudadanía (CC)
                </option>
                <option value="TI">
                  Tarjeta de Identidad (TI)
                </option>
                <option value="CE">
                  Cédula de Extranjería (CE)
                </option>
                <option value="PASAPORTE">
                  Pasaporte
                </option>
              </select>
            </ProfileField>

            <ProfileField
              label="Número de documento"
              icon={<CreditCard size={18} />}
            >
              <input
                type="text"
                name="cedula"
                value={profileData.cedula}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>

            <ProfileField
              label="Fecha de nacimiento"
              icon={<Calendar size={18} />}
            >
              <input
                type="date"
                name="fechaNacimiento"
                value={profileData.fechaNacimiento}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>

            <ProfileField
              label="Sexo"
              icon={<User size={18} />}
            >
              <select
                name="sexo"
                value={profileData.sexo}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              >
                <option value="">No especificado</option>
                <option value="Masculino">
                  Masculino
                </option>
                <option value="Femenino">
                  Femenino
                </option>
                <option value="Otro">
                  Otro
                </option>
              </select>
            </ProfileField>

            <ProfileField
              label="Dirección de residencia"
              icon={<MapPin size={18} />}
            >
              <input
                type="text"
                name="direccion"
                value={profileData.direccion}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>

            <ProfileField
              label="Cargo / Rol"
              icon={<Briefcase size={18} />}
            >
              <input
                type="text"
                name="rol"
                value={profileData.rol}
                onChange={handleChange}
                disabled={!isEditing}
                className={inputClass}
              />
            </ProfileField>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-500 disabled:cursor-default disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-950/50";

interface ProfileFieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ProfileField({
  label,
  icon,
  children,
}: ProfileFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        {children}
      </div>
    </div>
  );
}