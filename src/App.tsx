import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./features/auth/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import AppRoutes from './routes';

/**
 * 🤖 [AI ASSISTANT GUIDE - ARQUITECTURA DE ARRANQUE]:
 * -------------------------------------------------------------------------------------------------
 * 📌 PROPÓSITO:
 *    Punto de orquestación central de la aplicación. Configura la cascada estricta de Context Providers
 *    globales antes de montar el sistema de rutas.
 * 
 * 🔍 ORDEN DE ANIDAMIENTO Y POR QUÉ IMPORTA (CASCADA DE CONTEXTOS):
 *    1. <ThemeProvider>: Capa más externa. Controla modo Dark/Light y evita flashes visuales.
 *    2. <BrowserRouter>: Historial HTML5. Es necesario para que AuthProvider pueda usar useNavigate().
 *    3. <AuthProvider>: Valida la sesión activa, decodifica el JWT y expone datos del usuario.
 *    4. <NotificationProvider>: Gestiona notificaciones SignalR aisladas por usuario (user-scoped).
 *    5. <ErrorBoundary>: Atrapa excepciones de render en componentes hijos para evitar cierres de app.
 *    6. <AppRoutes>: Despliega las rutas protegidas y públicas con Code-Splitting perezoso.
 * 
 * 💡 TIPS PARA LA SUSTENTACIÓN:
 *    "Usamos una jerarquía de Providers desacoplada donde el estado global se propaga limpiamente
 *    hacia los componentes sin prop-drilling, garantizando alta mantenibilidad y rendimiento."
 * -------------------------------------------------------------------------------------------------
 */
export default function App() {
  return (
    // 💡 [AI HINT]: 1. Inicializa el tema visual persistido en localStorage
    <ThemeProvider>
      {/* 💡 [AI HINT]: 2. Habilita el enrutamiento SPA en el navegador */}
      <BrowserRouter>
        {/* 💡 [AI HINT]: 3. Centraliza tokens JWT, roles y tiempo de expiración */}
        <AuthProvider>
          {/* 💡 [AI HINT]: 4. Canal de alertas en tiempo real vía WebSocket / Hub SignalR */}
          <NotificationProvider>
            {/* 💡 [AI HINT]: 5. Blindaje contra pantallas blancas ante fallos imprevistos */}
            <ErrorBoundary>
              {/* 💡 [AI HINT]: 6. Enrutador principal con Suspense y carga perezosa */}
              <AppRoutes />
            </ErrorBoundary>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
