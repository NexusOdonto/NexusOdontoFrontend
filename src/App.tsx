export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-500 ring-1 ring-blue-500/20">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            NexusOdonto Frontend
          </h1>
          <p className="text-sm text-slate-400">
            Estructura base cargada con React, TypeScript y Tailwind CSS v4.
          </p>
        </div>

        <div className="pt-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Servidor de desarrollo activo
          </span>
        </div>
      </div>
    </main>
  );
}