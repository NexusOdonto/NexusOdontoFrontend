import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import logo from "../../assets/nexus-odonto-logo.webp";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogleCallback } = useAuth();
  const [statusMessage, setStatusMessage] = useState("Verificando credenciales de Google...");

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      navigate(`/login?error=${encodeURIComponent(errorParam)}`, { replace: true });
      return;
    }

    if (!token) {
      navigate("/login?error=no_token_provided", { replace: true });
      return;
    }

    const processAuth = async () => {
      try {
        setStatusMessage("Iniciando sesión en NexusOdonto...");
        const success = await loginWithGoogleCallback(token, refreshToken || undefined);

        if (success) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login?error=session_init_failed", { replace: true });
        }
      } catch (err: any) {
        console.error("Error processing Google OAuth callback:", err);
        navigate("/login?error=auth_callback_failed", { replace: true });
      }
    };

    processAuth();
  }, [searchParams, navigate, loginWithGoogleCallback]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-teal-500/30 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-5 max-w-sm w-full animate-fadeIn">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg ring-4 ring-teal-500/20">
            <img src={logo} alt="NexusOdonto" className="w-10 h-10 object-contain" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-teal-400/20 blur-lg pointer-events-none animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white tracking-tight">
            NexusOdonto
          </h2>
          <p className="text-xs text-teal-300 animate-pulse font-medium">
            {statusMessage}
          </p>
        </div>

        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
