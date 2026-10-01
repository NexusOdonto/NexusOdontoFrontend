import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  locationKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  prevLocationKey?: string;
}

class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    prevLocationKey: this.props.locationKey,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // Si el usuario navegó a otra ruta, limpiar el estado de error para no bloquear la aplicación
    if (props.locationKey && props.locationKey !== state.prevLocationKey) {
      return {
        hasError: false,
        error: null,
        prevLocationKey: props.locationKey,
      };
    }
    return null;
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);

    // Si falló por módulo dinámico desactualizado de Vite en desarrollo o recarga de chunks
    const msg = error?.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Outdated Optimize Dep") ||
      msg.includes("dynamically imported module")
    ) {
      const reloadKey = "chunk_autoreload_" + window.location.pathname;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 dark:border-rose-500/20 p-8 rounded-3xl shadow-2xl space-y-5">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {this.props.fallbackTitle || "Ocurrió un error al cargar la vista"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se detectó una discrepancia inesperada en los datos. Puedes recargar o regresar al panel de control.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-rose-600 dark:text-rose-400 break-words text-left overflow-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reintentar</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                <Home size={14} />
                <span>Ir al Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary(props: { children: ReactNode; fallbackTitle?: string }) {
  try {
    const location = useLocation();
    return <ErrorBoundaryClass {...props} locationKey={location.pathname} />;
  } catch {
    // Si se usa fuera de un Router, funciona como ErrorBoundary clásico
    return <ErrorBoundaryClass {...props} />;
  }
}
