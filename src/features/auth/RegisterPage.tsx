import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";
import {
  authService,
  type RegisterRequest,
  type GoogleRegisterRequest,
  type RegisterOptionItem,
} from "../../api/authService";
import { useAuth } from "./AuthContext";
import {
  isReservedServiceAccount,
  RESERVED_ACCOUNT_REGISTER_MESSAGE,
} from "./reservedServiceAccounts";
import fondoLoginLight from "../../assets/fondo-Login-ligh.webp";
import fondoLoginDark from "../../assets/fondoLogin.webp";
import logoNexus from "../../assets/nexus-odonto-logo.webp";

type CatalogOption = RegisterOptionItem;

/** Normalize date input to YYYY-MM-DD for DateOnly-compatible APIs. */
const toDateOnly = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().split("T")[0];
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { login, loginWithGoogleCallback } = useAuth();

  const isGoogle =
    searchParams.get("isGoogle") === "true" ||
    searchParams.get("google") === "true";

  const [googleSub, setGoogleSub] = useState(
    searchParams.get("googleSub") || ""
  );

  const [documentTypes, setDocumentTypes] = useState<CatalogOption[]>([]);
  const [sexes, setSexes] = useState<CatalogOption[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [firstName, setFirstName] = useState(
    searchParams.get("firstName") || ""
  );
  const [lastName, setLastName] = useState(
    searchParams.get("lastName") || ""
  );
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sexId, setSexId] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflowX = document.documentElement.style.overflowX;
    const originalBodyOverflowX = document.body.style.overflowX;

    const updateScroll = () => {
      if (mediaQuery.matches) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflowX = "hidden";
        document.body.style.overflowX = "hidden";
      } else {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflowX = "hidden";
        document.body.style.overflowX = "hidden";
      }
    };

    updateScroll();

    mediaQuery.addEventListener("change", updateScroll);

    return () => {
      mediaQuery.removeEventListener("change", updateScroll);

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflowX = originalHtmlOverflowX;
      document.body.style.overflowX = originalBodyOverflowX;
    };
  }, []);

  useEffect(() => {
    const urlFirstName = searchParams.get("firstName");
    const urlLastName = searchParams.get("lastName");
    const urlEmail = searchParams.get("email");
    const urlSub = searchParams.get("googleSub");

    if (urlFirstName) setFirstName(urlFirstName);
    if (urlLastName) setLastName(urlLastName);
    if (urlEmail) setEmail(urlEmail);
    if (urlSub) setGoogleSub(urlSub);
  }, [searchParams]);

  const translateDocumentTypeName = (doc: CatalogOption): string => {
    const code = (doc.code || "").toUpperCase();
    const name = (doc.name || "").toLowerCase();

    if (
      code === "CC" ||
      name.includes("citizenship") ||
      name.includes("ciudadanía") ||
      name.includes("ciudadania")
    ) {
      return "Cédula de Ciudadanía";
    }

    if (
      code === "CE" ||
      name.includes("foreigner") ||
      name.includes("extranjería") ||
      name.includes("extranjeria")
    ) {
      return "Cédula de Extranjería";
    }

    if (
      code === "TI" ||
      name.includes("identity card") ||
      name.includes("tarjeta de identidad")
    ) {
      return "Tarjeta de Identidad";
    }

    if (
      code === "PAS" ||
      code === "PP" ||
      name.includes("passport") ||
      name.includes("pasaporte")
    ) {
      return "Pasaporte";
    }

    if (
      code === "RC" ||
      name.includes("civil registry") ||
      name.includes("registro civil")
    ) {
      return "Registro Civil";
    }

    if (
      code === "NIT" ||
      name.includes("tax") ||
      name.includes("tributario")
    ) {
      return "NIT";
    }

    return doc.name;
  };

  const translateSexName = (s: CatalogOption): string => {
    const code = (s.code || s.name || "").toUpperCase();
    if (code.includes("FEM") || code === "F") return "Femenino";
    if (code.includes("MASC") || code.includes("MALE") || code === "M") {
      return "Masculino";
    }
    if (code.includes("OTRO") || code.includes("OTHER") || code === "O") {
      return "Otro";
    }
    return s.name;
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);

        const options = await authService.getRegisterOptions();

        const docs = (options.documentTypes || []).map((dt) => ({
          ...dt,
          name: translateDocumentTypeName(dt),
        }));

        if (docs.length > 0) {
          setDocumentTypes(docs);
          const defaultDoc =
            docs.find((dt) => (dt.code || "").toUpperCase() === "CC") ||
            docs[0];
          setDocumentTypeId(defaultDoc.id);
        } else {
          setError(
            "No se pudieron cargar los tipos de documento. Recarga la página e inténtalo de nuevo."
          );
        }

        const sexOptions = (options.sexes || []).map((s) => ({
          ...s,
          name: translateSexName(s),
        }));
        setSexes(sexOptions);
      } catch (err) {
        console.error("Error loading register-options:", err);
        setError(
          "No se pudieron cargar las opciones de registro. Verifica tu conexión e inténtalo de nuevo."
        );
      } finally {
        setLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanDocNumber = documentNumber.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();
    const dateOnly = toDateOnly(dateOfBirth);

    if (!cleanFirstName || !cleanLastName) {
      setError("Por favor ingresa tus nombres y apellidos.");
      return;
    }

    if (!documentTypeId || !cleanDocNumber) {
      setError("Por favor especifica tu tipo y número de documento.");
      return;
    }

    if (
      isReservedServiceAccount(cleanDocNumber) ||
      isReservedServiceAccount(cleanEmail)
    ) {
      setError(RESERVED_ACCOUNT_REGISTER_MESSAGE);
      return;
    }

    if (!cleanEmail) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError(
        "Ingresa un correo electrónico válido (ejemplo: usuario@correo.com)."
      );
      return;
    }

    if (!isGoogle) {
      if (cleanPassword.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      if (cleanPassword !== confirmPassword) {
        setError("Las contraseñas no coinciden. Verifícalas.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isGoogle) {
        const payload: GoogleRegisterRequest = {
          documentTypeId,
          documentNumber: cleanDocNumber,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          email: cleanEmail,
          phone: cleanPhone || undefined,
          dateOfBirth: dateOnly,
          sexId: sexId || undefined,
          address: address.trim() || undefined,
          googleSub: googleSub || cleanEmail,
          password: cleanPassword || undefined,
        };

        const res = await authService.registerGoogle(payload);

        if (res && res.token) {
          setIsSuccess(true);
          await loginWithGoogleCallback(res.token, res.refreshToken);
          return;
        }

        throw new Error(
          "El registro con Google no devolvió una sesión válida."
        );
      }

      const payload: RegisterRequest = {
        documentTypeId,
        documentNumber: cleanDocNumber,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        phone: cleanPhone || undefined,
        dateOfBirth: dateOnly,
        sexId: sexId || undefined,
        address: address.trim() || undefined,
        password: cleanPassword,
      };

      await authService.register(payload);

      // Auto-login with cédula (loginId). AuthContext routes to dashboard or cambiar-password.
      const loginResult = await login(cleanDocNumber, cleanPassword);

      if (!loginResult.success) {
        setIsSuccess(true);
        setError(
          loginResult.error ||
            "Cuenta creada, pero no se pudo iniciar sesión automáticamente. Inicia sesión con tu cédula."
        );
        return;
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Error creating account:", err);

      const status = err.response?.status;

      let friendlyMsg =
        "Ocurrió un error al procesar el registro. Intenta nuevamente.";

      if (status === 409) {
        friendlyMsg =
          "El número de documento o correo electrónico ya se encuentra registrado.";
      } else if (status === 400) {
        friendlyMsg =
          err.response?.data?.message ||
          "Verifica que todos los campos obligatorios sean correctos.";
      } else if (status === 401) {
        friendlyMsg =
          "No se pudo completar el registro (sesión no autorizada). Recarga e inténtalo de nuevo.";
      } else if (
        err.message &&
        !err.message.includes("status code")
      ) {
        friendlyMsg = err.message;
      }

      setError(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundImage =
    theme === "dark" ? fondoLoginDark : fondoLoginLight;

  return (
    <main
      role="main"
      className="
        relative
        w-full
        h-screen
        max-h-screen
        min-h-0
        flex
        items-center
        justify-center
        bg-cover
        bg-center
        bg-no-repeat
        overflow-hidden
        p-4
        py-8
        max-md:h-dvh
        max-md:max-h-dvh
        max-md:min-h-0
      "
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className="hidden md:inline-flex absolute top-3 left-3 sm:top-6 sm:left-6 z-30 items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950/70 hover:bg-slate-900/90 text-slate-200 hover:text-white border border-white/15 backdrop-blur-xl shadow-lg text-xs font-bold transition-all hover:-translate-x-1 active:scale-95 cursor-pointer"
      >
        <ArrowLeft size={16} className="text-teal-400" />
        <span>Volver a la Página Principal</span>
      </button>

      <div className="relative w-full max-w-2xl mx-auto my-auto min-w-0 group transition-all duration-500">
        <div className="absolute -inset-4 rotate-[-2deg] rounded-3xl bg-teal-500/10 backdrop-blur-sm border border-teal-300/20 shadow-xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-6 group-hover:rotate-[-4deg] group-hover:bg-teal-500/20" />

        <div className="absolute -inset-2 rotate-2deg rounded-3xl bg-slate-900/30 backdrop-blur-md border border-cyan-400/20 shadow-2xl pointer-events-none transition-all duration-500 ease-out group-hover:-inset-4 group-hover:rotate-[3deg] group-hover:bg-slate-900/60" />

        <div
          className="
            relative
            z-10
            w-full
            min-w-0
            p-6
            sm:p-10
            rounded-3xl
            bg-slate-950/80
            backdrop-blur-xl
            border
            border-white/15
            shadow-[0_20px_50px_rgba(0,0,0,0.6)]
            flex
            flex-col
            gap-6
            overflow-hidden
            md:max-h-full
            md:overflow-hidden
            max-md:max-h-[calc(100dvh-2rem)]
            max-md:overflow-y-auto
            max-md:overflow-x-hidden
            max-md:overscroll-contain
          "
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Login</span>
            </button>

            <div className="flex items-center min-w-0">
              <img
                src={logoNexus}
                alt="NexusOdonto"
                className="h-7 w-auto max-w-full object-contain"
              />
            </div>
          </div>

          <div className="text-center space-y-1 min-w-0">
            <h1 className="font-prata bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent font-bold text-3xl sm:text-4xl tracking-tight">
              {isGoogle
                ? "Completa tu Registro"
                : "Crear Nueva Cuenta"}
            </h1>

            <p className="font-sans text-xs sm:text-sm text-slate-300 break-words">
              {isGoogle
                ? "Estás a un paso de acceder. Ingresa tus datos clínicos y de identificación."
                : "Regístrate para agendar consultas, ver tus citas y acceder a tu odontograma."}
            </p>
          </div>

          {isGoogle && (
            <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-400/30 text-teal-200 text-xs flex items-center gap-3 animate-fadeIn min-w-0">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>Autenticación con Google verificada</span>
                  <Sparkles
                    size={13}
                    className="text-teal-300"
                  />
                </p>

                <p className="text-teal-200/90 leading-relaxed break-words">
                  Hemos precargado tu correo ({email}). Completa tu
                  documento y teléfono para activar tu expediente.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              className="p-3.5 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs sm:text-sm text-center flex items-center justify-center gap-2 animate-fadeIn min-w-0"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="p-8 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">
                  ¡Registro completado con éxito!
                </h2>

                <p className="text-xs sm:text-sm text-slate-300">
                  Tu perfil ha sido creado satisfactoriamente en
                  NexusOdonto.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(isGoogle || !error ? "/dashboard" : "/login")
                }
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                {isGoogle || !error
                  ? "Ir a mi Panel Principal"
                  : "Iniciar Sesión Ahora"}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 min-w-0 font-instrument"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Nombres{" "}
                    <span className="text-teal-400">*</span>
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>

                    <input
                      type="text"
                      placeholder="Ej. Juan Andrés"
                      value={firstName}
                      onChange={(e) =>
                        setFirstName(e.target.value)
                      }
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Apellidos{" "}
                    <span className="text-teal-400">*</span>
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>

                    <input
                      type="text"
                      placeholder="Ej. Pérez Gómez"
                      value={lastName}
                      onChange={(e) =>
                        setLastName(e.target.value)
                      }
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Tipo de Documento{" "}
                    <span className="text-teal-400">*</span>
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>

                    <select
                      value={documentTypeId}
                      onChange={(e) =>
                        setDocumentTypeId(e.target.value)
                      }
                      disabled={loadingCatalogs}
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-slate-100 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    >
                      {documentTypes.map((dt) => (
                        <option
                          key={dt.id}
                          value={dt.id}
                          className="bg-slate-900 text-slate-100"
                        >
                          {dt.name} ({dt.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Número de Documento{" "}
                    <span className="text-teal-400">*</span>
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>

                    <input
                      type="text"
                      placeholder="Ej. 1020304050"
                      value={documentNumber}
                      onChange={(e) =>
                        setDocumentNumber(
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Correo Electrónico{" "}
                    <span className="text-teal-400">*</span>
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>

                    <input
                      type="email"
                      placeholder="paciente@correo.com"
                      value={email}
                      readOnly={isGoogle}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full min-w-0 pl-10 pr-3 py-2.5 border rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors ${
                        isGoogle
                          ? "bg-slate-900/60 border-teal-500/30 text-teal-200 cursor-not-allowed"
                          : "bg-white/5 border-white/10"
                      }`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Teléfono / Celular (Opcional)
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>

                    <input
                      type="tel"
                      placeholder="Ej. 3001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Fecha de Nacimiento (Opcional)
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>

                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) =>
                        setDateOfBirth(e.target.value)
                      }
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="block text-xs font-medium text-slate-200">
                    Sexo / Género (Opcional)
                  </label>

                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>

                    <select
                      value={sexId}
                      onChange={(e) => setSexId(e.target.value)}
                      className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-slate-100 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                    >
                      <option
                        value=""
                        className="bg-slate-900 text-slate-400"
                      >
                        Selecciona sexo (opcional)
                      </option>

                      {sexes.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          className="bg-slate-900 text-slate-100"
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="block text-xs font-medium text-slate-200">
                  Dirección de Residencia (Opcional)
                </label>

                <div className="relative min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>

                  <input
                    type="text"
                    placeholder="Ej. Calle 123 # 45-67"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full min-w-0 pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {!isGoogle && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <label className="block text-xs font-medium text-slate-200">
                      Contraseña{" "}
                      <span className="text-teal-400">*</span>
                    </label>

                    <div className="relative min-w-0">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>

                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        className="w-full min-w-0 pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                        required={!isGoogle}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <label className="block text-xs font-medium text-slate-200">
                      Confirmar Contraseña{" "}
                      <span className="text-teal-400">*</span>
                    </label>

                    <div className="relative min-w-0">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        placeholder="Repite la contraseña"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        className="w-full min-w-0 pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-100 placeholder:text-slate-400 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-colors"
                        required={!isGoogle}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-300 transition-colors bg-transparent border-none cursor-pointer"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 font-semibold tracking-wide rounded-full py-3.5 px-6 shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_6px_25px_rgba(45,212,191,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />

                    <span>
                      {isGoogle
                        ? "Guardando expediente..."
                        : "Creando cuenta..."}
                    </span>
                  </>
                ) : (
                  <span>
                    {isGoogle
                      ? "Completar Registro y Entrar"
                      : "Registrarme"}
                  </span>
                )}
              </button>

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