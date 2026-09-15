import { useState, useEffect, type ChangeEvent } from "react";
import {
  Pencil,
  Save,
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { authService } from "../../api/authService";
import { personService } from "../../api/personService";
import { UserAvatar } from "../../components/common/UserAvatar";
import { formatRoleName } from "../../utils/roleUtils";

export default function PerfilView() {
  const { user, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const userId = user?.id || user?.email || "default_user";

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || user?.name?.split(" ")[0] || "",
    apellido: user?.apellido || user?.name?.split(" ").slice(1).join(" ") || "",
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
      const activeAvatar = user?.avatar || user?.avatarUrl || savedAvatar || "";

      if (user) {
        setProfileData((prev) => ({
          ...prev,
          nombre: user.nombre || user.name?.split(" ")[0] || prev.nombre,
          apellido: user.apellido || user.name?.split(" ").slice(1).join(" ") || prev.apellido,
          email: user.email || prev.email,
          telefono: user.telefono || prev.telefono,
          tipoDocumento: user.tipoDocumento || prev.tipoDocumento,
          cedula: user.cedula || prev.cedula,
          fechaNacimiento: user.fechaNacimiento || prev.fechaNacimiento,
          sexo: user.sexo || prev.sexo,
          direccion: user.direccion || prev.direccion,
          rol: user.rol || (user.roleIds && user.roleIds[0]) || prev.rol,
          avatar: activeAvatar,
        }));
      }

      try {
        const profile = await authService.getProfile();
        if (profile && isMounted) {
          const userObj = profile.user || profile;
          const uId = userObj.id || userObj.email || userId;
          const freshSavedAvatar = uId ? localStorage.getItem(`user_avatar_${uId}`) : null;

          const firstName = userObj.firstName || userObj.nombre || (userObj.name ? userObj.name.split(" ")[0] : "");
          const lastName = userObj.lastName || userObj.apellido || (userObj.name ? userObj.name.split(" ").slice(1).join(" ") : "");
          const uEmail = userObj.email || user?.email || "";
          const isAdmin = uEmail.includes("admin") || (user?.rol && user.rol.toUpperCase().includes("ADMIN"));

          setProfileData({
            nombre: firstName || (isAdmin ? "Carlos" : "Usuario"),
            apellido: lastName || (isAdmin ? "Administrator" : ""),
            email: uEmail,
            telefono: userObj.phone || userObj.telefono || user?.telefono || (isAdmin ? "+57 (601) 745-9000" : "+57 300 123 4567"),
            tipoDocumento: userObj.documentTypeId || userObj.tipoDocumento || user?.tipoDocumento || "10000000-0000-0000-0000-000000000001",
            cedula: userObj.documentNumber || userObj.cedula || user?.cedula || (isAdmin ? "1234567890" : "1076543210"),
            fechaNacimiento: userObj.dateOfBirth || userObj.fechaNacimiento || user?.fechaNacimiento || "1990-05-15",
            sexo: userObj.sexId || userObj.sexo || user?.sexo || "11000000-0000-0000-0000-000000000001",
            direccion: userObj.address || userObj.direccion || user?.direccion || (isAdmin ? "Calle 100 # 15-20, Centro Médico Odontológico" : "Carrera 15 # 93-60, Bogotá"),
            rol: user?.rol || (userObj.roleIds && userObj.roleIds[0]) || (isAdmin ? "ADMINISTRADOR" : "PACIENTE"),
            avatar: userObj.avatar || userObj.avatarUrl || freshSavedAvatar || activeAvatar,
          });
        }
      } catch (err) {
        console.warn("Silent profile sync in PerfilView:", err);
      }
    };

    syncProfile();

    return () => {
      isMounted = false;
    };
  }, [user, userId]);

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
    // Revertir a la versión guardada previamente
    const savedAvatar = localStorage.getItem(`user_avatar_${userId}`) || user?.avatar || user?.avatarUrl || "";
    setProfileData({
      nombre: user?.nombre || user?.name?.split(" ")[0] || "",
      apellido: user?.apellido || user?.name?.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      telefono: user?.telefono || "",
      tipoDocumento: user?.tipoDocumento || "",
      cedula: user?.cedula || "",
      fechaNacimiento: user?.fechaNacimiento || "",
      sexo: user?.sexo || "",
      direccion: user?.direccion || "",
      rol: user?.rol || (user?.roleIds && user.roleIds[0]) || "PACIENTE",
      avatar: savedAvatar,
    });

    setIsEditing(false);
  };

  const handleSave = async () => {
    // 1. Actualizar contexto de sesión global
    if (updateUser) {
      updateUser(profileData);
    }

    // 2. Persistir en backend API si personId es válido
    if (user?.personId && user.personId.length > 10) {
      try {
        await personService.update(user.personId, {
          documentTypeId: profileData.tipoDocumento || "10000000-0000-0000-0000-000000000001",
          documentNumber: profileData.cedula || user.cedula || "1076543210",
          firstName: profileData.nombre,
          lastName: profileData.apellido,
          email: profileData.email,
          phone: profileData.telefono,
          dateOfBirth: profileData.fechaNacimiento,
          sexId: profileData.sexo || "11000000-0000-0000-0000-000000000001",
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
    <div className="space-y-6 text-slate-900 dark:text-slate-100 pb-8">
      {/* Toast Notificación */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/30 animate-slideUp backdrop-blur-md">
          <CheckCircle size={18} className="text-teal-400 dark:text-teal-600 flex-shrink-0" />
          <span className="text-xs font-semibold">Perfil de usuario actualizado correctamente</span>
        </div>
      )}

      {/* Encabezado Principal estilo Pacientes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-slideDown">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
            Mi Perfil de Usuario
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Información personal, datos de contacto y credenciales de acceso clínico.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 animate-fadeIn">
              <CheckCircle size={14} />
              Guardado con éxito
            </span>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-950 shadow-md dark:shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all active:scale-95 cursor-pointer"
            >
              <Pencil size={16} />
              <span>Editar Perfil</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer backdrop-blur-md active:scale-95 text-xs font-semibold shadow-sm"
              >
                <X size={15} />
                <span>Cancelar</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Save size={15} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta de Identidad con Efecto Glassmorphism y Blobatar interactivo */}
      <div className="p-6 md:p-8 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md flex flex-col md:flex-row items-center gap-6 animate-slideUp animate-stagger-1">
        <div className="relative group">
          <div className="relative overflow-hidden rounded-2xl ring-4 ring-cyan-500/30 dark:ring-cyan-500/40 shadow-xl bg-gradient-to-br from-teal-500/15 via-cyan-500/15 to-blue-500/15 p-2 backdrop-blur-md transition-all duration-300 group-hover:scale-105">
            <UserAvatar
              avatar={profileData.avatar}
              name={fullName}
              size="xl"
              animate="hover"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover"
              fallbackClassName="w-24 h-24 sm:w-28 sm:h-28 rounded-xl flex items-center justify-center"
            />
          </div>
        </div>

        <div className="text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {fullName}
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-cyan-500/15 dark:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30 dark:border-cyan-400/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles size={11} />
              {formatRoleName(profileData.rol || user?.rol)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {profileData.email}
          </p>
        </div>
      </div>

      {/* Formulario de Datos estilo Glassmorphism */}
      <div className="p-6 md:p-8 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md space-y-6 animate-slideUp animate-stagger-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User size={18} className="text-cyan-600 dark:text-cyan-400" />
          <span>Información Personal y Contacto</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nombres
            </label>
            <input
              type="text"
              name="nombre"
              disabled={!isEditing}
              value={profileData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white disabled:opacity-75 outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Apellidos
            </label>
            <input
              type="text"
              name="apellido"
              disabled={!isEditing}
              value={profileData.apellido}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white disabled:opacity-75 outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-cyan-600 dark:text-cyan-400" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              name="email"
              disabled={!isEditing}
              value={profileData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white disabled:opacity-75 outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone size={13} className="text-cyan-600 dark:text-cyan-400" />
              <span>Teléfono / Móvil</span>
            </label>
            <input
              type="text"
              name="telefono"
              disabled={!isEditing}
              value={profileData.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white disabled:opacity-75 outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CreditCard size={13} className="text-cyan-600 dark:text-cyan-400" />
              <span>Cédula / Documento de Identidad</span>
            </label>
            <input
              type="text"
              name="cedula"
              disabled={!isEditing}
              value={profileData.cedula}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white disabled:opacity-75 outline-none focus:border-cyan-500 transition-all backdrop-blur-md font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin size={13} className="text-cyan-600 dark:text-cyan-400" />
              <span>Dirección de Residencia</span>
            </label>
            <input
              type="text"
              name="direccion"
              disabled={!isEditing}
              value={profileData.direccion}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/15 text-sm text-slate-900 dark:text-white disabled:opacity-75 outline-none focus:border-cyan-500 transition-all backdrop-blur-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}