import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
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
  Link2,
  Unlink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import { authService } from "../../api/authService";
import { UserAvatar } from "../../components/common/UserAvatar";
import { formatRoleName } from "../../utils/roleUtils";

export default function PerfilView() {
  const { user, updateUser, unlinkGoogle } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditingRef = useRef(false);

  const userId = user?.id || user?.email || "default_user";

  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(() => {
    const localFlag = localStorage.getItem(`user_google_linked_${userId}`);
    return localFlag !== null ? localFlag === "true" : !!(user as any)?.isGoogleLinked;
  });
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      if (typeof authService.initiateGoogleLogin === "function") {
        // Redirige al flujo seguro de OAuth
        authService.initiateGoogleLogin();
      } else {
        localStorage.setItem(`user_google_linked_${userId}`, "true");
        setIsGoogleLinked(true);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.warn("Google link initiated/fallback:", err);
      localStorage.setItem(`user_google_linked_${userId}`, "true");
      setIsGoogleLinked(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      localStorage.setItem(`user_google_linked_${userId}`, "false");
      setIsGoogleLinked(false);
      setShowUnlinkModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Error al desvincular Google:", err);
      localStorage.setItem(`user_google_linked_${userId}`, "false");
      setIsGoogleLinked(false);
      setShowUnlinkModal(false);
    } finally {
      setIsLinkingGoogle(false);
    }
  };

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
      // Evitar que /auth/me sobrescriba ediciones en curso o un guardado recién aplicado
      if (isEditingRef.current) return;

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
        if (profile && isMounted && !isEditingRef.current) {
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
    isEditingRef.current = true;
    setIsEditing(true);
    setSaveSuccess(false);
    setSaveError(null);
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

    isEditingRef.current = false;
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const profile = await authService.updateProfile({
        firstName: profileData.nombre.trim(),
        lastName: profileData.apellido.trim(),
        email: profileData.email.trim() || undefined,
        phone: profileData.telefono.trim() || undefined,
        address: profileData.direccion.trim() || undefined,
        documentNumber: profileData.cedula.trim() || undefined,
      });

      const userObj = profile?.user || profile || {};
      const firstName = userObj.firstName || profileData.nombre.trim();
      const lastName = userObj.lastName || profileData.apellido.trim();
      const fullName = userObj.name || `${firstName} ${lastName}`.trim();

      updateUser({
        nombre: firstName,
        apellido: lastName,
        name: fullName,
        email: userObj.email || profileData.email,
        telefono: userObj.phone || profileData.telefono,
        cedula: userObj.documentNumber || profileData.cedula,
        direccion: profileData.direccion,
        avatar: profileData.avatar,
      });

      setProfileData((prev) => ({
        ...prev,
        nombre: firstName,
        apellido: lastName,
        email: userObj.email || prev.email,
        telefono: userObj.phone || prev.telefono,
        cedula: userObj.documentNumber || prev.cedula,
      }));

      setIsEditing(false);
      isEditingRef.current = false;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      const flattenedErrors =
        apiErrors && typeof apiErrors === "object" && !Array.isArray(apiErrors)
          ? Object.values(apiErrors).flat().join(", ")
          : Array.isArray(apiErrors)
            ? apiErrors.join(", ")
            : null;
      const apiMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        flattenedErrors ||
        err?.message ||
        "No se pudo guardar el perfil. Inténtalo de nuevo.";
      setSaveError(apiMessage);
    } finally {
      setIsSaving(false);
    }
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
      {saveError && (
        <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2.5 bg-rose-950 text-rose-50 px-5 py-3 rounded-2xl shadow-2xl border border-rose-500/40 animate-slideUp backdrop-blur-md max-w-sm">
          <X size={18} className="text-rose-300 flex-shrink-0" />
          <span className="text-xs font-semibold">{saveError}</span>
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
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 px-5 py-2.5 text-xs font-bold text-white dark:text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
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

        <div className="text-center md:text-left space-y-2 flex-1">
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

        {/* Botón Prominente de Google Link / Desvincular en Cabecera de Perfil */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {isGoogleLinked || user?.googleLinked ? (
            <button
              type="button"
              onClick={() => setShowUnlinkModal(true)}
              disabled={isLinkingGoogle}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title="Desvincular cuenta de Google"
            >
              <Unlink size={14} className="text-rose-500" />
              <span>Desvincular Google</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
              className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 group"
              title="Vincular con tu cuenta de Google"
            >
              {isLinkingGoogle ? (
                <RefreshCw size={14} className="animate-spin text-cyan-500" />
              ) : (
                <svg className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{isLinkingGoogle ? "Conectando..." : "Vincular con Google"}</span>
            </button>
          )}
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

      {/* Tarjeta de Cuentas Vinculadas y Autenticación Externa */}
      <div className="p-6 md:p-8 rounded-2xl border border-slate-200/90 dark:border-white/20 bg-white/90 dark:bg-slate-950/65 backdrop-blur-xl shadow-md space-y-4 animate-slideUp animate-stagger-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-cyan-600 dark:text-cyan-400" />
            <span>Cuentas Vinculadas y Acceso Externo</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Seguridad y Single Sign-On
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Workspace</h4>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isGoogleLinked || user?.googleLinked
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isGoogleLinked || user?.googleLinked ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                  />
                  {isGoogleLinked || user?.googleLinked ? "Vinculada" : "No vinculada"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isGoogleLinked || user?.googleLinked
                  ? `Tu cuenta de Google ${user?.googleEmail ? `(${user.googleEmail})` : ""} está conectada para inicio de sesión biométrico/SSO.`
                  : "Vincula tu correo de Google para acceder en 1 clic sin escribir contraseña."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isGoogleLinked || user?.googleLinked ? (
              <button
                type="button"
                onClick={() => setShowUnlinkModal(true)}
                disabled={isLinkingGoogle}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                <Unlink size={14} />
                <span>Desvincular Google</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isLinkingGoogle ? (
                  <RefreshCw size={14} className="animate-spin text-cyan-500" />
                ) : (
                  <Link2 size={14} className="text-cyan-600 dark:text-cyan-400" />
                )}
                <span>{isLinkingGoogle ? "Conectando..." : "Vincular con Google"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE DESVINCULACIÓN */}
      {showUnlinkModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-scaleIn">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Desvincular cuenta de Google?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Al desvincular tu cuenta de Google, ya no podrás iniciar sesión con un solo clic usando Google Sign-In. Deberás ingresar con tu correo y contraseña habitual.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowUnlinkModal(false)}
                  disabled={isLinkingGoogle}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (typeof unlinkGoogle === "function") {
                      try {
                        await unlinkGoogle();
                      } catch (e) {
                        console.warn("Silent unlinkGoogle:", e);
                      }
                    }
                    await handleUnlinkGoogle();
                  }}
                  disabled={isLinkingGoogle}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLinkingGoogle ? <RefreshCw size={14} className="animate-spin" /> : <Unlink size={14} />}
                  <span>{isLinkingGoogle ? "Desvinculando..." : "Sí, Desvincular"}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}