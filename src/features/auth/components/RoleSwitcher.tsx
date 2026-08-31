import { useAuth } from '../AuthContext';
import { MOCK_USERS } from '../mocks/users.mock';

export function RoleSwitcher() {
  const { user, login } = useAuth();

  // Hide in production builds
  if (!user || import.meta.env.PROD) {
    return null;
  }

  const handleSwitchRole = async (email: string, password: string) => {
    await login(email, password);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-xl">
      <h3 className="text-sm font-semibold text-white mb-3">Switch Role (Dev)</h3>
      <div className="space-y-2">
        {MOCK_USERS.map((mockUser) => (
          <button
            key={mockUser.id}
            type="button"
            onClick={() => handleSwitchRole(mockUser.email, mockUser.password)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              user.id === String(mockUser.id)
                ? 'bg-primary-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <div className="font-medium">{mockUser.nombre} {mockUser.apellido}</div>
            <div className="text-xs opacity-75">{mockUser.rol}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
