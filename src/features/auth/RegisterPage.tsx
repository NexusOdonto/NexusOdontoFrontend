import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import { documentTypeService, type DocumentType } from "../../api/documentTypeService";
import { sexService, type Sex } from "../../api/sexService";
import { roleService } from "../../api/roleService";
import { authService, type RegisterRequest } from "../../api/authService";
import { MOCK_USERS } from "./mocks/users.mock";

import fondoLoginLight from "../../assets/fondo-Login-ligh.webp";
import fondoLoginDark from "../../assets/fondoLogin.webp";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Catalogs
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [patientRoleId, setPatientRoleId] = useState<string>("13000000-0000-0000-0000-000000000005");
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sexId, setSexId] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load catalogs on mount
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [docTypesData, sexesData, rolesData] = await Promise.allSettled([
          documentTypeService.getAll(),
          sexService.getAll(),
          roleService.getAll(),
        ]);

        if (docTypesData.status === "fulfilled" && docTypesData.value.length > 0) {
          setDocumentTypes(docTypesData.value);
          const defaultDoc = docTypesData.value.find((dt) => dt.code === "CC") || docTypesData.value[0];
          setDocumentTypeId(defaultDoc.id);
        } else {
          // Fallback defaults
          const fallbackDocs: DocumentType[] = [
            { id: "e0000000-0000-0000-0000-000000000001", code: "CC", name: "Cédula de Ciudadanía", isActive: true },
            { id: "e0000000-0000-0000-0000-000000000002", code: "CE", name: "Cédula de Extranjería", isActive: true },
            { id: "e0000000-0000-0000-0000-000000000003", code: "TI", name: "Tarjeta de Identidad", isActive: true },
            { id: "e0000000-0000-0000-0000-000000000004", code: "PAS", name: "Pasaporte", isActive: true },
          ];
          setDocumentTypes(fallbackDocs);
          setDocumentTypeId(fallbackDocs[0].id);
        }

        if (sexesData.status === "fulfilled" && sexesData.value.length > 0) {
          setSexes(sexesData.value);
        } else {
          // Fallback sexes
          setSexes([
            { id: "f0000000-0000-0000-0000-000000000001", code: "FEMENINO", name: "Femenino", isActive: true },
            { id: "f0000000-0000-0000-0000-000000000002", code: "MASCULINO", name: "Masculino", isActive: true },
            { id: "f0000000-0000-0000-0000-000000000003", code: "OTRO", name: "Otro", isActive: true },
          ]);
        }

        if (rolesData.status === "fulfilled" && rolesData.value.length > 0) {
          const patient = rolesData.value.find((r) => r.code === "PACIENTE");
          if (patient) {
            setPatientRoleId(patient.id);
          }
        }
      } catch (err) {
        console.error("Error loading catalogs in register:", err);
      } finally {
        setLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanDocNumber = documentNumber.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanFirstName || !cleanLastName) {
      setError("Por favor ingresa tus nombres y apellidos.");
      return;
    }

    if (!documentTypeId || !cleanDocNumber) {
      setError("Por favor especifica tu tipo y número de documento.");
      return;
    }

    if (!cleanEmail) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Ingresa un correo electrónico válido (ejemplo: usuario@correo.com).");
      return;
    }

    if (cleanPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (cleanPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Verifícalas.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Resolver el ID del rol PACIENTE
      let roleIdToAssign = patientRoleId;
      if (!roleIdToAssign || roleIdToAssign === "13000000-0000-0000-0000-000000000005") {
        try {
          const roles = await roleService.getAll();
          const patient = roles.find((r) => r.code?.toUpperCase() === "PACIENTE");
          if (patient) {
            roleIdToAssign = patient.id;
          }
        } catch {
          roleIdToAssign = "13000000-0000-0000-0000-000000000005";
        }
      }

      const payload: RegisterRequest = {
        documentTypeId,
        documentNumber: cleanDocNumber,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        sexId: sexId || undefined,
        address: address.trim() || undefined,
        password: cleanPassword,
        roleId: roleIdToAssign,
      };

      // Consumir el servicio público de registro
      try {
        await authService.register(payload);
      } catch (authErr: any) {
        // Si el endpoint de backend no está disponible o responde 404/405/401 en dev
        if (!authErr.response || authErr.response.status === 404 || authErr.response.status === 405 || authErr.response.status === 401) {
          console.warn("Auth register endpoint fallback active:", authErr);
        } else {
          // Si el backend devolvió un error de validación específico (400, 409 cédula duplicada, etc.)
          throw authErr;
        }
      }

      // Registrar también en mock para pruebas locales inmediatas
      const existingMockIndex = MOCK_USERS.findIndex(
        (u) => u.email.toLowerCase() === cleanEmail.toLowerCase() || u.cedula === cleanDocNumber
      );

      const newMockUser = {
        id: Date.now(),
        email: cleanEmail,
        cedula: cleanDocNumber,
        password: cleanPassword,
        nombre: cleanFirstName,
        apellido: cleanLastName,
        rol: "PACIENTE" as const,
        avatar: `https://api.dicebear.com/7.x/avatars/svg?seed=${encodeURIComponent(cleanFirstName)}`,
        telefono: cleanPhone || undefined,
      };

      if (existingMockIndex >= 0) {
        MOCK_USERS[existingMockIndex] = newMockUser;
      } else {
        MOCK_USERS.push(newMockUser);
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Ocurrió un error al registrar el usuario. Por favor intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundImage = theme === "dark" ? fondoLoginDark : fondoLoginLight;

  return (
    <main
      role="main"
      className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat py-8 px-4 overflow-y-auto"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Container with interactive hover effect */}
      <div className="relative w-full max-w-2xl my-auto group">
        {/* Decorative ambient layers */}
        <div className="absolute -inset-4 rotate-[-2deg] rounded-3xl bg-teal-500/10 backdrop-blur-sm border border-teal-300/20 shadow-xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-6 group-hover:rotate-[-4deg] group-hover:scale-105 group-hover:bg-teal-500/20" />
        <div className="absolute -inset-2 rotate-2deg rounded-3xl bg-slate-900/30 backdrop-blur-md border border-cyan-400/20 shadow-2xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-4 group-hover:rotate-[4deg] group-hover:scale-105 group-hover:bg-slate-900/60" />

        {/* Main Card */}
        <div className="relative z-10 w-full p-6 sm:p-10 rounded-3xl bg-slate-950/60 backdrop-blur-md border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col gap-6">
          {/* Header limpio */}
          <div className="flex items-center justify-start border-b border-white/10 pb-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Login</span>
            </button>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent font-extrabold text-3xl sm:text-4xl tracking-tight">
              Crear Cuenta
            </h1>
            <p className="text-sm text-slate-300">
              Ingresa tus datos para registrarte en la plataforma NexusOdonto.
            </p>
          </div>

          {/* Success Notification View */}
          {isSuccess ? (
            <div className="space-y-6 py-6 text-center animate-fadeIn">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  ¡Registro Exitoso!
                </h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión con tu correo electrónico o número de documento y tu contraseña.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-semibold tracking-wide rounded-full py-3.5 px-6 shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_6px_25px_rgba(45,212,191,0.5)] transition-all duration-300"
              >
                <span>Ir al Inicio de Sesión</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-3.5 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Nombres <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej. Juan Andrés"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Apellidos <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej. Pérez Gómez"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tipo y Número de Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Tipo de Documento <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <select
                      value={documentTypeId}
                      onChange={(e) => setDocumentTypeId(e.target.value)}
                      disabled={loadingCatalogs}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-slate-100 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    >
                      {documentTypes.map((dt) => (
                        <option key={dt.id} value={dt.id} className="bg-slate-900 text-slate-100">
                          {dt.name} ({dt.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Número de Documento <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ej. 1020304050"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Correo Electrónico <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      placeholder="usuario@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Teléfono (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      placeholder="Ej. +57 300 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fecha de Nacimiento y Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Fecha de Nacimiento (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Sexo / Género (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <select
                      value={sexId}
                      onChange={(e) => setSexId(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-slate-100 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                    >
                      <option value="" className="bg-slate-900 text-slate-400">
                        Selecciona sexo (opcional)
                      </option>
                      {sexes.map((s) => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-200">
                  Dirección de Residencia (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ej. Calle 123 # 45-67, Bogotá"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Contraseñas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Contraseña <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-200">
                    Confirmar Contraseña <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-semibold tracking-wide rounded-full py-3.5 px-6 shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_6px_25px_rgba(45,212,191,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <span>Registrarme</span>
                )}
              </button>

              {/* Already have an account link */}
              <div className="text-center pt-2">
                <p className="text-sm text-slate-300">
                  ¿Ya tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-teal-300 hover:underline font-medium transition-colors bg-transparent border-none cursor-pointer"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
