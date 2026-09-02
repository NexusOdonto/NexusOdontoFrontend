import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  Camera,
  Pencil,
  Save,
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { authService } from "../../api/authService";
import { personService } from "../../api/personService";
import { UserAvatar } from "../../components/common/UserAvatar";
import { formatRoleName } from "../../utils/roleUtils";

export default function PerfilView() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const userId = user?.id || user?.email || "default_user";

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || user?.name?.split(" ")[0] || "",
    apellido:
      user?.apellido || user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    telefono: user?.telefono || "",
    tipoDocumento: user?.tipoDocumento || "",
    cedula: user?.cedula || "",
    fechaNacimiento: user?.fechaNacimiento || "",
    sexo: user?.sexo || "",
    direccion: user?.direccion || "",
    rol: user?.rol || (user?.roleIds && user.roleIds[0]) || "PACIENTE",
    avatar: user?.avatar || user?.avatarUrl || "",
  });

  // Sincronización robusta del perfil desde AuthContext y la API
  useEffect(() => {
    let isMounted = true;

    const syncProfile = async () => {
      const savedAvatar = localStorage.getItem(`user_avatar_${userId}`);
      const activeAvatar =
        user?.avatar || user?.avatarUrl || savedAvatar || "";

      if (user) {
        setProfileData((prev) => ({
          ...prev,
          nombre:
            user.nombre ||
            user.name?.split(" ")[0] ||
            prev.nombre,
          apellido:
            user.apellido ||
            user.name?.split(" ").slice(1).join(" ") ||
            prev.apellido,
          email: user.email || prev.email,
          telefono: user.telefono || prev.telefono,
          tipoDocumento:
            user.tipoDocumento || prev.tipoDocumento,
          cedula: user.cedula || prev.cedula,
          fechaNacimiento:
            user.fechaNacimiento || prev.fechaNacimiento,
          sexo: user.sexo || prev.sexo,
          direccion: user.direccion || prev.direccion,
          rol:
            user.rol ||
            (user.roleIds && user.roleIds[0]) ||
            prev.rol,
          avatar: activeAvatar,
        }));
      }

      try {
        const profile = await authService.getProfile();

        if (profile && isMounted) {
          const userObj = profile.user || profile;

          const uId =
            userObj.id ||
            userObj.email ||
            userId;

          const freshSavedAvatar = uId
            ? localStorage.getItem(`user_avatar_${uId}`)
            : null;

          const firstName =
            userObj.firstName ||
            userObj.nombre ||
            (userObj.name
              ? userObj.name.split(" ")[0]
              : "");

          const lastName =
            userObj.lastName ||
            userObj.apellido ||
            (userObj.name
              ? userObj.name.split(" ").slice(1).join(" ")
              : "");

          setProfileData({
            nombre: firstName,
            apellido: lastName,
            email: userObj.email || "",
            telefono:
              userObj.phone ||
              userObj.telefono ||
              "",
            tipoDocumento:
              userObj.documentTypeId ||
              userObj.tipoDocumento ||
              "",
            cedula:
              userObj.documentNumber ||
              userObj.cedula ||
              "",
            fechaNacimiento:
              userObj.dateOfBirth ||
              userObj.fechaNacimiento ||
              "",
            sexo:
              userObj.sexId ||
              userObj.sexo ||
              "",
            direccion:
              userObj.address ||
              userObj.direccion ||
              "",
            rol:
              user?.rol ||
              (userObj.roleIds && userObj.roleIds[0]) ||
              "PACIENTE",
            avatar:
              userObj.avatar ||
              userObj.avatarUrl ||
              freshSavedAvatar ||
              activeAvatar,
          });
        }
      } catch (err) {
        console.warn(
          "Silent profile sync in PerfilView:",
          err,
        );
      }
    };

    syncProfile();

    return () => {
      isMounted = false;
    };
  }, [user, userId]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;

    setProfileData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Previsualización de nueva foto solo en modo edición
  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    setUploadError("");

    const file = e.target.files?.[0];

    if (!file) return;

    // Validación de formato
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!validTypes.includes(file.type)) {
      setUploadError(
        "Formato no soportado. Por favor selecciona una imagen PNG, JPG o WebP.",
      );
      return;
    }

    // Validación de tamaño (Máx 2MB)
    const maxSizeInBytes = 2 * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      setUploadError(
        "La imagen no debe superar los 2 MB de tamaño.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;

      // Actualizar únicamente el estado de previsualización local
      setProfileData((prev) => ({
        ...prev,
        avatar: base64String,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaveSuccess(false);
    setUploadError("");
  };

  const handleCancel = () => {
    // Revertir a la versión guardada previamente
    const savedAvatar =
      localStorage.getItem(
        `user_avatar_${userId}`,
      ) ||
      user?.avatar ||
      user?.avatarUrl ||
      "";

    setProfileData({
      nombre:
        user?.nombre ||
        user?.name?.split(" ")[0] ||
        "",
      apellido:
        user?.apellido ||
        user?.name?.split(" ").slice(1).join(" ") ||
        "",
      email: user?.email || "",
      telefono: user?.telefono || "",
      tipoDocumento: user?.tipoDocumento || "",
      cedula: user?.cedula || "",
      fechaNacimiento:
        user?.fechaNacimiento || "",
      sexo: user?.sexo || "",
      direccion: user?.direccion || "",
      rol:
        user?.rol ||
        (user?.roleIds && user.roleIds[0]) ||
        "PACIENTE",
      avatar: savedAvatar,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsEditing(false);
    setUploadError("");
  };

  const handleSave = async () => {
    // 1. Persistir foto en localStorage si fue modificada
    if (profileData.avatar) {
      localStorage.setItem(
        `user_avatar_${userId}`,
        profileData.avatar,
      );
    }

    // 2. Actualizar contexto de sesión global
    if (updateUser) {
      updateUser(profileData);
    }

    // 3. Persistir en backend API si personId es válido
    if (
      user?.personId &&
      user.personId.length > 10
    ) {
      try {
        await personService.update(
          user.personId,
          {
            documentTypeId:
              profileData.tipoDocumento ||
              "10000000-0000-0000-0000-000000000001",
            documentNumber:
              profileData.cedula ||
              user.cedula ||
              "1076543210",
            firstName: profileData.nombre,
            lastName: profileData.apellido,
            email: profileData.email,
            phone: profileData.telefono,
            dateOfBirth:
              profileData.fechaNacimiento,
            sexId:
              profileData.sexo ||
              "11000000-0000-0000-0000-000000000001",
            address: profileData.direccion,
          },
        );
      } catch (err) {
        console.warn(
          "Backend person update sync:",
          err,
        );
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setIsEditing(false);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const fullName =
    `${profileData.nombre} ${profileData.apellido}`.trim() ||
    user?.name ||
    "Usuario";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handleImageChange}
      />

      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Mi Perfil de Usuario
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Información personal, foto de perfil y credenciales de acceso clínico.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 animate-fadeIn">
              <CheckCircle size={14} />
              Guardado con éxito
            </span>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition-all hover:bg-teal-600"
            >
              <Pencil size={16} />
              <span>Editar Perfil</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={15} />
                <span>Cancelar</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-all hover:bg-teal-600"
              >
                <Save size={15} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Validación */}
      {uploadError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/15 p-3.5 text-xs text-red-400 animate-fadeIn">
          <AlertCircle
            size={16}
            className="flex-shrink-0"
          />

          <span>{uploadError}</span>
        </div>
      )}

      {/* Tarjeta de Identidad */}
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-slate-700/30 bg-slate-900/35 p-6 shadow-sm backdrop-blur-md md:flex-row md:p-8">
        <div className="relative group">
          <div
            onClick={() => {
              if (isEditing) {
                fileInputRef.current?.click();
              }
            }}
            className={`relative overflow-hidden rounded-2xl ring-4 transition-all duration-300 ${
              isEditing
                ? "cursor-pointer ring-teal-500/40 hover:ring-teal-500/70"
                : "cursor-default ring-teal-500/15"
            }`}
            title={
              isEditing
                ? "Haz clic para seleccionar una nueva foto"
                : undefined
            }
          >
            <UserAvatar
              avatar={profileData.avatar}
              name={fullName}
              size="xl"
              className={`h-24 w-24 rounded-2xl bg-teal-500/10 object-cover transition-transform duration-300 sm:h-28 sm:w-28 ${
                isEditing
                  ? "group-hover:scale-105"
                  : ""
              }`}
              fallbackClassName="flex h-24 w-24 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/20 text-2xl font-extrabold text-teal-700 sm:h-28 sm:w-28 dark:text-teal-300"
            />

            {/* Overlay interactivo SOLO visible en modo edición */}
            {isEditing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-950/60 text-[10px] font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Camera
                  size={18}
                  className="text-teal-300"
                />

                <span>Cambiar foto</span>
              </div>
            )}
          </div>

          {/* Botón de Cámara SOLO visible en modo edición */}
          {isEditing && (
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="absolute -bottom-2 -right-2 cursor-pointer rounded-xl border border-white/20 bg-gradient-to-r from-teal-500 to-cyan-400 p-2.5 text-slate-950 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 animate-fadeIn"
              title="Seleccionar foto de perfil"
              aria-label="Seleccionar foto de perfil"
            >
              <Camera size={15} />
            </button>
          )}
        </div>

        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
              {fullName}
            </h2>

            <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-950/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal-400">
              <Sparkles size={11} />

              {formatRoleName(
                profileData.rol || user?.rol,
              )}
            </span>
          </div>

          <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
            {profileData.email}
          </p>

          {isEditing && (
            <p className="text-[11px] font-medium text-teal-600 animate-fadeIn dark:text-teal-400">
              Haz clic en la foto para cambiarla
              (Máx. 2 MB)
            </p>
          )}
        </div>
      </div>

      {/* Formulario de Datos */}
      <div className="space-y-6 rounded-3xl border border-slate-700/30 bg-slate-900/35 p-6 shadow-sm backdrop-blur-md md:p-8">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
          <User
            size={18}
            className="text-teal-500"
          />

          <span>
            Información Personal y Contacto
          </span>
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Nombres
            </label>

            <input
              type="text"
              name="nombre"
              disabled={!isEditing}
              value={profileData.nombre}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 disabled:opacity-75 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Apellidos
            </label>

            <input
              type="text"
              name="apellido"
              disabled={!isEditing}
              value={profileData.apellido}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 disabled:opacity-75 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Mail
                size={13}
                className="text-slate-400"
              />

              <span>Correo Electrónico</span>
            </label>

            <input
              type="email"
              name="email"
              disabled={!isEditing}
              value={profileData.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 disabled:opacity-75 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Phone
                size={13}
                className="text-slate-400"
              />

              <span>Teléfono / Móvil</span>
            </label>

            <input
              type="text"
              name="telefono"
              disabled={!isEditing}
              value={profileData.telefono}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 disabled:opacity-75 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <CreditCard
                size={13}
                className="text-slate-400"
              />

              <span>
                Cédula / Documento de Identidad
              </span>
            </label>

            <input
              type="text"
              name="cedula"
              disabled={!isEditing}
              value={profileData.cedula}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 disabled:opacity-75 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <MapPin
                size={13}
                className="text-slate-400"
              />

              <span>
                Dirección de Residencia
              </span>
            </label>

            <input
              type="text"
              name="direccion"
              disabled={!isEditing}
              value={profileData.direccion}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700/60 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 disabled:opacity-75 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}