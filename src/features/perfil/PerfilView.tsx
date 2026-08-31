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
  MapPin,
  CheckCircle,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { personService } from "../../api/personService";

export default function PerfilView() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    setSaveSuccess(false);
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

  const handleSave = async () => {
    if (updateUser) {
      updateUser(profileData);
    }

    // Persistir en backend API si personId es válido
    if (user?.personId && user.personId.length > 10) {
      try {
        await personService.update(user.personId, {
          documentTypeId: "10000000-0000-0000-0000-000000000001",
          documentNumber: profileData.cedula || user.cedula || "1076543210",
          firstName: profileData.nombre,
          lastName: profileData.apellido,
          email: profileData.email,
          phone: profileData.telefono,
          dateOfBirth: profileData.fechaNacimiento,
          sexId: "11000000-0000-0000-0000-000000000001",
          address: profileData.direccion,
        });
      } catch (err) {
        console.warn("Backend person update sync:", err);
      }
    }

    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const fullName = `${profileData.nombre} ${profileData.apellido}`.trim() || user?.name || "Usuario";

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mi Perfil de Usuario
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Información personal, datos de contacto y credenciales de acceso.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-fadeIn">
              <CheckCircle size={14} />
              Guardado con éxito
            </span>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Pencil size={16} />
              <span>Editar Perfil</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={15} />
                <span>Cancelar</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <Save size={15} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta de Identidad */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={profileData.avatar || `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(fullName)}`}
            alt={fullName}
            className="w-24 h-24 rounded-2xl bg-teal-500/10 border-2 border-teal-500/30 object-cover shadow-inner"
          />
          {isEditing && (
            <button
              type="button"
              className="absolute -bottom-2 -right-2 p-2 bg-teal-500 text-slate-950 rounded-xl shadow-lg hover:scale-105 transition-transform"
              title="Cambiar avatar"
            >
              <Camera size={14} />
            </button>
          )}
        </div>

        <div className="text-center md:text-left space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {fullName}
          </h2>
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            {user?.rol || (user?.roleIds && user.roleIds[0]) || "PACIENTE"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {profileData.email}
          </p>
        </div>
      </div>

      {/* Formulario de Datos */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User size={18} className="text-teal-500" />
          <span>Información Personal y Contacto</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Nombres
            </label>
            <input
              type="text"
              name="nombre"
              disabled={!isEditing}
              value={profileData.nombre}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm disabled:opacity-75 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Apellidos
            </label>
            <input
              type="text"
              name="apellido"
              disabled={!isEditing}
              value={profileData.apellido}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm disabled:opacity-75 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              name="email"
              disabled={!isEditing}
              value={profileData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm disabled:opacity-75 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" />
              <span>Teléfono / Móvil</span>
            </label>
            <input
              type="text"
              name="telefono"
              disabled={!isEditing}
              value={profileData.telefono}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm disabled:opacity-75 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <CreditCard size={13} className="text-slate-400" />
              <span>Cédula / Documento de Identidad</span>
            </label>
            <input
              type="text"
              name="cedula"
              disabled={!isEditing}
              value={profileData.cedula}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm disabled:opacity-75 outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-slate-400" />
              <span>Dirección de Residencia</span>
            </label>
            <input
              type="text"
              name="direccion"
              disabled={!isEditing}
              value={profileData.direccion}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm disabled:opacity-75 outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}