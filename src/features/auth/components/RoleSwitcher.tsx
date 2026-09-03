import { useAuth } from '../AuthContext';

const SEEDED_USERS = [
  { id: '1', nombre: 'Carlos', apellido: 'Administrador', login: '1234567890', pass: 'Admin123!', rol: 'ADMINISTRADOR' },
  { id: '2', nombre: 'Dra. Laura', apellido: 'Gómez', login: '1098765432', pass: 'Doctor123!', rol: 'ODONTOLOGO' },
  { id: '3', nombre: 'María', apellido: 'Recepción', login: '1087654321', pass: 'Recepcion123!', rol: 'RECEPCIONISTA' },
  { id: '4', nombre: 'Andrés', apellido: 'Pérez', login: '1076543210', pass: 'Paciente123!', rol: 'PACIENTE' },
];

export function RoleSwitcher() {
  const { user, login } = useAuth();

  if (!user || import.meta.env.PROD) {
    return null;
  }

  const handleSwitchRole = async (loginId: string, pass: string) => {
    await login(loginId, pass);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-2xl">
      <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 mb-2.5">Cambiar Rol (Modo Dev)</h3>
      <div className="space-y-1.5">
        {SEEDED_USERS.map((su) => (
          <button
            key={su.id}
            type="button"
            onClick={() => handleSwitchRole(su.login, su.pass)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              user.rol === su.rol
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold">{su.nombre} {su.apellido}</div>
            <div className="text-[10px] opacity-75">{su.rol}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
