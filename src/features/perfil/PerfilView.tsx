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
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

export default function PerfilView() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    email: user?.email || "",
    telefono: user?.telefono || "",
    cedula: user?.cedula || "",
    avatar: user?.avatar || "",
    sexo: "",
    rol: user?.rol || "",
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setProfileData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = () => {

    setIsEditing(false);

    console.log("Perfil actualizado:", profileData);
  };

  const handleCancel = () => {
    setProfileData({
      nombre: user?.nombre || "",
      apellido: user?.apellido || "",
      email: user?.email || "",
      telefono: user?.telefono || "",
      cedula: user?.cedula || "",
      avatar: user?.avatar || "",
      sexo: "",
      rol: user?.rol || "",
    });

    setIsEditing(false);
  };

  if (!user) {
    return null;
  }

  const fullName =
    `${profileData.nombre} ${profileData.apellido}`.trim();

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      {/* ENCABEZADO */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-cyan-600 dark:text-cyan-400">
            Mi cuenta
          </p>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Gestionar tu cuenta
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Consulta y actualiza la información de tu perfil.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-cyan-500
              px-5
              py-3
              font-medium
              text-white
              transition-colors
              hover:bg-cyan-600
            "
          >
            <Pencil size={18} />

            Editar perfil
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-300
                px-4
                py-3
                text-slate-700
                transition-colors
                hover:bg-slate-100
                dark:border-slate-700
                dark:text-slate-300
                dark:hover:bg-slate-800
              "
            >
              <X size={18} />

              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-cyan-500
                px-4
                py-3
                font-medium
                text-white
                transition-colors
                hover:bg-cyan-600
              "
            >
              <Save size={18} />

              Guardar cambios
            </button>
          </div>
        )}
      </div>

      {/* TARJETA PRINCIPAL */}
      <div
        className="
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        {/* CABECERA DEL PERFIL */}
        <div
          className="
            relative
            border-b
            border-slate-200
            bg-gradient-to-r
            from-cyan-500/10
            via-blue-500/5
            to-transparent
            px-6
            py-8
            dark:border-slate-800
          "
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* FOTO */}
            <div className="relative h-28 w-28 shrink-0">
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt={fullName}
                  className="
                    h-28
                    w-28
                    rounded-3xl
                    border-4
                    border-white
                    object-cover
                    shadow-lg
                    dark:border-slate-900
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-28
                    w-28
                    items-center
                    justify-center
                    rounded-3xl
                    bg-cyan-500
                    text-4xl
                    font-bold
                    text-white
                  "
                >
                  {profileData.nombre.charAt(0)}
                </div>
              )}

              {isEditing && (
                <button
                  type="button"
                  className="
                    absolute
                    -bottom-2
                    -right-2
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-cyan-500
                    text-white
                    shadow-lg
                    transition-colors
                    hover:bg-cyan-600
                  "
                  aria-label="Cambiar foto"
                >
                  <Camera size={18} />
                </button>
              )}
            </div>

            {/* INFORMACIÓN PRINCIPAL */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {fullName}
              </h2>

              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {profileData.email}
              </p>

              <span
                className="
                  mt-3
                  inline-flex
                  rounded-full
                  bg-cyan-500/10
                  px-3
                  py-1
                  text-sm
                  font-medium
                  text-cyan-600
                  dark:text-cyan-400
                "
              >
                {profileData.rol}
              </span>
            </div>
          </div>
        </div>

        {/* INFORMACIÓN EDITABLE */}
        <div className="p-6 lg:p-8">
          <h3 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
            Información personal
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* NOMBRE */}
            <ProfileField
              label="Nombre"
              name="nombre"
              value={profileData.nombre}
              icon={<User size={18} />}
              isEditing={isEditing}
              onChange={handleChange}
            />

            {/* APELLIDO */}
            <ProfileField
              label="Apellido"
              name="apellido"
              value={profileData.apellido}
              icon={<User size={18} />}
              isEditing={isEditing}
              onChange={handleChange}
            />

            {/* CORREO */}
            <ProfileField
              label="Correo electrónico"
              name="email"
              type="email"
              value={profileData.email}
              icon={<Mail size={18} />}
              isEditing={isEditing}
              onChange={handleChange}
            />

            {/* TELÉFONO */}
            <ProfileField
              label="Teléfono"
              name="telefono"
              type="tel"
              value={profileData.telefono}
              icon={<Phone size={18} />}
              isEditing={isEditing}
              onChange={handleChange}
            />

            {/* CÉDULA */}
            <ProfileField
              label="Cédula"
              name="cedula"
              value={profileData.cedula}
              icon={<CreditCard size={18} />}
              isEditing={isEditing}
              onChange={handleChange}
            />

            {/* SEXO */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Sexo
              </label>

              {isEditing ? (
                <select
                  name="sexo"
                  value={profileData.sexo}
                  onChange={handleChange}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-3
                    text-slate-900
                    outline-none
                    transition-colors
                    focus:border-cyan-500
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-white
                  "
                >
                  <option value="">
                    Seleccionar sexo
                  </option>

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
              ) : (
                <div
                  className="
                    flex
                    h-[50px]
                    items-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-slate-700
                    dark:border-slate-800
                    dark:bg-slate-950/50
                    dark:text-slate-300
                  "
                >
                  {profileData.sexo || "No especificado"}
                </div>
              )}
            </div>

            {/* CARGO / ROL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Cargo / Rol
              </label>

              {isEditing ? (
                <select
                  name="rol"
                  value={profileData.rol}
                  onChange={handleChange}
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-3
                    text-slate-900
                    outline-none
                    transition-colors
                    focus:border-cyan-500
                    dark:border-slate-700
                    dark:bg-slate-950
                    dark:text-white
                  "
                >
                  <option value="ADMIN">
                    ADMIN
                  </option>

                  <option value="ODONTOLOGO">
                    ODONTÓLOGO
                  </option>

                  <option value="RECEPCIONISTA">
                    RECEPCIONISTA
                  </option>
                </select>
              ) : (
                <div
                  className="
                    flex
                    h-[50px]
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-slate-700
                    dark:border-slate-800
                    dark:bg-slate-950/50
                    dark:text-slate-300
                  "
                >
                  <Briefcase size={18} />

                  {profileData.rol}
                </div>
              )}
            </div>
          </div>
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
  onChange,
}: ProfileFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {isEditing ? (
        <div className="relative">
          <span
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          >
            {icon}
          </span>

          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              bg-white
              py-3
              pl-11
              pr-4
              text-slate-900
              outline-none
              transition-colors
              focus:border-cyan-500
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-white
            "
          />
        </div>
      ) : (
        <div
          className="
            flex
            h-[50px]
            items-center
            gap-3
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            text-slate-700
            dark:border-slate-800
            dark:bg-slate-950/50
            dark:text-slate-300
          "
        >
          <span className="text-slate-400">
            {icon}
          </span>

          {value || "No especificado"}
        </div>
      )}
    </div>
  );
}